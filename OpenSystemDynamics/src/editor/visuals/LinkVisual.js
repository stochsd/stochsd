class LinkVisual extends BaseConnection {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);

		// reload image of anchor to make sure anchor is ontop
		this.b1_anchor.reloadImage();
		this.b2_anchor.reloadImage();
	}

	createInitialAnchors(pos0, pos1) {
		// Used to keep a local coordinate system between start- and endAnchor
		// startLocal = [0,0], endLocal = [1,0]
		this.b1Local = [0.3, 0.0];
		this.b2Local = [0.7, 0.0];
		super.createInitialAnchors(pos0, pos1);
		this.b1_anchor = new AnchorPoint(this.id + ".b1_anchor", "dummy_anchor", [0, 0], "bezier1");
		this.b2_anchor = new AnchorPoint(this.id + ".b2_anchor", "dummy_anchor", [0, 0], "bezier2");
		this.keepRelativeHandlePositions();
		this.b1_anchor.makeSquare();
		this.b2_anchor.makeSquare();
	}

	getAnchors() {
		return [this.start_anchor, this.b1_anchor, this.b2_anchor, this.end_anchor];
	}

	worldToLocal(worldPos) {
		// localPos(worldPos) = inv(S)*inv(R)*inv(T)*worldPos
		let origoWorld = this.start_anchor.getPos();
		let oneZeroWorld = this.end_anchor.getPos();
		let scaleFactor = distance(origoWorld, oneZeroWorld);
		let sine = sin(origoWorld, oneZeroWorld);
		let cosine = cos(origoWorld, oneZeroWorld);
		let S_pWorld = translate(worldPos, neg(origoWorld));
		let RS_pWorld = rotate(S_pWorld, -sine, cosine);
		let posWorld = scale(RS_pWorld, [0, 0], 1 / scaleFactor);
		return posWorld;
	}
	localToWorld(localPos) {
		// worldPos(localPos) = T*R*S*localPos
		let origoWorld = this.start_anchor.getPos();
		let oneZeroWorld = this.end_anchor.getPos();
		let scaleFactor = distance(origoWorld, oneZeroWorld);
		let sine = sin(origoWorld, oneZeroWorld);
		let cosine = cos(origoWorld, oneZeroWorld);
		let S_pLocal = scale(localPos, [0, 0], scaleFactor);
		let RS_pLocal = rotate(S_pLocal, sine, cosine);
		let posWorld = translate(RS_pLocal, origoWorld);
		return posWorld;
	}
	unselect() {
		this.selected = false;
		if (this.getChildren().some(child => child.isSelected())) {
			for (let i in this.highlight_on_select) {
				this.highlight_on_select[i].setAttribute("stroke", "black");
			}
		} else {
			for (let child of this.getChildren()) {
				if ('setVisible' in child) {
					child.setVisible(false);
				}
			}
		}

		// Hide beizer lines
		for (let element of this.showOnlyOnSelect) {
			element.setAttribute("visibility", "hidden");
		}
	}
	select(selectChildren = true) {
		for (let child of this.getChildren()) {
			if ('setVisible' in child) {
				child.setVisible(true);
			}
		}
		for (let i in this.highlight_on_select) {
			this.highlight_on_select[i].setAttribute("stroke", "red");
		}

		if (selectChildren) {
			// This for loop is partly redundant and should be integrated in later code
			for (let anchor of this.getAnchors()) {
				anchor.select();
				anchor.setVisible(true);
			}
		}

		// Show beizer lines
		for (let element of this.showOnlyOnSelect) {
			element.setAttribute("visibility", "visible");
		}
	}
	updateClickArea() {
		this.click_area.x1 = this.curve.x1;
		this.click_area.y1 = this.curve.y1;
		this.click_area.x2 = this.curve.x2;
		this.click_area.y2 = this.curve.y2;
		this.click_area.x3 = this.curve.x3;
		this.click_area.y3 = this.curve.y3;
		this.click_area.x4 = this.curve.x4;
		this.click_area.y4 = this.curve.y4;
		this.click_area.update();
	}

	isAcceptableStartAttach(attachVisual) {
		let okAttachTypes = ["stock", "variable", "constant", "converter", "flow"];
		return okAttachTypes.includes(attachVisual.getType());
	}

	isAcceptableEndAttach(attachVisual) {
		let okAttachTypes = ["stock", "variable", "converter", "flow"];
		if (attachVisual.getType() === "converter") {
			let linkedPrims = getLinkedPrimitives(findID(attachVisual.id)).filter((prim) => {
				// filter out linked primitives that have the same source as this link.
				let source = findID(this.id).source;
				if (source) {
					return getID(prim) !== getID(source);
				}
				return false;
			});
			// only allow converter to have one ingoing link 
			return linkedPrims.length < 1;
		}
		return okAttachTypes.includes(attachVisual.getType()) && attachVisual.is_ghost !== true;
	}

	setStartAttach(new_start_attach) {
		super.setStartAttach(new_start_attach)
		if (this._end_attach) {
			this._end_attach.updateDefinitionError();
			this._end_attach.update();
		}
	}
	setEndAttach(new_end_attach) {
		let old_end_attach = this._end_attach;
		super.setEndAttach(new_end_attach);
		if (new_end_attach != null && new_end_attach.getType() == "stock") {
			this.dashLine();
		} else {
			this.undashLine();
		}
		if (old_end_attach) {
			old_end_attach.updateDefinitionError();
			old_end_attach.update();
		}
		if (new_end_attach) {
			new_end_attach.updateDefinitionError();
			new_end_attach.update();
		}
	}

	clean() {
		// remove end_attach to make sure end_attach value error is updated 
		this.setEndAttach(null);
		super.clean();
	}
	clearImage() {
		super.clearImage();
		// curve must be removed seperatly since it is not part of any group 
		this.curve.remove();
	}

	setColor(color) {
		this.color = color;
		this.primitive.setAttribute("Color", this.color);
		this.curve.setAttribute("stroke", color);
		this.arrowPath.setAttribute("stroke", color);
		this.start_anchor.setColor(color);
		this.end_anchor.setColor(color);
		this.b1_anchor.setColor(color);
		this.b2_anchor.setColor(color);
		this.b1_line.setAttribute("stroke", color);
		this.b2_line.setAttribute("stroke", color);
	}

	makeGraphics() {
		let [x1, y1] = this.start_anchor.getPos();
		let [x2, y2] = this.b1_anchor.getPos();
		let [x3, y3] = this.b2_anchor.getPos();
		let [x4, y4] = this.end_anchor.getPos();

		this.arrowPath = SVG.fromString(`<path d="M0,0 -4,12 4,12 Z" stroke="black" fill="white"/>`);
		this.arrowHead = SVG.group([this.arrowPath]);
		SVG.translate(this.arrowHead, x4, y4);

		this.click_area = SVG.curve("twoway",x1, y1, x2, y2, x3, y3, x4, y4, { "pointer-events": "all", "stroke": "transparent", "stroke-width": "10" });
		this.curve = SVG.append(SVG.linkLayer, 
			SVG.curve("oneway", x1, y1, x2, y2, x3, y3, x4, y4, { "stroke": "black", "stroke-width": "1" })
		);
		this.click_area.draggable = false;
		this.curve.draggable = false;

		// curve is not included in group since it is one-way and will therefore span an area
		// The area will be clickable if included in the group 
		this.group = SVG.append(SVG.linkLayer, 
			SVG.group([this.click_area, this.arrowHead])
		);
		this.group.setAttribute("node_id", this.id);

		this.b1_line = SVG.append(SVG.linkLayer, SVG.line(x1, y1, x2, y2, "black", "black", "", { "stroke-dasharray": "5 5" }));
		this.b2_line = SVG.append(SVG.linkLayer, SVG.line(x4, y4, x3, y3, "black", "black", "", { "stroke-dasharray": "5 5" }));

		this.showOnlyOnSelect = [this.b1_line, this.b2_line];

		this.element_array = this.element_array.concat([this.b1_line, this.b2_line]);
	}
	dashLine() {
		this.curve.setAttribute("stroke-dasharray", "6 4");
	}
	undashLine() {
		this.curve.setAttribute("stroke-dasharray", "");
	}
	resetBezierPoints() {
		let obj1 = this.getStartAttach();
		let obj2 = this.getEndAttach();
		if (!obj1 || !obj2) {
			return;
		}
		this.start_anchor.setPos(obj1.getLinkMountPos(obj2.getPos()));
		this.end_anchor.setPos(obj2.getLinkMountPos(obj1.getPos()));
		this.resetBezier1();
		this.resetBezier2();
		this.update();
	}
	resetBezier1() {
		this.b1Local = [0.3, 0];
	}
	resetBezier2() {
		this.b2Local = [0.7, 0];
	}
	syncAnchorToPrimitive(anchorType) {
		super.syncAnchorToPrimitive(anchorType);

		let startpos = this.start_anchor.getPos();
		let endpos = this.end_anchor.getPos();
		let b1pos = this.b1_anchor.getPos();
		let b2pos = this.b2_anchor.getPos();

		switch (anchorType) {
			case "start":
				this.curve.x1 = startpos[0];
				this.curve.y1 = startpos[1];
				this.curve.update();

				this.b1_line.setAttribute("x1", startpos[0]);
				this.b1_line.setAttribute("y1", startpos[1]);
				break;
			case "end":
				this.curve.x4 = endpos[0];
				this.curve.y4 = endpos[1];
				this.curve.update();


				this.b2_line.setAttribute("x1", endpos[0]);
				this.b2_line.setAttribute("y1", endpos[1]);
				break;
			case "bezier1":
					this.curve.x2 = b1pos[0];
					this.curve.y2 = b1pos[1];
					this.curve.update();

					this.b1_line.setAttribute("x2", b1pos[0]);
					this.b1_line.setAttribute("y2", b1pos[1]);

					this.primitive.setAttribute("b1x", b1pos[0]);
					this.primitive.setAttribute("b1y", b1pos[1]);
				break;
			case "bezier2":
					this.curve.x3 = b2pos[0];
					this.curve.y3 = b2pos[1];
					this.curve.update();

					this.b2_line.setAttribute("x2", b2pos[0]);
					this.b2_line.setAttribute("y2", b2pos[1]);

					this.primitive.setAttribute("b2x", b2pos[0]);
					this.primitive.setAttribute("b2y", b2pos[1]);
				break;
		}
		this.updateClickArea();
	}
	updateGraphics() {
		// The arrow is pointed from the second bezier point to the end
		let b2pos = this.b2_anchor.getPos();

		let xdiff = this.endX - b2pos[0];
		let ydiff = this.endY - b2pos[1];
		let angle = Math.atan2(xdiff, -ydiff) * (180 / Math.PI);
		SVG.transform(this.arrowHead, this.endX, this.endY, angle, 1);

		// Update end position so that we get the drawing effect when link is created
		this.curve.x4 = this.endX;
		this.curve.y4 = this.endY;
		this.curve.update();
	}
	update() {
		// This function is similar to TwoPointer::update but it takes attachments into account

		// Get start position from attach
		// _start_anchor is null if we are currently creating the connection
		// _start_attach is null if we are not attached to anything

		if (this.getStartAttach() != null && this.start_anchor != null) {
			if (this.getStartAttach().getPos) {
				let oldPos = this.start_anchor.getPos();
				let newPos = this.getStartAttach().getLinkMountPos(this.b1_anchor.getPos());
				// If start point have moved reset b1
				if (oldPos[0] != newPos[0] || oldPos[1] != newPos[1]) {
					this.start_anchor.setPos(newPos);
				}
			}
		}
		if (this.getEndAttach() != null && this.end_anchor != null) {
			if (this.getEndAttach().getPos) {
				let oldPos = this.end_anchor.getPos();
				let newPos = this.getEndAttach().getLinkMountPos(this.b2_anchor.getPos());
				// If end point have moved reset b2
				if (oldPos[0] != newPos[0] || oldPos[1] != newPos[1]) {
					this.end_anchor.setPos(newPos);
				}
			}
		}
		this.keepRelativeHandlePositions();
		// update anchors 
		this.getAnchors().map(anchor => anchor.updatePosition());
		this.updateGraphics();
	}
	keepRelativeHandlePositions() {
		this.b1_anchor.setPos(this.localToWorld(this.b1Local));
		this.b2_anchor.setPos(this.localToWorld(this.b2Local));
	}
	setHandle1Pos(newPos) {
		this.b1Local = this.worldToLocal(newPos);
	}
	setHandle2Pos(newPos) {
		this.b2Local = this.worldToLocal(newPos);
	}
}

