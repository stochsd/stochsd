function tool_deletePrimitive(id) {
	let primitive = findID(id);

	removePrimitive(primitive);

	// Delete ghosts
	let ghostIDs = findGhostsOfID(id);
	for (let i in ghostIDs) {
		tool_deletePrimitive(ghostIDs[i]);
	}
	cleanUnconnectedLinks();
	detachFlows(id);
	RunResults.removeResultsForId(id);
}

function detachFlows(id) {
	for (let connection of Visuals.twoPointers()) {
		if (connection.type == "flow") {
			if (connection.getStartAttach() && connection.getStartAttach().id == id) {
				connection.setStartAttach(null);
				connection.update();
			}
			if (connection.getEndAttach() && connection.getEndAttach().id == id) {
				connection.setEndAttach(null);
				connection.update();
			}
		}
	}
}

function get_selected_root_objects() {
	let result = {};
	for (let visual of Visuals.all()) {
		let parent = get_parent(visual);
		// If any element is selected we add its parent
		if (visual.isSelected()) {
			result[parent.id] = parent;
		}
	}
	return result;
}

function get_root_objects() {
	let result = {};
	for (let visual of Visuals.all()) {
		if (visual.id.indexOf(".") == -1) {
			result[visual.id] = visual;
		}
	}
	return result;
}

function delete_selected_objects() {
	// Delete all objects that are selected
	let selection = get_selected_root_objects();
	for (let key in selection) {
		// check if object not already deleted
		// e.i. link gets deleted automatically if any of it's attachments gets deleted
		if (Visuals.get(key)) {
			tool_deletePrimitive(key);
		}
	}
}

function get_selected_objects() {
	let return_array = {};
	for (let visual of Visuals.all()) {
		if (visual.isSelected()) {
			return_array[visual.id] = visual;
		}
	}
	return return_array;
}

function get_selected_ids() {
	return Object.keys(get_selected_objects());
}

function delete_connection(key) {
	let connection = Visuals.getTwoPointer(key);
	if (!connection) {
		return;
	}
	let start_anchor = connection.start_anchor;
	let end_anchor = connection.end_anchor;
	let auxiliary = connection.auxiliary;
	connection.group.remove();
	Visuals.remove(key);

	// Must be done last otherwise the anchors will respawn	
	delete_object(start_anchor.id);
	delete_object(end_anchor.id);
	delete_object(auxiliary.id);
}
function delete_object(node_id) {
	let object_to_delete = Visuals.getOnePointer(node_id);

	// Delete all references to the object in the connections
	if (object_to_delete.hasOwnProperty("parent_id")) {
		delete_connection(object_to_delete.parent_id);
	}

	for (let i in object_to_delete.selector_array) {
		object_to_delete.selector_array[i].remove();
	}
	for (let key in object_to_delete.element_array) {
		object_to_delete.element_array[key].remove();
	}
	object_to_delete.group.remove();
	Visuals.remove(node_id);
}
function primitive_mousedown(node_id, event, new_primitive) {
	mouse.lastClickedPrimitive = Visuals.get(node_id);
	// If we left click directly on the anchors we dont want anything but them selected
	if (event.which === mouse.left) {
		if (mouse.lastClickedPrimitive.type == "dummy_anchor") {
			let elementId = get_parent_id(mouse.lastClickedPrimitive.id);
			unselect_all_but(elementId);
		} else if (get_only_selected_anchor_id()) {
			Visuals.unselectAll();
		}
		if (mouse.lastClickedPrimitive.isSelected()) {
			if (event.shiftKey) {
				mouse.lastClickedPrimitive.unselect();
			}
		} else {
			if (!event.shiftKey) {
				// We don't want to unselect an eventual parent
				// As that will hide other anchors
				let parent_id = get_parent_id(node_id);
				unselect_all_but(parent_id);
			}
			mouse.lastClickedPrimitive.select();
		}
		mouse.clickedOnObject = true
	}
}

