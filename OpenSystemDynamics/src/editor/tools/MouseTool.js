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
		if (selected_anchor && Visuals.getTwoPointer(selected_anchor.parent_id).getStartAttach) {
			let parent = Visuals.getTwoPointer(selected_anchor.parent_id);
			// Detach anchor 
			switch (Visuals.getOnePointer(selected_anchor.child_id).getAnchorType()) {
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
			let parent = Visuals.getTwoPointer(only_selected_anchor["parent_id"]);
			let tool = ToolBox.tools[parent.type];
			tool.mouseMoveSingleAnchor(x, y, shiftKey, only_selected_anchor["child_id"]);
			parent.update();
		} else if (only_selected_link) {
			// special exeption for links of links is being draged directly 
			LinkTool.mouseRelativeMoveSingleAnchor(diff_x, diff_y, shiftKey, only_selected_link["parent_id"] + ".b1_anchor");
			LinkTool.mouseRelativeMoveSingleAnchor(diff_x, diff_y, shiftKey, only_selected_link["parent_id"] + ".b2_anchor");
			let parent = Visuals.getTwoPointer(only_selected_link["parent_id"]);
			parent.update();
		} else {
			this.defaultRelativeMove(Visuals.selected(), diff_x, diff_y);
		}
	}
	/** @param {(OnePointer | TwoPointer)[]} move_objects */
	static defaultRelativeMove(move_objects, diff_x, diff_y) {
		let objectMoved = false;
		for (let visual of move_objects) {
			if (visual.draggable == undefined) {
				continue;
			}
			if (visual.draggable == false) {
				do_global_log("skipping because of no draggable");
				continue;
			}

			objectMoved = true;
			// This code is not very optimised. If we want to optimise it we should just find the objects that needs to be updated recursivly
			visual.moveBy(diff_x, diff_y);
		}
		if (objectMoved) {
			// TwoPointer objects depent on OnePointer object (e.g. AnchorPoint, Stock, Auxiliary etc.)
			// Therefore they must be updated seprately 
			Visuals.updateAllExceptDisplays(move_objects.map(visual => visual.id));
		}
	}
	static leftMouseUp(x, y) {
		// Check if we selected only 1 anchor element and in that case detach it;
		let selected_anchor = get_only_selected_anchor_id();

		if (selected_anchor && Visuals.getTwoPointer(selected_anchor.parent_id).getStartAttach) {
			let parent = Visuals.getTwoPointer(selected_anchor.parent_id);
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
			Visuals.getTwoPointer(only_selected_anchor["parent_id"]).getType() === "flow" &&
			Visuals.getOnePointer(only_selected_anchor["child_id"]).getAnchorType() === "end") {
			FlowTool.rightMouseDown(x, y);
		}
	}
}

