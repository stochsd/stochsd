class HtmlComponent {
	/** @param {DisplayDialog} parent */
	constructor(parent) {
		this.componentId = "component-" + Math.ceil(Math.random() * (2 ** 32)).toString(16)
		this.parent = parent;
		this.primitive = parent.primitive;
	}
	find(selector) {
		return $(this.parent.dialogContent).find(selector);
	}
	render() { return "<p>EmptyComponent</p>"; }
	bindEvents() { }
	applyChange() { }
}


class PlotPeriodComponent extends HtmlComponent {
	render() {
		let auto_plot_per = JSON.parse(this.primitive.getAttribute("AutoPlotPer"));
		let plot_per = Number(this.primitive.getAttribute("PlotPer"));
		if (auto_plot_per) {
			plot_per = this.parent.getDefaultPlotPeriod();
		}
		return (`
			<table class="modern-table zebra" title="Distance between points in time units. \n (Should not be less then Time Step)" >
				<tr>
					<th>
						Plot Period: 
					</th>
					<td style="padding:1px;">
						<input style="" class="plot-per-field limit-input enter-apply" type="number" value="${plot_per}" ${auto_plot_per ? "disabled" : ""}/>
					</td>
					<td>
						Auto
						<input style="" class="plot-per-auto-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(auto_plot_per)}/>
					</td>
				</tr>
			</table>
			<div class="plot-per-warning" ></div>
		`);
	}
	checkValidPlotPer() {
		let plotPerStr = this.find(".plot-per-field").val();
		let warningDiv = this.find(".plot-per-warning");
		if (isNaN(plotPerStr) || plotPerStr === "") {
			warningDiv.html(warningHtml(`Plot Period must be a decimal number`, true));
			return false;
		} else if (Number(plotPerStr) <= 0) {
			warningDiv.html(warningHtml(`Plot Period must be &gt;0`, true));
			return false;
		}
		warningDiv.html("");
		return true;
	}
	bindEvents() {
		this.find(".plot-per-auto-checkbox").change(event => {
			let plot_per_field = this.find(".plot-per-field");
			plot_per_field.prop("disabled", event.target.checked);

			let plot_per = Number(this.primitive.getAttribute("PlotPer"));
			if (event.target.checked) {
				plot_per = this.parent.getDefaultPlotPeriod();
			}
			plot_per_field.val(plot_per);
		});
		this.find(".plot-per-field").keyup(() => {
			this.checkValidPlotPer();
		});
	}
	applyChange() {
		if (this.checkValidPlotPer()) {
			let auto_plot_per = this.find(".plot-per-auto-checkbox").prop("checked");
			let plot_per = Number(this.find(".plot-per-field").val());
			this.primitive.setAttribute("AutoPlotPer", auto_plot_per);
			this.primitive.setAttribute("PlotPer", plot_per);
		}
	}

}

/**
 * @param labels = [{ text, attribute }]
 */
class LabelTableComponent extends HtmlComponent {
	constructor(parent, labels) {
		super(parent);
		this.labels = labels;
	}
	render() {
		return (`
			<table class="modern-table zebra">
				${this.labels.map(label => {
			return (`<tr>
						<th>${label.text}:</th>
						<td style="padding:1px;" >
							<input style="width: 150px;" class="${label.attribute}-field enter-apply" spellcheck="false" type="text" value="${this.primitive.getAttribute(label.attribute)}"/>
						</td>
					</tr>`);
		}).join("")}
			</table>
		`);
	}
	applyChange() {
		this.labels.forEach(label => {
			let labelChoosen = removeSpacesAtEnd(this.find(`.${label.attribute}-field`).val());
			this.primitive.setAttribute(label.attribute, labelChoosen);
		})
	}
}

/**
 * @param checkboxes = [{ text, attribute }]
 */
// Checkboxhtml
class CheckboxTableComponent extends HtmlComponent {
	constructor(parent, checkboxes) {
		super(parent);
		this.checkboxes = checkboxes;
	}
	render() {
		return (`
			<table class="modern-table zebra">
				${this.checkboxes.map(checkbox => {
			return (`<tr>
						<td>
							<input class="${checkbox.attribute}-checkbox enter-apply" type="checkbox" ${checkedHtml(this.primitive.getAttribute(checkbox.attribute) === "true")}>
						</td>
						<th style="text-align: left;">${checkbox.text}</th>
					</tr>`)
		}).join("")}
			</table>
		`);
	}

