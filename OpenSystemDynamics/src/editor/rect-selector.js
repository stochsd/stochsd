class CoordRect {
	constructor() {
		this.x1 = 0;
		this.y1 = 0;
		this.x2 = 0;
		this.y2 = 0;
		this.element = null; // This is set at page ready
	}
	setVisible(new_visible) {
		this.element.setAttribute("visibility", new_visible ? "visible" : "hidden");
	}
	xmin() {
		return this.x1 < this.x2 ? this.x1 : this.x2;
	}
	ymin() {
		return this.y1 < this.y2 ? this.y1 : this.y2;
	}
	width() {
		return Math.abs(this.x2 - this.x1);
	}
	height() {
		return Math.abs(this.y2 - this.y1);
	}
	update() {
		this.element.setAttribute("x", this.xmin());
		this.element.setAttribute("y", this.ymin());

		this.element.setAttribute("width", this.width());
		this.element.setAttribute("height", this.height());
	}
}

class RectSelector {
	/** @type {CoordRect} coordRect */
	static coordRect;
	static init() {
		RectSelector.coordRect = new CoordRect();
		RectSelector.coordRect.element = SVG.append(SVG.svgElement, SVG.rect(-30, -30, 60, 60, "black", "none", "rect-selector"));
		RectSelector.coordRect.element.setAttribute("stroke-dasharray", "4 4");
		RectSelector.coordRect.setVisible(false);
	}
	/** 
	 * @param {number} x  
	 * @param {number} y 
	*/
	static start(x, y) {
		unselect_all();
		RectSelector.coordRect.setVisible(true);
		RectSelector.coordRect.x1 = x;
		RectSelector.coordRect.y1 = y;
		RectSelector.coordRect.x2 = x;
		RectSelector.coordRect.y2 = y;
		RectSelector.coordRect.update();
	}
	/** 
	 * @param {number} x  
	 * @param {number} y 
	*/
	static move(x, y) {
		RectSelector.coordRect.x2 = x;
		RectSelector.coordRect.y2 = y;
		RectSelector.coordRect.update();
		unselect_all();
		let select_array = RectSelector.getObjectsWithin();
		for (let key in select_array) {
			let parent = get_parent(select_array[key]);
			parent.select(false); // We also select the parent but not all of its anchors
			select_array[key].select();
		}
	}
	static stop() {
		RectSelector.coordRect.setVisible(false);
		let select_array = RectSelector.getObjectsWithin();
		for (let key in select_array) {
			select_array[key].select();
		}
	}
	static getObjectsWithin() {
		let return_array = {};
		for (let key in object_array) {
			if (RectSelector.isWithin(key)) {
				return_array[key] = object_array[key];
			}
		}
		return return_array;
	}
	/** @param {string} nodeId  */
	static isWithin(nodeId) {
		return (
			object_array[nodeId].pos[0] >= this.coordRect.xmin() &&
			object_array[nodeId].pos[1] >= this.coordRect.ymin() &&
			object_array[nodeId].pos[0] <= this.coordRect.xmin() + this.coordRect.width() &&
			object_array[nodeId].pos[1] <= this.coordRect.ymin() + this.coordRect.height()
		);
	}
}

