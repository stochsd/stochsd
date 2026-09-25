class TimePlotSelectorComponent extends PrimitiveSelectorComponent {
	constructor(parent) {
		super(parent);
		this.sides = [];
	}
	renderIncludedList() {
		return (`<table id="${this.componentId}" class="primitive-selector">
			<tr>
				${["", "Added Primitives", "Left", "Right"].map(title => `<th>${title}</th>`).join("")}
			</tr>
			${this.displayIds.map((id, index) => {
			const selectedSide = this.sides[index];
			const primitive = findID(id);
			const type = getTypeNew(primitive);
			const color = primitive?.getAttribute("Color")
			const isRandom = hasRandomFunction(getValue(primitive));
			return (`<tr>
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
								${PrimitiveSvgPreview.create(type.toLowerCase(), { color, dice: isRandom })}
							</div>
							<span class="cm-primitive cm-${color}">
								${getName(primitive)}
							</span>
						</div>
						</td>
						<td style="padding: 0; text-align: center;">
							<input type="radio" name="id-${id}" class="side-radio" value="L" data-id="${id}"
								${checkedHtml(selectedSide === "L")}
							/>
						</td>
						<td style="padding: 0; text-align: center;">
							<input type="radio" name="id-${id}" class="side-radio" value="R" data-id="${id}"
								${checkedHtml(selectedSide === "R")}
							/>
						</td>
				</tr>
			`)
		}).join("")}
		</table>`);
	}
	updateIncludedList() {
		super.updateIncludedList();
		this.find(".side-radio").change(event => {
			this.switchSideHandler(event);
		});
	}
	switchSideHandler(event) {
		let value = $(event.target).val();
		let id = $(event.target).attr("data-id");
		let index = this.displayIds.indexOf(id);
		if (index !== -1) {
			this.sides[index] = value;
		}
	}
	removeButtonHandler(event) {
		let removeId = $(event.target).attr("data-id");
		let removeIndex = this.displayIds.indexOf(removeId);
		if (removeIndex !== -1) {
			this.displayIds.splice(removeIndex, 1);
			this.sides.splice(removeIndex, 1);
		}
	}
	addButtonHandler(event) {
		let addId = $(event.target).attr("data-id");
		this.displayIds.push(addId);
		this.sides.push("L");
	}
	render() {
		this.sides = getDisplaySides(this.primitive);
		return super.render();
	}
	applyChange() {
		setDisplayIds(this.primitive, this.displayIds, this.sides);
	}
}

class TimePlotDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Time Plot Properties");
		this.components = [
			[new TimePlotSelectorComponent(this)],
			[
				new PlotPeriodComponent(this),
				new AxisLimitsComponent(this, [
					{ text: "Time", key: "timeaxis", isTimeAxis: true },
					{ text: "Left", key: "leftaxis" },
					{ text: "Right", key: "rightaxis" },
				]),
				new LabelTableComponent(this, [
					{ text: "Title", attribute: "TitleLabel" },
					{ text: "Left", attribute: "LeftAxisLabel" },
					{ text: "Right", attribute: "RightAxisLabel" }
				]),
				new LineOptionsComponent(this),
				new CheckboxTableComponent(this, [
					{ text: "Numbered Lines", attribute: "HasNumberedLines" },
					{ text: "Colour from Primitive", attribute: "ColorFromPrimitive" },
					{ text: "Show Data when hovering", attribute: "ShowHighlighter" },
				])
			]
		];
	}
}

