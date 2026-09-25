class TimePlotVisual extends PlotVisual {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.runHandler = () => {
			this.render();
		}
		RunResults.subscribeRun(id, this.runHandler);
		this.plot = null;
		this.serieArray = null;
		this.namesToDisplay = [];
		this.data = {
			resultIds: [],
			results: []
		}

		this.dialog = new TimePlotDialog(id);
		this.dialog.subscribePool.subscribe(() => {
			this.render();
		});
	}
	removePlotReference(removeId) {
		let result = removeDisplayId(this.primitive, removeId);
		if (result) {
			this.render();
		}
	}
	fetchData() {
		this.fetchedIds = getDisplayIds(this.primitive);

		this.data.resultIds = ["time"].concat(this.fetchedIds);
		let auto_plot_per = JSON.parse(this.primitive.getAttribute("AutoPlotPer"));
		let plot_per = Number(this.primitive.getAttribute("PlotPer"));
		if (auto_plot_per && plot_per !== this.dialog.getDefaultPlotPeriod()) {
			plot_per = this.dialog.getDefaultPlotPeriod();
			this.primitive.setAttribute("PlotPer", plot_per);
		}
		this.data.results = RunResults.getFilteredSelectiveIdResults(this.fetchedIds, getTimeStart(), getTimeLength(), plot_per);
	}
	render() {
		this.fetchData();

		let idsToDisplay = getDisplayIds(this.primitive);
		let sides = getDisplaySides(this.primitive);

		this.namesToDisplay = idsToDisplay.map(findID).map(getName);
		this.colorsToDisplay = idsToDisplay.map(findID).map(
			(node) => node.getAttribute("Color")
		);

		let types_to_display = idsToDisplay.map(findID).map(node => Visuals.get(node.id).type);
		let line_options = JSON.parse(this.primitive.getAttribute("LineOptions"));
		this.patternsToDisplay = types_to_display.map(type => line_options[type] ? line_options[type]["pattern"] : [1]);
		this.widthsToDisplay = types_to_display.map(type => line_options[type] ? line_options[type]["width"] : 2);

		if (this.data.results.length == 0) {
			this.setEmptyPlot();
			return;
		}

		let hasNumberedLines = (this.primitive.getAttribute("HasNumberedLines") === "true");

		let makeSerie = (resultColumn, lineCount) => {
			let serie = [];
			let plotPerIdx = Math.floor(this.data.results.length / 4);
			for (let i = 0; i < this.data.results.length; i++) {
				let row = this.data.results[i];
				let time = Number(row[0]);
				let value = Number(row[resultColumn]);
				let showNumHere = i % plotPerIdx === Math.floor((plotPerIdx / 2 + (plotPerIdx * lineCount) / 8) % plotPerIdx);
				if (showNumHere && hasNumberedLines) {
					serie.push([time, value, Math.floor(lineCount).toString()]);
				} else {
					serie.push([time, value, null]);
				}
			}
			return serie;
		}

		// Declare series and settings for series
		this.serieSettingsArray = [];
		this.serieArray = [];

		// Make time series & Settings 
		let counter = 0;
		for (let i = 0; i < idsToDisplay.length; i++) {
			counter++;
			let index = this.data.resultIds.indexOf(idsToDisplay[i]);
			if (index === -1) {
				this.serieArray.push([null, null, null]);
			} else {
				this.serieArray.push(makeSerie(index, counter));
			}
			let label = "";
			label += hasNumberedLines ? `${counter}. ` : "";
			label += this.namesToDisplay[i];
			label += ((sides.includes("R") && sides.includes("L")) ? ((sides[i] === "L") ? " - L" : " - R") : (""));
			this.serieSettingsArray.push(
				{
					showLabel: true,
					lineWidth: this.widthsToDisplay[i],
					label: label,
					yaxis: (sides[i] === "L") ? "yaxis" : "y2axis",
					linePattern: this.patternsToDisplay[i],
					color: this.primitive.getAttribute("ColorFromPrimitive") === "true" ? this.colorsToDisplay[i] : undefined,
					shadow: false,
					showMarker: false,
					markerOptions: { size: 5 },
					pointLabels: {
						show: true,
						edgeTolerance: 0,
						ypadding: 0,
						location: "n"
					}
				}
			);
		}

		do_global_log("serieArray " + JSON.stringify(this.serieArray));

		do_global_log(JSON.stringify(this.serieSettingsArray));

		// We need to ad a delay and respond to events first to make this work in firefox
		setTimeout(() => {
			this.updateChart();
		}, 200);

	}
	updateChart() {
		// Dont update chart if primitive has been deleted
		// This check needs to be here since updateChart is updated with a timeout 
		if (!Visuals.getTwoPointer(this.id)) return;

		if (this.serieArray == null || this.serieArray.length == 0) {
			this.setEmptyPlot();
			return;
		}
		$(this.chartDiv).empty();

		let axisLimits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		let min = Number(axisLimits.timeaxis.auto ? getTimeStart() : axisLimits.timeaxis.min);
		let max = Number(axisLimits.timeaxis.auto ? getTimeStart() + getTimeLength() : axisLimits.timeaxis.max);
		let tickList = this.getTicks(min, max);

		$.jqplot.config.enablePlugins = true;
		this.plot = $.jqplot(this.chartId, this.serieArray, {
			title: this.primitive.getAttribute("TitleLabel"),
			series: this.serieSettingsArray,
			grid: {
				background: "transparent",
				shadow: false
			},
			axes: {
				xaxis: {
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					label: "Time",
					min: min,
					max: max,
					ticks: tickList
				},
				yaxis: {
					renderer: (this.primitive.getAttribute("LeftLogScale") === "true") ? $.jqplot.LogAxisRenderer : $.jqplot.LinearAxisRenderer,
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					label: this.primitive.getAttribute("LeftAxisLabel"),
					min: axisLimits.leftaxis.auto ? undefined : axisLimits.leftaxis.min,
					max: axisLimits.leftaxis.auto ? undefined : axisLimits.leftaxis.max
				},
				y2axis: {
					renderer: (this.primitive.getAttribute("RightLogScale") === "true") ? $.jqplot.LogAxisRenderer : $.jqplot.LinearAxisRenderer,
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					label: this.primitive.getAttribute("RightAxisLabel"),
					min: axisLimits.rightaxis.auto ? undefined : axisLimits.rightaxis.min,
					max: axisLimits.rightaxis.auto ? undefined : axisLimits.rightaxis.max,
					tickOptions: {
						showGridline: false
					}
				}
			},
			highlighter: {
				show: this.primitive.getAttribute("ShowHighlighter") === "true",
				sizeAdjust: 1.5,
				tooltipAxes: "xy",
				fadeTooltip: false,
				tooltipLocation: "ne",
				formatString: "Time = %.5p<br/>Value = %.5p",
				useAxesFormatters: false
			},
			legend: {
				show: true,
				placement: 'outsideGrid'
			}
		});
		if (axisLimits.leftaxis.auto && this.serieSettingsArray.map(ss => ss["yaxis"]).includes("yaxis")) {
			if (!isNaN(this.plot.axes.yaxis.min) && !isNaN(this.plot.axes.yaxis.max)) {
				axisLimits.leftaxis.min = this.plot.axes.yaxis.min;
				axisLimits.leftaxis.max = this.plot.axes.yaxis.max;
			}
		}
		if (axisLimits.rightaxis.auto && this.serieSettingsArray.map(ss => ss["yaxis"]).includes("y2axis")) {
			if (!isNaN(this.plot.axes.y2axis.min) && !isNaN(this.plot.axes.y2axis.max)) {
				axisLimits.rightaxis.min = this.plot.axes.y2axis.min;
				axisLimits.rightaxis.max = this.plot.axes.y2axis.max;
			}
		}

		this.primitive.setAttribute("AxisLimits", JSON.stringify(axisLimits));
	}
	setEmptyPlot() {
		$(this.chartDiv).empty();
		let idsToDisplay = getDisplayIds(this.primitive);
		let selected_str = "None selected";
		if (idsToDisplay.length !== 0) {
			selected_str = (`<ul style="margin: 4px;">
				${idsToDisplay.map(id => `<li>
					<span style="font-weight:bold; color: ${findID(id)?.getAttribute("Color") ?? "black"};">
						[${getName(findID(id))}]
					</span>
				</li>`).join("")}
			</ul>`);
		}
		this.chartDiv.innerHTML = (`
			<div class="empty-plot-header">Time Plot</div>
			${selected_str}
		`);
	}
}


