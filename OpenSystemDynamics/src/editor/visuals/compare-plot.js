// Hold data for ComparePlots 
class DataGenerations {
	constructor() {
		this.reset();
	}
	reset() {
		this.numGenerations = 0;
		this.numLines = 0;
		this.idGen = [];
		this.labelSuffixId = "";
		this.labelGen = [];
		this.isRandom = [];
		this.primitiveTypeGen = [];
		this.nameGen = [];
		this.colorGen = [];
		this.patternGen = [];
		this.lineWidthGen = [];
		this.resultGen = [];
	}
	setLabel(genIndex, id, label) {
		const index = this.idGen[genIndex] ? this.idGen[genIndex].indexOf(id) : -1
		if (index != -1) {
			this.labelGen[genIndex][index] = label
		}
	}
	removeSim(genIndex, id) {
		const index = this.idGen[genIndex].indexOf(id)
		if (index != -1) {
			this.idGen[genIndex].splice(index, 1)
			this.labelGen[genIndex].splice(index, 1)
			this.nameGen[genIndex].splice(index, 1)
			this.isRandom[genIndex].splice(index, 1)
			this.primitiveTypeGen[genIndex].splice(index, 1)
			this.colorGen[genIndex].splice(index, 1)
			this.patternGen[genIndex].splice(index, 1)
			this.lineWidthGen[genIndex].splice(index, 1)
			this.resultGen[genIndex].map(r => r.splice(index + 1, 1))
			this.numLines--;
		}
		if (this.idGen[genIndex].length == 0) {
			this.numGenerations--;
			this.idGen.splice(genIndex, 1);
			this.labelGen.splice(genIndex, 1)
			this.nameGen.splice(genIndex, 1)
			this.isRandom.splice(genIndex, 1)
			this.primitiveTypeGen.splice(genIndex, 1)
			this.colorGen.splice(genIndex, 1)
			this.patternGen.splice(genIndex, 1)
			this.lineWidthGen.splice(genIndex, 1)
			this.resultGen.splice(genIndex, 1)
		}
	}
	append(ids, results, lineOptions) {
		if (!RunResults.simulationDone || results.length == 0) return;
		this.resultGen.push(results);
		this.numGenerations++;
		this.numLines += ids.length;
		this.idGen.push(ids);
		let suffixPrim = findID(this.labelSuffixId)
		let suffix = suffixPrim ? `, ${getName(suffixPrim)} = ${getValue(suffixPrim)}` : ""
		this.labelGen.push(ids.map(findID).map(p => getName(p) + suffix));
		this.isRandom.push(ids.map(findID).map(p => hasRandomFunction(getValue(p))));
		this.nameGen.push(ids.map(findID).map(getName));
		this.primitiveTypeGen.push(ids.map(id => getTypeNew(findID(id))));
		this.colorGen.push(ids.map(findID).map(
			node => node.getAttribute('Color') ? node.getAttribute('Color') : defaultStroke
		));
		let types = ids.map(findID).map(node => get_object(node.id).type);
		this.patternGen.push(
			types.map(type => lineOptions[type]["pattern"])
		);
		this.lineWidthGen.push(
			types.map(type => lineOptions[type]["width"])
		);
	}
	setCurrent(ids, results, lineOptions) {
		// Remove last
		if (this.idGen.length !== 0) {
			let removedIds = this.idGen.pop();
			let numRemoved = removedIds.length;
			this.numLines -= numRemoved;
			this.numGenerations--;
			this.labelGen.pop();
			this.nameGen.pop();
			this.primitiveTypeGen.pop();
			this.isRandom.pop();
			this.colorGen.pop();
			this.patternGen.pop();
			this.lineWidthGen.pop();
			this.resultGen.pop();
		}

		// Add new 
		this.append(ids, results, lineOptions);
	}
	iterator() {
		let genIndex = 0;
		let index = -1;
		let iter = {
			next: () => {
				index++;
				let result;
				if (this.idGen[genIndex] && index == this.idGen[genIndex].length) {
					genIndex++;
					index = 0;
				}
				if (genIndex < this.idGen.length && index < this.idGen[genIndex].length) {
					result = {
						value: {
							genIndex,
							index,
							id: this.idGen[genIndex][index],
							name: this.nameGen[genIndex][index],
							label: this.labelGen[genIndex][index],
							isRandom: this.isRandom[genIndex][index],
							type: this.primitiveTypeGen[genIndex][index],
							color: this.colorGen[genIndex][index],
							patern: this.patternGen[genIndex][index],
							lineWidth: this.lineWidthGen[genIndex][index],
						},
						done: false
					}
				} else {
					result = { done: true }
				}
				return result;
			},
		}
		return iter;
	}
	forEach(fn) {
		const it = this.iterator();
		let counter = 0;
		let sim = it.next();
		while (!sim.done) {
			fn(sim.value, counter)
			sim = it.next();
			counter++;
		}
	}
	/**
 	* @param {(
	*   value: {
	*     genIndex: number;
	*     index: number;
	*     id: string;
	*     name: string;
	*     label: string;
	*     isRandom: boolean;
	*     type: any;
	*     color: string;
	*     patern: any;
	*     lineWidth: any;
	*   }, 
	*   index: number
	* ) => any} fn
	*/
	map(fn) {
		const list = []
		let counter = 0;
		const it = this.iterator();
		let sim = it.next();
		while (!sim.done) {
			list.push(fn(sim.value, counter))
			sim = it.next();
			counter++;
		}
		return list
	}
	getSeriesArray(wantedIds, hasNumberedLines) {
		let seriesArray = [];
		let lineCount = 0;
		// Loop generations 
		for (let i = 0; i < this.idGen.length; i++) {
			let currentIds = this.idGen[i];
			// Loop through one generation (each simulation run)
			for (let j = 0; j < currentIds.length; j++) {
				let id = currentIds[j];
				if (wantedIds.includes(id)) {
					let tmpArr = [];
					lineCount++;
					let plotPerIdx = Math.floor(this.resultGen[i].length / 4);
					// loop through simulation run (each value)
					for (let k = 0; k < this.resultGen[i].length; k++) {
						let row = this.resultGen[i][k];
						let time = Number(row[0]);
						let value = Number(row[j + 1]);
						let showNumHere = (k % plotPerIdx) === Math.floor((plotPerIdx / 2 + (plotPerIdx * lineCount) / 8) % plotPerIdx);
						tmpArr.push([time, value, showNumHere && hasNumberedLines ? Math.floor(lineCount).toString() : null]);
					}
					seriesArray.push(tmpArr);
				}
			}
		}
		return seriesArray;
	}
	getSeriesSettingsArray(wantedIds, hasNumberedLines, colorFromPrimitive) {
		let seriesSettingsArray = [];
		let countLine = 0;
		// Loop generations 
		for (let i = 0; i < this.idGen.length; i++) {
			let currentIds = this.idGen[i];
			for (let j = 0; j < currentIds.length; j++) {
				let id = currentIds[j];
				if (wantedIds.includes(id)) {
					countLine++;
					seriesSettingsArray.push({
						showLabel: true,
						lineWidth: this.lineWidthGen[i][j], // change according to lineOptions here 
						label: `${(hasNumberedLines ? `${countLine}. ` : "")}${this.labelGen[i][j]}`,
						linePattern: this.patternGen[i][j],
						color: (colorFromPrimitive ? this.colorGen[i][j] : undefined),
						shadow: false,
						showMarker: false,
						markerOptions: { size: 5 },
						pointLabels: {
							show: true,
							edgeTolerance: 0,
							ypadding: 0,
							location: "n"
						}
					});
				}
			}
		}
		return seriesSettingsArray;
	}
}