class GenerationsComponent extends HtmlComponent {
	/** @type {DataGenerations} */
	gens;
	/**
	 * @param {DataGenerations} gens 
	 */
	constructor(parent, gens) {
		super(parent)
		this.gens = gens
	}
	render() {
		const result = (`<div id=${this.componentId} style="max-height: 300px; overflow-x: auto;">
			${this.renderTable()}
		</div>`);
		return result;
	}
	renderTable() {
		const generationsHtml = `<table class="modern-table" style="width: 100%;">
			<tr>
				<th>#</th><th>Primitive</th><th>Label</th><th></th>
			</tr>
			${this.gens.map((value, index) => `
			${value.index == 0 && value.genIndex != 0 ? `<tr style="background-color: #ccc;"><td colspan="4"></td></tr>` : ""}
			<tr>
				<td>${index + 1}</td>
				<td>
					<div class="center-vertically-container">
						<div style="display: flex; width: 1.75rem; padding-right: 0.25rem;">
							${PrimitiveSvgPreview.create(value.type.toLowerCase(), { color: value.color, dice: value.isRandom })}
						</div>
						<span class="cm-primitive cm-${value.color}">${value.name}</span>
					</div>
				</td>
				<td>
					<input type="text" class="sim-label enter-apply" style="width: 100%; text-align: left;" data-gen-index="${value.genIndex}" data-id="${value.id}" value="${value.label}"/>
				</td>
				<td style="padding:0;" >
					<button class="primitive-remove-button enter-apply" title="Delete Simulation" data-gen-index="${value.genIndex}" data-id="${value.id}">X</button>
				</td>
			</tr>`).join("")}
		</table>`
		const clearButtonHtml = `<table class="modern-table zebra" style="width:100%; text-align:center;"><tr><td>
			<button class="clear-button enter-apply">Clear Results</button>
		</td></tr></table>`
		return `<div id="${this.componentId}">
			${this.gens.idGen.length != 0 ? generationsHtml : ""}
			${clearButtonHtml}
		</div>`
	}
	applyChange() {
		let fields = this.find(`#${this.componentId} input[type="text"].sim-label`);
		this.find(`#${this.componentId} input[type="text"].sim-label`).each((index) => {
			const elem = $(fields[index]);
			const genIndex = elem.attr("data-gen-index");
			const id = elem.attr("data-id");
			const value = elem.val();
			this.gens.setLabel(genIndex, id, value);
		});
	}
	bindEvents() {
		this.find(`#${this.componentId} .primitive-remove-button`).click(event => {
			const button = $(event.currentTarget);
			this.gens.removeSim(button.attr("data-gen-index"), button.attr("data-id"));
			// re-render table
			this.find(`#${this.componentId}`).html(this.renderTable());
			this.bindEvents();
		})
		this.find(".clear-button").click((event) => {
			$(event.currentTarget).prop("disabled", true);
			let id = getID(this.primitive);
			let parentVisual = Visuals.getTwoPointer(id);
			parentVisual.clearGenerations();
			this.find(`#${this.componentId}`).html(this.renderTable());
			this.bindEvents();
		});
	}
}

class ComparePlotDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Compare Simulations Plot Properties");

		this.components = [
			[new PrimitiveSelectorComponent(this)],
			[
				new PlotPeriodComponent(this),
				new AxisLimitsComponent(this, [
					{ text: "Time", key: "timeaxis", isTimeAxis: true },
					{ text: "Y-Axis", key: "yaxis" }
				]),
				new LabelTableComponent(this, [
					{ text: "Title", attribute: "TitleLabel" },
					{ text: "Y-Axis Label", attribute: "LeftAxisLabel" }
				]),
				new LineOptionsComponent(this),
				new CheckboxTableComponent(this, [
					{ text: "Numbered Lines", attribute: "HasNumberedLines" },
					{ text: "Colour from Primitive", attribute: "ColorFromPrimitive" },
					{ text: "Show Data when hovering", attribute: "ShowHighlighter" },
				])
			],
			[new GenerationsComponent(this, Visuals.getTwoPointer(this.primitive.id).gens)]
		];
	}
}

