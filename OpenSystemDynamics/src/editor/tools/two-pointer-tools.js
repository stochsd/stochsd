class TwoPointerTool extends BaseTool {
	static init() {
		this.primitive = null; // The primitive in Insight Maker engine we are creating
		/** @type {TwoPointer} */
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
		// Example: this.current_connection = new FlowVisual(this.primitive.id,[x,y]);
	}
	static leftMouseDown(x, y) {
		Visuals.unselectAll();

		// Looks for visual under mouse. 
		const startVisual = Visuals.firstAttachableAt(x, y);

		// Finds free name for primitive. e.g. "stock1", "stock2", "variable1" etc. (Visible to the user)
		const primitiveName = findFreeName(type_basename[this.getType()]);
		this.createTwoPointer(x, y, primitiveName);

		// subscribes to changes in insight makers x and y positions. (these values are then saved)
		this.primitive.subscribePosition(this.current_connection.positionUpdateHandler);
		if (startVisual != null && this.current_connection.getStartAttach) {
			this.current_connection.setStartAttach(startVisual);
		}
		this.current_connection.setName(primitiveName);

		// make sure start anchor is synced with primitive 
		this.current_connection.syncHandleToPrimitive("start");
	}
	static mouseMove(x, y, shiftKey) {
		// Function used during creation of twopointer
		if (this.current_connection == null) {
			return;
		}
		this.current_connection.select();
		let move_node_id = this.current_connection.endHandle.id;
		this.mouseMoveSingleHandle(x, y, shiftKey, move_node_id);
	}
	static mouseMoveSingleHandle(x, y, shiftKey, node_id) {
		// Function used both during creation and later moving of handle 
		const handleToMove = Visuals.getHandle(node_id);
		let parent = handleToMove.getParent();
		if (shiftKey) {
			const [oppositeX, oppositeY] = [parent.startX, parent.startY];
			if (parent.startHandle.id === node_id) {
				[oppositeX, oppositeY] = [parent.endX, parent.endY];
			}
			const sideX = x - oppositeX;
			const sideY = y - oppositeY;
			const shortSideLength = Math.min(Math.abs(sideX), Math.abs(sideY));
			const signX = Math.sign(sideX);
			const signY = Math.sign(sideY);
			handleToMove.setPos([oppositeX + signX * shortSideLength, oppositeY + signY * shortSideLength]);
		} else {
			handleToMove.setPos([x, y]);
		}
		parent.update();
		Visuals.getHandle(node_id).updatePosition();
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
			this.mouseMoveSingleHandle(x, y, false, this.current_connection.endHandle.id);
		} else {
			// First time moving mouse 
			this.firstLeftMouseMove(x, y);
		}
	}
	static firstLeftMouseMove(x, y) {
		// does not create anything until the first leftMouseMove have been triggered 
		super.leftMouseDown(x, y);
	}
	/** 
	 * @param {number} x 
	 * @param {number} y 
	 * @param {boolean} shiftKey 
	 * @param {string} handleId 
	 * */
	static mouseMoveSingleHandle(x, y, shiftKey, handleId) {
		// Function used both during creation and later moving of handle
		const mainHandle = Visuals.getHandle(handleId);
		/** @type {FlowVisual} */
		const parent = mainHandle.getParent();

		parent.dragHandleTo(mainHandle, [x, y])
		parent.update();
		// update connecting links 
		Visuals.connectionsAttachedTo(parent).forEach(conn => conn.update());
	}
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Flow", null, null);
		setNonNegative(this.primitive, false); 			// What does this do?

		this.current_connection = new FlowVisual(this.primitive.id, [x, y], [x + 1, y + 1]);
		this.current_connection.name_pos = Number(this.primitive.getAttribute("RotateName"));

		this.current_connection.selectWithOnlyHandle(this.current_connection.endHandle);
		this.current_connection.updateNamePosition();
	}
	static rightMouseDown(x, y) {
		if (mouse.isLeftDown) {
			const child = Visuals.selectedHandle();
			if (child) {
				/** @type {FlowVisual} */
				const parent = child.getParent();
				if (parent.getType() === "flow" && child.getHandleType() === "end") {
					let prevHandlePos = parent.getPreviousHandle(child.id).getPos();
					if (distance(prevHandlePos, [x, y]) < 10) {
						if (parent.handles.length > 2) {
							// remove last middle anchor
							parent.removeLastBend();
						}
					} else {
						// Add middle anchor 
						parent.addBend([x, y]);
						parent.selectWithOnlyHandle(child);
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
			this.mouseUpSingleHandle(x, y, shiftKey, this.current_connection.endHandle.id);
			this.current_connection = null;
			mouse.lastClickedPrimitive = null;

			if (this.rightClickMode === false) {
				// bugfix: unselect to not unattach on next empty click
				Visuals.unselectAll();
				ToolBox.setTool("mouse");
			}
		}
	}
	static mouseUpSingleHandle(x, y, shiftKey, node_id) {
		attachHandle(Visuals.getHandle(node_id));
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
		this.current_connection = new TextAreaVisual(this.primitive.id, [x, y], [x + 1, y + 1]);
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
		this.current_connection = new RectangleVisual(this.primitive.id, [x, y], [x + 1, y + 1]);
	}
	static getType() {
		return "rectangle";
	}
}
RectangleTool.init();


class EllipseTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Ellipse", null, null);
		this.current_connection = new EllipseVisual(this.primitive.id, [x, y], [x + 1, y + 1]);
	}
	static getType() {
		return "ellipse";
	}
}

class LineTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Line", null, null);
		this.current_connection = new LineVisual(this.primitive.id, [x, y], [x + 1, y + 1]);
	}
	static getType() {
		return "line";
	}
	static mouseMoveSingleHandle(x, y, shiftKey, node_id) {
		// Function used both during creation and later moving of handle
		let handle = Visuals.getHandle(node_id);
		let parent = handle.getParent();
		if (shiftKey) {
			let [oppositeX, oppositeY] = [parent.startX, parent.startY];
			if (parent.startHandle.id === node_id) {
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
					handle.setPos([oppositeX, y]);
				} else {
					// place Horizontal -
					handle.setPos([x, oppositeY]);
				}
			} else {
				// place at 45 degree angle 
				let signX = Math.sign(sideX);
				let signY = Math.sign(sideY);
				handle.setPos([oppositeX + signX * shortSideLength, oppositeY + signY * shortSideLength]);
			}
		} else {
			handle.setPos([x, y]);
		}
		parent.update();
		Visuals.getHandle(node_id).updatePosition();
	}
}
LineTool.init();

class TableTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Table", null, null);
		this.current_connection = new TableVisual(this.primitive.id, [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Visuals.selected().map(visual => visual.id);
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
		this.current_connection = new TimePlotVisual(this.primitive.id, [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Visuals.selected().map(visual => visual.id);
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
		this.current_connection = new ComparePlotVisual(this.primitive.id, [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Visuals.selected().map(visual => visual.id);
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
		this.current_connection = new XyPlotVisual(this.primitive.id, [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Visuals.selected().map(visual => visual.id);
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
		this.current_connection = new HistoPlotVisual(this.primitive.id, [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Visuals.selected().map(visual => visual.id);
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
		this.current_connection = new LinkVisual(this.primitive.id, [x, y], [x + 1, y + 1]);
	}
	static mouseMoveSingleHandle(x, y, shiftKey, node_id) {
		const handle = Visuals.getHandle(node_id);
		/** @type {LinkVisual} */
		const link = handle.getParent();
		link.dragHandleTo(handle, [x, y]);
		link.update();
	}
	static mouseRelativeMoveSingleHandle(diff_x, diff_y, shiftKey, move_node_id) {
		let startPos = Visuals.getHandle(move_node_id).getPos();
		this.mouseMoveSingleHandle(startPos[0] + diff_x, startPos[1] + diff_y, shiftKey, move_node_id);
	}
	static mouseUpSingleHandle(x, y, shiftKey, node_id) {
		this.mouseMoveSingleHandle(x, y, shiftKey, node_id);
		/** @type {Handle} */
		const handle = Visuals.getHandle(node_id);
		/** @type {LinkVisual} */
		const link = handle.getParent();
		if (handle.getHandleType() === "start" || handle.getHandleType() === "end") {
			attachHandle(handle, (attachTo) => !(handle.getHandleType() == "end" && attachTo.is_ghost));
			link.update();
			if (link.getStartAttach() === null || link.getEndAttach() === null) {
				// delete link is not attached at both ends 
				Visuals.deleteSelected();
			}
		} else if (handle.getHandleType() === "control1" || handle.getHandleType() === "control2") {
			link.update();
		}
	}
	static leftMouseUp(x, y, shiftKey) {
		this.mouseUpSingleHandle(x, y, shiftKey, this.current_connection.endHandle.id);

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
 * @param {Handle} handle
 * @param {(attachTo: BaseVisual) => boolean} [shouldAttach=(attachTo) => true]
 */
function attachHandle(handle, shouldAttach = (attachTo) => true) {
	[x, y] = handle.getPos();
	let parentConnection = handle.getParent();

	let elements_under = Visuals.attachablesAt(x, y);
	let handleElement = null;
	let attachTo = null;


	// Find unselected stock element
	for (let i = 0; i < elements_under.length; i++) {
		let element = elements_under[i];

		let elemIsNotSelected = !element.isSelected();
		let elemIsNotParentOfAnchor = element[i] != parentConnection;
		if (elemIsNotSelected && elemIsNotParentOfAnchor) {
			attachTo = element;
			break;
		}
	}
	if (attachTo == null) {
		return false;
	} else if (!shouldAttach(attachTo)) {
		return false
	}


	switch (handle.getHandleType()) {
		case "start":
			parentConnection.setStartAttach(attachTo);
			break;
		case "end":
			parentConnection.setEndAttach(attachTo);
			break;
	}

	parentConnection.update();
	return true;
}
/** @type {ToolClass} */
var CurrentTool = MouseTool;

