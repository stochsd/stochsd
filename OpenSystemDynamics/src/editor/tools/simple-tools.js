class BaseTool {
	static init() {
		this.middleDownX = 0;
		this.middleDownY = 0;
		this.downScrollPosX = 0;
		this.downScrollPosY = 0;
	}
	static leftMouseDown(x, y) {
		// Is triggered when mouse goes down for this tool
	}
	static mouseMove(x, y, shiftKey) {
		// Is triggered when mouse moves
	}
	static leftMouseUp(x, y, shiftKey) {
		// Is triggered when mouse goes up for this tool
	}
	static rightMouseDown(x, y) {
		// Is triggered when right mouse is clicked for this tool 
	}
	static enterTool(mouseButton) {
		// Is triggered when the tool is selected
	}
	static leaveTool() {
		// Is triggered when the tool is deselected
	}
}
BaseTool.init();

class RunTool extends BaseTool {
	static enterTool() {
		/* Check that all primitives are defined */
		let definitionErrorPrims = DefinitionError.getAllPrims();
		if (definitionErrorPrims.length !== 0) {
			let prim = definitionErrorPrims[0];
			let name = prim.getAttribute("name");
			let color = prim.getAttribute("Color");
			let alert = new XAlertDialog(`
				Definition Error in <b style="color:${color};">${name}</b>: <br/><br/>
				&nbsp &nbsp ${DefinitionError.getMessage(prim)}
			`, () => {
				get_object(getID(prim)).doubleClick();
			});
			alert.setTitle("Unable to Simulate");
			alert.show();
			unselect_all();
			Visuals.get(prim.id).select();
			InfoBar.update();
			ToolBox.updateButtons();
		} else {
			RunResults.runPauseSimulation();
		}
		ToolBox.setTool("mouse");
	}
}

class StepTool extends BaseTool {
	static enterTool() {
		RunResults.stepSimulation();
		ToolBox.setTool("mouse");
	}
}

class ResetTool extends BaseTool {
	static enterTool() {
		RunResults.resetSimulation();
		ToolBox.setTool("mouse");
	}
}

class DeleteTool extends BaseTool {
	static enterTool() {
		let selected_ids = Object.keys(get_selected_root_objects());
		if (selected_ids.length == 0) {
			xAlert("You must select at least one primitive to delete");
			ToolBox.setTool("mouse");
			return;
		}
		delete_selected_objects();
		History.storeUndoState();
		InfoBar.update();
		ToolBox.setTool("mouse");
	}
}
DeleteTool.init();

class UndoTool extends BaseTool {
	static enterTool() {
		History.doUndo();
		ToolBox.setTool("mouse");
	}
}
UndoTool.init();

class RedoTool extends BaseTool {
	static enterTool() {
		History.doRedo();
		ToolBox.setTool("mouse");
	}
}
RedoTool.init();

