class TwoPointer extends BaseObject {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.id = id;
		this.type = type;
		this.selected = false;
		this.superClass = "TwoPointer";
		Visuals.addTwoPointer(this);

		// anchors must exist before make graphics 
		this.createInitialAnchors(pos0, pos1);

		this.makeGraphics();
		$(this.group).on("mousedown", function (event) {
			let node_id = this.getAttribute("node_id");
			primitive_mousedown(node_id, event);
		});

		// this is done so anchor is ontop 
		this.start_anchor.reloadImage();
		this.end_anchor.reloadImage();
	}

	createInitialAnchors(pos0, pos1) {
		this.start_anchor = new AnchorPoint(this.id + ".start_anchor", "dummy_anchor", pos0, "start");
		this.end_anchor = new AnchorPoint(this.id + ".end_anchor", "dummy_anchor", pos1, "end");
	}

	getAnchors() {
		return [this.start_anchor, this.end_anchor];
	}

	getBoundRect() {
		return {
			"minX": this.getMinX(),
			"maxX": this.getMinX() + this.getWidth(),
			"minY": this.getMinY(),
			"maxY": this.getMinY() + this.getHeight()
		};
	}

	setColor(color) {
		super.setColor(color);
		this.start_anchor.setColor(color);
		this.end_anchor.setColor(color);
	}

	get startX() { return this.start_anchor.getPos()[0]; }
	get startY() { return this.start_anchor.getPos()[1]; }
	get endX() { return this.end_anchor.getPos()[0]; }
	get endY() { return this.end_anchor.getPos()[1]; }

	getPos() { return [(this.startX + this.endX) / 2, (this.startY + this.endY) / 2]; }
	getMinX() { return Math.min(this.startX, this.endX); }
	getMinY() { return Math.min(this.startY, this.endY); }
	getWidth() { return Math.abs(this.startX - this.endX); }
	getHeight() { return Math.abs(this.startY - this.endY); }

	unselect() {
		this.selected = false;
		for (let anchor of this.getAnchors()) {
			anchor.setVisible(false);
		}
	}
	select() {
		this.selected = true;
		for (let anchor of this.getAnchors()) {
			anchor.select();
			anchor.setVisible(true);
		}
	}

	update() {
		this.updateGraphics();
	}
	makeGraphics() {

	}
	updateGraphics() {

	}
	/** @param {AnchorType} anchorType */
	syncAnchorToPrimitive(anchorType) {
		// This function should sync anchor position to primitive 
		let primitive = findID(this.id);
		if (!primitive) return;
		switch (anchorType) {
			case "start":
				setSourcePosition(primitive, this.start_anchor.getPos());
				break;
			case "end":
				setTargetPosition(primitive, this.end_anchor.getPos());
				break;
		}
	}
}

class BaseConnection extends TwoPointer {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		/** @type {BaseObject} */
		this._start_attach = null;
		/** @type {BaseObject} */
		this._end_attach = null;
		this.positionUpdateHandler = () => {
			let primitive = findID(this.id);
			let sourcePoint = getSourcePosition(primitive);
			let targetPoint = getTargetPosition(primitive);
			this.start_anchor.setPos(sourcePoint);
			this.end_anchor.setPos(targetPoint);
			alert("Position got updated");
		}
	}

	isAcceptableStartAttach(attachVisual) {
		// function to decide if attachVisual is OK allowed to attach start to 
		return false;
	}
	isAcceptableEndAttach(attachVisual) {
		return false;
	}
	setStartAttach(new_start_attach) {
		if (new_start_attach != null && this.getEndAttach() == new_start_attach) {
			return;		// Will not attach if other anchor is attached to same
		}
		if (new_start_attach != null && this.isAcceptableStartAttach(new_start_attach) === false) {
			return; 	// Will not attach if not acceptable attachType
		}

		// Update the attachment primitive
		this._start_attach = new_start_attach;

		let sourcePrimitive = null;
		if (this._start_attach != null) {
			sourcePrimitive = findID(this._start_attach.id);
		}
		setSource(this.primitive, sourcePrimitive);

		// Trigger the attach event on the new attachment primitives
		this.triggerAttachEvents();
	}
	getStartAttach() {
		return this._start_attach;
	}
	setEndAttach(new_end_attach) {
		do_global_log("end_attach");
		if (new_end_attach != null && this.getStartAttach() == new_end_attach) {
			return; 	// Will not attach if other anchor is attached to same 
		}
		if (new_end_attach != null && this.isAcceptableEndAttach(new_end_attach) === false) {
			return;		// Will not attach if not acceptable attachType
		}

		// Update the attachment primitive
		this._end_attach = new_end_attach;
		let targetPrimitive = null;
		if (this._end_attach != null) {
			targetPrimitive = findID(this._end_attach.id);
		}
		setTarget(this.primitive, targetPrimitive);

		// Trigger the attach event on the new attachment primitives
		this.triggerAttachEvents();
	}
	getEndAttach() {
		return this._end_attach;
	}
	triggerAttachEvents() {
		// We must always trigger both start and end, since a change in the start might affect the logics of the primitive attach at the end of a link or flow
		if (this.getStartAttach() != null) {
			this.getStartAttach().attachEvent();
		}
		if (this.getEndAttach() != null) {
			this.getEndAttach().attachEvent();
		}
	}
	clean() {
		this.triggerAttachEvents();
		super.clean();
	}
	updateGraphics() {

	}
}

function getStackTrace() {
	try {
		let a = {};
		a.debug();
	} catch (ex) {
		return ex.stack;
	}
}


