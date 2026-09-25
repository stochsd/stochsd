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
	for (let key in connection_array) {
		let connection = connection_array[key];
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
	let all_objects = get_all_objects();
	for (let key in all_objects) {
		let parent = get_parent(all_objects[key]);

		// If any element is selected we add its parent
		if (all_objects[key].isSelected()) {
			result[parent.id] = parent;
		}
	}
	return result;
}

function get_root_objects() {
	let result = {};
	let all_objects = get_all_objects();
	for (let key in all_objects) {
		if (key.indexOf(".") == -1) {
			result[key] = all_objects[key];
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
		if (get_object(key)) {
			tool_deletePrimitive(key);
		}
	}
}

function get_selected_objects() {
	let return_array = {};
	for (let key in object_array) {
		if (object_array[key].isSelected()) {
			return_array[key] = object_array[key];
		}
	}
	for (let key in connection_array) {
		if (connection_array[key].isSelected()) {
			return_array[key] = connection_array[key];
		}
	}
	return return_array;
}

function get_selected_ids() {
	return Object.keys(get_selected_objects());
}

function delete_connection(key) {
	if (!(key in connection_array)) {
		return;
	}
	let start_anchor = connection_array[key].start_anchor;
	let end_anchor = connection_array[key].end_anchor;
	let auxiliary = connection_array[key].auxiliary;
	connection_array[key].group.remove();
	delete connection_array[key];

	// Must be done last otherwise the anchors will respawn	
	delete_object(start_anchor.id);
	delete_object(end_anchor.id);
	delete_object(auxiliary.id);
}
function delete_object(node_id) {
	let object_to_delete = object_array[node_id];

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
	delete object_array[node_id];
}
function primitive_mousedown(node_id, event, new_primitive) {
	mouse.lastClickedPrimitive = get_object(node_id);
	// If we left click directly on the anchors we dont want anything but them selected
	if (event.which === mouse.left) {
		if (mouse.lastClickedPrimitive.type == "dummy_anchor") {
			let elementId = get_parent_id(mouse.lastClickedPrimitive.id);
			unselect_all_but(elementId);
		} else if (get_only_selected_anchor_id()) {
			unselect_all();
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
	for (let key in object_array) {
		// dont update dummy_anchors, the twopointer parent of the dummy anchor has responsibility of the dummy_anchors 
		if (object_array[key].type !== "dummy_anchor") {
			object_array[key].update();
		}
	}
	update_twopointer_objects(ids);
}

// only updates diagrams, tables, and XyPlots if needed 
function update_twopointer_objects(ids) {
	for (let key in connection_array) {
		let onlyIfRelevant = ["timeplot", "xyplot", "compareplot", "histoplot", "table"];
		if (onlyIfRelevant.includes(connection_array[key].type)) {
			if (ids.includes(key)) {
				connection_array[key].update();
			}
		} else {
			connection_array[key].update();
		}
	}
}

function update_all_objects() {
	for (let key in object_array) {
		object_array[key].update();
	}
	for (let key in connection_array) {
		connection_array[key].update();
	}
}

function get_all_objects() {
	/** @type {{[id: string]: BaseObject }} */
	let result = {}
	for (let key in object_array) {
		result[key] = object_array[key];
	}
	for (let key in connection_array) {
		result[key] = connection_array[key];
	}
	return result;
}

function get_object(id) {
	if (typeof object_array[id] != "undefined") {
		return object_array[id];
	}
	if (typeof connection_array[id] != "undefined") {
		return connection_array[id];
	}
	return false;
}

/** @param {string} id @param {string} new_name */
function set_name(id, new_name) {
	let tobject = get_object(id);
	if (!tobject) {
		return;
	}
	tobject.setName(new_name);
	tobject.afterNameChange();
}
/** @param {string} node_id @param {number} diff_x @param {number} diff_y */
function rel_move(node_id, diff_x, diff_y) {
	let primitive = findID(node_id);
	if (primitive != null) {
		// If its a real primitive (stoch, variable etc) update it in the engine
		let oldPos = getCenterPosition(primitive);
		let newPos = [oldPos[0] + diff_x, oldPos[1] + diff_y];
		setCenterPosition(primitive, newPos);
	} else {
		// If its not a real primtiive but rather an anchor point updated the position only graphically
		object_array[node_id].pos[0] += diff_x;
		object_array[node_id].pos[1] += diff_y;
	}
	object_array[node_id].updatePosition();
	object_array[node_id].afterMove(diff_x, diff_y);
}

function positionToModel() {

}


function unselect_all_other_anchors(parent_id, child_id_to_select) {
	unselect_all();
	let parent = connection_array[parent_id];
	parent.select();
	for (let anchor of parent.getAnchors()) {
		if (anchor.id !== child_id_to_select) {
			anchor.unselect();
		}
	}
}

function unselect_all() {
	for (let key in object_array) {
		object_array[key].unselect();
	}
	for (let key in connection_array) {
		connection_array[key].unselect();
	}
}

function unselect_all_but(dont_unselect_id) {
	for (let key in object_array) {
		if (key != dont_unselect_id) {
			object_array[key].unselect();
		}
	}
	for (let key in connection_array) {
		if (key != dont_unselect_id) {
			connection_array[key].unselect();
		}
	}
}

function rotate_name(node_id) {
	let object = get_object(node_id);
	if (object.name_pos < 3) {
		object.name_pos++;
	} else {
		object.name_pos = 0;
	}
	update_name_pos(node_id);
}

function update_name_pos(node_id) {
	let object = get_object(node_id);
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

	let visualObject = get_object(node_id);
	let pos = visualObject.namePosList[visualObject.name_pos];
	name_element.setAttribute("x", pos[0]); //Set path's data
	name_element.setAttribute("y", pos[1]); //Set path's data

	switch (get_object(node_id).name_pos) {
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

