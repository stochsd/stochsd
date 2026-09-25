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

function delete_selected_objects() {
	// Delete all objects that are selected
	for (let parent of Visuals.selectedParents()) {
		// check if object not already deleted
		// e.i. link gets deleted automatically if any of it's attachments gets deleted
		if (Visuals.get(parent.id)) {
			tool_deletePrimitive(parent.id);
		}
	}
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
			let elementId = Visuals.getParentId(mouse.lastClickedPrimitive.id);
			Visuals.unselectAllExcept(elementId);
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
				let parent_id = Visuals.getParentId(node_id);
				Visuals.unselectAllExcept(parent_id);
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
	Visuals.updateTwoPointers(ids);
}

