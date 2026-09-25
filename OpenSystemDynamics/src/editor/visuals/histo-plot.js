class HistoPlotVisual extends PlotVisual {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.runHandler = () => {
			this.render();
		}
		RunResults.subscribeRun(id, this.runHandler);
		this.plot = null;

		this.dialog = new HistoPlotDialog(id);
		this.dialog.subscribePool.subscribe(() => {
			this.render();
		});
	}

	calcHistogram(results) {
		let histogram = {};
		histogram.data = results.map(row => Number(row[1]));

		if (this.primitive.getAttribute("LowerBoundAuto") === "true") {
			histogram.min = Math.min.apply(null, histogram.data);
			this.primitive.setAttribute("LowerBound", histogram.min);
		} else {
			histogram.min = Number(this.primitive.getAttribute("LowerBound"));
		}
		if (this.primitive.getAttribute("UpperBoundAuto") === "true") {
			histogram.max = Math.max.apply(null, histogram.data);
			// This line is to slightly elevate the upper limit so the top most value is included.
			// histogram.max += (histogram.max-histogram.min)*0.0001;
			this.primitive.setAttribute("UpperBound", histogram.max);
		} else {
			histogram.max = Number(this.primitive.getAttribute("UpperBound"));
		}
		if (this.primitive.getAttribute("NumberOfBarsAuto") === "true") {
			histogram.numBars = Number(getDefaultAttributeValue("histoplot", "NumberOfBars"));
			this.primitive.setAttribute("NumberOfBars", histogram.numBars);
		} else {
			histogram.numBars = this.primitive.getAttribute("NumberOfBars");
		}

		histogram.intervalWidth = (histogram.max - histogram.min) / histogram.numBars;
		histogram.bars = [];
		// Data points below resp. below the lower and upper boundary 
		histogram.below_data = [];
		histogram.above_data = [];

		for (let i = 0; i < histogram.numBars; i++) {
			histogram.bars.push({
				lowerLimit: histogram.min + i * histogram.intervalWidth,
				upperLimit: histogram.min + (i + 1) * histogram.intervalWidth,
				data: []
			});
		}
		for (let dataPoint of histogram.data) {
			let pos = Math.floor((dataPoint - histogram.min) / histogram.intervalWidth);
			if (0 <= pos && pos < histogram.numBars) {
				histogram.bars[pos].data.push(dataPoint);
			} else if (pos < 0) {
				histogram.below_data.push(dataPoint);
			} else {
				histogram.above_data.push(dataPoint);
			}
		}
		return histogram;
	}

	render() {
		let idsToDisplay = getDisplayIds(this.primitive);
		this.primitive.setAttribute("Primitives", idsToDisplay.join(","));
		if (idsToDisplay.length !== 1) {
			this.setEmptyPlot();
			return;
		}
		let results = RunResults.getSelectiveIdResults(idsToDisplay);

		if (results.length === 0) {
			this.setEmptyPlot();
			return;
		}

		this.serieArray = [];
		this.labels = [];
		this.ticks = [];

		// Declare series and settings for series
		this.serieSettingsArray = [];

		this.histogram = this.calcHistogram(results);
		let tickDecimal = Number.isInteger(this.histogram.intervalWidth) ? 0 : 2;

		let serie = [];
		for (let i = 0; i < this.histogram.bars.length; i++) {
			let bar = this.histogram.bars[i];
			let barValue = bar.data.length;
			let usePDF = (this.primitive.getAttribute("ScaleType") === "PDF");
			if (usePDF) {
				barValue = bar.data.length / this.histogram.data.length;
			}
			//		1___2___3		  ______
			// _____|		|1___2___3		...

			// (1)
			serie.push([bar.lowerLimit, barValue]);
			this.labels.push("");
			this.ticks.push(bar.lowerLimit.toFixed(tickDecimal));

			// (2) label here 
			serie.push([(bar.lowerLimit + bar.upperLimit) / 2, barValue]);
			this.labels.push(usePDF ? barValue.toFixed(3) : barValue.toString());

			// (3)
			serie.push([bar.upperLimit, barValue]);
			this.labels.push("");
		}

		serie.push([this.histogram.max, 0]);
		this.labels.push("");
		this.ticks.push(this.histogram.max.toFixed(tickDecimal));

		this.serieArray.push(serie);
		let targetPrim = findID(idsToDisplay[0]);

		// Make serie settings
		this.serieSettingsArray.push(
			{
				color: targetPrim.getAttribute("Color"),
				shadow: false,
				pointLabels: {
					show: true,
					labels: this.labels
				}
			}
		);

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
		if (getDisplayIds(this.primitive).length !== 1) {
			this.setEmptyPlot();
			return;
		}
		$(this.chartDiv).empty();

		let width = parseInt(this.chartDiv.style.width);
		let widthPerTick = width / this.histogram.numBars;

		let tempTick = this.ticks;
		let minTickWidth = Number.isInteger(this.histogram.intervalWidth) ? 30 : 40;
		if (widthPerTick < minTickWidth) {
			let tickIndexSkip = Math.ceil(minTickWidth / widthPerTick);
			tempTick = this.ticks.filter((_, index) => index % tickIndexSkip === 0 || index === this.ticks.length - 1);
		}



		let scaleType = this.primitive.getAttribute("ScaleType");
		let targetPrimName = `${getName(findID(getDisplayIds(this.primitive)[0]))}`;

		$.jqplot.config.enablePlugins = true;
		this.plot = $.jqplot(this.chartId, this.serieArray, {
			series: this.serieSettingsArray,
			title: `${scaleType} of ${targetPrimName}`,
			sortData: false,
			grid: {
				background: "transparent",
				shadow: false
			},
			seriesDefaults: {
				step: true,
				fill: true
			},
			axes: {
				xaxis: {
					tickOptions: {
						// alternative way of showing ticks, will be displayed as: <value≤
						// Tick placement can not be choosen with this method
						// axes.xaxis.ticks attribute must be removed for this
						// formatString: '<%5p≤'
					},
					label: "&nbsp;", // make sure there is space for below/above labels 
					pad: 0,
					ticks: tempTick
				},
				yaxis: {
					min: 0
				}
			},
			highlighter: {
				show: false
			}
		});

		let outsideLimitInfoID = [`${getID(this.primitive)}_histoBelow`, `${getID(this.primitive)}_histoAbove`];
		$(this.chartDiv).append(`
				<div id="${outsideLimitInfoID[0]}">
					${this.histogram.below_data.length} values &lt; ${Number(this.primitive.getAttribute("LowerBound")).toFixed(2)}
				</div>
		`);
		$(this.chartDiv).append(`
				<div id="${outsideLimitInfoID[1]}">
					${this.histogram.above_data.length} values &geq; ${Number(this.primitive.getAttribute("UpperBound")).toFixed(2)}
				</div>
		`);
		$(`#${outsideLimitInfoID[0]}`).css("left", "8px");
		$(`#${outsideLimitInfoID[1]}`).css("right", "8px");
		for (let i in outsideLimitInfoID) {
			$(`#${outsideLimitInfoID[i]}`).css("z-index", "9999");
			$(`#${outsideLimitInfoID[i]}`).css("position", "absolute");
			$(`#${outsideLimitInfoID[i]}`).css("padding", "4px 8px");
			$(`#${outsideLimitInfoID[i]}`).css("bottom", "0px");
			$(`#${outsideLimitInfoID[i]}`).css("background", "#f0f0f0");
			// $(`#${outsideLimitInfoID[i]}`).css("border", "1px solid gray");
			$(`#${outsideLimitInfoID[i]}`).css("font-size", "0.8em");
		}
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
				</li>
			</ul>`);
		}
		if (idsToDisplay.length > 1) {
			selected_str += warningHtml("<br/>Exactly one primitive must be selected", false);
		}
		this.chartDiv.innerHTML = (`
			<div class="empty-plot-header">Histogram Plot</div>
			${selected_str}
		`);
	}
}

