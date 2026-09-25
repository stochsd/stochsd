class TwoPointerTool extends BaseTool {
	static init() {
		this.primitive = null; // The primitive in Insight Maker engine we are creating
		this.current_connection = null; // The visual we are working on right now
		this.type = "flow";
		this.rightClickMode = false;
	}
	static enterTool(mouseButton) {
		this.rightClickMode = (mouseButton === mouse.right);
	}
	static getType() {
		return "none";
	}
	static createTwoPointer(x, y, name) {
		// Override this and do a for example: 
		// Example: this.primitive = createConnector(name, "Flow", null,null);
		// Example: this.current_connection = new FlowVisual(this.primitive.id,this.getType(),[x,y]);
	}
	static leftMouseDown(x, y) {
		Visuals.unselectAll();

		// Looks for element under mouse. 
		let start_element = find_element_under(x, y);

		// Finds free name for primitive. e.g. "stock1", "stock2", "variable1" etc. (Visible to the user)
		let primitive_name = findFreeName(type_basename[this.getType()]);
		this.createTwoPointer(x, y, primitive_name);

		// subscribes to changes in insight makers x and y positions. (these valus are then saved)
		this.primitive.subscribePosition(this.current_connection.positionUpdateHandler);
		if (start_element != null && this.current_connection.getStartAttach) {
			this.current_connection.setStartAttach(get_parent(start_element));
		}
		this.current_connection.setName(primitive_name);

		// make sure start anchor is synced with primitive 
		this.current_connection.syncAnchorToPrimitive("start");
	}
	static mouseMove(x, y, shiftKey) {
		// Function used during creation of twopointer
		if (this.current_connection == null) {
			return;
		}
		this.current_connection.select();
		let move_node_id = `${this.current_connection.id}.end_anchor`;
		this.mouseMoveSingleAnchor(x, y, shiftKey, move_node_id);
	}
	static mouseMoveSingleAnchor(x, y, shiftKey, node_id) {
		// Function used both during creation and later moving of anchor point 
		let moveObject = Visuals.get(node_id);
		let parent = get_parent(moveObject);
		if (shiftKey) {
			let [oppositeX, oppositeY] = [parent.startX, parent.startY];
			if (parent.start_anchor.id === node_id) {
				[oppositeX, oppositeY] = [parent.endX, parent.endY];
			}
			let sideX = x - oppositeX;
			let sideY = y - oppositeY;
			let shortSideLength = Math.min(Math.abs(sideX), Math.abs(sideY));
			let signX = Math.sign(sideX);
			let signY = Math.sign(sideY);
			moveObject.setPos([oppositeX + signX * shortSideLength, oppositeY + signY * shortSideLength]);
		} else {
			moveObject.setPos([x, y]);
		}
		parent.update();
		Visuals.getOnePointer(node_id).updatePosition();
	}
	static leftMouseUp(x, y, shiftKey) {
		this.current_connection.update();
		this.current_connection = null;
		mouse.lastClickedPrimitive = null;
		if (this.rightClickMode === false) {
			ToolBox.setTool("mouse");
		}
	}
	static rightMouseDown(x, y) {
		ToolBox.setTool("mouse");
	}
	static leaveTool() {
		mouse.lastClickedPrimitive = null;
	}
}

class FlowTool extends TwoPointerTool {
	static init() {
		super.init();
		// Is to prevent error if rightdown happens before leftdown 
		// can be either "x" or "y" 
		this.direction = "";
	}
	static leftMouseDown(x, y) {

	}
	static mouseMove(x, y) {
		if (this.current_connection) {
			this.mouseMoveSingleAnchor(x, y, false, this.current_connection.end_anchor.id);
		} else {
			// First time moving mouse 
			this.firstLeftMouseMove(x, y);
		}
	}
	static firstLeftMouseMove(x, y) {
		// does not create anything until the first leftMouseMove have been triggered 
		super.leftMouseDown(x, y);
	}
	static mouseMoveSingleAnchor(x, y, shiftKey, anchor_id) {
		// Function used both during creation and later moving of anchor point 
		let mainAnchor = Visuals.get(anchor_id);
		let parent = get_parent(mainAnchor);

		parent.requestNewAnchorPos([x, y], anchor_id);
		parent.update();
		// update connecting links 
		find_connections(parent).map(conn => conn.update());
	}
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Flow", null, null);
		setNonNegative(this.primitive, false); 			// What does this do?

		this.current_connection = new FlowVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
		this.current_connection.name_pos = Number(this.primitive.getAttribute("RotateName"));

