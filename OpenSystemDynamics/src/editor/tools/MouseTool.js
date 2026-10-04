class MouseTool extends BaseTool {
	static leftMouseDown(x, y) {
		mouse.downX = x;
		mouse.downY = y;
		do_global_log("mouse.clickedOnObject " + mouse.clickedOnObject);
		if (!mouse.clickedOnObject) {
			mouse.emptyClickDown = true;
			RectSelector.start(mouse.downX, mouse.downY);
		}

		const selectedHandle = Visuals.selectedHandle();
		// Only one anchor is selected AND that that anchor has attaching capabilities
		if (selectedHandle && selectedHandle.getParent().getStartAttach) {
			const parent = selectedHandle.getParent();
			// Detach handle
			switch (selectedHandle.getHandleType()) {
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
		const selectedHandle = Visuals.selectedHandle();
		const selection = Visuals.selected();
		if (selectedHandle) {
			// Use equivalent tool type
			// 	RectangleVisual => RectangleTool
			// 	LinkVisual => LinkTool
			const parent = selectedHandle.getParent();
			/** @type {typeof TwoPointerTool} */
			let tool = ToolBox.tools[parent.type];
			tool.mouseMoveSingleHandle(x, y, shiftKey, selectedHandle.id);
			parent.update();
		} else if (selection.length === 1 && selection[0] instanceof LinkVisual) {
			// special exeption for links of links is being draged directly
			const link = selection[0];
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
				let handles = visual.getHandles().filter(handle => handle.isSelected());
				if (visual instanceof LinkVisual) {
					// A link's ends follow what they are attached to, and its control points follow its ends.
					// So its control points are only moved on their own when neither attachment moves
					const movedEnds = [];
					if (visuals.includes(visual.getStartAttach())) {
						movedEnds.push(visual.startHandle);
					}
					if (visuals.includes(visual.getEndAttach())) {
						movedEnds.push(visual.endHandle);
					}
					const controls = [visual.control1Handle, visual.control2Handle];
					handles = movedEnds.length > 0 ? movedEnds : handles.filter(handle => controls.includes(handle));
				}
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
		const selectedHandle = Visuals.selectedHandle();

		if (selectedHandle && selectedHandle.getParent().getStartAttach) {
			const tool = ToolBox.tools[selectedHandle.getParent().getType()];
			tool.mouseUpSingleHandle(x, y, false, selectedHandle.id);
		}

		if (mouse.emptyClickDown) {
			RectSelector.stop();
			mouse.emptyClickDown = false;
			ToolBox.updateButtons()			
		}
	}
	static rightMouseDown(x, y) {
		const selectedHandle = Visuals.selectedHandle();
		if (selectedHandle &&
			selectedHandle.getParent().getType() === "flow" &&
			selectedHandle.getHandleType() === "end") {
			FlowTool.rightMouseDown(x, y);
		}
	}
}

