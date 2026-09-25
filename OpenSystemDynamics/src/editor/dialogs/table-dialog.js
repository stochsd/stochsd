class TableData {
	constructor() {
		this.namesToDisplay = [];
		this.results = [];
	}
	exportCSV() {
		let string = this.getAsString(",");
		fileManager.exportFile(string, ".csv");
	}
	exportTSV() {
		let string = this.getAsString("\t");
		fileManager.exportFile(string, ".tsv");
	}
	getAsString(seperator) {
		let str = "Time" + seperator;
		for (let i = 0; i < this.namesToDisplay.length; i++) {
			let name = this.namesToDisplay[i];
			str += `${name}`;
			if (i != this.namesToDisplay.length - 1) {
				str += seperator;
			}
		}
		str += "\n";
		for (let row of this.results) {
			for (let i = 0; i < row.length; i++) {
				let value = row[i];
				if (value !== null) {
					str += value.toString();
				}
				if (i != row.length - 1) {
					str += seperator;
				}
			}
			str += "\n";
		}
		return str;

	}
}

class TableLimitsComponent extends HtmlComponent {
	render() {
		let limits = JSON.parse(this.primitive.getAttribute("TableLimits"));
		let startValue = limits.start.auto ? getTimeStart() : limits.start.value;
		let endValue = limits.end.auto ? getTimeStart() + getTimeLength() : limits.end.value;
		let stepValue = limits.step.auto ? this.parent.getDefaultPlotPeriod() : limits.step.value;
		return (`
		<table class="modern-table zebra">
			${["", "Value", "Auto"].map(header => `<th>${header}</th>`).join("")}
			<tr>
				<th>From</th>
				<td style="padding:1px;">
					<input class="limit-input start-field enter-apply" ${limits.start.auto ? "disabled" : ""} value="${startValue}" type="number">
				</td>
				<td><input class="limit-input start-auto-checkbox enter-apply" type="checkbox"  ${checkedHtml(limits.start.auto)}/></td>
			</tr><tr>
				<th>To</th>
				<td style="padding:1px;">
					<input class="limit-input end-field enter-apply" ${limits.end.auto ? "disabled" : ""} value="${endValue}" type="number">
				</td>
				<td><input class="limit-input end-auto-checkbox enter-apply" type="checkbox" ${checkedHtml(limits.end.auto)}/>
				</td>
			</tr><tr title="Step &#8805; DT should hold">
				<th>Step</th>
				<td style="padding:1px;">
					<input class="limit-input step-field enter-apply" ${limits.step.auto ? "disabled" : ""} value="${stepValue}" type="number">
				</td>
				<td><input class="limit-input step-auto-checkbox enter-apply" type="checkbox" ${checkedHtml(limits.step.auto)}/></td>
			</tr>
		</table>
		<div class="limits-warning-div warning"></div>`);
	}
	bindEvents() {
		let limits = JSON.parse(this.primitive.getAttribute("TableLimits"));
		this.find(".start-auto-checkbox").change(event => {
			let startAuto = $(event.target).prop("checked");
			this.find(".start-field").prop("disabled", startAuto);
			this.find(".start-field").val(startAuto ? getTimeStart() : limits.start.value);
		});
		this.find(".end-auto-checkbox").change(event => {
			let endAuto = $(event.target).prop("checked");
			this.find(".end-field").prop("disabled", endAuto);
			this.find(".end-field").val(endAuto ? getTimeStart() + getTimeLength() : limits.end.value);
		});
		this.find(".step-auto-checkbox").change(event => {
			let stepAuto = $(event.target).prop("checked");
			this.find(".step-field").prop("disabled", stepAuto);
			this.find(".step-field").val(stepAuto ? getTimeStep() : limits.step.value);
		});
		this.find("input[type='text'].limit-input").keyup(event => {
			this.checkValidTableLimits();
		});
	}
	checkValidTableLimits() {
		let warningDiv = this.find(".limits-warning-div");
		let startStr = this.find(".start-field").val();
		let endStr = this.find(".end-field").val();
		let stepStr = this.find(".step-field").val();
		if (isNaN(startStr) || startStr === "") {
			warningDiv.html(warningHtml(`"From" must be a decimal number`, true));
			return false;
		} else if (isNaN(endStr) || endStr === "") {
			warningDiv.html(warningHtml(`"To" must be a decimal number`, true));
			return false;
		} else if (isNaN(stepStr) || stepStr === "") {
			warningDiv.html(warningHtml(`"Step" must be a decimal number`, true));
			return false;
		} else if (Number(stepStr) <= 0) {
			warningDiv.html(warningHtml(`"Step" must be &gt;0`, true));
			return false;
		}
		warningDiv.html("");
		return true;
	}
	applyChange() {
		if (this.checkValidTableLimits()) {
			let limits = JSON.parse(this.primitive.getAttribute("TableLimits"));

			limits.start.value = Number(this.find(".start-field").val());
			limits.end.value = Number(this.find(".end-field").val());
			limits.step.value = Number(this.find(".step-field").val());

			limits.start.auto = this.find(".start-auto-checkbox").prop("checked");
			limits.end.auto = this.find(".end-auto-checkbox").prop("checked");
			limits.step.auto = this.find(".step-auto-checkbox").prop("checked");
			this.primitive.setAttribute("TableLimits", JSON.stringify(limits));
		}
	}
}

