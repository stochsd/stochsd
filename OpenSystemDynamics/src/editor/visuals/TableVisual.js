class TableVisual extends HtmlTwoPointer {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.runHandler = () => {
			this.render();
		}
		RunResults.subscribeRun(id, this.runHandler);
		this.data = new TableData();
	}
	removePlotReference(removeId) {
		let result = removeDisplayId(this.primitive, removeId);
		if (result) {
			this.render();
		}
	}
	// Tables have no chart, but like the plots they redraw here, e.g. to show new primitive names
	updateChart() {
		this.render();
	}
	render() {
		let IdsToDisplay = getDisplayIds(this.primitive);
		this.primitive.setAttribute("Primitives", IdsToDisplay.join(","));
		do_global_log(IdsToDisplay);
		this.data.namesToDisplay = IdsToDisplay.map(findID).map(getName);
		do_global_log("names to display");
		do_global_log(JSON.stringify(this.data.namesToDisplay));
		let limits = JSON.parse(this.primitive.getAttribute("TableLimits"));
		limits.start.value = limits.start.auto ? getTimeStart() : limits.start.value;
		limits.end.value = limits.end.auto ? getTimeStart() + getTimeLength() : limits.end.value;
		limits.step.value = limits.step.auto ? this.dialog.getDefaultPlotPeriod() : limits.step.value;
		let length = limits.end.value - limits.start.value;
		this.primitive.setAttribute("TableLimits", JSON.stringify(limits));
		this.data.results = RunResults.getFilteredSelectiveIdResults(IdsToDisplay, limits.start.value, length, limits.step.value);

		let time_step_str = `${getTimeStep()}`;
		let time_decimals = decimals_in_value_string(time_step_str);

		// We must get the data in column_index+1 since column 1 is reserved for time
		let roundToZero = this.primitive.getAttribute("RoundToZero");
		let round_to_zero_limit = -1;
		if (roundToZero === "true") {
			round_to_zero_limit = this.primitive.getAttribute("RoundToZeroAtValue");
			if (isNaN(round_to_zero_limit)) {
				round_to_zero_limit = getDefaultAttributeValue("table", "RoundToAtZeroValue");
			} else {
				round_to_zero_limit = Number(round_to_zero_limit);
			}
		}

		let number_length = JSON.parse(this.primitive.getAttribute("NumberLength"));
		let number_options = {
			round_to_zero_limit,
			"precision": number_length["usePrecision"] ? number_length["precision"] : undefined,
			"decimals": number_length["usePrecision"] ? undefined : number_length["decimal"]
		};

		html = `<table class='sticky-table zebra-odd'>
			<thead>
				<tr>
					<th class='time-header-cell'>
						<div class="">Time</div>
						<div class="time-unit">${getTimeUnits()}</div>
					</th>
					${this.data.namesToDisplay.map(name => {
						const primitives = findName(name)
						const primitive = Array.isArray(primitives) ? primitives.find(primitive => !isPrimitiveGhost(primitive)) : primitives
						const color = primitive?.getAttribute("Color")
						return `<th class="prim-header-cell">
						<span class="cm-primitive cm-${color}">${name}</span>
					</th>`}).join("")}
				</tr>
			</thead>
			<tbody>
				${this.data.results.map((row) => `<tr>
					${["Time"].concat(this.data.namesToDisplay).map((_, column_index) =>
			column_index == 0
				? `<td class="time-value-cell">${format_number(row[column_index], { round_to_zero_limit, decimals: time_decimals }
				)}</td>`
				: `<td class="prim-value-cell">${format_number(row[column_index], number_options)}</td>`
		).join("")}
				</tr>`).join("")}
			</tbody>
		</table>`;

		if (this.data.results.length === 0) {
			// show this when empty table 
			html += (`<div class="empty-plot-header">Table</div>`);
		}
		this.updateHTML(html);
		this.dialog.data = this.data;
	}

	makeGraphics() {
		this.dialog = new TableDialog(this.id);
		this.dialog.subscribePool.subscribe(() => {
			this.render();
		});
		this.element = SVG.rect(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), defaultStroke, "none", "element", "");
		this.htmlElement = SVG.append(SVG.plotLayer,
			SVG.foreignScrollable(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), "table not rendered yet", "white")
		);

		$(this.htmlElement.cutDiv).mousedown((event) => {
			// This is an alternative to having the htmlElement in the group
			primitive_mousedown(this.id, event)
			mouseDownHandler(event);
			event.stopPropagation();
		});

		$(this.htmlElement.cutDiv).dblclick(() => {
			this.dialog.show();
		});

		this.coordRect = new CoordRect();
		this.coordRect.element = this.element;

		// this.group = SVG.group([this.element]);
		this.group = SVG.append(SVG.plotLayer, SVG.group([this.element]));
		this.group.setAttribute("node_id", this.id);

		this.element_array = [this.element];
		this.element_array = [this.htmlElement.scrollDiv, this.element];
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

		this.htmlElement.setX(this.getMinX());
		this.htmlElement.setY(this.getMinY());
		this.htmlElement.setWidth(this.getWidth());
		this.htmlElement.setHeight(this.getHeight());

		$(this.htmlElement.scrollDiv).css("width", this.getWidth());
		$(this.htmlElement.scrollDiv).css("height", this.getHeight());
	}
}

