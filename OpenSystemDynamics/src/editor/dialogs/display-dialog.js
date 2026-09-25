// This is the super class dor ComparePlotDialog and TableDialog
class DisplayDialog extends jqDialog {
	constructor(id) {
		super();
		this.primitive = findID(id);
		this.displayIdList = [];
		this.subscribePool = new SubscribePool();
		this.acceptedPrimitveTypes = ["Stock", "Flow", "Variable", "Converter"];
		this.displayLimit = undefined;
		this.components = [];
	}
	getDefaultPlotPeriod() {
		return getTimeStep();
	}
	clearRemovedIds() {
		for (let id of this.displayIdList) {
			if (findID(id) == null) {
				this.setDisplayId(id, false);
			}
		}
	}
	getAcceptedPrimitiveList() {
		let results = [];
		let primitiveList = getPrimitiveList();
		for (let primitive of primitiveList) {
			this.acceptsId(primitive.id) && results.push(primitive);
		}
		return results;
	}
	acceptsId(id) {
		let type = getType(findID(id));
		return (this.acceptedPrimitveTypes.indexOf(type) != -1);
	}
	removeIdToDisplay(id) {
		let idxToRemove = this.displayIdList.indexOf(id);
		idxToRemove !== -1 && this.displayIdList.splice(idxToRemove, 1);
	}
	addIdToDisplay(id) {
		let index = this.displayIdList.indexOf(id)
		index === -1 && this.displayIdList.push(id)
	}
	setDisplayId(id, value) {
		let oldIdIndex = this.displayIdList.indexOf(id);
		switch (value) {
			case true:
				// Check that the id can be added
				if (!this.acceptsId(id)) {
					return;
				}
				// Check if id already in this.displayIdList
				if (oldIdIndex != -1) {
					return;
				}
				// Add the value
				this.displayIdList.push(id.toString());

				break;
			case false:
				// Check if id is not in the list
				if (oldIdIndex == -1) {
					return;
				}
				this.displayIdList.splice(oldIdIndex, 1);
				break;
		}
	}
	getDisplayId(id) {
		id = id.toString();
		return this.displayIdList.indexOf(id) != -1
	}
	setIdsToDisplay(idList) {
		this.displayIdList = [];
		idList.forEach((id) => this.setDisplayId(id, true))
	}
	getIdsToDisplay() {
		this.clearRemovedIds();
		return this.displayIdList;
	}
	afterClose() {
		this.subscribePool.publish("window closed");
	}
	makeApply() {
		this.components.forEach(column => column.forEach(component => component.applyChange()));
	}
	beforeShow() {
		this.setHtml(`<div class="table">
			<div class="table-row">
				${this.components.map(column => `<div class="table-cell">
					${column.map(component => component.render()).join(`<div class="vertical-space"></div>`)}
				</div>`).join("")}
			</div>
		</div>`);
		this.components.forEach(column => column.forEach(component => component.bindEvents()));
		this.bindEnterApplyEvents();
	}
}
/**
 * @param axisOptions [{text, key, isTimeAxis}]
 */
class AxisLimitsComponent extends HtmlComponent {
	constructor(parent, axisOptions) {
		super(parent);
		this.axisOptions = axisOptions;
	}
	render() {
		let axisLimits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		return (`
		<table class="modern-table zebra">
			<tr>
				${["Axis", "Min", "Max", "Auto"].map(title => `<th>${title}</th>`).join("")}
			</tr>
			${this.axisOptions.map(axis => {
			let limit = axisLimits[axis.key];
			let min = axis.isTimeAxis && limit.auto ? getTimeStart() : limit.min;
			let max = axis.isTimeAxis && limit.auto ? getTimeStart() + getTimeLength() : limit.max;
			return (`<tr>
					<td style="text-align:center; padding:0px 6px">${axis.text}</td>
					<td style="padding:1px;">
						<input class="${axis.key}-min-field limit-input enter-apply" type="number" ${limit.auto ? "disabled" : ""} value="${min}">
					</td>
					<td style="padding:1px;">
						<input class="${axis.key}-max-field limit-input enter-apply" type="number" ${limit.auto ? "disabled" : ""} value="${max}">
					</td>
					<td>
						<input class="${axis.key}-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(limit.auto)}>
					</td>
				</tr>`);
		}).join("")}
		</table>
		<div class="axis-limits-warning-div" ></div>`);
	}
	bindEvents() {
		let axisLimits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		this.axisOptions.forEach(axis => {
			let limit = axisLimits[axis.key];
			this.find(`.${axis.key}-checkbox`).change(event => {
				let checkboxAuto = $(event.target).prop("checked");
				// Disable/enable input boxes 
				this.find(`.${axis.key}-min-field, .${axis.key}-max-field`).prop("disabled", checkboxAuto);

				// Set input values
				let min = axis.isTimeAxis && checkboxAuto ? getTimeStart() : limit.min;
				let max = axis.isTimeAxis && checkboxAuto ? getTimeStart() + getTimeLength() : limit.max;
				this.find(`.${axis.key}-min-field`).val(min);
				this.find(`.${axis.key}-max-field`).val(max);

				this.checkValidAxisLimits();
			});
		});

		this.find("input[type='text'].limit-input").keyup(() => {
			this.checkValidAxisLimits();
		});
	}

	checkValidAxisLimits() {
		let warningDiv = this.find(".axis-limits-warning-div");

		let hasFaultReduce = (acc, axis) => {
			let min = this.find(`.${axis.key}-min-field`).val();
			let max = this.find(`.${axis.key}-max-field`).val();
			return acc || isNaN(min) || isNaN(max);
		}

		let shouldWarn = this.axisOptions.reduce(hasFaultReduce, false);
		if (shouldWarn) {
			warningDiv.html(warningHtml(`Axis limits must be decimal numbers`, true));
			return false;
		} else {
			warningDiv.html("");
			return true;
		}
	}

	applyChange() {
		if (this.checkValidAxisLimits()) {
			let axisLimits = JSON.parse(this.parent.primitive.getAttribute("AxisLimits"));
			this.axisOptions.forEach(axis => {
				axisLimits[axis.key].auto = this.find(`.${axis.key}-checkbox`).prop("checked");
				axisLimits[axis.key].min = Number(this.find(`.${axis.key}-min-field`).val());
				axisLimits[axis.key].max = Number(this.find(`.${axis.key}-max-field`).val());
			});
			this.primitive.setAttribute("AxisLimits", JSON.stringify(axisLimits));
		}
	}
}

