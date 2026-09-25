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

