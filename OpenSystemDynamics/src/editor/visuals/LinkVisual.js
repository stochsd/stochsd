class LinkVisual extends BaseConnection {
	/** @returns {VisualType} */
	get type() {
		return "link";
	}
	constructor(id, pos0, pos1) {
		super(id, pos0, pos1);

		// reload image of anchor to make sure anchor is ontop
		this.control1Handle.reloadImage();
		this.control2Handle.reloadImage();
	}

	createInitialHandles(pos0, pos1) {
		// Created here rather than in the constructor, since the anchors are created during super()
		/** @type {BezierPath} */
		this.path = new BezierPath(pos0, pos1);
		super.createInitialHandles(pos0, pos1);
		const [, control1, control2] = this.path.points;
		this.control1Handle = new Handle(this.id + ".control1Handle", control1, "control1", this);
		this.control2Handle = new Handle(this.id + ".control2Handle", control2, "control2", this);
		this.control1Handle.makeSquare();
		this.control2Handle.makeSquare();
	}

	getHandles() {
		return [this.startHandle, this.control1Handle, this.control2Handle, this.endHandle];
	}

	unselect() {
		this.selected = false;
		if (this.getHandles().some(handle => handle.isSelected())) {
			for (let i in this.highlight_on_select) {
				this.highlight_on_select[i].setAttribute("stroke", "black");
			}
		} else {
			for (let handle of this.getHandles()) {
				handle.setVisible(false);
			}
		}

		// Hide beizer lines
		for (let element of this.showOnlyOnSelect) {
			element.setAttribute("visibility", "hidden");
		}
	}
	select(selectChildren = true) {
		this.selected = true;
		for (let handle of this.getHandles()) {
			handle.setVisible(true);
		}
		for (let i in this.highlight_on_select) {
			this.highlight_on_select[i].setAttribute("stroke", "red");
		}

		if (selectChildren) {
			// This for loop is partly redundant and should be integrated in later code
			for (let anchor of this.getHandles()) {
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
		/** @type {VisualType[]} */
		let okAttachTypes = ["stock", "variable", "constant", "converter", "flow"];
		return okAttachTypes.includes(attachVisual.getType());
	}

	isAcceptableEndAttach(attachVisual) {
		/** @type {VisualType[]} */
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
		if (this._end_attach && !this._end_attach.isRemoved()) {
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
		// The old end is already removed if it is being deleted, e.g. a flow deleted together with links to it
		if (old_end_attach && !old_end_attach.isRemoved()) {
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
		// curve must be removed separately since it is not part of any group 
		this.curve.remove();
	}

	setColor(color) {
		this.color = color;
		this.primitive.setAttribute("Color", this.color);
		this.curve.setAttribute("stroke", color);
		this.arrowPath.setAttribute("stroke", color);
		this.startHandle.setColor(color);
		this.endHandle.setColor(color);
		this.control1Handle.setColor(color);
		this.control2Handle.setColor(color);
		this.b1_line.setAttribute("stroke", color);
		this.b2_line.setAttribute("stroke", color);
	}

	makeGraphics() {
		let [x1, y1] = this.startHandle.getPos();
		let [x2, y2] = this.control1Handle.getPos();
		let [x3, y3] = this.control2Handle.getPos();
		let [x4, y4] = this.endHandle.getPos();

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

		this.elements = this.elements.concat([this.b1_line, this.b2_line]);
	}
	dashLine() {
		this.curve.setAttribute("stroke-dasharray", "6 4");
	}
	undashLine() {
		this.curve.setAttribute("stroke-dasharray", "");
	}
	resetBezierPoints() {
		let startVisual = this.getStartAttach();
		let endVisual = this.getEndAttach();
		if (!startVisual || !endVisual) {
			return;
		}
		this.path.movePoint(0, startVisual.getLinkMountPos(endVisual.getPos()));
		this.path.movePoint(3, endVisual.getLinkMountPos(startVisual.getPos()));
		this.path.resetControls();
		this.update();
	}
	syncHandleToPrimitive(handleType) {
		super.syncHandleToPrimitive(handleType);

		let startPos = this.startHandle.getPos();
		let endPos = this.endHandle.getPos();
		let control1Pos = this.control1Handle.getPos();
		let control2Pos = this.control2Handle.getPos();

		switch (handleType) {
			case "start":
				this.curve.x1 = startPos[0];
				this.curve.y1 = startPos[1];
				this.curve.update();

				this.b1_line.setAttribute("x1", startPos[0]);
				this.b1_line.setAttribute("y1", startPos[1]);
				break;
			case "end":
				this.curve.x4 = endPos[0];
				this.curve.y4 = endPos[1];
				this.curve.update();


				this.b2_line.setAttribute("x1", endPos[0]);
				this.b2_line.setAttribute("y1", endPos[1]);
				break;
			case "control1":
					this.curve.x2 = control1Pos[0];
					this.curve.y2 = control1Pos[1];
					this.curve.update();

					this.b1_line.setAttribute("x2", control1Pos[0]);
					this.b1_line.setAttribute("y2", control1Pos[1]);

					this.primitive.setAttribute("b1x", control1Pos[0]);
					this.primitive.setAttribute("b1y", control1Pos[1]);
				break;
			case "control2":
					this.curve.x3 = control2Pos[0];
					this.curve.y3 = control2Pos[1];
					this.curve.update();

					this.b2_line.setAttribute("x2", control2Pos[0]);
					this.b2_line.setAttribute("y2", control2Pos[1]);

					this.primitive.setAttribute("b2x", control2Pos[0]);
					this.primitive.setAttribute("b2y", control2Pos[1]);
				break;
		}
		this.updateClickArea();
	}
	updateGraphics() {
		// The arrow is pointed from the second bezier point to the end
		let control2Pos = this.control2Handle.getPos();

		let xdiff = this.endX - control2Pos[0];
		let ydiff = this.endY - control2Pos[1];
		let angle = Math.atan2(xdiff, -ydiff) * (180 / Math.PI);
		SVG.transform(this.arrowHead, this.endX, this.endY, angle, 1);

		// Update end position so that we get the drawing effect when link is created
		this.curve.x4 = this.endX;
		this.curve.y4 = this.endY;
		this.curve.update();
	}
	/** Places each attached end on the edge of what it's attached to, facing its nearest control point. */
	#mountEndsOnAttachments() {
		const [, control1, control2] = this.path.points;
		const startAttach = this.getStartAttach();
		if (startAttach) {
			this.path.movePoint(0, startAttach.getLinkMountPos(control1));
		}
		const endAttach = this.getEndAttach();
		if (endAttach) {
			this.path.movePoint(3, endAttach.getLinkMountPos(control2));
		}
	}
	update() {
		this.#mountEndsOnAttachments();
		this.#syncHandles();
		// update anchors 
		this.getHandles().map(anchor => anchor.updatePosition());
		this.updateGraphics();
	}
	/**
	 * @param {Handle} handle
	 * @param {[number, number]} position
	 */
	dragHandleTo(handle, position) {
		const index = this.getHandles().indexOf(handle);
		if (index == -1) return;

		this.path.movePoint(index, position);
		this.#syncHandles();
	}
	/**
	 * Moves some or all handles by the same amount, e.g. when a selection is dragged.
	 * @param {Handle[]} handles
	 * @param {number} diffX
	 * @param {number} diffY
	 */
	moveHandlesBy(handles, diffX, diffY) {
		if (handles.length === this.getHandles().length) {
			this.path.translate(diffX, diffY);
			this.#syncHandles();
			return;
		}
		// Targets are taken before moving, since moving an end also moves the control points
		const targets = handles.map(handle => {
			const [x, y] = handle.getPos();
			return [x + diffX, y + diffY];
		});
		handles.forEach((handle, i) => this.dragHandleTo(handle, targets[i]));
	}
	#syncHandles() {
		const [start, control1, control2, end] = this.path.points
		this.startHandle.setPos(start)
		this.control1Handle.setPos(control1)
		this.control2Handle.setPos(control2)
		this.endHandle.setPos(end)
	}
}