// only updates diagrams, tables, and XyPlots if needed 
function update_relevant_objects(ids) {
	for (let visual of Visuals.onePointers()) {
		// dont update dummy_anchors, the twopointer parent of the dummy anchor has responsibility of the dummy_anchors 
		if (visual.type !== "dummy_anchor") {
			visual.update();
		}
	}
	update_twopointer_objects(ids);
}

// only updates diagrams, tables, and XyPlots if needed 
function update_twopointer_objects(ids) {
	for (let visual of Visuals.twoPointers()) {
		let onlyIfRelevant = ["timeplot", "xyplot", "compareplot", "histoplot", "table"];
		if (onlyIfRelevant.includes(visual.type)) {
			if (ids.includes(visual.id)) {
				visual.update();
			}
		} else {
			visual.update();
		}
	}
}

function update_all_objects() {
	for (let visual of Visuals.onePointers()) {
		visual.update();
	}
	for (let visual of Visuals.twoPointers()) {
		visual.update();
	}
}

/** @param {string} id @param {string} new_name */
function set_name(id, new_name) {
	let vis = Visuals.get(id);
	if (!vis) {
		return;
	}
	vis.setName(new_name);
	vis.afterNameChange();
}
/** @param {string} node_id @param {number} diff_x @param {number} diff_y */
function rel_move(node_id, diff_x, diff_y) {
	let primitive = findID(node_id);
	let visual = Visuals.getOnePointer(node_id);
	if (primitive != null) {
		// If its a real primitive (stoch, variable etc) update it in the engine
		let oldPos = getCenterPosition(primitive);
		let newPos = [oldPos[0] + diff_x, oldPos[1] + diff_y];
		setCenterPosition(primitive, newPos);
	} else {
		// If its not a real primtiive but rather an anchor point updated the position only graphically
		visual.pos[0] += diff_x;
		visual.pos[1] += diff_y;
	}
	visual.updatePosition();
	visual.afterMove(diff_x, diff_y);
}

function positionToModel() {

}


function unselect_all_other_anchors(parent_id, child_id_to_select) {
	Visuals.unselectAll();
	let parent = Visuals.getTwoPointer(parent_id);
	parent.select();
	for (let anchor of parent.getAnchors()) {
		if (anchor.id !== child_id_to_select) {
			anchor.unselect();
		}
	}
}

function unselect_all_but(dont_unselect_id) {
	for (let visual of Visuals.onePointers()) {
		if (visual.id != dont_unselect_id) {
			visual.unselect();
		}
	}
	for (let visual of Visuals.twoPointers()) {
		if (visual.id != dont_unselect_id) {
			visual.unselect();
		}
	}
}

/** @param {string} node_id  */
function rotate_name(node_id) {
	const vis = Visuals.get(node_id);
	if (vis.name_pos < 3) {
		vis.name_pos++;
	} else {
		vis.name_pos = 0;
	}
	update_name_pos(node_id);
}

function update_name_pos(node_id) {
	let object = Visuals.get(node_id);
	let name_element = object.name_element;
	// Some objects does not have name element
	if (name_element == null) {
		return;
	}
	// For fixed names (used only by text element)
	if (object.name_centered) {
		name_element.setAttribute("x", 0); //Set path's data
		name_element.setAttribute("y", 0); //Set path's data
		name_element.setAttribute("text-anchor", "middle");
		return;
	}

	let visualObject = Visuals.get(node_id);
	let pos = visualObject.namePosList[visualObject.name_pos];
	name_element.setAttribute("x", pos[0]); //Set path's data
	name_element.setAttribute("y", pos[1]); //Set path's data

	switch (Visuals.get(node_id).name_pos) {
		case 0:
			// Below
			name_element.setAttribute("text-anchor", "middle");
			break;
		case 1:
			// To the right
			name_element.setAttribute("text-anchor", "start");
			break;
		case 2:
			// Above
			name_element.setAttribute("text-anchor", "middle");
			break;
		case 3:
			// To the left
			name_element.setAttribute("text-anchor", "end");
			break;
	}
}

