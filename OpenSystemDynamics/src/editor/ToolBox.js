// @ts-check
/**
 * @typedef {(
 *   typeof MouseTool | typeof DeleteTool | typeof UndoTool | typeof RedoTool | typeof StockTool |
 *   typeof ConverterTool | typeof VariableTool | typeof ConstantTool | typeof FlowTool |
 *   typeof LinkTool | typeof RotateNameTool | typeof MoveValveTool | typeof StraightenLinkTool |
 *   typeof GhostTool | typeof TextAreaTool | typeof RectangleTool | typeof EllipseTool |
 *   typeof LineTool | typeof TableTool | typeof TimePlotTool | typeof ComparePlotTool |
 *   typeof XyPlotTool | typeof HistoPlotTool | typeof NumberboxTool | typeof RunTool |
 *   typeof StepTool | typeof ResetTool
 * )} ToolClass
 */
class ToolBox {
	static init() {
		this.tools = {
			"mouse": MouseTool,
			"delete": DeleteTool,
			"undo": UndoTool,
			"redo": RedoTool,
			"stock": StockTool,
			"converter": ConverterTool,
			"variable": VariableTool,
			"constant": ConstantTool,
			"flow": FlowTool,
			"link": LinkTool,
			"rotatename": RotateNameTool,
			"movevalve": MoveValveTool,
			"straightenlink": StraightenLinkTool,
			"ghost": GhostTool,
			"text": TextAreaTool,
			"rectangle": RectangleTool,
			"ellipse": EllipseTool,
			"line": LineTool,
			"table": TableTool,
			"timeplot": TimePlotTool,
			"compareplot": ComparePlotTool,
			"xyplot": XyPlotTool,
			"histoplot": HistoPlotTool,
			"numberbox": NumberboxTool,
			"run": RunTool,
			"step": StepTool,
			"reset": ResetTool
		};
	}
	static setTool(toolName, whichMouseButton) {
		if (toolName in this.tools) {
			$(".tool-button").removeClass("pressed");
			$("#btn_" + toolName).addClass("pressed");

			CurrentTool.leaveTool();
			CurrentTool = this.tools[toolName];
			CurrentTool.enterTool(whichMouseButton);
			ToolBox.updateButtons()
		} else {
			errorPopUp("The tool " + toolName + " does not exist");
		}
	}
	static getTool() {

	}
	static updateButtons() {
		const selection = Visuals.selected();
		/** @type {VisualType[]} */
		const rotatableNameTypes = ["stock", "variable", "constant", "converter", "flow"];
		const hasRotatableName = selection.some(s => rotatableNameTypes.includes(s.type))
		const hasFlow = selection.some(s => s.type == "flow")
		const hasLink = selection.some(s => s.type == "link")
		const numberboxError = NumberboxTool.getSelectionError()
		const ghostError = GhostTool.getSelectionError()
		$("#btn_rotatename").prop("disabled", !hasRotatableName)
		$("#btn_movevalve").prop("disabled", !hasFlow)
		$("#btn_straighten_link").prop("disabled", !hasLink)
		$("#btn_numberbox").prop("disabled", !!numberboxError)
		$("#btn_ghost").prop("disabled", !!ghostError)
	}
	static updateTimeUnitButton() {
		if (isTimeUnitOk(getTimeUnits())) {
			$("#timeunit-value").html(getTimeUnits());
		} else {
			$("#timeunit-value").html(warningHtml("None", false));
		}
	}
}
ToolBox.init();