class HistogramOptionsComponent extends HtmlComponent {
	constructor(parent) {
		super(parent);
		this.tableData = {
			headers: ["", "Value", "Auto"],
			rows: [
				{ label: "Upper Bound", classPrefix: "upper-bound", attribute: "UpperBound" },
				{ label: "Lower Bound", classPrefix: "lower-bound", attribute: "LowerBound" },
				{ label: "No. Bars", classPrefix: "num-bars", attribute: "NumberOfBars" }
			]
		};
	}
	render() {
		return (`<table class="modern-table zebra">
			<tr>	
				${this.tableData.headers.map(header => `<th>${header}</th>`).join("")}
			</tr>
			${this.tableData.rows.map(row => {
			let value = this.primitive.getAttribute(row.attribute);
			let auto = this.primitive.getAttribute(`${row.attribute}Auto`) === "true";
			return (`<tr>
				<td><b>${row.label}:</b></td>
				<td><input class="${row.classPrefix}-field enter-apply" type="number" value=${value} ${auto ? "disabled" : ""} /></td>
				<td><input class="${row.classPrefix}-auto-checkbox enter-apply" type="checkbox" ${checkedHtml(auto)} /></td>
			</tr>`)
		}).join("")}
		</table>`);
	}
	bindEvents() {
		this.tableData.rows.forEach(row => {
			let valueField = this.find(`.${row.classPrefix}-field`);
			let checkbox = this.find(`.${row.classPrefix}-auto-checkbox`);

			checkbox.click(event => {
				let auto = $(event.currentTarget).prop("checked");
				valueField.prop("disabled", auto);
			});
		});
	}
	applyChange() {
		this.tableData.rows.forEach(row => {
			let value = this.find(`.${row.classPrefix}-field`).val();
			let auto = this.find(`.${row.classPrefix}-auto-checkbox`).prop("checked");
			this.primitive.setAttribute(`${row.attribute}Auto`, auto);
			if (!auto && !isNaN(value)) {
				this.primitive.setAttribute(row.attribute, value);
			}
		});
	}
}

class RadioCompontent extends HtmlComponent {
	/**
	 * @param {{header: string, name: string, attribute, options: [{value: string, label: string}]}} data 
	 */
	constructor(parent, data) {
		super(parent);
		this.data = data;
	}
	render() {
		return (`<table class="modern-table zebra">
			<tr><th colspan="2" >${this.data.header}</th></tr>
			${this.data.options.map(option => {
			let checkString = checkedHtml(this.primitive.getAttribute(this.data.attribute) === option.value);
			return (`<tr>
					<td>
						<input type="radio" id="${option.value}" class="enter-apply" name="${this.data.name}" value="${option.value}" ${checkString} >
					</td>
					<td>
						<label for="${option.value}" >${option.label}</label>
					</td>
				</tr>`);
		}).join("")}
		</table>`);
	}
	applyChange() {
		let value = this.find(`input[name="${this.data.name}"]:checked`).val();
		this.primitive.setAttribute(this.data.attribute, value);
	}
}

class HistoPlotDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Histogram Plot Properties");
		this.displayLimit = 1;

		this.components = [
			[new PrimitiveSelectorComponent(this, 1)],
			[
				new HistogramOptionsComponent(this),
				new RadioCompontent(this, {
					header: "Select Scaling Type",
					name: "scaling",
					attribute: "ScaleType",
					options: [
						{ value: "Histogram", label: "Histogram" },
						{ value: "PDF", label: "Probability Density Function" }
					]
				})
			]
		];
	}
}

class XySelectorComponent extends PrimitiveSelectorComponent {
	renderIncludedList() {
		let axies = ["X", "Y"];
		return (`<table id="${this.componentId}" class="primitive-selector">
				<tr>
					<th></th>
					<th>Added Primitives</td>
					<th>Axis</th>
				</tr>
				${this.displayIds.map((id, index) => {
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
								</span>
							</div>
						</td>
						<td style="font-size: 20px; text-align: center;">${axies[index]}</td>
					</tr>
				`}).join("")}
			</table>`);
	}
}

class XyPlotDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("XY Plot Properties");

		this.components = [
			[new XySelectorComponent(this, 2)],
			[
				new PlotPeriodComponent(this),
				new AxisLimitsComponent(this, [
					{ text: "X-Axis", key: "xaxis" },
					{ text: "Y-Axis", key: "yaxis" }
				]),
				new CheckboxTableComponent(this, [
					{ text: "Show Line", attribute: "ShowLine" },
					{ text: "Show Markers", attribute: "ShowMarker" },
					{ text: "Mark Start (🔴)", attribute: "MarkStart" },
					{ text: "Mark End (🟩)", attribute: "MarkEnd" },
					{ text: "Show Data when hovering", attribute: "ShowHighlighter" }
				]),
				new LabelTableComponent(this, [{ text: "Title", attribute: "TitleLabel" }]),
				new RadioCompontent(this, {
					header: "Line Width",
					name: "line-width",
					attribute: "LineWidth",
					options: [
						{ value: "1", label: "Thin" },
						{ value: "2", label: "Thick" }
					]
				})
			]
		];
	}
}

