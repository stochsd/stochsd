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
		unselect_all();
		this.create(x, y);
		update_relevant_objects([]);
		InfoBar.update();
		ToolBox.updateButtons();
	}
	static leftMouseUp(x, y) {
		if (!this.rightClickMode) {
			ToolBox.setTool("mouse");
		}
	}
	static rightMouseDown(x, y) {
		unselect_all();
		ToolBox.setTool("mouse");
		InfoBar.update();
		ToolBox.updateButtons();
	}
}

class NumberboxTool extends OnePointCreateTool {
	static init() {
		this.targetPrimitive = null;
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
		let selected_ids = Object.keys(get_selected_root_objects());
		if (selected_ids.length != 1) {
			if (selected_ids.length == 0) {
				return "You must first select a primitive for the Number Box.";
			} else {
				return "You must first select exactly one primitive for the Number Box.";
			}
		} else {
			let selected_object = get_object(selected_ids[0]);
			if (this.numberboxable_primitives.indexOf(selected_object.type) == -1) {
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
		let selected_ids = Object.keys(get_selected_root_objects());
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
		let selection = get_selected_objects();
		for (let node_id in selection) {
			rotate_name(node_id);
		}
		ToolBox.setTool("mouse");
	}
	static leaveTool() {
		History.storeUndoState();
	}
}

class MoveValveTool extends BaseTool {
	static enterTool() {
		let selection = get_selected_objects();
		for (let node_id in selection) {
			let obj = get_object(node_id);
			if (obj.type == "flow") {
				obj.moveValve();
			}
		}
		ToolBox.setTool("mouse");
	}
}

class StraightenLinkTool extends BaseTool {
	static enterTool() {
		for (let node_id in get_selected_objects()) {
			let key = get_parent_id(node_id);
			let obj = get_object(key);
			if (obj.type == "link") {
				obj.resetBezierPoints();
			}
		}
		ToolBox.setTool("mouse");
	}

}

class GhostTool extends OnePointCreateTool {
	static init() {
		this.id_to_ghost = null;
		this.ghostable_primitives = ["stock", "variable", "constant", "converter"];
	}
	static create(x, y) {
		let source = findID(this.id_to_ghost);
		let ghost = makeGhost(source, [x, y]);
		ghost.setAttribute("RotateName", "0");
		syncVisual(ghost);
		let DIM_ghost = get_object(ghost.getAttribute("id"));
		source.subscribeAttribute(DIM_ghost.changeAttributeHandler);
	}
	/** @returns {string | undefined} */
	static getSelectionError() {
		let selectedIds = get_selected_ids();
		// filter out non root object, e.g. anchors 
		let selectedObjects = selectedIds.filter(id => !id.includes(".")).map(get_object);
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
		// filter out non root object, e.g. anchors 
		const error = GhostTool.getSelectionError()
		if (error) {
			xAlert(error);
			ToolBox.setTool("mouse");
			return;
		}
		let selectedIds = get_selected_ids();
		let selectedObjects = selectedIds.filter(id => !id.includes(".")).map(get_object);
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
	let selection = get_selected_objects();
	let keys = [];
	for (let key in selection) {
		keys.push(key);
	}
	if (keys.length === 1 && selection[keys[0]].getType() === "dummy_anchor") {
		// only one anchor in selection
		return { "parent_id": get_parent_id(keys[0]), "child_id": keys[0] };
	} else if (keys.length === 2) {
		if (get_object(keys[0]).getType() === "dummy_anchor" && get_object(keys[1]).getType() === "dummy_anchor") {
			// both anchors are dummies 
			return null;
		} else if (get_parent_id(keys[0]) === get_parent_id(keys[1])) {
			// one anchor and parent object selected 
			let parent_id = null;
			let child_id = null;
			if (get_parent_id(keys[0]) === keys[0]) {
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
	let selection = get_selected_objects();
	let keys = [];
	for (let key in selection) {
		keys.push(key);
	}
	let object_ids = { "children_ids": [] };
	if (keys.length > 0) {
		object_ids["parent_id"] = get_parent_id(keys[0]);
		for (let key of keys) {
			if (get_parent_id(key) !== object_ids["parent_id"]) {
				return null;
			} else if (get_parent_id(key) !== key) {
				object_ids["children_ids"].push(key);
			}
		}
		return object_ids;
	}
	return null;
}

function get_only_link_selected() {
	let object_ids = get_single_primitive_id_selected();
	if (object_ids !== null && get_object(object_ids["parent_id"]).getType() === "link") {
		return object_ids;
	}
	return null;
}

