


class FlowVisual extends BaseConnection {
	constructor(id, type, pos) {
		super(id, type, pos);
		this.setAttachableTypes(["stock"]);
		this.updateValueError();
		this.namePosList = [[0,40],[31,5],[0,-33],[-31,5]]; 	// Textplacement when rotating text
		
		// List of anchors. Not start- and end-anchor. TYPE: [AnchorPoints]
		this.anchorPoints = []; 

		this.valveIndex; 	// index to indicate what inbetween path valve is placed
		this.variableSide;	// bool to indicate what side of path variable is placed

		this.startCloud;
		this.endCloud;
		this.outerPath; 	// Black path element
		this.innerPath; 	// White path element
		this.arrowHeadPath; // Head of Arrow element
		this.flowPathGroup; // Group element with outer- inner- & arrowHeadPath within.
		this.valve; 
		this.variable; 		// variable (only svg group-element with circle and text)
	}

	getRadius() {
		return 20;
	}

	areAllAnchorsSelected() {
		for (i = 0; i < this.anchorPoints.length; i++) {
			if ( ! this.anchorPoints[i].is_selected()) {
				return false;
			}
		}
		return true;
	}

	getPreviousAnchor(index) { // Index is index of Anchor in this.anchorPoints
		if (index == 0) {
			return this.start_anchor;
		} else {
			return this.anchorPoints[index-1];
		}
	}

	getNextAnchor(index) { // Index is index of Anchor in this.anchorPoints
		if (this.anchorPoints.length-1 == index) {
			return this.end_anchor;
		} else {
			return this.anchorPoints[index+1];
		} 
	}

	afterAnchorUpdate(anchorType) {
		// Save middle anchor points to primitive
		super.afterAnchorUpdate(anchorType);
		let middlePoints = "";
		for (i = 1; i < this.anchorPoints.length-1; i++) {
			let pos = this.anchorPoints[i].get_pos();
			let x = pos[0];
			let y = pos[1];
			middlePoints += `${x},${y} `;
		}
		this.primitive.value.setAttribute("MiddlePoints", middlePoints);
	}

	adjustNeighborAnchor(masterAnchor, slaveAnchor) {
		let masterPos = masterAnchor.get_pos();
		let slavePos = slaveAnchor.get_pos();
		let dir = neswDirection(masterPos, slavePos);
		let dist = 15; 		// mininum distance from master and slave anchor
		if (dir == "north" || dir == "south") {

			// Keep masterAnchor at distance from slaveAnchor 
			if (slavePos[1]-dist < masterPos[1] && masterPos[1] <= slavePos[1]) { // if too close above
				masterAnchor.set_pos([masterPos[0], slavePos[1]+dist]);			// switch side
			} else if (slavePos[1] <= masterPos[1] && masterPos[1] < slavePos[1]+dist) { // if too close below 
				masterAnchor.set_pos([masterPos[0], slavePos[1]-dist]); 		// switch side
			}
			
			slaveAnchor.set_pos([masterPos[0], slavePos[1]]);
		} else {

			// Keep masterAnchor at distance from slaveAnchor 
			if ((slavePos[0]-dist < masterPos[0]) && (masterPos[0] <= slavePos[0])) { // if to close left
				masterAnchor.set_pos([slavePos[0]+dist, masterPos[1]]);				// switch to right side
			} else if (slavePos[0] <= masterPos[0] && masterPos[0] < slavePos[0]+dist) { // if to close to right side
				masterAnchor.set_pos([slavePos[0]-dist, masterPos[1]]);				// switch to left side 
			}

			slaveAnchor.set_pos([slavePos[0], masterPos[1]]);
		}
	}

	adjustNeighbors(anchorIndex) {
		let anchor = this.anchorPoints[anchorIndex];

		// Adjust previous Neighbor
		let prevAnchor = this.getPreviousAnchor(anchorIndex);
		this.adjustNeighborAnchor(anchor, prevAnchor);

		// Adjust next Neighbor
		let nextAnchor = this.getNextAnchor(anchorIndex);
		this.adjustNeighborAnchor(anchor, nextAnchor);
	}

