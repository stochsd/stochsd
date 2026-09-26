class OnePointCreateTool extends BaseTool {
	constructor() {
		this.rightClickMode = false;
	}
	static enterTool(mouseButton) {
		this.rightClickMode = (mouseButton === mouse.right);
	}
	static create(x, y) {
		// This function should be over written
	}
	static leftMouseDown(x, y) {
		Visuals.unselectAll();
		this.create(x, y);
		Visuals.updateAllExceptDisplays();
		InfoBar.update();
		ToolBox.updateButtons();
	}
	static leftMouseUp(x, y) {
		if (!this.rightClickMode) {
			ToolBox.setTool("mouse");
		}
	}
	static rightMouseDown(x, y) {
		Visuals.unselectAll();
		ToolBox.setTool("mouse");
		InfoBar.update();
		ToolBox.updateButtons();
	}
}

class NumberboxTool extends OnePointCreateTool {
	static init() {
		this.targetPrimitive = null;
		/** @type {VisualType[]} */
		this.numberboxable_primitives = ["stock", "variable", "constant", "converter", "flow"];
	}
	static create(x, y) {
		// The right place to  create primitives and elements is in the tools-layers
		let primitive_name = findFreeName(type_basename["text"]);
		let size = type_size["text"];

		this.primitive = createPrimitive(name, "Numberbox", [x, y], [0, 0]);
		this.primitive.setAttribute("Target", this.targetPrimitive);
	}
	/** @returns { string | undefined } */
	static getSelectionError() {
		let selectedIds = Visuals.selectedParents().map(visual => visual.id);
		if (selectedIds.length != 1) {
			if (selectedIds.length == 0) {
				return "You must first select a primitive for the Number Box.";
			} else {
				return "You must first select exactly one primitive for the Number Box.";
			}
		} else {
			let selectedVisual = Visuals.get(selectedIds[0]);
			if (this.numberboxable_primitives.indexOf(selectedVisual.type) == -1) {
				return "This primitive can not have a Number Box";
			}
		}
		return undefined
	}
	static enterTool() {
		const error = NumberboxTool.getSelectionError()
		if (error) {
			xAlert(error)
			ToolBox.setTool("mouse");
			return
		}
		let selected_ids = Visuals.selectedParents().map(visual => visual.id);
		if (isPrimitiveGhost(findID(selected_ids[0]))) {
			this.targetPrimitive = findID(selected_ids[0]).getAttribute("Source");
		} else {
			this.targetPrimitive = selected_ids[0];
		}
	}
}
NumberboxTool.init();


class StockTool extends OnePointCreateTool {
	static create(x, y) {
		// The right place to  create primitives and elements is in the tools-layers
		let primitive_name = findFreeName(type_basename["stock"]);
		let size = type_size["stock"];
		let new_stock = createPrimitive(primitive_name, "Stock", [x - size[0] / 2, y - size[1] / 2], size);
	}
}

class RotateNameTool extends BaseTool {
	static enterTool() {
		for (let visual of Visuals.selected()) {
			visual.rotateName();
		}
		ToolBox.setTool("mouse");
	}
	static leaveTool() {
		History.storeUndoState();
	}
}

class MoveValveTool extends BaseTool {
	static enterTool() {
		for (let visual of Visuals.selected()) {
			if (visual.type == "flow") {
				visual.moveValve();
			}
		}
		ToolBox.setTool("mouse");
	}
}

class StraightenLinkTool extends BaseTool {
	static enterTool() {
		for (let visual of Visuals.selected()) {
			let parent = visual.getParent();
			if (parent.type == "link") {
				parent.resetBezierPoints();
			}
		}
		ToolBox.setTool("mouse");
	}

}

