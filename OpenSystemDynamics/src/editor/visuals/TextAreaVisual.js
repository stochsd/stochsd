class TextAreaVisual extends HtmlTwoPointer {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);

		this.primitive = findID(id);

		this.dialog = new TextAreaDialog(id);
		this.dialog.subscribePool.subscribe(() => {
			this.render();
		});
		this.render();
	}
	updateGraphics() {
		// code for svg foreign
		this.htmlElement.setX(this.getMinX());
		this.htmlElement.setY(this.getMinY());
		this.htmlElement.setWidth(this.getWidth());
		this.htmlElement.setHeight(this.getHeight());

		this.coordRect.x1 = this.startX;
		this.coordRect.y1 = this.startY;
		this.coordRect.x2 = this.endX;
		this.coordRect.y2 = this.endY;
		this.coordRect.update();
	}
	makeGraphics() {
		this.element = SVG.append(SVG.plotLayer, SVG.rect(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), defaultStroke, "none", "element", ""));

		this.coordRect = new CoordRect();
		this.coordRect.element = this.element;

		this.htmlElement = SVG.append(SVG.plotLayer, SVG.foreign(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), "Text not renderd yet", "white"));

		$(this.htmlElement.cutDiv).mousedown((event) => {
			// This is an alternative to having the htmlElement in the group
			this.onMouseDown(event)
			mouseDownHandler(event);
			event.stopPropagation();
		});

		// Emergency solution since double clicking a ComparePlot or XyPlot does not always work.
		$(this.htmlElement.cutDiv).on("contextmenu", () => {
			this.doubleClick();
		});

		$(this.htmlElement.cutDiv).dblclick(() => {
			this.doubleClick();
		});

		this.group = SVG.append(SVG.plotLayer, SVG.group([this.element]));
		this.group.setAttribute("node_id", this.id);

		this.element_array = [this.element];
		this.element_array = [this.htmlElement.contentDiv, this.element];
		for (let key in this.element_array) {
			this.element_array[key].setAttribute("node_id", this.id);
		}
	}
	doubleClick() {
		this.dialog.show();
	}
	render() {
		let newText = getName(this.primitive);
		let hideFrame = this.primitive.getAttribute("HideFrame") === "true";
		if (hideFrame && removeSpacesAtEnd(newText).length !== 0) {
			this.element.setAttribute("visibility", "hidden");
		} else {
			this.element.setAttribute("visibility", "visible");
		}
		// space is replaced with span "&nbsp;" does not work since it does not work with overflow-wrap: break-word
		// Replace <, >, space, new line
		let formatedText = newText
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/ /g, "<span style='display:inline-block; width:5px;'></span>")
			.replace(/\n/g, "<br/>");
		this.updateHTML(formatedText);
	}
	setColor(color) {
		super.setColor(color);
		this.htmlElement.style.color = color;
	}
}

