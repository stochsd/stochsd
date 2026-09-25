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

