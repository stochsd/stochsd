class MouseTool extends BaseTool {
	static leftMouseDown(x, y) {
		mouse.downX = x;
		mouse.downY = y;
		do_global_log("mouse.clickedOnObject " + mouse.clickedOnObject);
		if (!mouse.clickedOnObject) {
			mouse.emptyClickDown = true;
			RectSelector.start(mouse.downX, mouse.downY);
		}

		let selectedHandle = getOnlySelectedHandleId();
		// Only one anchor is selected AND that that anchor has attaching capabilities 
		if (selectedHandle && Visuals.getTwoPointer(selectedHandle.parent_id).getStartAttach) {
			let parent = Visuals.getTwoPointer(selectedHandle.parent_id);
			// Detach handle 
			switch (Visuals.getOnePointer(selectedHandle.child_id).getHandleType()) {
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
		const onlySelectedHandle = getOnlySelectedHandleId();
		const onlySelectedLink = get_only_link_selected();
		if (onlySelectedHandle) {
			// Use equivalent tool type
			// 	RectangleVisual => RectangleTool
			// 	LinkVisual => LinkTool
			let parent = Visuals.getTwoPointer(onlySelectedHandle["parent_id"]);
			/** @type {typeof TwoPointerTool} */
			let tool = ToolBox.tools[parent.type];
			tool.mouseMoveSingleHandle(x, y, shiftKey, onlySelectedHandle["child_id"]);
			parent.update();
		} else if (onlySelectedLink) {
			// special exeption for links of links is being draged directly 
			/** @type {LinkVisual} */
			let link = Visuals.getTwoPointer(onlySelectedLink["parent_id"]);
			LinkTool.mouseRelativeMoveSingleHandle(diff_x, diff_y, shiftKey, link.control1Handle.id);
			LinkTool.mouseRelativeMoveSingleHandle(diff_x, diff_y, shiftKey, link.control2Handle.id);
			link.update();
		} else {
			this.defaultRelativeMove(Visuals.selected(), diff_x, diff_y);
		}
	}
	/** 
	 * @param {(OnePointer | TwoPointer)[]} visuals 
	 * @param {number} diffX
	 * @param {number} diffY
	*/
	static defaultRelativeMove(visuals, diffX, diffY) {
		let visualsMoved = false;
		for (let visual of visuals) {
			if (visual instanceof TwoPointer) {
				// TwoPointers are moved through their selected handles. A rect selection can select only some of them
				const handles = visual.getHandles().filter(handle => handle.isSelected());
				if (handles.length > 0) {
					visual.moveHandlesBy(handles, diffX, diffY);
					visualsMoved = true;
				}
				continue;
			}
			if (visual.draggable == false) {
				do_global_log("skipping because of no draggable");
				continue;
			}
			visualsMoved = true;
			// This code is not very optimised. If we want to optimise it we should just find the objects that needs to be updated recursivly
			visual.moveBy(diffX, diffY);
		}
		if (visualsMoved) {
			// TwoPointer depend on OnePointer object (e.g. Handle, Stock, Auxiliary etc.)
			// Therefore they must be updated seprately 
			Visuals.updateAllExceptDisplays(visuals.map(visual => visual.id));
		}
	}
	static leftMouseUp(x, y) {
		// Check if we selected only 1 handle element and in that case detach it;
		const selectedHandle = getOnlySelectedHandleId();

		if (selectedHandle && Visuals.getTwoPointer(selectedHandle.parent_id).getStartAttach) {
			const parent = Visuals.getTwoPointer(selectedHandle.parent_id);
			const tool = ToolBox.tools[parent.getType()];
			tool.mouseUpSingleHandle(x, y, false, selectedHandle.child_id);
		}

		if (mouse.emptyClickDown) {
			RectSelector.stop();
			mouse.emptyClickDown = false;
			ToolBox.updateButtons()			
		}
	}
	static rightMouseDown(x, y) {
		let onlySelectedHandle = getOnlySelectedHandleId();
		if (onlySelectedHandle &&
			Visuals.getTwoPointer(onlySelectedHandle["parent_id"]).getType() === "flow" &&
			Visuals.getOnePointer(onlySelectedHandle["child_id"]).getHandleType() === "end") {
			FlowTool.rightMouseDown(x, y);
		}
	}
}

