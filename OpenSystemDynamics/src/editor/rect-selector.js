// @ts-check
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
		Visuals.unselectAll();
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
		Visuals.unselectAll();
		let onePointers = RectSelector.getVisualsWithin();
		for (let key in onePointers) {
			const visual = onePointers[key]
			visual.select();
		}
		let handles = RectSelector.getHandlesWithin();
		for (let key in handles) {
			const handle = handles[key]
			const parent = handle.getParent();
			parent.select(); // We also select the parent but not all of its anchors
			handle.select();
		}
	}
	static stop() {
		RectSelector.coordRect.setVisible(false);
	}
	static getVisualsWithin() {
		/** @type {Record<string, OnePointer>} */
		const result = {};
		for (let visual of Visuals.onePointers()) {
			if (RectSelector.isWithin(visual)) {
				result[visual.id] = visual;
			}
		}
		return result;
	}
	static getHandlesWithin() {
		/** @type {Record<string, Handle>} */
		const result = {};
		for (let handle of Visuals.handles()) {
			if (RectSelector.isWithin(handle)) {
				result[handle.id] = handle;
			}
		}
		return result;
	}
	/** @param {OnePointer | Handle} visual */
	static isWithin(visual) {
		let [x, y] = visual.getPos();
		return (
			x >= this.coordRect.xmin() &&
			y >= this.coordRect.ymin() &&
			x <= this.coordRect.xmin() + this.coordRect.width() &&
			y <= this.coordRect.ymin() + this.coordRect.height()
		);
	}
}

