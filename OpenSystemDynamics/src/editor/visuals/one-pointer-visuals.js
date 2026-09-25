class StockVisual extends BasePrimitive {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
		this.updateDefinitionError();
		this.namePosList = [[0, 32], [27, 5], [0, -24], [-27, 5]];
	}

	getSize() {
		return [50, 38];
	}

	getBoundRect() {
		let pos = this.getPos()
		let size = this.getSize();
		return {
			"minX": pos[0] - size[0] / 2,
			"maxX": pos[0] + size[0] / 2,
			"minY": pos[1] - size[1] / 2,
			"maxY": pos[1] + size[1] / 2
		};
	}

	setPos(pos) {
		let diff = translate(neg(this.pos), pos);
		super.setPos(pos);
		let startConn = Visuals.connectionsFrom(this);
		for (let conn of startConn) {
			if (conn.type === "flow" && conn.isSelected() === false) {
				let oldConnPos = conn.start_anchor.getPos();
				let newConnPos = translate(oldConnPos, diff);
				conn.requestNewAnchorPos(newConnPos, conn.start_anchor.id);
			}
		}
		let endConn = Visuals.connectionsTo(this);
		for (let conn of endConn) {
			if (conn.type === "flow" && conn.isSelected() === false) {
				let oldAnchorPos = conn.end_anchor.getPos();
				let newAnchorPos = translate(oldAnchorPos, diff);
				conn.requestNewAnchorPos(newAnchorPos, conn.end_anchor.id);
			}
		}
	}

	// Used for FlowVisual
	getFlowMountPos([xTarget, yTarget]) {
		const [xCenter, yCenter] = this.getPos();
		const [width, height] = this.getSize();
		const boxSlope = safeDivision(height, width);
		const targetSlope = safeDivision(yTarget - yCenter, xTarget - xCenter);
		let xEdge;
		let yEdge;
		if (isInLimits(-boxSlope, targetSlope, boxSlope)) { // Left or right of box
			xEdge = sign(xTarget - xCenter) * width / 2 + xCenter;
			if (isInLimits(yCenter - height / 2, yTarget, yCenter + height / 2)) { // if within box y-limits
				yEdge = yTarget;
			} else {
				yEdge = yCenter + sign(yTarget - yCenter) * height / 2
			}
		} else { // above or below box
			if (isInLimits(xCenter - width / 2, xTarget, xCenter + width / 2)) {	// If within box x-limits
				xEdge = xTarget;
			} else {
				xEdge = xCenter + sign(xTarget - xCenter) * width / 2;
			}
			yEdge = sign(yTarget - yCenter) * (height / 2) + yCenter;
		}
		return [xEdge, yEdge];
	}

	// Used for LinkVisual
	getLinkMountPos([xTarget, yTarget]) {
		// See "docs/code/mountPoints.svg" for math explanation 
		const [xCenter, yCenter] = this.getPos();
		const [width, height] = this.getSize();
		const boxSlope = safeDivision(height, width);
		const targetSlope = safeDivision(yTarget - yCenter, xTarget - xCenter);
		let xEdge;
		let yEdge;
		if (isInLimits(-boxSlope, targetSlope, boxSlope)) {
			const xSign = sign(xTarget - xCenter); // -1 if target left of box and 1 if target right of box 
			xEdge = xSign * (width / 2) + xCenter;
			yEdge = xSign * (width / 2) * targetSlope + yCenter;
		} else {
			const ySign = sign(yTarget - yCenter); // -1 if target above box and 1 if target below box
			xEdge = ySign * safeDivision(height / 2, targetSlope) + xCenter;
			yEdge = ySign * (height / 2) + yCenter;
		}
		return [xEdge, yEdge];
	}

	getImage() {
		const textElement = SVG.text(0, 39, this.primitive.getAttribute("name"), "name_element");
		textElement.setAttribute("fill", this.color);
		const size = this.getSize();
		const w = size[0];
		const h = size[1];
		return [
			SVG.rect(-w / 2, -h / 2, w, h, this.color, defaultFill, "element"),
			SVG.rect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, "none", this.color, "highlight"),
			textElement,
			SVG.icons(defaultStroke, defaultFill, "icons")
		];
	}
	getLayer() {
		return SVG.stockLayer;
	}
}

class NumberboxVisual extends BasePrimitive {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
		this.name_centered = true;
		this.updateNamePosition();
		this.setSelectionSizeToText();

		this.runHandler = () => {
			this.render();
		}
		RunResults.subscribeRun(id, this.runHandler);

