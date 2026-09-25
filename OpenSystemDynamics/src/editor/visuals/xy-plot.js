class XyPlotVisual extends PlotVisual {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.runHandler = () => {
			this.render();
		}
		RunResults.subscribeRun(id, this.runHandler);
		this.plot = null;
		this.serieArray = null;
		this.namesToDisplay = [];

		this.xAxisColor = defaultStroke;
		this.yAxisColor = defaultStroke;

		this.minXValue = 0;
		this.maxXValue = 0;

		this.minYValue = 0;
		this.maxYValue = 0;

		this.dialog = new XyPlotDialog(id);
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
	render() {
		let IdsToDisplay = getDisplayIds(this.primitive);
		this.primitive.setAttribute("Primitives", IdsToDisplay.join(","));
		this.namesToDisplay = IdsToDisplay.map(findID).map(getName);
		let auto_plot_per = JSON.parse(this.primitive.getAttribute("AutoPlotPer"));
		let plot_per = Number(this.primitive.getAttribute("PlotPer"));
		if (auto_plot_per && plot_per !== this.dialog.getDefaultPlotPeriod()) {
			plot_per = this.dialog.getDefaultPlotPeriod();
			this.primitive.setAttribute("PlotPer", plot_per);
		}
		let results = RunResults.getFilteredSelectiveIdResults(IdsToDisplay, getTimeStart(), getTimeLength(), plot_per);
		if (results.length == 0) {
			this.setEmptyPlot();
			return;
		}

		this.minXValue = 0;
		this.maxXValue = 0;

		this.minYValue = 0;
		this.maxYValue = 0;

		this.serieXName = "X series";
		this.serieYName = "Y series";

		if (IdsToDisplay.length != 2) {
			// We have no series to display
			this.setEmptyPlot();
			return;
		}

		let makeXYSerie = () => {
			let serie = [];
			this.serieXName = this.namesToDisplay[0];
			this.serieYName = this.namesToDisplay[1];
			this.colorXLabel = findName(this.serieXName)?.getAttribute("Color");
			this.colorYLabel = findName(this.serieYName)?.getAttribute("Color");

			for (let row of results) {
				let x = Number(row[1]);
				let y = Number(row[2]);
				let t = Number(row[0]);
				if (x < this.minXValue) {
					this.minXValue = x;
				}
				if (x > this.maxXValue) {
					this.maxXValue = x;
				}
				if (y < this.minValue) {
					this.minYValue = y;
				}
				if (y > this.maxYValue) {
					this.maxYValue = y;
				}
				serie.push([x, y, t]);
			}
			return serie;
		}

		// Declare series and settings for series
		this.serieSettingsArray = [];
		this.serieArray = [];

		// Make time series
		let dataSerie = makeXYSerie();
		this.serieArray.push(dataSerie);
		do_global_log("serieArray " + JSON.stringify(this.serieArray));

		// Make serie settings
		this.serieSettingsArray.push({
			lineWidth: this.primitive.getAttribute("LineWidth"),
			color: "black",
			shadow: false,
			showLine: this.primitive.getAttribute("ShowLine") === "true",
			showMarker: this.primitive.getAttribute("ShowMarker") === "true",
			markerOptions: { shadow: false, size: 5 },
			pointLabels: { show: false }
		});
		if (this.primitive.getAttribute("MarkStart") === "true") {
			this.serieArray.push([dataSerie[0]]);
			this.serieSettingsArray.push({
				color: "#ff4444",
				showLine: false,
				showMarker: true,
				markerOptions: { shadow: false },
				pointLabels: { show: false }
			});
		}
		if (this.primitive.getAttribute("MarkEnd") === "true") {
			this.serieArray.push([dataSerie[dataSerie.length - 1]]);
			this.serieSettingsArray.push({
				color: "#00aa00",
				showLine: false,
				showMarker: true,
				markerOptions: {
					style: "filledSquare",
					shadow: false,
					pointLabels: { show: false }
				}
			});
		}

		do_global_log(JSON.stringify(this.serieSettingsArray));

		// We need to ad a delay and respond to events first to make this work in firefox
		setTimeout(() => {
			this.updateChart();
		}, 200);
	}

	updateChart() {
		// Dont update chart if primitive has been deleted
		// This check needs to be here since updateChart is updated with a timeout 
		if (!(this.id in connection_array)) return;

		if (this.serieArray == null) {
			// The series are not initialized yet
			this.setEmptyPlot();
			return;
		}
		if (getDisplayIds(this.primitive).length != 2) {
			this.setEmptyPlot();
			return;
		}
		$(this.chartDiv).empty();
		let axisLimits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		this.plot = $.jqplot(this.chartId, this.serieArray, {
			series: this.serieSettingsArray,
			title: this.primitive.getAttribute("TitleLabel"),
			grid: {
				background: "transparent",
				shadow: false
			},
			sortData: false,
			axesDefaults: {
				labelRenderer: $.jqplot.CanvasAxisLabelRenderer
			},
			axes: {
				xaxis: {
					label: this.serieXName,
					labelOptions: { textColor: this.colorXLabel },
					renderer: (this.primitive.getAttribute("XLogScale") === "true") ? $.jqplot.LogAxisRenderer : $.jqplot.LinearAxisRenderer,
					min: axisLimits.xaxis.auto ? undefined : axisLimits.xaxis.min,
					max: axisLimits.xaxis.auto ? undefined : axisLimits.xaxis.max,
					ticks: axisLimits.xaxis.auto ? undefined : this.getTicks(Number(axisLimits.xaxis.min), Number(axisLimits.xaxis.max)),
				},
				yaxis: {
					label: this.serieYName,
					labelOptions: { textColor: this.colorYLabel },
					renderer: (this.primitive.getAttribute("YLogScale") === "true") ? $.jqplot.LogAxisRenderer : $.jqplot.LinearAxisRenderer,
					min: axisLimits.yaxis.auto ? undefined : axisLimits.yaxis.min,
					max: axisLimits.yaxis.auto ? undefined : axisLimits.yaxis.max,
					ticks: axisLimits.yaxis.auto ? undefined : this.getTicks(Number(axisLimits.yaxis.min), Number(axisLimits.yaxis.max), "height"),
				}
			},
			highlighter: {
				show: this.primitive.getAttribute("ShowHighlighter") === "true",
				sizeAdjust: 1.5,
				yvalues: 2,
				fadeTooltip: false,
				tooltipLocation: "ne",
				formatString: (`
					<table class="jqplot-highlighter" style="color: black;">
						<tr><td>Time </td><td> = </td><td>%3$.3p</td></tr>
        				<tr><td style="font-weight: bold; color: ${this.colorXLabel};">${this.serieXName} </td><td> = </td><td>%1$.3p</td></tr>
						<tr><td style="font-weight: bold; color: ${this.colorYLabel};">${this.serieYName} </td><td> = </td><td>%2$.3p</td></tr>
					</table>
				`),
				useAxesFormatters: false
			}
		});
		if (axisLimits.xaxis.auto) {
			axisLimits.xaxis.min = this.plot.axes.xaxis.min;
			axisLimits.xaxis.max = this.plot.axes.xaxis.max;
		}
		if (axisLimits.yaxis.auto) {
			axisLimits.yaxis.min = this.plot.axes.yaxis.min;
			axisLimits.yaxis.max = this.plot.axes.yaxis.max;
		}
		this.primitive.setAttribute("AxisLimits", JSON.stringify(axisLimits));
	}
	setEmptyPlot() {
		$(this.chartDiv).empty();
		let idsToDisplay = getDisplayIds(this.primitive);
		let selected_str = "None selected<br/>";
		if (idsToDisplay.length !== 0) {
			selected_str = (`<ul style="margin: 4px;">
				${idsToDisplay.map(id => `<li>
					<span style="font-weight:bold; color: ${findID(id)?.getAttribute("Color") ?? "black"};">
						[${getName(findID(id))}]
					</span>
				</li>`).join("")}
			</ul>`);
		}
		if (idsToDisplay.length !== 2) {
			selected_str += warningHtml("<br/>Exactly two primitives must be selected!");
		}
		this.chartDiv.innerHTML = (`
			<div class="empty-plot-header">XY Plot</div>
			${selected_str}
		`);
	}
}