	create_dummy_start_anchor() {
		this.start_anchor = new OrthoAnchorPoint(
			this.id+".start_anchor", 
			"dummy_anchor", 
			[this.startx, this.starty], 
			anchorTypeEnum.start, 
			0
		);
		this.anchorPoints[0] = (this.start_anchor);
	}
	
	create_dummy_end_anchor() {
		this.end_anchor = new OrthoAnchorPoint(
			this.id+".end_anchor", 
			"dummy_anchor", 
			[this.endx, this.endy],
			anchorTypeEnum.end,
			this.anchorPoints.length
		)
		this.anchorPoints[this.anchorPoints.length] = this.end_anchor; 
	}

	getLinkMountPos([xTarget, yTarget]) {
		// See "docs/code/mountPoints.svg" for math explanation 
		const [xCenter, yCenter] = this.getVariablePos();
		const rTarget = distance([xCenter, yCenter], [xTarget, yTarget]);
		const dXTarget = xTarget - xCenter;
		const dYTarget = yTarget - yCenter;
		const dXEdge = safeDivision(dXTarget*this.getRadius(), rTarget);
		const dYEdge = safeDivision(dYTarget*this.getRadius(), rTarget);
		const xEdge = dXEdge + xCenter; 
		const yEdge = dYEdge + yCenter;
		return [xEdge, yEdge]; 
	}

	moveValve () {
		if (this.variableSide) {
			this.valveIndex = (this.valveIndex+1)%(this.anchorPoints.length-1);
		}
		this.variableSide = !this.variableSide;

		this.primitive.setAttribute("valveIndex", this.valveIndex);
		this.primitive.setAttribute("variableSide", this.variableSide);

		// update_all_objects();
		update_relevant_objects("");
	}

	createAnchorPoint(x, y) {
		let index = this.anchorPoints.length;
		let newAnchor = new OrthoAnchorPoint(
			this.id+".point"+index, 
			"dummy_anchor", 
			[this.endx, this.endy], 
			anchorTypeEnum.orthoMiddle, 
			index
		);
		this.anchorPoints.push(newAnchor);
	}
	
	parseMiddlePoints(middlePointsString) {
		if (middlePointsString == "") {
			return [];
		}
		// example input: "15,17 19,12 "
		
		// example ["15,17", "19,12"]
		let stringPoints = middlePointsString.trim().split(" ");
		
		// example [["15", "17"], ["19", "12"]]
		let stringDimension = stringPoints.map(stringPos => stringPos.split(","));
		
		// example [[15,17], [19,12]]
		let points = stringDimension.map(dim => [parseInt(dim[0]), parseInt(dim[1])]);

		return points;
	}

	loadMiddlePoints() {
		let middlePointsString = this.primitive.getAttribute("MiddlePoints");
		if (! middlePointsString) {
			return [];
		}
		let points = this.parseMiddlePoints(middlePointsString);
		for (let point of points) {
			let index = this.anchorPoints.length;
			let newAnchor = new OrthoAnchorPoint(
				this.id+".point"+index, 
				"dummy_anchor", 
				point,
				anchorTypeEnum.orthoMiddle, 
				index
			);
			this.anchorPoints.push(newAnchor);
		}
	}

	getBoundRect() {
		let pos = this.getVariablePos();
		let radius = this.getRadius();
		return {
			"minX": pos[0] - radius, 
			"maxX": pos[0] + radius,
			"minY": pos[1] - radius,
			"maxY": pos[1] + radius
		};
	}

	getValvePos() {
		let points = this.getPathPoints();
		let valveX = (points[this.valveIndex][0]+points[this.valveIndex+1][0])/2;
		let valveY = (points[this.valveIndex][1]+points[this.valveIndex+1][1])/2;
		return [valveX, valveY];
	}

	getValveRotation() {
		let points = this.getPathPoints();
		let dir = neswDirection(points[this.valveIndex], points[this.valveIndex+1]);
		let valveRot = 0;
		if (dir == "north" || dir == "south") {
			valveRot = 90;
		}
		return valveRot;
	}