class ExportDataComponent extends HtmlComponent {
	render() {
		return (`<table class="modern-table zebra">
			<tr>
				<td>
					<button class="export-csv">
						Export Table (CSV)
					</button>
				</td>
			</tr>
			<tr>
				<td>
					<button class="export-tsv">
						Export Table (TSV)
					</button>
				</td>
			</tr>
		</table>`);
	}
	bindEvents() {
		this.find(".export-csv").click(event => {
			if (this.parent.data) {
				this.parent.data.exportCSV();
			}
		});

		this.find(".export-tsv").click(event => {
			if (this.parent.data) {
				this.parent.data.exportTSV();
			}
		});
	}
}


class ArithmeticPrecisionComponent extends HtmlComponent {
	render() {
		let numLength = JSON.parse(this.primitive.getAttribute("NumberLength"));
		let options = [{ key: "precision", label: "Precision" }, { key: "decimal", label: "Decimal" }];
		return (`<table class="modern-table zebra">
			${options.map(option => {
			let key = option.key;
			let isChecked = numLength.usePrecision === (option.key === "precision");
			let disabled = isChecked ? "" : "disabled";
			return (`<tr>
					<td>
						<input class="num-len-radio enter-apply" type="radio" id="${key}" name="num-len" value="${key}" ${checkedHtml(isChecked)}>
					</td>
					<td>
						<label for="${key}" >${option.label}</label>
					</td>
					<td>
						<input class="${key}-field enter-apply" type="number" ${disabled} value="${numLength[key]}">
					</td>
				</tr>`);
		}).join("")}
			
		</table>
		<div class="num-len-warn-div"></div>`);
	}
	bindEvents() {
		this.find(".num-len-radio[name='num-len']").change(event => {
			let selectedKey = event.target.value;
			let otherKey = (selectedKey === "precision") ? "decimal" : "precision";

			let selectedField = this.find(`.${selectedKey}-field`);
			let otherField = this.find(`.${otherKey}-field`);

			selectedField.prop("disabled", false);
			otherField.prop("disabled", true);

			this.checkValidNumberLength(selectedField.val());
		});
		this.find(".precision-field, .decimal-field").keyup(event => {
			this.checkValidNumberLength(event.target.value);
		});
	}

	checkValidNumberLength(value) {
		if (isNaN(value)) {
			$(".num-len-warn-div").html(warningHtml(`${value} is not a decimal number.`, true));
			return false;
		} else if (Number.isInteger(parseFloat(value)) === false) {
			$(".num-len-warn-div").html(warningHtml(`${value} is not an integer.`, true));
			return false;
		} else if (parseInt(value) < 0) {
			$(".num-len-warn-div").html(warningHtml(`${value} is negative.`, true));
			return false;
		} else if (parseInt(value) >= 12) {
			$(".num-len-warn-div").html(warningHtml(`${value} is above the limit of 12.`, true));
			return false;
		} else {
			$(".num-len-warn-div").html("");
			return true;
		}
	}
	applyChange() {
		let numLength = JSON.parse(this.primitive.getAttribute("NumberLength"));
		let selected = this.find("input[name='num-len']:checked").val();
		let usePrecision = selected === "precision";

		let value = this.find(`.${selected}-field`).val();
		if (this.checkValidNumberLength(value)) {
			numLength[selected] = parseInt(value);
			numLength.usePrecision = usePrecision;
			this.primitive.setAttribute("NumberLength", JSON.stringify(numLength));
		}
	}
}

