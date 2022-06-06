
class Plot1 {
	parent
	constructor(parent) {
		this.connect(parent)
		this.series = []
		this.settings = []
		this.options = {}
	}
	connect(parent) {
		this.parent = parent
	}
	clear() {
		$(parent).empty()
	}
	/**
	 * @param {string} title 
	 * @param {string | string[]} description 
	 * @param {string | string[]} warning 
	 */
	setEmpty(title, description, warning) {
		const titleHtml = `<div class="empty-plot-header">${title}</div>`
		const descHtml = Array.isArray(description)
			? `<ul>${description.map(d => `<li>${d}</li>`).join(",")}</ul>`
			: description
		const warnHtml = Array.isArray(warning)
			? `<ul class="warning">${warning.map(d => `<li>${d}</li>`).join(",")}</ul>`
			: `<span class="warning">${warning}</span>`
		$(parent).html(titleHtml + descHtml + warnHtml)
	}
	/**
	 * @param {[number, number][][]} series 
	 * @param {boolean} numbered
	 */
	setSeries(series, numbered = true) {
		this.series = series.map((s, si) => {
			const plotPerIdx = Math.floor(this.data.results.length / 4);
			return s.map((point) => {
				let showNumHere = i % plotPerIdx === Math.floor((plotPerIdx / 2 + (plotPerIdx * lineCount) / 8) % plotPerIdx);
				return [point[0], point[1], showNumHere && numbered ? si + 1 : null]
			})
		})
	}
	/**
	 * 
	 * @param {{
	 * 	label: string, 
	 * 	lineWidth?: number, 
	 * 	side?: "L" | "R", 
	 * 	linePattern?: number[], 
	 * 	color: string,
	 * 	pointLabels?: {
	 * 		show?: boolean
	 * 	}
	 * }[]} settings 
	 */
	setSeriesSettings(settings) {
		this.settings = settings.map(s => ({
			showLabel: true,
			lineWidth: s.lineWidth ?? 2,
			label: s.label ?? "Untitled",
			yaxis: s.side === "R" ? "y2axis" : "yaxis",
			linePattern: s.linePattern,
			color: s.color,
			shadow: false,
			showMarker: false,
			markerOptions: { size: 5 },
			pointLabels: {
				show: s.pointLabels.show,
				edgeTolerance: 0,
				ypadding: 0,
				location: "n"
			}
		}))
	}
	/**
	 * @param {{
	 * 	title?: string, 
	 * 	axes?: {
	 * 		xaxis?: {
	 * 			label?: string
	 * 			min?: number
	 * 			max?: number
	 * 			renderer?: "linear" | "log"
	 * 		},
	 * 	yaxis?: {
	 * 			label?: string
	 * 			min?: number
	 *			max?: number
	 *			renderer?: "linear" | "log"
	 * 		},
	 * 	y2axis?: {
	 * 			label?: string
	 *			renderer?: "linear" | "log"
	 * 		},
	 * 	}
	 * 	highlighter?: {
	 * 		show?: boolean,
	 * 		format?: {name: string, format: string}[]
	 * 	},
	 * 	showLegend?: boolean
	 * }} option
	 */
	setOptions(option) {
		this.setOptions = {
			title: option.title,
			grid: {
				background: "transparent",
				shadow: false
			},
			axes: {
				xaxis: {
					renderer: option?.axes.xaxis.renderer == "log"
						? $.jqplot.LinearAxisRenderer
						: $.jqplot.LogAxisRenderer,
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					label: option?.axes?.xaxis?.label,
					min: option.min,
					max: option.max,
					// ticks: tickList
				},
				yaxis: {
					renderer: option?.axes?.yaxis?.renderer == "log"
						? $.jqplot.LinearAxisRenderer
						: $.jqplot.LogAxisRenderer,
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					label: option?.axes?.yaxis?.label,
					min: option?.axes?.yaxis?.min,
					max: option?.axes?.yaxis?.max
				},
				y2axis: {
					renderer: option?.axes.y2axis.renderer == "log"
						? $.jqplot.LinearAxisRenderer
						: $.jqplot.LogAxisRenderer,
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					label: option?.axes.y2axis.label,
					min: option?.axes.y2axis.min,
					max: option?.axes.y2axis.max,
					tickOptions: {
						showGridline: false
					}
				},
				highlighter: {
					show: option.highlighter.show,
					sizeAdjust: 1.5,
					tooltipAxes: "xy",
					fadeTooltip: false,
					tooltipLocation: "ne",
					formatString: `<table class="jqplot-highlighter" style="color: black;">
						${option.highlighter?.format?.map(f => (
						`<tr><td>${f.name}</td><td> = </td><td>${f.format}</td></tr>`
					))}
					</table>`,
					useAxesFormatters: false
				},
				...(option.showLegend
					? {
						legend: {
							show: true,
							placement: 'outsideGrid'
						}
					}
					: undefined)
			},
		}
	}
}


