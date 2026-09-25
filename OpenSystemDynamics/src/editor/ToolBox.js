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

			currentTool.leaveTool();
			currentTool = this.tools[toolName];
			currentTool.enterTool(whichMouseButton);
			ToolBox.updateButtons()
		} else {
			errorPopUp("The tool " + toolName + " does not exist");
		}
	}
	static getTool() {

	}
	static updateButtons() {
		const selection = Visuals.selected();
		const hasRotatableName = selection.some(s => ["stock", "variable", "contant", "converter", "flow"].includes(s.type))
		const hasFlow = selection.some(s => s.type == "flow")
		const hasLink = selection.some(s => s.getParent().type == "link")
		const numberboxError = NumberboxTool.getSelectionError()
		const ghostError = GhostTool.getSelectionError()
		$("#btn_rotatename").prop("disabled", !hasRotatableName)
		$("#btn_movevalve").prop("disabled", !hasFlow)
		$("#btn_straighten_link").prop("disabled", !hasLink)
		$("#btn_numberbox").prop("disabled", !!numberboxError)
		$("#btn_ghost").prop("disabled", !!ghostError)
	}
}
ToolBox.init();

