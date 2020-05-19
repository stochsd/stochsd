
/** Tools start here */


class FlowTool extends TwoPointerTool {
	static init() {
		super.init();
		// Is to prevent error if rightdown happens before leftdown 
		this.hasLeftClicked = false;
	}
	static leftMouseDown(x, y) {
		super.leftMouseDown(x, y);
		this.hasLeftClicked = true;
	}
	static leftMouseUp(x, y) {
		super.leftMouseUp(x, y);
		this.hasLeftClicked = false;
	}
	static create_TwoPointer_start(x, y, name) {
		this.primitive = createConnector(name, "Flow", null, null);
		setNonNegative(this.primitive, false); 			// What does this do?
		
		let rotateName = this.primitive.getAttribute("RotateName");
		// Force all stocks to have a RotateName
		if (!rotateName) {
			rotateName = "0";
			this.primitive.setAttribute("RotateName", rotateName);
		}		
		
		this.current_connection = new FlowVisual(this.primitive.id, this.getType(), [x,y]);
		this.current_connection.name_pos = rotateName;
		this.current_connection.select();
		update_name_pos(this.primitive.id);
	}
	static mouseMove(x, y) {
		let dir;
		if (this.current_connection.anchorPoints.length == 1) {
			dir = neswDirection(this.current_connection.anchorPoints[0].get_pos(), [x, y]);
			if (dir == "north" || dir == "south") {
				this.current_connection.endx = this.current_connection.anchorPoints[0].get_pos()[0];
				this.current_connection.endy = y;
			} else {
				this.current_connection.endx = x;
				this.current_connection.endy = this.current_connection.anchorPoints[0].get_pos()[1];
			}
		} else {
			let anchorPoints = this.current_connection.anchorPoints;
			let lastAnchor = anchorPoints[anchorPoints.length-1];
			let secondLastAnchor = anchorPoints[anchorPoints.length-2];
			dir = neswDirection(secondLastAnchor.get_pos(), lastAnchor.get_pos());
			if (dir == "north" || dir == "south") {
				this.current_connection.endx = x;
				this.current_connection.endy = lastAnchor.get_pos()[1];
			} else {
				this.current_connection.endx = lastAnchor.get_pos()[0];
				this.current_connection.endy = y;
			}
		}
		this.current_connection.update();
	}
	static rightMouseDown(x,y) {
		if (this.hasLeftClicked) {
			do_global_log("Right mouse on: "+x+", "+y);
			this.current_connection.createAnchorPoint(x, y);
		}
	}

	static getType() {
		return "flow";
	}
}
FlowTool.init();

class EllipseTool extends TwoPointerTool {
	static create_TwoPointer_start(x,y,name) {
		this.primitive = createConnector(name, "Ellipse", null, null);
		this.current_connection = new EllipseVisual(this.primitive.id, this.getType(), [x,y]);
	}
	getType() {
		return "ellipse";
	}
}

class LineTool extends TwoPointerTool {
	static create_TwoPointer_start(x,y,name) {
		this.primitive = createConnector(name, "Line", null,null);
		this.current_connection = new LineVisual(this.primitive.id,this.getType(),[x,y]);
	}
	static getType() {
		return "line";
	}
}
LineTool.init();


class TableTool extends TwoPointerTool {
	static create_TwoPointer_start(x,y,name) {
		this.primitive = createConnector(name, "Table", null,null);
		this.current_connection = new TableVisual(this.primitive.id,this.getType(),[x,y]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x,y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x,y);
		this.current_connection.dialog.setIdsToDisplay(this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "table";
	}
}
TableTool.init();



class ComparePlotTool extends TwoPointerTool {
	static create_TwoPointer_start(x,y,name) {
		this.primitive = createConnector(name, "ComparePlot", null,null);
		this.current_connection = new ComparePlotVisual(this.primitive.id,this.getType(),[x,y]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x,y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x,y)
		this.current_connection.dialog.setIdsToDisplay(this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "compareplot";
	}
}
ComparePlotTool.init();

class TextAreaTool extends TwoPointerTool {
	static create_TwoPointer_start(x,y,name) {
		let primitive_name = findFreeName(type_basename["text"]);
		this.primitive = createConnector(primitive_name, "TextArea", null,null);
		this.current_connection = new TextAreaVisual(this.primitive.id,this.getType(),[x,y]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static getType() {
		return "text";
	}
}

class XyPlotTool extends TwoPointerTool {
	static create_TwoPointer_start(x,y,name) {
		this.primitive = createConnector(name, "XyPlot", null,null);
		this.current_connection = new XyPlotVisual(this.primitive.id,this.getType(),[x,y]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x,y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x,y)
		this.current_connection.dialog.setIdsToDisplay(this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "xyplot";
	}
}
XyPlotTool.init();


class HistoPlotTool extends TwoPointerTool {
	static create_TwoPointer_start(x,y,name) {
		this.primitive = createConnector(name, "HistoPlot", null, null);
		this.current_connection = new HistoPlotVisual(this.primitive.id, this.getType(), [x,y]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x,y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x,y);
		this.current_connection.dialog.setIdsToDisplay(this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "histoplot";
	}


}