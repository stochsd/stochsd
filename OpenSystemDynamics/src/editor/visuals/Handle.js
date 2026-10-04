/** @typedef {"invalid" | "start" | "end" | "control1" | "control2" | "bend"} HandleType */
class Handle extends BaseVisual {
	/** @type {HandleType} */
	#handleType
	/** @type {TwoPointer} */
    #parent
	/** @type {boolean} */
	#isSquare
	/** @type {SVGElement[]} */
	#elements
	/** @type {SVGElement[]} */
	#selectElements
	/** @type {SVGGElement | undefined} */
	group
	/**
	 * @param {string} id 
	 * @param {string} type 
	 * @param {[number, number]} pos 
	 * @param {HandleType} handleType 
     * @param {TwoPointer} parent 
	 */
	constructor(id, type, pos, handleType, parent) {
		super(id, type, pos);
		Visuals.addHandle(this)
		this.#handleType = handleType;
        this.#parent = parent
		this.#isSquare = false;
		this.#elements = [];
		this.#selectElements = [];
		this.group = undefined;
		/** @type {[number, number]} */
		this.pos = [pos[0], pos[1]];
		this.loadImage();
	}
	/** @returns {TwoPointer} */
    getParent() {
        return this.#parent
    }
	/** Clicking a handle selects only it and its parent */
	onMouseDown(event) {
		mouse.lastClickedPrimitive = this;
		if (event.which === mouse.left) {
			Visuals.unselectAllExcept(this.#parent.id);
			this.select();
			mouse.clickedOnObject = true;
		}
	}
	isAttached() {
		let parent = this.getParent();
		if (!parent.getStartAttach) {
			return;
		}
		switch (this.#handleType) {
			case "start":
				return !!parent.getStartAttach();
			case "end":
				return !!parent.getEndAttach()
			default:
				// It's not a start or end anchor so it cannot be attached
				return false;
		}
	}
		/** @param {[number, number]} pos */
	setPos(pos) {
		if (pos[0] == this.pos[0] && pos[1] == this.pos[1]) return;
		this.pos = [pos[0], pos[1]];
	}

	/** @returns {[number, number]} */
	getPos() {
		return [this.pos[0], this.pos[1]];
	}
    /** @param {number} diff_x @param {number} diff_y */
	moveBy(diff_x, diff_y) {
		this.pos[0] += diff_x;
		this.pos[1] += diff_y;
		this.updatePosition();
		this.afterMove(diff_x, diff_y);
	}
	/** @returns {HandleType} */
	getHandleType() {
		return this.#handleType;
	}
	setVisible(newVisible) {
		if (newVisible) {
			for (let element of this.#elements) {
				// Show all elements except for selectors
				if (element.getAttribute("class") != "highlight") {
					element.setAttribute("visibility", "visible");
				}
			}
		}
		else {
			// Hide elements
			for (let element of this.#elements) {
				element.setAttribute("visibility", "hidden");
			}
		}
	}
	updatePosition() {
		this.update();
		let parent = this.getParent();
		if (parent.startHandle && parent.endHandle) {
			parent.syncHandleToPrimitive(this.#handleType);
		}
	}
	loadImage() {
		this.#elements = this.getImage();
		this.#selectElements = this.#elements.filter(element => element.getAttribute("class") == "highlight");
		this.group = SVG.append(this.getLayer(), SVG.group(this.#elements));
		this.group.setAttribute("node_id", this.id);
		this.update();
		for (let key in this.#elements) {
			let element = this.#elements[key];
			$(element).on("mousedown", (event) => {
				this.onMouseDown(event);
			});
		}
	}
	getImage() {
		if (this.#isSquare) {
			return [
				SVG.rect(-4, -4, 8, 8, this.color, "white", "element"),
				SVG.rect(-4, -4, 8, 8, "none", this.color, "highlight")
			];
		} else {
			return [
				SVG.circle(0, 0, 5, this.color, "white", "element"),
				SVG.circle(0, 0, 5, "none", this.color, "highlight")
			];
		}

	}
	getLayer() {
		return SVG.handleLayer;
	}
	makeSquare() {
		this.#isSquare = true;
		this.reloadImage();
	}
	reloadImage() {
		this.clearImage();
		this.loadImage();
	}
	select() {
		this.selected = true;
		for (let elem of this.#selectElements) {
			elem.setAttribute("visibility", "visible");
		}
	}
	unselect() {
		this.selected = false;
		for (let elem of this.#selectElements) {
			elem.setAttribute("visibility", "hidden");
		}
	}
    update() {
		this.group.setAttribute("transform", "translate(" + this.pos[0] + "," + this.pos[1] + ")");
	}
}