	getVariablePos() {
		let points = this.getPathPoints();
		let dir = neswDirection(points[this.valveIndex], points[this.valveIndex+1]);
		let variableOffset = [0, 0];
		if (dir == "north" || dir == "south") {
			if (this.variableSide) {
				variableOffset = [this.getRadius(), 0];
			} else {
				variableOffset = [-this.getRadius(), 0];
			}
		} else {
			if (this.variableSide) {
				variableOffset = [0, -this.getRadius()];
			} else {
				variableOffset = [0, this.getRadius()];
			}
		} 
		let [valveX, valveY] = this.getValvePos();
		return [valveX+variableOffset[0], valveY+variableOffset[1]];
	}

	setColor(color) {
		this.color = color;
		this.primitive.setAttribute("color", this.color);
		this.startCloud.setAttribute("stroke", color);
		this.endCloud.setAttribute("stroke", color);
		this.outerPath.setAttribute("stroke", color);
		this.arrowHeadPath.setAttribute("stroke", color);
		this.valve.setAttribute("stroke", color);
		this.variable.getElementsByClassName("element")[0].setAttribute("stroke", color);
		this.variable.getElementsByClassName("selector")[0].setAttribute("fill", color);
		this.name_element.setAttribute("fill", color);
		this.anchorPoints.map(anchor => anchor.setColor(color));
	}

	makeGraphics() {
		this.startCloud = svgCloud(this.color, defaultFill, {"class": "element"});
		this.endCloud = svgCloud(this.color, defaultFill, {"class": "element"});
		this.outerPath = svgWidePath(5, this.color, {"class": "element"});
		this.innerPath = svgWidePath(3, "white"); // Must have white ohterwise path is black
		this.arrowHeadPath = svgArrowHead(this.color, defaultFill, {"class": "element"});
		this.flowPathGroup = svg_group([this.startCloud, this.endCloud, this.outerPath, this.innerPath, this.arrowHeadPath]);
		this.valve = svg_path("M8,8 -8,-8 8,-8 -8,8 Z", this.color, defaultFill, "element");
		this.name_element = svg_text(0, -this.getRadius(), "vairable", "name_element");
		this.icons = svgIcons(defaultStroke, defaultFill, "icons");
		this.variable = svg_group(
			[svg_circle(0, 0, this.getRadius(), this.color, "white", "element"), 
			svg_circle(0, 0, this.getRadius()-2, "none", this.color, "selector"),
			this.icons,	
			this.name_element]
		);
		this.icons.setColor("white");
		this.anchorPoints = [];
		this.valveIndex = 0;
		this.variableSide = false;
		
		$(this.name_element).dblclick((event) => {	
			this.name_double_click();
		});
		
		this.group = svg_group([this.flowPathGroup, this.valve, this.variable]);
		this.group.setAttribute("node_id",this.id);

		$(this.group).dblclick(() => {
			this.double_click(this.id);
		});
	}
	
	getDirection() {
		// This function is used to determine which way the arrowHead should aim 
		let points = this.getPathPoints();
		let len = points.length;
		let p1 = points[len-1];
		let p2 = points[len-2];
		return [p2[0]-p1[0], p2[1]-p1[1]];
	}

	shortenLastPoint(shortenAmount) {
		let points = this.getPathPoints();
		let last = points[points.length-1];
		let secondLast = points[points.length-2];
		let sine = sin(last, secondLast);
		let cosine = cos(last, secondLast);
		let newLast = rotate([shortenAmount, 0], sine, cosine);
		newLast = translate(newLast, last);
		points[points.length-1] = newLast;
		return points;
	}

	getPathPoints() {
		let points = this.anchorPoints.map(point => point.get_pos());
		if (points.length == 0) {
			points = [[this.startx, this.starty], [this.endx, this.endy]];
		} else if (this.anchorPoints[this.anchorPoints.length-1].getAnchorType() != anchorTypeEnum.end) {
			points.push([this.endx, this.endy]);
		}
		return points;
	}

