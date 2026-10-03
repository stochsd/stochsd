class TwoPointer extends BaseVisual {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.id = id;
		this.type = type;
		this.selected = false;
		this.superClass = "TwoPointer";
		Visuals.addTwoPointer(this);

		// anchors must exist before make graphics 
		this.createInitialHandles(pos0, pos1);

		this.makeGraphics();
		$(this.group).on("mousedown", (event) => {
			this.onMouseDown(event);
		});

		// this is done so anchor is ontop 
		this.startHandle.reloadImage();
		this.endHandle.reloadImage();
	}

	createInitialHandles(pos0, pos1) {
		this.startHandle = new Handle(this.id + ".startHandle", "dummy_anchor", pos0, "start");
		this.endHandle = new Handle(this.id + ".endHandle", "dummy_anchor", pos1, "end");
	}

	getHandles() {
		return [this.startHandle, this.endHandle];
	}

	/**
	 * Selects this and only one of its anchors, e.g. the anchor being dragged. Everything else is unselected.
	 * @param {Handle} handleToSelect
	 */
	selectWithOnlyHandle(handleToSelect) {
		Visuals.unselectAll();
		this.select();
		for (let handle of this.getHandles()) {
			if (handle.id !== handleToSelect.id) {
				handle.unselect();
			}
		}
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
		this.startHandle.setColor(color);
		this.endHandle.setColor(color);
	}

	get startX() { return this.startHandle.getPos()[0]; }
	get startY() { return this.startHandle.getPos()[1]; }
	get endX() { return this.endHandle.getPos()[0]; }
	get endY() { return this.endHandle.getPos()[1]; }

	getPos() { return [(this.startX + this.endX) / 2, (this.startY + this.endY) / 2]; }
	getMinX() { return Math.min(this.startX, this.endX); }
	getMinY() { return Math.min(this.startY, this.endY); }
	getWidth() { return Math.abs(this.startX - this.endX); }
	getHeight() { return Math.abs(this.startY - this.endY); }

	unselect() {
		this.selected = false;
		for (let anchor of this.getHandles()) {
			anchor.setVisible(false);
		}
	}
	select() {
		this.selected = true;
		for (let anchor of this.getHandles()) {
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
	/** @param {HandleType} handleType */
	syncHandleToPrimitive(handleType) {
		// This function should sync handle position to primitive 
		let primitive = findID(this.id);
		if (!primitive) return;
		switch (handleType) {
			case "start":
				setSourcePosition(primitive, this.startHandle.getPos());
				break;
			case "end":
				setTargetPosition(primitive, this.endHandle.getPos());
				break;
		}
	}
}

class BaseConnection extends TwoPointer {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		/** @type {BaseVisual} */
		this._start_attach = null;
		/** @type {BaseVisual} */
		this._end_attach = null;
		this.positionUpdateHandler = () => {
			let primitive = findID(this.id);
			let sourcePoint = getSourcePosition(primitive);
			let targetPoint = getTargetPosition(primitive);
			this.startHandle.setPos(sourcePoint);
			this.endHandle.setPos(targetPoint);
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
		if (this.getStartAttach() != null && !this.getStartAttach().isRemoved()) {
			this.getStartAttach().attachEvent();
		}
		if (this.getEndAttach() != null && !this.getEndAttach().isRemoved()) {
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