class GhostTool extends OnePointCreateTool {
	static init() {
		this.id_to_ghost = null;
		/** @type {VisualType[]} */
		this.ghostable_primitives = ["stock", "variable", "constant", "converter"];
	}
	static create(x, y) {
		let source = findID(this.id_to_ghost);
		let ghost = makeGhost(source, [x, y]);
		ghost.setAttribute("RotateName", "0");
		syncVisual(ghost);
		let DIM_ghost = Visuals.get(ghost.getAttribute("id"));
		source.subscribeAttribute(DIM_ghost.changeAttributeHandler);
	}
	/** @returns {string | undefined} */
	static getSelectionError() {
		// filter out children, e.g. anchors
		let selectedObjects = Visuals.selected().filter(visual => !visual.id.includes("."));
		if (selectedObjects.length != 1) {
			return "You must first select exactly one primitive to ghost"
		}
		let selectedObject = selectedObjects[0];
		if (selectedObject.is_ghost) {
			return "You cannot ghost a ghost"
		}
		if (this.ghostable_primitives.indexOf(selectedObject.type) == -1) {
			return `This primitive is not ghostable`
		}
	}
	static enterTool() {
		// filter out children, e.g. anchors
		const error = GhostTool.getSelectionError()
		if (error) {
			xAlert(error);
			ToolBox.setTool("mouse");
			return;
		}
		let selectedObjects = Visuals.selected().filter(visual => !visual.id.includes("."));
		let selectedObject = selectedObjects[0];
		this.id_to_ghost = selectedObjects[0].id;
	}
}
GhostTool.init();

class ConverterTool extends OnePointCreateTool {
	static create(x, y) {
		// The right place to  create primitives and elements is in the tools-layers
		let primitive_name = findFreeName(type_basename["converter"]);
		let size = type_size["converter"];
		let new_converter = createPrimitive(primitive_name, "Converter", [x - size[0] / 2, y - size[1] / 2], size);
	}
}

class VariableTool extends OnePointCreateTool {
	static create(x, y) {
		// The right place to  create primitives and elements is in the tools-layers
		let primitive_name = findFreeName(type_basename["variable"]);
		let size = type_size["variable"];
		let newVariable = createPrimitive(
			primitive_name,
			"Variable",
			[x - size[0] / 2, y - size[1] / 2],
			size,
			{ "isConstant": false }
		);
	}
}

class ConstantTool extends OnePointCreateTool {
	static create(x, y) {
		let primitiveName = findFreeName(type_basename["constant"]);
		let size = type_size["variable"];
		let newConstant = createPrimitive(
			primitiveName,
			"Variable",
			[x - size[0] / 2, y - size[1] / 2],
			size,
			{ "isConstant": true }
		);
	}
}

function get_only_selected_anchor_id() {
	// returns null if more is selected than one anchor is selected, else returns object {parent_id: ... , child_id: ... }
	let selection = Visuals.selected();
	let keys = selection.map(visual => visual.id);
	if (keys.length === 1 && selection[0].getType() === "dummy_anchor") {
		// only one anchor in selection
		return { "parent_id": Visuals.getParentId(keys[0]), "child_id": keys[0] };
	} else if (keys.length === 2) {
		if (Visuals.get(keys[0]).getType() === "dummy_anchor" && Visuals.get(keys[1]).getType() === "dummy_anchor") {
			// both anchors are dummies 
			return null;
		} else if (Visuals.getParentId(keys[0]) === Visuals.getParentId(keys[1])) {
			// one anchor and parent object selected 
			let parent_id = null;
			let child_id = null;
			if (Visuals.getParentId(keys[0]) === keys[0]) {
				child_id = keys[1];
				parent_id = keys[0];
			} else {
				child_id = keys[0];
				parent_id = keys[1];
			}
			return { "parent_id": parent_id, "child_id": child_id };
		}
	}
	return null;
}

function get_single_primitive_id_selected() {
	// will give object { "parent_id": ..., "children_ids": [...] } or null if more objects selected 
	let keys = Visuals.selected().map(visual => visual.id);
	let object_ids = { "children_ids": [] };
	if (keys.length > 0) {
		object_ids["parent_id"] = Visuals.getParentId(keys[0]);
		for (let key of keys) {
			if (Visuals.getParentId(key) !== object_ids["parent_id"]) {
				return null;
			} else if (Visuals.getParentId(key) !== key) {
				object_ids["children_ids"].push(key);
			}
		}
		return object_ids;
	}
	return null;
}

function get_only_link_selected() {
	let object_ids = get_single_primitive_id_selected();
	if (object_ids !== null && Visuals.get(object_ids["parent_id"]).getType() === "link") {
		return object_ids;
	}
	return null;
}