	applyChange() {
		this.checkboxes.forEach(checkbox => {
			let boolChosen = this.find(`.${checkbox.attribute}-checkbox`).prop("checked");
			this.primitive.setAttribute(checkbox.attribute, boolChosen);
		})
	}
}

class PrimitiveSelectorComponent extends HtmlComponent {
	constructor(parent, displayLimit) {
		super(parent);
		this.displayIds = [];
		this.displayLimit = displayLimit;
	}
	renderIncludedList() {
		return (`<table id=${this.componentId} class="primitive-selector">
			<tr>
				<th></th>
				<th>Added Primitives</td>
			</tr>
			${this.displayIds.map(id => {
			const primitive = findID(id)
			const type = getTypeNew(primitive).toLowerCase()
			const color = primitive?.getAttribute("Color")
			const isRandom = hasRandomFunction(getValue(primitive))
			return `<tr>
					<td style="padding: 0;">
						<button 
							class="primitive-remove-button enter-apply" 
							data-id="${id}">
							-
						</button>
						</td>
						<td style="width: 100%;">
						<div class="center-vertically-container">
							<div style="display: flex; width: 1.75rem; padding-right: 0.25rem;">
								${PrimitiveSvgPreview.create(type, { color, dice: isRandom })}
							</div>
							<span class="cm-primitive cm-${color}">
							${getName(primitive)}
							<span>
						</div>
						</td>
				</tr>
			`}).join("")}
		</table>`);
	}
	updateIncludedList() {
		let htmlContent = "No primitives selected";
		if (this.displayIds.length > 0) {
			htmlContent = this.renderIncludedList();
		}
		this.find(".included-list-div").html(htmlContent);
		this.parent.bindEnterApplyEvents();
		this.find(`#${this.componentId} .primitive-remove-button`).click(event => {
			this.removeButtonHandler(event);
			this.updateIncludedList();
			this.updateExcludedList();
		});
	}
	removeButtonHandler(event) {
		let removeId = $(event.target).attr("data-id");
		let removeIndex = this.displayIds.indexOf(removeId);
		if (removeIndex !== -1) {
			this.displayIds.splice(removeIndex, 1);
		}
	}
	updateExcludedList() {
		let searchWord = this.find(".primitive-filter-input").val();

		let searchLowercase = searchWord.toLowerCase();
		let results = this.getSearchPrimitiveResults(searchLowercase);
		let get_highlight_match = (name, match) => {
			let index = name.toLowerCase().indexOf(match.toLowerCase());
			if (index === -1 || match === "") {
				return name;
			} else {
				return `${name.slice(0, index)}<mark>${name.slice(index, index + match.length)}</mark>${name.slice(index + match.length, name.length)}`
			}
		}
		let htmlContent = "";
		if (results.length > 0) {
			let limitReached = this.displayLimit && this.displayIds.length >= this.displayLimit;
			htmlContent = (`<table class="primitive-selector"> 
				${results.map(p => {
				const type = getTypeNew(p).toLowerCase()
				const color = p?.getAttribute("Color")
				const isRandom = hasRandomFunction(getValue(p));
				return `<tr>
						<td style="padding: 0;">
							<button class="primitive-add-button enter-apply" data-id="${getID(p)}" 
								${limitReached ? "disabled" : ""} 
								${limitReached ? `title="Max ${this.displayLimit} primitives selected"` : ""}>
								+
							</button>
						</td>
						<td style="width: 100%;">
						<div class="center-vertically-container">
							<div style="display: flex; display: flex; width: 1.75rem; padding-right: 0.25rem;">
								${PrimitiveSvgPreview.create(type.toLowerCase(), { color, dice: isRandom })}
							</div>
							<span class="cm-primitive cm-${color}">${get_highlight_match(getName(p), searchWord)}<span>
						</div>
						</td>
					</tr>
				`}).join("")}
			</table>`);
		} else if (searchLowercase === "") {
			htmlContent = (`<div>No more primitives to add.</div>`);
		} else {
			htmlContent = (noteHtml(`No primitive matches search: <br/><b>${searchWord}</b>`));
		}
		this.find(".excluded-list-div").html(htmlContent);
		this.parent.bindEnterApplyEvents();
		this.find(".primitive-add-button").click((event) => {
			this.addButtonHandler(event);
			this.updateIncludedList();
			this.find(".primitive-filter-input").val("");
			this.updateExcludedList();
		});
	}
	addButtonHandler(event) {
		let addId = $(event.target).attr("data-id");
		this.displayIds.push(addId);
	}
	render() {
		this.displayIds = getDisplayIds(this.primitive);

		return (`
			<div class="included-list-div" style="border: 1px solid black;"></div>
			<div class="vertical-space"></div>
			<div class="center-vertically-container">
				<img style="height: 22px; padding: 0px 5px;" src="graphics/exchange.svg"/>
				<input type="text" class="primitive-filter-input enter-apply" placeholder="Find Primitive ..." style="height: 18px; width: 220px;"> 
			</div>
			<div class="excluded-list-div" style="max-height: 300px; overflow: auto; border: 1px solid black;"></div>
		`);
	}
	bindEvents() {
		this.find(".primitive-filter-input").keyup(() => {
			this.updateExcludedList();
		});
		this.updateIncludedList();
		this.updateExcludedList();
	}
	getSearchPrimitiveResults(searchLowercase) {
		let prims = this.parent.getAcceptedPrimitiveList();
		let results = [];

		let compareByTypeAndName = (a, b) => { // sort by type and by alphabetical 
			let orderDiff = order.indexOf(getTypeNew(a)) - order.indexOf(getTypeNew(b))
			if (orderDiff !== 0) {
				return orderDiff;
			} else { // else sort alphabetically
				return getName(a).toLowerCase() > getName(b).toLowerCase() ? 1 : -1;
			}
		}

		let compareBySearchWord = (a, b) => { // sort by what search word appears first 
			let charMatch = getName(a).toLowerCase().indexOf(searchLowercase) - getName(b).toLowerCase().indexOf(searchLowercase);
			if (charMatch !== 0) {
				return charMatch;
			} else { // else sort alphabetically 
				return getName(a).toLowerCase() > getName(b).toLowerCase() ? 1 : -1;
			}
		}

		let order = ["Stock", "Flow", "Variable", "Constant", "Converter"];
		results = prims.filter(p => // filter already added primitives 
			this.displayIds.includes(getID(p)) === false
		).filter(p => // filter search
			getName(p).toLowerCase().includes(searchLowercase)
		).sort(searchLowercase === "" ? compareByTypeAndName : compareBySearchWord);

		return results;
	}
	applyChange() {
		setDisplayIds(this.primitive, this.displayIds);
	}
}