class LinePlot {
	constructor(parentId) {
		this.connect(parentId)
		this.lines = [] // {points: [], settings: {...}}[]
		this.options = {}
	}
	connect(parentId) {
		this.parentId = parentId
		this.parent = $(`#${parentId}`)
	}
	clear() {
		$(this.parent).empty()
	}
	/**
	 * @param {string} title 
	 * @param {string | string[]} description 
	 * @param {string | string[]} warning 
	 */
	setEmpty(title, description, warning) {
		const titleHtml = `<div class="empty-plot-header">${title}</div>`
		const descHtml = Array.isArray(description)
			? `<ul>${description.map(d => `<li>${d}</li>`).join(",")}</ul>`
			: description
		const warnHtml = !warning 
			? ""
			: Array.isArray(warning)
			? `<ul class="warning">${warning.map(d => `<li>${d}</li>`).join(",")}</ul>`
			: `<span class="warning">${warning}</span>`
		$(parent).html(titleHtml + descHtml + warnHtml)
	}
	/**
	 * Add numbered lines to datapoints
	 * @param {[number, number][]} points 
	 * @returns {[number, number, null | number][]}
	 */
	#addNumberLinesToPoints(points) {
		const plotPerIdx = Math.floor(points.length / 4);
		const lineIndex = this.lines.length
		return points.map((point) => {
			let showNumHere = i % plotPerIdx === Math.floor((plotPerIdx / 2 + (plotPerIdx * lineIndex) / 8) % plotPerIdx);
			return [point[0], point[1], showNumHere && numbered ? lineIndex + 1 : null]
		})
	}
	/**
	 * 
	 * @param {[number, number][] | [number, number, number][]} points 
	 * @param {{
	 * 	label?: string, 
	 * 	showLabel?: boolean
	 * 	lineWidth?: number, 
	 * 	side?: "L" | "R", 
	 * 	linePattern?: number[], 
	 * 	color?: string,
	 * 	pointLabels?: {
	 * 		show?: boolean
	 * 	}} settings 
	 * @param {boolean} numberedLines 
	 */
	addLine(points, settings, numberedLines = false) {
		const _points = numberedLines ? this.#addNumberLinesToPoints(points) : points
		this.lines.push({
			points: _points,
			settings: {
				shadow: false,
				showMarker: false,
				markerOptions: { size: 5 },
				showLabel: settings.showLabel,
				lineWidth: settings.lineWidth ?? 2,
				label: (settings.pointLabels?.show ? `${this.lines.length+1}. ` : "") + settings.label ?? "Untitled",
				yaxis: settings.side === "R" ? "y2axis" : "yaxis",
				linePattern: settings.linePattern,
				color: settings.color,
				pointLabels: {
					show: settings.pointLabels?.show,
					edgeTolerance: 0,
					ypadding: 0,
					location: "n"
				}
			}
		})
	}
	clearLines() {
		this.lines = []
	}
	/**
 * @param {{
	 * 	title?: string, 
	 * 	axes?: {
	 * 		xaxis?: {
	 * 			label?: string
	 * 			min?: number
	 * 			max?: number
	 * 			renderer?: "linear" | "log"
	 * 		},
	 * 	yaxis?: {
	 * 			label?: string
	 * 			min?: number
	 *			max?: number
	 *			renderer?: "linear" | "log"
	 * 		},
	 * 	y2axis?: {
	 * 			label?: string
	 *			renderer?: "linear" | "log"
	 * 		},
	 * 	}
	 * 	highlighter?: {
	 * 		show?: boolean,
	 * 		display?: {name: string, format: string}[]
	 * 	},
	 * 	showLegend?: boolean
	 * }} option
	 */
	setOptions(option) {
		this.options = {
			title: option.title,
			grid: {
				background: "transparent",
				shadow: false
			},
			axes: {
				xaxis: {
					renderer: option?.axes.xaxis.renderer == "log"
						? $.jqplot.LogAxisRenderer
						: $.jqplot.LinearAxisRenderer,
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					label: option?.axes?.xaxis?.label,
					min: option.min,
					max: option.max,
					// ticks: tickList
				},
				yaxis: {
					renderer: option?.axes?.yaxis?.renderer == "log"
						? $.jqplot.LogAxisRenderer
						: $.jqplot.LinearAxisRenderer,
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					label: option?.axes?.yaxis?.label,
					min: option?.axes?.yaxis?.min,
					max: option?.axes?.yaxis?.max
				},
				y2axis: {
					renderer: option?.axes?.y2axis?.renderer == "log"
						? $.jqplot.LogAxisRenderer
						: $.jqplot.LinearAxisRenderer,
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					label: option?.axes?.y2axis?.label,
					min: option?.axes?.y2axis?.min,
					max: option?.axes?.y2axis?.max,
					tickOptions: {
						showGridline: false
					}
				},
			},
			highlighter: {
				show: option.highlighter.show,
				sizeAdjust: 1.5,
				tooltipAxes: "xy",
				fadeTooltip: false,
				tooltipLocation: "ne",
				formatString: `<table class="jqplot-highlighter" style="color: black;">
						${option.highlighter?.display?.map(d => (
					`<tr><td>${d.name}</td><td> = </td><td>${d.format}</td></tr>`
				))}
				</table>`,
				useAxesFormatters: false
			},
			...(option.showLegend
				? {
					legend: {
						show: true,
						placement: 'outsideGrid'
					}
				}
				: undefined)
		}
	}
	/**
	 * @returns {JqPlot}
	 */
	draw() {
		this.clear()
		return $.jqplot(
			this.parentId,
			this.lines.map(l => l.points),
			{
				...this.options,
				series: this.lines.map(l => l.settings)
			}
		)
	}
}