class RoundToZeroComponent extends HtmlComponent {
	render() {
		let roundToZero = this.primitive.getAttribute("RoundToZero") === "true";
		let roundToZeroAtValue = this.primitive.getAttribute("RoundToZeroAtValue");
		let disabled = roundToZero ? "" : "disabled";
		return (`
			<table class="modern-table zebra">
				<tr>
					<td>
						<input class="round-to-zero-checkbox enter-apply" type="checkbox" ${checkedHtml(roundToZero)} /> 
						Show <b>0</b> when <i>abs(value) &lt;</i> 
						<input class="round-to-zero-field enter-apply" type="number" value="${roundToZeroAtValue}" ${disabled}/>
					</td>
				</tr>
				<tr>
					<td style="text-align: center;">
						<button class="default-round-to-zero-button enter-apply">Reset to Default</button>
					</td>
				</tr>
			</table>
			<span class="round-to-zero-warning-div warning" style="margin: 5px 0px;"></span>
		`);
	}
	bindEvents() {
		let roundToZeroCheckbox = this.find(".round-to-zero-checkbox");
		let roundToZeroField = this.find(".round-to-zero-field");

		// set default button listener
		this.find(".default-round-to-zero-button").click(() => {
			// fetches default for numberbox, but this is also used for table 
			// Should be fixes so it fetches default for the type of object the dialog belongs to  
			this.setRoundToZero(getDefaultAttributeValue("numberbox", "RoundToZero") === "true");
			roundToZeroField.val(getDefaultAttributeValue("numberbox", "RoundToZeroAtValue"));
			this.checkValidRoundAtZeroAtField();
		});

		roundToZeroCheckbox.click(() => {
			this.setRoundToZero(roundToZeroCheckbox.prop("checked"));
		});

		roundToZeroField.keyup((event) => {
			this.checkValidRoundAtZeroAtField();
		});
	}
	setRoundToZero(roundToZero) {
		this.find(".round-to-zero-checkbox").prop("checked", roundToZero);
		this.find(".round-to-zero-field").prop("disabled", !roundToZero);
		this.checkValidRoundAtZeroAtField();
	}

	checkValidRoundAtZeroAtField() {
		let roundToZeroFieldValue = this.find(".round-to-zero-field").val();
		if (this.find(".round-to-zero-checkbox").prop("checked")) {
			if (isNaN(roundToZeroFieldValue)) {
				this.setNumberboxWarning(true, `<b>${roundToZeroFieldValue}</b> is not a decimal number.`);
				return false;
			} else if (roundToZeroFieldValue == "") {
				this.setNumberboxWarning(true, "No value choosen.");
				return false;
			} else if (Number(roundToZeroFieldValue) >= 1) {
				this.setNumberboxWarning(true, "Value must be less then 1.");
				return false;
			} else if (Number(roundToZeroFieldValue) <= 0) {
				this.setNumberboxWarning(true, "Value must be strictly positive.");
				return false;
			} else {
				this.setNumberboxWarning(false);
				return true;
			}
		} else {
			this.setNumberboxWarning(false);
			return false;
		}
	}

	setNumberboxWarning(isVisible, htmlMessage) {
		let message = isVisible ? warningHtml(htmlMessage, true) : "";
		let visibility = isVisible ? "visible" : "hidden";
		this.find(".round-to-zero-warning-div").html(message);
		this.find(".round-to-zero-warning-div").css("visibility", visibility);
	}

	applyChange() {
		if (this.primitive) {
			let roundToZero = this.find(".round-to-zero-checkbox").prop("checked");
			this.primitive.setAttribute("RoundToZero", roundToZero);

			if (this.checkValidRoundAtZeroAtField()) {
				let roundToZeroAtValue = this.find(".round-to-zero-field").val();
				this.primitive.setAttribute("RoundToZeroAtValue", roundToZeroAtValue);
			}
		}
	}
}

class TableDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Table Properties");

		this.components = [
			[new PrimitiveSelectorComponent(this)],
			[
				new TableLimitsComponent(this),
				new ArithmeticPrecisionComponent(this),
				new RoundToZeroComponent(this),
				new ExportDataComponent(this)
			]
		];
	}
}