		unselect_all_other_anchors(this.current_connection.id, this.current_connection.end_anchor.id);
		update_name_pos(this.primitive.id);
	}
	static rightMouseDown(x, y) {
		if (mouse.isLeftDown) {
			let only_selected_anchor = get_only_selected_anchor_id();
			if (only_selected_anchor) {
				let parent = Visuals.getTwoPointer(only_selected_anchor["parent_id"]);
				let child = Visuals.getOnePointer(only_selected_anchor["child_id"]);
				if (parent.getType() === "flow" && child.getAnchorType() === "end") {
					let prevAnchorPos = parent.getPreviousAnchor(child.id).getPos();
					if (distance(prevAnchorPos, [x, y]) < 10) {
						if (parent.middleAnchors.length > 0) {
							// remove last middle anchor
							parent.removeLastMiddleAnchorPoint();
						}
					} else {
						// Add middle anchor 
						parent.createMiddleAnchorPoint(x, y);
						unselect_all_other_anchors(parent.id, child.id);
					}
				}
			}
		} else {
			// bugfix: unselect to not unattach on next empty click
			Visuals.unselectAll();
			ToolBox.setTool("mouse");
		}
	}
	static leftMouseUp(x, y, shiftKey) {
		if (this.current_connection) {
			this.mouseUpSingleAnchor(x, y, shiftKey, this.current_connection.end_anchor.id);
			this.current_connection = null;
			mouse.lastClickedPrimitive = null;

			if (this.rightClickMode === false) {
				// bugfix: unselect to not unattach on next empty click
				Visuals.unselectAll();
				ToolBox.setTool("mouse");
			}
		}
	}
	static mouseUpSingleAnchor(x, y, shiftKey, node_id) {
		attach_anchor(Visuals.getOnePointer(node_id));
	}
	static getType() {
		return "flow";
	}
}
FlowTool.init();


function cleanUnconnectedLinks() {
	let allLinks = primitives("Link");
	for (let link of allLinks) {
		let ends = getEnds(link);
		if ((ends[0] == null) || (ends[1] == null)) {
			removePrimitive(link);
		}
	}
}


class TextAreaTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		let primitive_name = findFreeName(type_basename["text"]);
		this.primitive = createConnector(primitive_name, "TextArea", null, null);
		this.current_connection = new TextAreaVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static getType() {
		return "text";
	}
}

class RectangleTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Rectangle", null, null);
		this.current_connection = new RectangleVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static getType() {
		return "rectangle";
	}
}
RectangleTool.init();


class EllipseTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Ellipse", null, null);
		this.current_connection = new EllipseVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static getType() {
		return "ellipse";
	}
}

class LineTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Line", null, null);
		this.current_connection = new LineVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static getType() {
		return "line";
	}
	static mouseMoveSingleAnchor(x, y, shiftKey, node_id) {
		// Function used both during creation and later moving of anchor point 
		let moveObject = Visuals.get(node_id);
		let parent = get_parent(moveObject);
		if (shiftKey) {
			let [oppositeX, oppositeY] = [parent.startX, parent.startY];
			if (parent.start_anchor.id === node_id) {
				[oppositeX, oppositeY] = [parent.endX, parent.endY];
			}
			let sideX = x - oppositeX;
			let sideY = y - oppositeY;
			let shortSideLength = Math.min(Math.abs(sideX), Math.abs(sideY));
			let longSideLength = Math.max(Math.abs(sideX), Math.abs(sideY));
			if (3 * shortSideLength < longSideLength) {
				// Place Horizontal or vertical
				if (Math.abs(sideX) < Math.abs(sideY)) {
					// place vertical |
					moveObject.setPos([oppositeX, y]);
				} else {
					// place Horizontal -
					moveObject.setPos([x, oppositeY]);
				}
			} else {
				// place at 45 degree angle 
				let signX = Math.sign(sideX);
				let signY = Math.sign(sideY);
				moveObject.setPos([oppositeX + signX * shortSideLength, oppositeY + signY * shortSideLength]);
			}
		} else {
			moveObject.setPos([x, y]);
		}
		parent.update();
		Visuals.getOnePointer(node_id).updatePosition();
	}
}
LineTool.init();

class TableTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Table", null, null);
		this.current_connection = new TableVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x, y);
		setDisplayIds(this.primitive, this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "table";
	}
}
TableTool.init();

class TimePlotTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "TimePlot", null, null);
		this.current_connection = new TimePlotVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		let sides = this.initialSelectedIds.map(() => "L");
		super.leftMouseDown(x, y);
		setDisplayIds(this.primitive, this.initialSelectedIds, sides);
		this.current_connection.render();
	}
	static getType() {
		return "timeplot";
	}
}

class ComparePlotTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "ComparePlot", null, null);
		this.current_connection = new ComparePlotVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x, y)
		setDisplayIds(this.primitive, this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "compareplot";
	}
}
ComparePlotTool.init();

class XyPlotTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "XyPlot", null, null);
		this.current_connection = new XyPlotVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x, y)
		setDisplayIds(this.primitive, this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "xyplot";
	}
}
XyPlotTool.init();


class HistoPlotTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "HistoPlot", null, null);
		this.current_connection = new HistoPlotVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x, y);
		setDisplayIds(this.primitive, this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "histoplot";
	}
}

class LinkTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Link", null, null);
		this.current_connection = new LinkVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static mouseMoveSingleAnchor(x, y, shiftKey, node_id) {
		let anchor_type = node_id.split(".")[1];
		if (anchor_type === "start_anchor" || anchor_type === "end_anchor") {
			let moveObject = Visuals.get(node_id);
			let parent = get_parent(moveObject);
			moveObject.setPos([x, y]);
			parent.update();
		} else if (anchor_type === "b1_anchor") {
			let parent = Visuals.getTwoPointer(get_parent_id(node_id));
			parent.setHandle1Pos([x, y]);
			parent.update();
		} else if (anchor_type === "b2_anchor") {
			let parent = Visuals.getTwoPointer(get_parent_id(node_id));
			parent.setHandle2Pos([x, y]);
			parent.update();
		}
	}
	static mouseRelativeMoveSingleAnchor(diff_x, diff_y, shiftKey, move_node_id) {
		let start_pos = Visuals.get(move_node_id).getPos();
		this.mouseMoveSingleAnchor(start_pos[0] + diff_x, start_pos[1] + diff_y, shiftKey, move_node_id);
	}
	static mouseUpSingleAnchor(x, y, shiftKey, node_id) {
		this.mouseMoveSingleAnchor(x, y, shiftKey, node_id);
		/** @type {AnchorPoint} */
		const anchor = Visuals.getOnePointer(node_id);
		/** @type {BaseConnection} */
		const parent = get_parent(anchor);
		if (anchor.getAnchorType() === "start" || anchor.getAnchorType() === "end") {
			attach_anchor(anchor, (attachTo) => !(anchor.getAnchorType() == "end" && attachTo.is_ghost));
			parent.update();
			if (parent.getStartAttach() === null || parent.getEndAttach() === null) {
				// delete link is not attached at both ends 
				delete_selected_objects();
			}
		} else if (anchor.getAnchorType() === "bezier1" || anchor.getAnchorType() === "bezier2") {
			parent.update();
		}
	}
	static leftMouseUp(x, y, shiftKey) {
		this.mouseUpSingleAnchor(x, y, shiftKey, this.current_connection.end_anchor.id);

		this.current_connection = null;
		mouse.lastClickedPrimitive = null;
		if (this.rightClickMode === false) {
			ToolBox.setTool("mouse");
		}
	}
	static getType() {
		return "link";
	}
}
LinkTool.init();


/** 
 * @param {AnchorPoint} anchor
 * @param {(attachTo: BaseObject) => boolean} [shouldAttach=(attachTo) => true]
 */
function attach_anchor(anchor, shouldAttach = (attachTo) => true) {
	[x, y] = anchor.getPos();
	let parentConnection = get_parent(anchor);

	let elements_under = find_elements_under(x, y);
	let anchor_element = null;
	let attach_to = null;


	// Find unselected stock element
	for (let i = 0; i < elements_under.length; i++) {
		let element = elements_under[i];

		let elemIsNotSelected = !element.isSelected();
		let elemIsNotParentOfAnchor = element[i] != parentConnection;
		if (elemIsNotSelected && elemIsNotParentOfAnchor) {
			attach_to = element;
			break;
		}
	}
	if (attach_to == null) {
		return false;
	} else if (!shouldAttach(attach_to)) {
		return false
	}


	switch (anchor.getAnchorType()) {
		case "start":
			parentConnection.setStartAttach(attach_to);
			break;
		case "end":
			parentConnection.setEndAttach(attach_to);
			break;
	}

	parentConnection.update();
	return true;
}

var currentTool = MouseTool;

