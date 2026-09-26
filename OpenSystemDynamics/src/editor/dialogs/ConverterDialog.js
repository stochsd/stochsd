class ConverterDialog extends jqDialog {
	constructor() {
		super();
		// [number,number][]
		this.currentValues = [];
		this.setHtml(`
			<div style="display: grid; grid-template-columns: auto auto; grid-gap: 1rem; max-height: 80vh;">
				<div class="primitive-settings" style="padding: 1rem 0;">
						<b>Name:</b><br/>
						<input class="name-field cm-primitive" style="width: 100%;" type="text" value=""><br/><br/>
						<div style="display: flex; justify-content: space-between; width: 100%; align-items: baseline;">
							<b>Definition:</b><span>${this.renderHelpButtonHtml("converter-help")}</span>
						</div>
						<textarea class="value-field" style="width: 300px; height: 200px;"></textarea>
						<p class="in-link" style="font-weight:bold; margin:5px 0px">Ingoing Link </p>
					</div>
					<div id="converter-plot-div" style="">
						<!-- Add plot here with code -->
					</div>
				</div>
			</div>
		`);

		this.setHelpButtonInfo("converter-help", "Converter Help", `<div style="max-width: 400px;">
			<p>The converter is a table look-up function that converts the values X<sub>i</sub> from the input (the linked-in primitive) to the output values Y<sub>i</sub> from the converter.</p>
			<p>
				<b>Definition:</b></br>
				&nbsp &nbsp <span style="font-family: monospace;" >
				${["1", "2", undefined, "n"].map(e => e ? `<span class="cm-x">X<sub>${e}</sub></span>,<span class="cm-y">Y<sub>${e}</sub></span>` : "...").join("; ")}
				</span>
				&nbsp &nbsp &nbsp (Often <span>X is time)
				</br>
				</br>
				<b>Example:</b></br>
				&nbsp &nbsp <span style="font-family: monospace;" >
				${[[0, 0], [1, 1], [2, 4], [3, 9]].map(e => `<span class="cm-x">${e[0]}</span>,<span class="cm-y">${e[1]}</span>`).join("; ")}
				</span>
			</p>
			<b>Key bindings:</b>
			<ul style="margin: 0.5em 0;">
				<li>${keyHtml("Esc")} &rarr; Cancels changes</li>
				<li>${keyHtml("Enter")} &rarr; Applies changes</li>
				<li>${keyHtml(["Shift", "Enter"])} &rarr; Adds new line</li>
				<li>${keyHtml(["Ctrl", "v"])} &rarr; Paste (you can paste two columns from spreadsheet program)</li>
			</ul>
			${noteHtml("Comments are not allowed in the converter.")}
		</div>
		`)

		this.inLinkParagraph = $(this.dialogContent).find(".in-link").get(0);
		this.valueField = $(this.dialogContent).find(".value-field").get(0);
		this.cmValueField = new CodeMirror.fromTextArea(this.valueField,
			{
				mode: "convertermode",
				theme: "stochsdtheme oneline",
				lineWrapping: true,
				lineNumbers: false,
				extraKeys: {
					"Esc": () => {
						this.dialogParameters.buttons["Cancel"]();
					},
					"Enter": () => {
						this.dialogParameters.buttons["Apply"]();
					},
					"Shift-Tab": () => {
						this.nameField.focus();
					}
				}
			}
		);
		this.cmValueField.setSize($(this.valueField).width(), $(this.valueField).height());
		// $(this.dialogContent).find(".CodeMirror").css("max-height", "50vh");
		// $(this.dialogContent).find(".CodeMirror").resizable({
		// 	resize: function() {
		// 		this.cmValueField.setSize(null, $(this).height());
		// 	}
		// });
		this.cmValueField.on("keyup", (cm) => {
			this.updateValues(cm.getValue())
			this.updatePlot()
		})
		this.cmValueField.on("inputRead", (cm, event) => {
			if (event.origin == "paste") {
				let columnWidth = 1
				/** @type {[string, string][]} */
				const data = event.text.map(row => row.split("\t"))
					.filter(row => {
						const isValidRow = row.length === 2 && this.isValidCellValue(row[0]) && this.isValidCellValue(row[1])
						if (isValidRow && columnWidth < row[0].length)
							columnWidth = row[0].length
						return isValidRow
					});
				if (data.length >= 1) {
					cm.setValue(data.map(d => `${d[0]},`.padEnd(columnWidth+2, " ")+d[1]).join(";\n"))
					this.updatePlot()
				}
			}
		})
		this.nameField = $(this.dialogContent).find(".name-field").get(0);
		$(this.nameField).keydown((event) => {
			if (event.key == "Enter") {
				this.applyChanges();
			}
		});
	}
	isValidCellValue(strValue) {
		return !(strValue.trim() === "" || isNaN(strValue))
	}
	open(id, defaultFocusSelector = null) {
		if (jqDialog.blockingDialogOpen) {
			// We can't open a new dialog while one is already open
			return;
		}
		this.primitive = findID(id);
		if (this.primitive == null) {
			alert("Primitive with id " + id + " does not exist");
			return;
		}
		this.show();
		let linkedIn = findLinkedInPrimitives(id);
		if (linkedIn.length === 1) {
			const prim = linkedIn[0]
			const name = getName(prim)
			const color = prim?.getAttribute("Color") ?? "black"
			this.inLinkParagraph.innerHTML = `Ingoing Link: <span style="color: ${color}; font-weight: bold;">[${name}]</span>`;
		} else if (linkedIn.length === 0) {
			this.inLinkParagraph.innerHTML = warningHtml("No Ingoing Link", false);
		} else {
			this.inLinkParagraph.innerHTML = warningHtml("More Then One Ingoing Link", false);
		}

		this.defaultFocusSelector = defaultFocusSelector;

		let oldValue = getValue(this.primitive);
		oldValue = oldValue.replace(/\\n/g, "\n");
		this.updateValues(oldValue)
		this.updatePlot()

		let oldName = getName(this.primitive);
		let oldNameBrackets = makePrimitiveName(oldName);
		const color = this.primitive.getAttribute("Color")
		this.setTitle(`<span style="${color ? `color: ${color};`: ""}">${oldNameBrackets}</span> properties`);

		$(this.nameField).val(oldNameBrackets);
		$(this.nameField).css("color", color);
		this.cmValueField.setValue(oldValue);

		if (this.defaultFocusSelector) {
			let valueFieldDom = $(this.dialogContent).find(this.defaultFocusSelector).get(0);
			valueFieldDom.focus();
		}
	}
	updateValues(str) {
		this.currentValues = str.split("#")[0].split(";").map(row => row.split(",").map(Number))
	}
	updatePlot() {
		$(this.dialogContent).find("#converter-plot-div").empty()
		if (!Preferences.get("showConverterPlotPreview")) return;
		let serieArray = [];
		for (let row of this.currentValues) {
			if (row[0] !== undefined && row[1] !== undefined)
				serieArray.push([Number(row[0]), Number(row[1])]);
		}
		$(this.dialogContent).find("#converter-plot-div").empty()
		if (serieArray.length < 2) {
			$(this.dialogContent).find("#converter-plot-div").html(`
				<div style="padding: 1rem 2rem;">
					<h1>Plot Preview</h1>
					<p style="font-size: 1rem;">Plot Preview will be shown here when at least two points are defined</p>
				</div>
			`);
		} else {
			// TODO: Add before and after series with dashed lines
			const start = serieArray[0][0]
			const end = serieArray.at(-1)[0]
			const xDist = end - start
			const beforeSeries = [
				[start - 0.3 * xDist, serieArray[0][1]],
				serieArray[0]
			]
			const afterSeries = [
				serieArray.at(-1),
				[end + 0.3 * xDist, serieArray.at(-1)[1]]
			]
			const color = this.primitive.getAttribute("Color")
			const beforeAfterSeries = {
				color: color,
				showLine: true,
				showMarker: false,
				linePattern: "dashed",
				shadow: false,
			}
			$.jqplot("converter-plot-div", [serieArray, beforeSeries, afterSeries], {
				series: [
					{
						color: color,
						showLine: true,
						showMarker: true,
						markerOptions: {
							size: 5,
							shadow: false,
							pointLabels: { show: false }
						}
					},
					beforeAfterSeries,
					beforeAfterSeries
				],
				grid: {
					background: "transparent",
					shadow: false
				},
				axesDefaults: {
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer
				},
				axes: {
					xaxis: {
						label: "Input",
						min: start - 0.2 * xDist,
						max: end + 0.2 * xDist,
					},
					yaxis: {
						label: "Output"
					}
				},
				highlighter: {
					show: true,
					sizeAdjust: 1.5
				},
			});
		}
	}
	afterShow() {
		let field = $(this.dialogContent).find(".name-field").get(0);
		let inputLength = field.value.length;
		field.setSelectionRange(0, inputLength);
	}
	makeApply() {
		if (this.primitive) {
			// Handle value
			let value = this.cmValueField.getValue();
			setValue2(this.primitive, value);

			// handle name
			let oldName = getName(this.primitive);
			let newName = stripBrackets($(this.dialogContent).find(".name-field").val());
			if (oldName != newName) {
				if (isNameFree(newName)) {
					setName(this.primitive, newName);
					changeReferencesToName(this.primitive.id, oldName, newName);
				} else {
					xAlert(`The name <b>${newName}</b> is already a taken name. \nName was not changed.`);
				}
			}
			// Update visual object to add/remove "?" icon 
			let visualObject = Visuals.getOnePointer(this.primitive.id);
			if (visualObject) {
				visualObject.update();
			}
		}
	}
}