class LineOptionsComponent extends HtmlComponent {
	render() {
		let options = JSON.parse(this.primitive.getAttribute("LineOptions"));
		return (`
			<table class="modern-table zebra">
				<tr>
					<th>Type</th><th>Pattern</th><th>Width</th>
				</tr>
				${Object.keys(options).map(key => (`<tr>
					<td>${type_basename[key]}</td>
					<td>
						<select data-key="${key}" class="line-pattern-select enter-apply" style="font-family: monospace;">
						<option value="[1]"		${options[key].pattern[0] === 1 ? "selected" : ""}>&#8212;&#8212;&#8212;&#8212;&#8212;&#8212;</option>
						<option value="[10, 5]" ${options[key].pattern[0] === 10 ? "selected" : ""}>------</option>
						</select>
					</td>
					<td>
						<select data-key="${key}" class="line-width-select enter-apply">
						<option value=1 ${options[key].width === 1 ? "selected" : ""}>1</option>
						<option value=2 ${options[key].width === 2 ? "selected" : ""}>2</option>
						<option value=3 ${options[key].width === 3 ? "selected" : ""}>3</option>
						</select>
					</td>
				</tr>`)).join("")}
			</table>
		`);
	}
	applyChange() {
		let options = JSON.parse(this.primitive.getAttribute("LineOptions"));

		let patternOptions = this.find(".line-pattern-select");
		let widthOptions = this.find(".line-width-select");
		for (let i = 0; i < widthOptions.length; i++) {
			let selectedWidth = JSON.parse($(widthOptions[i]).find(" :selected").val());
			let selectedPattern = JSON.parse($(patternOptions[i]).find(" :selected").val());

			options[$(widthOptions[i]).attr("data-key")]["width"] = selectedWidth;
			options[$(patternOptions[i]).attr("data-key")]["pattern"] = selectedPattern;
		}
		this.primitive.setAttribute("LineOptions", JSON.stringify(options));
	}
}


