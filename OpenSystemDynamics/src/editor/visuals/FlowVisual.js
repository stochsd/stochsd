class FlowVisual extends BaseConnection {
	/** @type {StockVisual} */
	_start_attach;
	/** @type {StockVisual} */
	_end_attach;
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.updateDefinitionError();
		this.namePosList = [[0, 40], [31, 5], [0, -33], [-31, 5]]; 	// Textplacement when rotating text
		
		/** @type {OrthogonalPath} */
		this.path = new OrthogonalPath(this.handles.map(h => h.getPos()));

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
	createInitialAnchors(pos0, pos1) {
		super.createInitialAnchors(pos0, pos1)
		/** @type {AnchorPoint[]} - start and end as first and last anchor */
		this.handles = [this.start_anchor, this.end_anchor]
	}
	isAcceptableStartAttach(attachVisual) {
		return attachVisual.getType() === "stock";
	}
	isAcceptableEndAttach(attachVisual) {
		return attachVisual.getType() === "stock";
	}
	getRadius() {
		return 20;
	}
	getAnchors() {
		return this.handles;
	}
	getPreviousAnchor(anchor_id) {
		let anchors = this.getAnchors();
		let anchor_ids = anchors.map(anchor => anchor.id);
		let prev_index = anchor_ids.indexOf(anchor_id) - 1;
		return prev_index >= 0 ? anchors[prev_index] : null;
	}

	/**
	 * @param {AnchorPoint} handle
	 * @param {[number, number]} position
	 */
	dragHandleTo(handle, position) {
		const index = this.handles.findIndex(h => h == handle)
		if (index == -1) return;
		
		this.path.movePoint(index, position)
		this.#syncHandles()
	}

	/**
	 * Moves some or all handles by the same amount, e.g. when a selection is dragged.
	 * @param {AnchorPoint[]} handles
	 * @param {number} diffX
	 * @param {number} diffY
	 */
	moveHandlesBy(handles, diffX, diffY) {
		if (handles.length === this.handles.length) {
			this.path.translate(diffX, diffY);
			this.#syncHandles();
			return;
		}
		// Targets are taken before moving, since moving one handle slides its neighbors
		const targets = handles.map(handle => {
			const [x, y] = handle.getPos();
			return [x + diffX, y + diffY];
		});
		handles.forEach((handle, i) => this.dragHandleTo(handle, targets[i]));
	}

	syncAnchorToPrimitive(anchorType) {
		// Save middle anchor points to primitive
		super.syncAnchorToPrimitive(anchorType);
		let middlePoints = "";
		for (let i = 1; i < this.handles.length-1; i++) {
			let pos = this.handles[i].getPos();
			let x = pos[0];
			let y = pos[1];
			middlePoints += `${x},${y} `;
		}
		this.primitive.setAttribute("MiddlePoints", middlePoints);
	}

	getLinkMountPos([xTarget, yTarget]) {
		// See "docs/code/mountPoints.svg" for math explanation 
		const [xCenter, yCenter] = this.getVariablePos();
		const rTarget = distance([xCenter, yCenter], [xTarget, yTarget]);
		const dXTarget = xTarget - xCenter;
		const dYTarget = yTarget - yCenter;
		const dXEdge = safeDivision(dXTarget * this.getRadius(), rTarget);
		const dYEdge = safeDivision(dYTarget * this.getRadius(), rTarget);
		const xEdge = dXEdge + xCenter;
		const yEdge = dYEdge + yCenter;
		return [xEdge, yEdge];
	}

	moveValve() {
		if (this.variableSide) {
			this.valveIndex = (this.valveIndex + 1) % (this.handles.length - 1);
		}
		this.variableSide = !this.variableSide;

		this.primitive.setAttribute("ValveIndex", this.valveIndex);
		this.primitive.setAttribute("VariableSide", this.variableSide);

		Visuals.updateAllExceptDisplays();
	}

	setStartAttach(new_start_attach) {
		super.setStartAttach(new_start_attach);
		// needs to update Links a few times to follow along
		for (let i = 0; i < 4; i++) Visuals.updateTwoPointers();
	}

	setEndAttach(new_end_attach) {
		super.setEndAttach(new_end_attach);
		for (let i = 0; i < 4; i++) Visuals.updateTwoPointers();
	}
	#createBendHandle(index) {
		return new AnchorPoint(this.id + ".point" + index, "dummy_anchor", [0,0], "orthoMiddle")
	}
	#syncHandles() {
		const points = this.path.points
		while (this.handles.length < points.length) {
			this.handles.splice(-1, 0, this.#createBendHandle(this.handles.length-2))
		}
		while (this.handles.length > points.length) {
			this.handles.splice(-2, 1)[0].remove()
		}
		points.forEach((point, i) => this.handles[i].setPos(point))
	}
	addBend(pos) {
		this.path.addBend(pos)
		this.#syncHandles()
	}
	removeLastBend() {
		if (this.handles.length <= 2) return;
		this.path.removeLastBend();
		this.#syncHandles();
	}

	/**
	 * @param {string} middlePointsString 
	 * @returns {[number, number][]}
	 */
	#parseMiddlePoints(middlePointsString) {
		if (!middlePointsString) return [];
		return middlePointsString.trim()    		// input: "15,17 19,12 "
            .split(" ")                   			// ["15,17", "19,12"]
            .map(stringPos => stringPos.split(",")) // [["15", "17"], ["19", "12"]]
		    .map(dim => [parseInt(dim[0]), parseInt(dim[1])]);  // [[15,17], [19,12]]
	}

	loadMiddlePoints() {
		const middlePointsString = this.primitive.getAttribute("MiddlePoints");
		const points = this.#parseMiddlePoints(middlePointsString);
		for (let point of points) {
			this.addBend(point)
		}
		this.path.fitFirstAxisToPoints();
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
		let points = this.getAnchors().map(anchor => anchor.getPos());
		let valveX = (points[this.valveIndex][0] + points[this.valveIndex + 1][0]) / 2;
		let valveY = (points[this.valveIndex][1] + points[this.valveIndex + 1][1]) / 2;
		return [valveX, valveY];
	}

	getValveRotation() {
		let points = this.getAnchors().map(anchor => anchor.getPos());
		let dir = neswDirection(points[this.valveIndex], points[this.valveIndex + 1]);
		let valveRot = 0;
		if (dir == "north" || dir == "south") {
			valveRot = 90;
		}
		return valveRot;
	}

	/** @returns {[number, number]} */
	getVariablePos() {
		let points = this.getAnchors().map(anchor => anchor.getPos());
		let dir = neswDirection(points[this.valveIndex], points[this.valveIndex + 1]);
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
		return [valveX + variableOffset[0], valveY + variableOffset[1]];
	}

	setColor(color) {
		this.color = color;
		this.primitive.setAttribute("Color", this.color);
		this.startCloud.setAttribute("stroke", color);
		this.endCloud.setAttribute("stroke", color);
		this.outerPath.setAttribute("stroke", color);
		this.arrowHeadPath.setAttribute("stroke", color);
		this.valve.setAttribute("stroke", color);
		this.variable.getElementsByClassName("element")[0].setAttribute("stroke", color);
		this.variable.getElementsByClassName("highlight")[0].setAttribute("fill", color);
		this.name_element.setAttribute("fill", color);
		this.getAnchors().map(anchor => anchor.setColor(color));
	}

	makeGraphics() {
		this.startCloud = SVG.cloud(this.color, defaultFill, { "class": "element" });
		this.endCloud = SVG.cloud(this.color, defaultFill, { "class": "element" });
		this.outerPath = SVG.widePath(5, this.color, { "class": "element" });
		this.innerPath = SVG.widePath(3, "white"); // Must have white ohterwise path is black
		this.arrowHeadPath = SVG.arrowHead(this.color, defaultFill, { "class": "element" });
		this.flowPathGroup = SVG.group([this.startCloud, this.endCloud, this.outerPath, this.innerPath, this.arrowHeadPath]);
		this.valve = SVG.path("M8,8 -8,-8 8,-8 -8,8 Z", this.color, defaultFill, "element");
		this.name_element = SVG.text(0, -this.getRadius(), "vairable", "name_element");
		this.icons = SVG.icons(defaultStroke, defaultFill, "icons");
		this.variable = SVG.group([
			SVG.circle(0, 0, this.getRadius(), this.color, "white", "element"),
			SVG.circle(0, 0, this.getRadius() - 2, "none", this.color, "highlight"),
			this.icons,
			this.name_element
		]);
		this.icons.setColor("white");
		this.valveIndex = 0;
		this.variableSide = false;

		$(this.name_element).dblclick((event) => {
			this.nameDoubleClick();
		});

		this.group = SVG.append(SVG.flowLayer, SVG.group([this.flowPathGroup, this.valve, this.variable]));
		this.group.setAttribute("node_id", this.id);

		$(this.group).dblclick(() => {
			this.doubleClick(this.id);
		});
		this.updateGraphics();
	}

	getDirection() {
		// This function is used to determine which way the arrowHead should aim 
		let points = this.getAnchors().map(anchor => anchor.getPos());
		let len = points.length;
		let p1 = points[len - 1];
		let p2 = points[len - 2];
		return [p2[0] - p1[0], p2[1] - p1[1]];
	}

	shortenLastPoint(shortenAmount) {
		let points = this.getAnchors().map(anchor => anchor.getPos());
		let last = points[points.length - 1];
		let secondLast = points[points.length - 2];
		let sine = sin(last, secondLast);
		let cosine = cos(last, secondLast);
		let newLast = rotate([shortenAmount, 0], sine, cosine);
		newLast = translate(newLast, last);
		points[points.length - 1] = newLast;
		return points;
	}

	update() {
		// This function is similar to TwoPointer::update but it takes attachments into account

		// Get start position from attach
		// _start_attach is null if we are not attached to anything

		let points = this.getAnchors().map(anchor => anchor.getPos());
		let connectionStartPos = points[1];
		let connectionEndPos = points[points.length - 2];

		if (this.getStartAttach() != null && this.start_anchor != null) {
			let oldPos = this.start_anchor.getPos();
			let newPos = this.getStartAttach().getFlowMountPos(connectionStartPos);
			if (oldPos[0] != newPos[0] || oldPos[1] != newPos[1]) {
				this.dragHandleTo(this.start_anchor, newPos);
			}
		}
		if (this.getEndAttach() != null && this.end_anchor != null) {
			let oldPos = this.end_anchor.getPos();
			let newPos = this.getEndAttach().getFlowMountPos(connectionEndPos);
			if (oldPos[0] != newPos[0] || oldPos[1] != newPos[1]) {
				this.dragHandleTo(this.end_anchor, newPos);
			}
		}
		super.update();
		// update anchors 
		this.getAnchors().map(anchor => anchor.updatePosition());

		if (this.primitive && this.icons) {
			const hasDefError = DefinitionError.has(this.primitive);
			this.icons.set("questionmark", hasDefError ? "visible" : "hidden");
			this.icons.set("dice", (!hasDefError && hasRandomFunction(getValue(this.primitive))) ? "visible" : "hidden");
		}
	}

	updateGraphics() {
		let points = this.getAnchors().map(anchor => anchor.getPos());
		if (this.getStartAttach() == null) {
			this.startCloud.setVisibility(true);
			this.startCloud.setPosition(points[0], points[1]);
		} else {
			this.startCloud.setVisibility(false);
		}
		if (this.getEndAttach() == null) {
			this.endCloud.setVisibility(true);
			this.endCloud.setPosition(points[points.length - 1], points[points.length - 2]);
		} else {
			this.endCloud.setVisibility(false);
		}
		this.outerPath.setPoints(this.shortenLastPoint(12));
		this.innerPath.setPoints(this.shortenLastPoint(8));
		this.arrowHeadPath.setPosition(points[points.length - 1], this.getDirection());

		let [valveX, valveY] = this.getValvePos();
		let valveRot = this.getValveRotation();
		let [varX, varY] = this.getVariablePos();
		SVG.transform(this.valve, valveX, valveY, valveRot, 1);
		SVG.translate(this.variable, varX, varY);
		// Update
		this.startCloud.update();
		this.endCloud.update();
		this.outerPath.update();
		this.innerPath.update();
		this.arrowHeadPath.update();
	}

	unselect() {
		super.unselect();
		this.variable.getElementsByClassName("highlight")[0].setAttribute("visibility", "hidden");
		this.icons.setColor(this.color);
	}

	select() {
		super.select();
		this.variable.getElementsByClassName("highlight")[0].setAttribute("visibility", "visible");
		this.icons.setColor("white");
	}

	doubleClick() {
		openPrimitiveDialog(this.id);
	}
}