	update() {
		// This function is similar to TwoPointer::update but it takes attachments into account
		
		// Get start position from attach
		// _start_attach is null if we are not attached to anything
		
		let points = this.getPathPoints();
		let connectionStartPos = points[1];
		let connectionEndPos = points[points.length-2]; 

		if (this.getStartAttach() != null && this.start_anchor != null) {
			if (this.getStartAttach().get_pos) {
				let oldPos = this.start_anchor.get_pos();
				let newPos = this.getStartAttach().getFlowMountPos(connectionStartPos);
				// If start point have moved reset b1
				if (oldPos[0] != newPos[0] || oldPos[1] != newPos[1]) {
					this.start_anchor.set_pos(newPos);
				}
			}
		}
		if (this.getEndAttach() != null && this.end_anchor != null) {
			if (this.getEndAttach().get_pos) {				
				let oldPos = this.end_anchor.get_pos();
				let newPos = this.getEndAttach().getFlowMountPos(connectionEndPos);
				// If end point have moved reset b2
				if (oldPos[0] != newPos[0] || oldPos[1] != newPos[1]) {
					this.end_anchor.set_pos(newPos);
				}
			}
		}
		super.update();
		if (this.start_anchor && this.end_anchor) {
			this.adjustNeighborAnchor(this.anchorPoints[0], this.anchorPoints[1]);
			this.adjustNeighborAnchor(this.anchorPoints[this.anchorPoints.length-1], this.anchorPoints[this.anchorPoints.length-2]);
		}

		if(this.primitive && this.icons) {
			let VE = this.primitive.getAttribute("ValueError");
			if (VE) {
				this.icons.set("questionmark", "visible");
			} else {
				this.icons.set("questionmark", "hidden");
			}
			this.icons.set("dice", (! VE && hasRandomFunction(getValue(this.primitive)) ) ? "visible" : "hidden");
		}
	}
	
	updateGraphics() {
		let points = this.getPathPoints();
		if (this.getStartAttach() == null) {
			this.startCloud.setVisibility(true);
			this.startCloud.setPos(points[0], points[1]);
		} else {
			this.startCloud.setVisibility(false);
		}
		if (this.getEndAttach() == null) {
			this.endCloud.setVisibility(true);
			this.endCloud.setPos(points[points.length-1], points[points.length-2]);
		} else {
			this.endCloud.setVisibility(false);
		}
		this.outerPath.setPoints(this.shortenLastPoint(12));
		this.innerPath.setPoints(this.shortenLastPoint(8));
		this.arrowHeadPath.setPos(points[points.length-1], this.getDirection());

		let [valveX, valveY] = this.getValvePos();
		let valveRot = this.getValveRotation();
		let [varX, varY] = this.getVariablePos();
		svg_transform(this.valve, valveX, valveY, valveRot, 1);
		svg_translate(this.variable, varX, varY);
		// Update
		this.startCloud.update();
		this.endCloud.update();
		this.outerPath.update();
		this.innerPath.update();
		this.arrowHeadPath.update();
	}
	
	unselect() {
		super.unselect();
		this.variable.getElementsByClassName("selector")[0].setAttribute("visibility", "hidden");
		this.icons.setColor(this.color);
	}

	select() {
		super.select();
		this.variable.getElementsByClassName("selector")[0].setAttribute("visibility", "visible");
		this.icons.setColor("white");
	}
	
	double_click() {
		default_double_click(this.id);
	}
}


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

class LinkTool extends TwoPointerTool {
	static create_TwoPointer_start(x,y,name) {
		this.primitive = createConnector(name, "Link", null,null);
		this.current_connection = new LinkVisual(this.primitive.id,this.getType(),[x,y]);
	}
	static create_TwoPointer_end() {
		cleanUnconnectedLinks();
	}
	static getType() {
		return "link";
	}
}
LinkTool.init();

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

class TimePlotTool extends TwoPointerTool {
	static create_TwoPointer_start(x,y,name) {
		this.primitive = createConnector(name, "TimePlot", null, null);
		this.current_connection = new TimePlotVisual(this.primitive.id, this.getType(), [x,y]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x, y);
		this.current_connection.dialog.setIdsToDisplay(this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "timeplot";
	}
}

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