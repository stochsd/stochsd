class RectangleVisual extends TwoPointer {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.dialog = new RectangleDialog(this.id);
		this.dialog.subscribePool.subscribe(() => {
			this.updateGraphics();
		});
	}
	makeGraphics() {
		this.element = SVG.rect(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), defaultStroke, "none", "element");

		// Invisible rect to more easily click
		this.clickRect = SVG.rect(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), "transparent", "none");
		this.clickRect.setAttribute("stroke-width", "10");

		this.coordRect = new CoordRect();
		this.coordRect.element = this.element;

		this.clickCoordRect = new CoordRect();
		this.clickCoordRect.element = this.clickRect;

		this.group = SVG.append(SVG.plotLayer, SVG.group([this.element, this.clickRect]));
		this.group.setAttribute("node_id", this.id);
		this.element_array = [this.element];
		for (let key in this.element_array) {
			this.element_array[key].setAttribute("node_id", this.id);
		}

		$(this.group).dblclick((event) => {
			this.doubleClick();
		});
	}
	doubleClick() {
		this.dialog.show();
	}
	updateGraphics() {
		this.element.setAttribute("stroke-dasharray", this.primitive.getAttribute("StrokeDashArray"));
		this.element.setAttribute("stroke-width", this.primitive.getAttribute("StrokeWidth"));
		// Update rect to fit start and end position
		this.coordRect.x1 = this.startX;
		this.coordRect.y1 = this.startY;
		// Prevent width from being 0 (then rect is not visible)
		let endx = (this.startX != this.endX) ? this.endX : this.startX + 1;
		let endy = (this.startY != this.endY) ? this.endY : this.startY + 1;
		this.coordRect.x2 = endx;
		this.coordRect.y2 = endy;
		this.coordRect.update();

		this.clickCoordRect.x1 = this.startX;
		this.clickCoordRect.y1 = this.startY;
		this.clickCoordRect.x2 = endx;
		this.clickCoordRect.y2 = endy;
		this.clickCoordRect.update();
	}
}


class EllipseVisual extends TwoPointer {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.dialog = new EllipseDialog(this.id);
		this.dialog.subscribePool.subscribe(() => {
			this.updateGraphics();
		});
	}
	makeGraphics() {
		let cx = (this.startX + this.endX) / 2;
		let cy = (this.startY + this.endY) / 2;
		let rx = Math.max(Math.abs(this.startX - this.endX) / 2, 1);
		let ry = Math.max(Math.abs(this.startY - this.endY) / 2, 1);
		this.element = SVG.ellipse(cx, cy, rx, ry, defaultStroke, "none", "element");
		this.clickEllipse = SVG.ellipse(cx, cy, rx, ry, "transparent", "none", "element", { "stroke-width": "10" });
		this.selector = SVG.rect(cx, cy, rx, ry, defaultStroke, defaultFill, "highlight", { "stroke-dasharray": "2 2" });

		this.selectorCoordRect = new CoordRect();
		this.selectorCoordRect.element = this.selector;
		this.element_array = [this.element];
		this.group = SVG.append(SVG.plotLayer, SVG.group([this.element, this.clickEllipse, this.selector]));
		this.group.setAttribute("node_id", this.id);

		$(this.group).dblclick(() => {
			this.doubleClick();
		});
	}
	doubleClick() {
		this.dialog.show();
	}
	updateGraphics() {
		let cx = (this.startX + this.endX) / 2;
		let cy = (this.startY + this.endY) / 2;
		let rx = Math.max(Math.abs(this.startX - this.endX) / 2, 1);
		let ry = Math.max(Math.abs(this.startY - this.endY) / 2, 1);
		this.element.setAttribute("cx", cx);
		this.element.setAttribute("cy", cy);
		this.element.setAttribute("rx", rx);
		this.element.setAttribute("ry", ry);
		this.element.setAttribute("stroke-dasharray", this.primitive.getAttribute("StrokeDashArray"));
		this.element.setAttribute("stroke-width", this.primitive.getAttribute("StrokeWidth"));
		this.clickEllipse.setAttribute("cx", cx);
		this.clickEllipse.setAttribute("cy", cy);
		this.clickEllipse.setAttribute("rx", rx);
		this.clickEllipse.setAttribute("ry", ry);
		this.selectorCoordRect.x1 = this.startX;
		this.selectorCoordRect.y1 = this.startY;
		this.selectorCoordRect.x2 = this.endX;
		this.selectorCoordRect.y2 = this.endY;
		this.selectorCoordRect.update();
	}

	select() {
		super.select();
		this.selector.setAttribute("visibility", "visible");
	}
	unselect() {
		super.unselect();
		this.selector.setAttribute("visibility", "hidden");
	}
}

class HtmlTwoPointer extends TwoPointer {
	updateHTML(html) {
		this.htmlElement.contentDiv.innerHTML = html;
	}
	clean() {
		super.clean();
		this.htmlElement.remove();
	}
}