		this.dialog = new NumberboxDialog(this.id);
		this.dialog.subscribePool.subscribe(() => {
			this.render();
		});
	}
	setSelectionSizeToText() {
		const boundingRect = this.name_element.getBoundingClientRect();
		const elementRect = this.element_array[0];
		const selectorRect = this.selector_array[0];
		const marginX = 10;
		const marginY = 2;
		for (let rect of [elementRect, selectorRect]) {
			rect.setAttribute("width", boundingRect.width + marginX * 2);
			rect.setAttribute("height", boundingRect.height + marginY * 2);
			rect.setAttribute("x", -boundingRect.width / 2 - marginX);
			rect.setAttribute("y", -boundingRect.height / 2 - marginY);
		}
	}
	render() {
		if (this.targetID == null) {
			this.name_element.innerHTML = "-";
			this.setSelectionSizeToText();
			return;
		}
		let valueString = "";
		let lastValue = RunResults.getLastValue(this.targetID);
		if (lastValue || lastValue === 0) {
			let roundToZero = this.primitive.getAttribute("RoundToZero");
			let roundToZeroAtValue = -1;
			if (roundToZero === "true") {
				roundToZeroAtValue = this.primitive.getAttribute("RoundToZeroAtValue");
				if (isNaN(roundToZeroAtValue)) {
					roundToZeroAtValue = getDefaultAttributeValue("numberbox", "RoundToZeroAtValue");
				} else {
					roundToZeroAtValue = Number(roundToZeroAtValue);
				}
			}
			let number_length = JSON.parse(this.primitive.getAttribute("NumberLength"));
			let number_options = {
				"round_to_zero_limit": roundToZeroAtValue,
				"precision": number_length["usePrecision"] ? number_length["precision"] : undefined,
				"decimals": number_length["usePrecision"] ? undefined : number_length["decimal"]
			};
			valueString = format_number(lastValue, number_options);
		} else {
			valueString += "_";
		}
		let output = `${valueString}`;
		this.name_element.innerHTML = output;
		this.setSelectionSizeToText();

		// update color in case hide frame changes 
		this.setColor(this.color);

	}
	get targetID() {
		return Number(this.primitive.getAttribute("Target"));
	}
	set targetID(newTargetID) {
		this.primitive.setAttribute("Target", newTargetID);
		this.render();
	}
	afterNameChange() {
		this.setSelectionSizeToText();
	}
	getImage() {
		this.element = SVG.rect(-20, -15, 40, 30, this.color, defaultFill, "element");
		return [
			this.element,
			SVG.rect(-20, -15, 40, 30, "none", this.color, "highlight"),
			SVG.text(0, 0, "", "name_element", { "alignment-baseline": "middle", "style": "font-size: 16px", "fill": this.color }),
		];
	}
	setColor(color) {
		super.setColor(color);
		if (this.selected) {
			this.name_element.setAttribute("fill", "white");
		}
		let frameColor = this.primitive.getAttribute("HideFrame") === "true" ? "transparent" : color;
		this.element.setAttribute("stroke", frameColor);
	}
	select() {
		super.select();
		this.name_element.setAttribute("fill", "white");
	}
	unselect() {
		super.unselect();
		this.name_element.setAttribute("fill", this.color);
	}
	nameDoubleClick() {
		// Override this function
		// Do nothing - otherwise double clicked is called twice 
	}
	doubleClick() {
		this.dialog.show();
	}
	getLayer() {
		return SVG.plotLayer;
	}
}

class VariableVisual extends BasePrimitive {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
		this.updateDefinitionError();
		this.namePosList = [[0, 34], [23, 5], [0, -25], [-23, 5]];
	}

	getRadius() {
		return 20;
	}

	getBoundRect() {
		let pos = this.getPos();
		let radius = this.getRadius();
		return {
			"minX": pos[0] - radius,
			"maxX": pos[0] + radius,
			"minY": pos[1] - radius,
			"maxY": pos[1] + radius
		};
	}

	getImage() {
		return [
			SVG.circle(0, 0, this.getRadius(), this.color, defaultFill, "element"),
			SVG.text(0, 0, this.primitive.getAttribute("name"), "name_element", { "fill": this.color }),
			SVG.circle(0, 0, this.getRadius() - 2, "none", this.color, "highlight"),
			SVG.icons(defaultStroke, defaultFill, "icons")
		];
	}

	getLayer() {
		return SVG.variableLayer;
	}

	getLinkMountPos([xTarget, yTarget]) {
		// See "docs/code/mountPoints.svg" for math explanation 
		const [xCenter, yCenter] = this.getPos();
		const rTarget = distance([xCenter, yCenter], [xTarget, yTarget]);
		const dXTarget = xTarget - xCenter;
		const dYTarget = yTarget - yCenter;
		const dXEdge = safeDivision(dXTarget * this.getRadius(), rTarget);
		const dYEdge = safeDivision(dYTarget * this.getRadius(), rTarget);
		const xEdge = dXEdge + xCenter;
		const yEdge = dYEdge + yCenter;
		return [xEdge, yEdge];
	}
}

