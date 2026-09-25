class MouseTool extends BaseTool {
	static leftMouseDown(x, y) {
		mouse.downX = x;
		mouse.downY = y;
		do_global_log("mouse.clickedOnObject " + mouse.clickedOnObject);
		if (!mouse.clickedOnObject) {
			mouse.emptyClickDown = true;
			RectSelector.start(mouse.downX, mouse.downY);
		}

		let selected_anchor = get_only_selected_anchor_id();
		// Only one anchor is selected AND that that anchor has attaching capabilities 
		if (selected_anchor && connection_array[selected_anchor.parent_id].getStartAttach) {
			let parent = connection_array[selected_anchor.parent_id];
			// Detach anchor 
			switch (object_array[selected_anchor.child_id].getAnchorType()) {
				case "start":
					parent.setStartAttach(null);
					break;
				case "end":
					parent.setEndAttach(null);
					break;
			}
		}

		// Reset it for use next time
		mouse.clickedOnObject = false
	}
	static mouseMove(x, y, shiftKey) {
		let diff_x = x - mouse.downX;
		let diff_y = y - mouse.downY;
		mouse.downX = x;
		mouse.downY = y;

		if (mouse.emptyClickDown) {
			RectSelector.move(mouse.downX, mouse.downY);
			return;
		}
		// We only come here if some object is being dragged
		// Otherwise we will trigger mouse.emptyClickDown
		let only_selected_anchor = get_only_selected_anchor_id();
		let only_selected_link = get_only_link_selected();
		if (only_selected_anchor) {
			// Use equivalent tool type
			// 	RectangleVisual => RectangleTool
			// 	LinkVisual => LinkTool
			let parent = connection_array[only_selected_anchor["parent_id"]];
			let tool = ToolBox.tools[parent.type];
			tool.mouseMoveSingleAnchor(x, y, shiftKey, only_selected_anchor["child_id"]);
			parent.update();
		} else if (only_selected_link) {
			// special exeption for links of links is being draged directly 
			LinkTool.mouseRelativeMoveSingleAnchor(diff_x, diff_y, shiftKey, only_selected_link["parent_id"] + ".b1_anchor");
			LinkTool.mouseRelativeMoveSingleAnchor(diff_x, diff_y, shiftKey, only_selected_link["parent_id"] + ".b2_anchor");
			let parent = connection_array[only_selected_link["parent_id"]];
			parent.update();
		} else {
			let move_array = get_selected_objects();
			this.defaultRelativeMove(move_array, diff_x, diff_y);
		}
	}
	static defaultRelativeMove(move_objects, diff_x, diff_y) {
		let objectMoved = false;
		for (let key in move_objects) {
			if (move_objects[key].draggable == undefined) {
				continue;
			}
			if (move_objects[key].draggable == false) {
				do_global_log("skipping because of no draggable");
				continue;
			}

			objectMoved = true;
			// This code is not very optimised. If we want to optimise it we should just find the objects that needs to be updated recursivly
			rel_move(key, diff_x, diff_y);
		}
		if (objectMoved) {
			// TwoPointer objects depent on OnePointer object (e.g. AnchorPoint, Stock, Auxiliary etc.)
			// Therefore they must be updated seprately 
			let ids = [];
			for (let key in move_objects) {
				ids.push(move_objects[key].id);
			}
			update_relevant_objects(ids);
		}
	}
	static leftMouseUp(x, y) {
		// Check if we selected only 1 anchor element and in that case detach it;
		let selected_anchor = get_only_selected_anchor_id();

		if (selected_anchor && connection_array[selected_anchor.parent_id].getStartAttach) {
			let parent = connection_array[selected_anchor.parent_id];
			let tool = ToolBox.tools[parent.getType()];
			tool.mouseUpSingleAnchor(x, y, false, selected_anchor.child_id);
		}

		if (mouse.emptyClickDown) {
			RectSelector.stop();
			mouse.emptyClickDown = false;
			ToolBox.updateButtons()			
		}
	}
	static rightMouseDown(x, y) {
		let only_selected_anchor = get_only_selected_anchor_id();
		if (only_selected_anchor &&
			connection_array[only_selected_anchor["parent_id"]].getType() === "flow" &&
			object_array[only_selected_anchor["child_id"]].getAnchorType() === "end") {
			FlowTool.rightMouseDown(x, y);
		}
	}
}