class ComparePlotVisual extends PlotVisual {
	/** @type {DataGenerations} */
	gens;
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.runHandler = () => {
			this.fetchData();
			this.render();
		}
		RunResults.subscribeRun(id, this.runHandler);
		this.plot = null;
		this.serieArray = null;
		this.gens = new DataGenerations();

		this.dialog = new ComparePlotDialog(id);
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
	clearGenerations() {
		this.gens.reset();
	}
	fetchData() {
		this.fetchedIds = getDisplayIds(this.primitive);

		let auto_plot_per = JSON.parse(this.primitive.getAttribute("AutoPlotPer"));
		let plot_per = Number(this.primitive.getAttribute("PlotPer"));
		if (auto_plot_per && plot_per !== this.dialog.getDefaultPlotPeriod()) {
			plot_per = this.dialog.getDefaultPlotPeriod();
			this.primitive.setAttribute("PlotPer", plot_per);
		}
		let results = RunResults.getFilteredSelectiveIdResults(this.fetchedIds, getTimeStart(), getTimeLength(), plot_per);
		let line_options = JSON.parse(this.primitive.getAttribute("LineOptions"));
		// add generation 
		this.gens.append(getDisplayIds(this.primitive), results, line_options);
	}
	render() {

		let idsToDisplay = getDisplayIds(this.primitive);
		this.primitive.setAttribute("Primitives", idsToDisplay.join(","));

		if (this.gens.numGenerations == 0) {
			this.setEmptyPlot();
			return;
		}

		// Declare series and settings for series
		this.serieSettingsArray = [];
		this.serieArray = [];

		let hasNumberedLines = this.primitive.getAttribute("HasNumberedLines") === "true";

		// Make time series
		this.serieArray = this.gens.getSeriesArray(idsToDisplay, hasNumberedLines);

		do_global_log("serieArray " + JSON.stringify(this.serieArray));

		// Make serie settings
		this.serieSettingsArray = this.gens.getSeriesSettingsArray(
			idsToDisplay,
			hasNumberedLines,
			this.primitive.getAttribute("ColorFromPrimitive") === "true"
		);

		do_global_log(JSON.stringify(this.serieSettingsArray));

		// We need to ad a delay and respond to events first to make this work in firefox
		setTimeout(() => this.updateChart(), 200);
	}
	updateChart() {
		// Dont update chart if primitive has been deleted
		// This check needs to be here since updateChart is updated with a timeout 
		if (!(this.id in connection_array)) return;

		if (this.serieArray == null || this.serieArray.length == 0 || this.serieArray[0].length === 0) {
			// The series are not initialized yet
			this.setEmptyPlot();
			return;
		}
		$(this.chartDiv).empty();
		let axisLimits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		let min = Number(axisLimits.timeaxis.auto ? getTimeStart() : axisLimits.timeaxis.min);
		let max = Number(axisLimits.timeaxis.auto ? getTimeStart() + getTimeLength() : axisLimits.timeaxis.max);
		let tickList = this.getTicks(min, max);

		this.plot = $.jqplot(this.chartId, this.serieArray, {
			title: this.primitive.getAttribute("TitleLabel"),
			series: this.serieSettingsArray,
			grid: {
				background: "transparent",
				shadow: false
			},
			axes: {
				xaxis: {
					label: "Time",
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					min: min,
					max: max,
					ticks: tickList,
				},
				yaxis: {
					renderer: (this.primitive.getAttribute("YLogScale") === "true") ? $.jqplot.LogAxisRenderer : $.jqplot.LinearAxisRenderer,
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					label: this.primitive.getAttribute("LeftAxisLabel"),
					min: axisLimits.yaxis.auto ? undefined : axisLimits.yaxis.min,
					max: axisLimits.yaxis.auto ? undefined : axisLimits.yaxis.max
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
		if (!isNaN(this.plot.axes.yaxis.min) && !isNaN(this.plot.axes.yaxis.max)) {
			axisLimits.yaxis.min = this.plot.axes.yaxis.min;
			axisLimits.yaxis.max = this.plot.axes.yaxis.max;
			this.primitive.setAttribute("AxisLimits", JSON.stringify(axisLimits));
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
			</ul>`);
		}
		this.chartDiv.innerHTML = (`
			<div class="empty-plot-header">Compare Simulations Plot</div>
			${selected_str}
		`);
	}
}

