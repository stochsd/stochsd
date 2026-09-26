class GeometryDialog extends DisplayDialog {
	renderStrokeHtml() {
		let strokeWidths = ["1", "2", "3", "4", "5", "6"];
		let primWidth = this.primitive.getAttribute("StrokeWidth");
		return (`
			<table class="modern-table zebra">
				<tr>
					<td>Line Width: </td>
					<td>
						<select class="width-select enter-apply">
						${strokeWidths.map(w => (`
							<option value="${w}" ${primWidth === w ? "selected" : ""}>${w}</option>
						`))}
						</select>
					</td>
				</tr>
				<tr>
					<td>Dashes: </td>
					<td>
						<select class="dash-select enter-apply">
						<option value="" 	${this.primitive.getAttribute("StrokeDashArray") === "" ? "selected" : ""}	 >––––––</option>
						<option value="8 4" ${this.primitive.getAttribute("StrokeDashArray") === "8 4" ? "selected" : ""}>– – – –</option>
						</select>
					</td>
				</tr>
			</table>
		`);
	}

	beforeShow() {
		this.setHtml(`<div>${this.renderStrokeHtml()}</div>`);
		this.bindEnterApplyEvents();
	}
	makeApply() {
		let dashArray = $(this.dialogContent).find(".dash-select :selected").val();
		let strokeWidth = $(this.dialogContent).find(".width-select :selected").val();
		this.primitive.setAttribute("StrokeDashArray", dashArray);
		this.primitive.setAttribute("StrokeWidth", strokeWidth);
	}
}

class RectangleDialog extends GeometryDialog {
	beforeShow() {
		this.setTitle("Rectangle Properties");
		super.beforeShow();
	}
}

class EllipseDialog extends GeometryDialog {
	beforeShow() {
		this.setTitle("Ellipse Properties");
		super.beforeShow();
	}
}

class LineDialog extends GeometryDialog {
	renderArrowCheckboxHtml() {
		let arrowStart = this.primitive.getAttribute("ArrowHeadStart") === "true";
		let arrowEnd = this.primitive.getAttribute("ArrowHeadEnd") === "true";
		return (`
			<table class="modern-table zebra">
				<tr>
					<td>Arrow head at start point:</td>
					<td><input class="arrow-start-checkbox enter-apply" type="checkbox" ${checkedHtml(arrowStart)} /></td>
				</tr>
				<tr>
					<td>Arrow head at end point:</td>
					<td><input class="arrow-end-checkbox enter-apply" type="checkbox" ${checkedHtml(arrowEnd)} /></td>
				</tr>
			</table>
		`);
	}
	beforeShow() {
		this.setTitle("Arrow/Line Properties");
		this.setHtml(`<div>
			${this.renderArrowCheckboxHtml()}
			<div class="vertical-space"></div>
			${this.renderStrokeHtml()}
		</div>`);
		this.bindEnterApplyEvents();
	}
	makeApply() {
		this.primitive.setAttribute("ArrowHeadStart", $(this.dialogContent).find(".arrow-start-checkbox").prop("checked"));
		this.primitive.setAttribute("ArrowHeadEnd", $(this.dialogContent).find(".arrow-end-checkbox").prop("checked"));
		super.makeApply();
	}
}

class NumberboxDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Number Box Properties");

		this.components = [
			new ArithmeticPrecisionComponent(this),
			new RoundToZeroComponent(this),
			new CheckboxTableComponent(this, [{ text: "Hide Frame", attribute: "HideFrame" }])
		];
	}
	beforeShow() {
		this.targetPrimitive = findID(this.primitive.getAttribute("Target"));
		if (this.targetPrimitive) {
			let primitiveName = makePrimitiveName(getName(this.targetPrimitive));
			this.setHtml(`
				<div>
					<p>Value of ${primitiveName}</p>
					${this.components.map(comp => comp.render()).join('<div class="vertical-space"></div>')}
				</div>
			`);
			this.components.forEach(comp => comp.bindEvents());
		} else {
			this.setHtml(`
				Target primitive not found
			`);
		}
		this.bindEnterApplyEvents();
	}
	makeApply() {
		this.components.forEach(comp => comp.applyChange());
	}
}