class ConstantVisual extends VariableVisual {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
		this.namePosList = [[0, 36], [25, 5], [0, -29], [-25, 5]];
	}

	getImage() {
		let r = this.getRadius();
		let rs = r - 3; // Selector radius 
		return [
			SVG.path(`M0,${r} ${r},0 0,-${r} -${r},0Z`, this.color, defaultFill, "element"),
			SVG.text(0, 0, this.primitive.getAttribute("name"), "name_element", { "fill": this.color }),
			SVG.path(`M0,${rs} ${rs},0 0,-${rs} -${rs},0Z`, "none", this.color, "highlight"),
			SVG.icons(defaultStroke, defaultFill, "icons")
		];
	}
	getLayer() {
		return SVG.constantLayer;
	}

	getRadius() {
		return 22;
	}

	getLinkMountPos([xTarget, yTarget]) {
		const [xCenter, yCenter] = this.getPos();
		const targetSlope = safeDivision(yCenter - yTarget, xCenter - xTarget);

		// "k" in the formula: y = kx + m
		const edgeSlope = -sign(targetSlope);

		// Where the line intercepts the x-axis ("m" in the formula: y = kx + m)
		const edgeIntercept = this.getRadius() * sign(yTarget - yCenter);

		// Relative coodinates relative center of ConstantVisual
		const xEdgeRel = safeDivision(edgeIntercept, targetSlope - edgeSlope);
		const yEdgeRel = edgeSlope * xEdgeRel + edgeIntercept;

		const xEdge = xEdgeRel + xCenter;
		const yEdge = yEdgeRel + yCenter;
		return [xEdge, yEdge];
	}
}

class ConverterVisual extends BasePrimitive {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
		this.updateDefinitionError();
		this.namePosList = [[0, 29], [23, 5], [0, -21], [-23, 5]];
	}
	getImage() {
		return [
			SVG.path("M-20 0  L-10 -15  L10 -15  L20 0  L10 15  L-10 15  Z", this.color, defaultFill, "element"),
			SVG.path("M-20 0  L-10 -15  L10 -15  L20 0  L10 15  L-10 15  Z", "none", this.color, "highlight", { "transform": "scale(0.87)" }),
			SVG.icons(defaultStroke, defaultFill, "icons"),
			SVG.text(0, 0, this.primitive.getAttribute("name"), "name_element", { "fill": this.color }),
		];
	}
	getLayer() {
		return SVG.converterLayer;
	}

	getLinkMountPos([xTarget, yTarget]) {
		// See "docs/code/mountPoints.svg" for math explanation 
		const [xCenter, yCenter] = this.getPos();
		const hexSlope = safeDivision(15.0, 10);  // placement of corner is at (10,15)
		const targetSlope = safeDivision(yTarget - yCenter, xTarget - xCenter);
		let xEdgeRel; 	// Relative x Position to center of Visual object.
		let yEdgeRel; 	// Relative y Position to center of Visual object.  
		if (hexSlope < targetSlope || targetSlope < -hexSlope) {
			const ySign = sign(yTarget - yCenter); 	// -1 if target above hexagon and 1 if target below hexagon 
			xEdgeRel = ySign * safeDivision(15, targetSlope);
			yEdgeRel = ySign * 15;
		} else if (0 < targetSlope && targetSlope < hexSlope) {
			const xSign = sign(xTarget - xCenter); // -1 if target left of hexagon and 1 if target right of hexagon
			xEdgeRel = xSign * safeDivision(30, (3 / 2) + targetSlope);
			yEdgeRel = xEdgeRel * targetSlope;
		} else {
			const xSign = sign(xTarget - xCenter); // -1 if target left of hexagon and 1 if target right of hexagon
			xEdgeRel = xSign * safeDivision(30, (3 / 2) - targetSlope);
			yEdgeRel = xEdgeRel * targetSlope;
		}
		const xEdge = xEdgeRel + xCenter;
		const yEdge = yEdgeRel + yCenter;
		return [xEdge, yEdge];
	}
	attachEvent() {
		do_global_log("this primitive");
		do_global_log(this.primitive);
		let linkedPrimitives = getLinkedPrimitives(this.primitive);
		do_global_log(linkedPrimitives);
		if (linkedPrimitives.length > 0) {
			do_global_log("choose yes");
			this.primitive.setAttribute("Source", linkedPrimitives[0].id);
		}
	}
	nameDoubleClick() {
		openPrimitiveDialog(this.id, "name")
	}
	doubleClick() {
		openPrimitiveDialog(this.id, "value")
	}
}

