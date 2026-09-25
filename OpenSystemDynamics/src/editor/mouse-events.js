class MousePan {
	/** @type {{x: number, y: number}} */
	static downAt;
	static middleIsDown;
	static init() {
		document.body.addEventListener("mouseleave", () => MousePan.end())
	}
	static start(x, y) {
		this.downAt = {x, y};
		this.middleIsDown = true;
		SVG.svgElement.classList.add("panning")
	}
	static move(x, y) {
		SVG.svgElement.parentElement.scrollBy(this.downAt.x - x, this.downAt.y - y);
	}
	static end() {
		SVG.svgElement.classList.remove("panning")
		this.middleIsDown = false;
	}
 }

function mouseDownHandler(event) {
	do_global_log("mouseDownHandler");
	if (!isTimeUnitOk(getTimeUnits()) && Preferences.get("forceTimeUnit")) {
		event.preventDefault();
		timeUnitDialog.show();
		return;
	}
	let offset = $(SVG.svgElement).offset();
	let x = event.pageX - offset.left;
	let y = event.pageY - offset.top;
	do_global_log("x:" + x + " y:" + y);
	switch (event.which) {
		case mouse.left:
			// if left mouse button down
			mouse.isLeftDown = true;
			currentTool.leftMouseDown(x, y);
			break;
		case mouse.middle: 
			event.preventDefault()
			MousePan.start(x, y)
			break;
		case mouse.right:
			// if right mouse button down
			currentTool.rightMouseDown(x, y);
			break;
	}
}
function mouseMoveHandler(event) {
	let offset = $(SVG.svgElement).offset();
	let x = event.pageX - offset.left;
	let y = event.pageY - offset.top;

	mouse.x = x;
	mouse.y = y;

	if (mouse.isLeftDown) {
		currentTool.mouseMove(x, y, event.shiftKey);
	}
	if (MousePan.middleIsDown) {
		event.preventDefault()
		MousePan.move(x, y)
	}
	
}
function mouseUpHandler(event) {
	if (event.which === mouse.left) {
		if (!mouse.isLeftDown) {
			return;
		}
		// does not work to store UndoState here, because mouseUpHandler happens even when we are outside the svg (click buttons etc)
		do_global_log("mouseUpHandler");
		let offset = $(SVG.svgElement).offset();
		let x = event.pageX - offset.left;
		let y = event.pageY - offset.top;

		currentTool.leftMouseUp(x, y, event.shiftKey);
		mouse.isLeftDown = false;
		InfoBar.update();
		History.storeUndoState();
		ToolBox.updateButtons();
	} else if (event.which == mouse.middle) {
		event.preventDefault()
		MousePan.end()
	}
}

function find_elements_under(x, y) {
	let found_array = [];
	// Having "flow" in this list causes a bug with flows that does not place properly
	//~ let attachable_object_types = ["flow", "stock", "variable"];
	let attachable_object_types = ["flow", "stock", "constant", "variable", "converter"];
	for (let visual of Visuals.all()) {
		if (visual.type == "dummy_anchor") {
			// We are only intressted in primitive-objects. not dummy_anchors
			continue;
		}
		if (attachable_object_types.indexOf(visual.type) == -1) {
			// We skip if the object is not attachable
			continue;
		}
		let rect = visual.getBoundRect();
		if (isInLimits(rect.minX, x, rect.maxX) && isInLimits(rect.minY, y, rect.maxY)) {
			found_array.push(visual);
		}
	}
	do_global_log("found array(" + found_array.length + ") " + found_array.map((x) => x.id).join(","));
	return found_array;
}

function find_element_under(x, y) {
	elements_under = find_elements_under(x, y);
	if (elements_under.length > 0) {
		do_global_log("find_element_under choose " + elements_under[0].id);
		return elements_under[0];
	} else {
		return null;
	}
}

function stochsd_clear_sync() {
	for (let parent of Visuals.parents()) {
		if (findID(parent.id) == null) {
			stochsd_delete_primitive(parent.id);
		}
	}
}

