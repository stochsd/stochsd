class HtmlOverlayTwoPointer extends TwoPointer {
	updateHTML(html) {
		this.targetElement.innerHTML = html;
	}

	makeGraphics() {
		this.targetBorder = 4;
		this.targetElement = document.createElement("div");
		this.targetElement.style.position = "absolute";
		this.targetElement.style.backgroundColor = "white";
		this.targetElement.style.zIndex = 100;
		this.targetElement.style.overflow = "hidden";
		this.targetElement.style.left = (this.getMinX() + this.targetBorder + 1) + "px";
		this.targetElement.style.top = (this.getMinY() + this.targetBorder + 1) + "px";
		this.targetElement.style.width = "2px";
		this.targetElement.style.height = "2px";
		document.getElementById("svgplanebackground").appendChild(this.targetElement);

		$(this.targetElement).mousedown((event) => {
			// This is an alternative to having the htmlElement in the group
			primitive_mousedown(this.id, event)
			mouseDownHandler(event);
			event.stopPropagation();
		});

		$(this.targetElement).dblclick(() => {
			this.doubleClick(this.id);
		});

		// Emergency solution since double clicking a ComparePlot or XyPlot does not always work.
		$(this.targetElement).bind("contextmenu", (event) => {
			this.doubleClick(this.id);
		});

		this.element = SVG.rect(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), defaultStroke, "white", "element", "");

		this.coordRect = new CoordRect();
		this.coordRect.element = this.element;

		this.group = SVG.append(SVG.plotLayer, SVG.group([this.element]));
		this.group.setAttribute("node_id", this.id);

		this.element_array = [this.element];
		for (let key in this.element_array) {
			this.element_array[key].setAttribute("node_id", this.id);
		}
	}

	updateGraphics() {
		// Update rect to fit start and end position
		this.coordRect.x1 = this.startX;
		this.coordRect.y1 = this.startY;
		this.coordRect.x2 = this.endX;
		this.coordRect.y2 = this.endY;
		this.coordRect.update();

		this.targetElement.style.left = (this.getMinX() + this.targetBorder + 1) + "px";
		this.targetElement.style.top = (this.getMinY() + this.targetBorder + 1) + "px";

		this.targetElement.style.width = (this.getWidth() - (2 * this.targetBorder)) + "px";
		this.targetElement.style.height = (this.getHeight() - (2 * this.targetBorder)) + "px";
	}

	clean() {
		super.clean();
		this.targetElement.remove();
	}
	doubleClick() {
		this.dialog.show();
	}
}

class PlotVisual extends HtmlOverlayTwoPointer {
	getTicks(min, max, dimention = "width") {
		let length = max - min;

		// Calculate minTimeSubDivision
		let tickSubDivStep = (10 ** Math.floor(Math.log10(length))) / 10;

		// Measure in pixels 
		let pxWidth = parseInt(this.chartDiv.style[dimention]) - 80;
		let minPxStep = 50;
		let maxSteps = Math.floor(pxWidth / minPxStep);

		let viableMultiples = [1, 2, 5, 10, 20, 50];
		let stepSizeList = viableMultiples.map(muliple => {
			return muliple * tickSubDivStep;
		})
		let okStepSize = stepSizeList.find(step => {
			return maxSteps >= length / step;
		});

		let ticks = [`${min}`, `${max}`];
		if (okStepSize !== undefined) {
			let tickStep = okStepSize;

			let decimals = Number.isInteger(okStepSize) ? 0 : undefined;

			ticks = [];
			let lowerIndex = Math.ceil(min / tickStep);
			let upperIndex = Math.floor(max / tickStep);

			if (tickStep * lowerIndex !== min) {
				// Add empty tick if min is not included
				// ticks can be formated as 2D array [[val,label],[val,label],...]
				// see reference: http://www.music.mcgill.ca/~ich/classes/mumt301_11/js/jqPlot/docs/files/jqplot-core-js.html#Axis.ticks
				ticks.push([min, ""]);
			}

			for (let i = lowerIndex; i <= upperIndex; i++) {
				let currentTick = tickStep * i;
				ticks.push([currentTick, format_number(currentTick, { decimals })]);
			}

			if (tickStep * upperIndex !== max) {
				ticks.push([max, ""]);
			}
		}

		return ticks;
	}
	updateGraphics() {
		super.updateGraphics();
		let newWidth = `${$(this.targetElement).width() - 10}px`;
		let newHeight = `${$(this.targetElement).height() - 10}px`;
		let oldWidth = this.chartDiv.style.width;
		let oldHeight = this.chartDiv.style.height;
		if (oldWidth !== newWidth || oldHeight !== newHeight) {
			this.chartDiv.style.width = newWidth;
			this.chartDiv.style.height = newHeight;

			// Clear updating chart so only the last updateGraphics updates chart
			// This limits the number of times updateCharts runs (updateChart is an expensive call)
			if (this.updateChartTimeOut) {
				clearTimeout(this.updateChartTimeOut);
				this.updateChartTimeOut = null;
			}
			this.updateChartTimeOut = setTimeout(this.updateChart.bind(this), 10);
		}
	}
	makeGraphics() {
		super.makeGraphics();

		this.chartId = this.id + "_chart";
		let html = `<div id="${this.chartId}" style="width:0px; height:0px; z-index: 100;"></div>`;
		this.updateHTML(html);
		this.chartDiv = document.getElementById(this.chartId);
	}
	doubleClick() {
		this.dialog.show();
	}
}

