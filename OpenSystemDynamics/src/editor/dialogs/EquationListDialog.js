class EquationListDialog extends jqDialog {
	constructor() {
		super();
		this.setTitle("Equation List");
	}
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			"Cancel": () => {
				$(this.dialog).dialog('close');
			},
			"Print Equations": () => {
				let contentHTML = $(this.dialogContent).html();
				printContentInNewWindow(contentHTML);
			}
		};
	}
	renderSpecsInfoHtml() {
		/** Set filename */
		let fileName = fileManager.fileName;
		if (fileName) {
			const winSplit = fileName.split("\\");
			fileName = winSplit[winSplit.length - 1];
			const unixSplit = fileName.split("/");
			fileName = unixSplit[unixSplit.length - 1];
		} else {
			fileName = "Unnamed file";
		}

		/** Get Date */
		const date = new Date();
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");
		const fullDate = `${date.getFullYear().toString().substring(2, 4)}-${month}-${day} (yy-mm-dd)`;

		/** Find seed */
		let isSeedSet = false;
		let seed = "";
		const macro = getMacros();
		const index = macro.lastIndexOf("SetRandSeed");
		if (index !== -1) {
			isSeedSet = true;
			const c = macro.substring(index, macro.length);
			const regExp = /\(([^)]+)\)/;
			const matches = regExp.exec(c);
			seed = matches[1];
		}

		const specs = [
			["Time Unit", getTimeUnits()],
			["Start", getTimeStart()],
			["Length", getTimeLength()],
			["DT", getTimeStep()],
			["Method", getAlgorithm() === "RK1" ? "Euler" : "RK4"]
		];
		if (isSeedSet) {
			specs.push(["Seed", seed]);
		}

		return (`
			<h3 class="equation-list-header">${fileName}</h3>${fullDate}</br>
			<h3 class="equation-list-header	">Specifications</h3>
			<table class="modern-table zebra">
				${specs.map(spec =>
			`<tr>
						<td>${spec[0]}</td>
						<td>${spec[1]}</td>
					</tr>`).join("")
			}
			</table>
		`);
	}
	renderPrimitiveListHtml(info) {
		return (`
		<h3 class="equation-list-header">${info.title}</h3>
		<table class="modern-table zebra">
			<tr>${info.tableColumns.map(col => (`<th>${col.header}</th>`)).join('')}</tr>
				${info.primitives.map(p => `<tr>
					${info.tableColumns.map(col => `<td style="${col.style ? col.style : ""}"">
						${col.cellFunc(p)}
					</td>`).join('')}
			</tr>`).join('')}
		</table>
		`);
	}
	beforeShow() {
		const Stocks = primitives("Stock");
		let stockHtml = "";
		if (Stocks.length > 0) {
			stockHtml = this.renderPrimitiveListHtml({
				title: "Stocks",
				primitives: Stocks,
				tableColumns: [
					{ header: "Name", cellFunc: (prim) => { return makePrimitiveName(getName(prim)); } },
					{ header: "Init. Value", cellFunc: getValue, style: "font-family: monospace;" },
					{
						header: "Recalculated as",
						cellFunc: (prim) => {
							const flows = primitives("Flow");
							const input = flows.filter(f => f.target).filter(f => f.target.id == getID(prim));
							const output = flows.filter(f => f.source).filter(f => f.source.id == getID(prim));
							const inputStr = input.map(f => ` +Δt*${makePrimitiveName(getName(f))}`).join("");
							const outputStr = output.map(f => ` -Δt*${makePrimitiveName(getName(f))}`).join("");
							return makePrimitiveName(getName(prim)) + inputStr + outputStr;
						}
					},
					{
						header: "Restricted",
						cellFunc: (prim) => prim.getAttribute("NonNegative") === "true" ? `${getName(prim)} ≥ 0` : "",
						style: "text-align: center;"
					},
				]
			});
		}

		const Flows = primitives("Flow");
		let flowHtml = "";
		if (Flows.length > 0) {
			flowHtml = this.renderPrimitiveListHtml({
				title: "Flows",
				primitives: Flows,
				tableColumns: [
					{ header: "Name", cellFunc: (prim) => { return makePrimitiveName(getName(prim)); } },
					{ header: "Rate", cellFunc: getValue, style: "font-family: monospace;" },
					{
						header: "Restricted",
						cellFunc: (prim) => prim.getAttribute("OnlyPositive") === "true" ? `${getName(prim)} ≥ 0` : "",
						style: "text-align: center;"
					},
				]
			});
		}

		const Variables = primitives("Variable");
		let variableHtml = "";
		if (Variables.length > 0) {
			variableHtml = this.renderPrimitiveListHtml({
				title: "Auxiliaries & Parameters",
				primitives: Variables,
				tableColumns: [
					{ header: "Name", cellFunc: (prim) => { return makePrimitiveName(getName(prim)); } },
					{ header: "Value", cellFunc: getValue, style: "font-family: monospace;" }
				]
			});
		}

		const Converters = primitives("Converter");
		let converterHtml = "";
		if (Converters.length > 0) {
			converterHtml = this.renderPrimitiveListHtml({
				title: "Converter",
				primitives: Converters,
				tableColumns: [
					{ header: "Name", cellFunc: (prim) => { return makePrimitiveName(getName(prim)); } },
					{ header: "Data", cellFunc: getValue, style: "font-family: monospace; max-width: 400px; word-break: break-word;" },
					{ header: "Ingoing Link", cellFunc: (prim) => { return findLinkedInPrimitives(prim.id).length !== 0 ? getName(findLinkedInPrimitives(prim.id)[0]) : "None"; } }
				]
			});
		}
		const numberOfPrimitives = Stocks.length + Flows.length + Variables.length + Converters.length;

		if (numberOfPrimitives == 0) {
			this.setHtml("This model is empty. Build a model to show equation list");
			return;
		}

		const htmlOut = `
			<h1>Equation List</h1>
			<div style="display:flex;">
				<div>
					${this.renderSpecsInfoHtml()}
				</div>
				<div style="padding-left: 32px; ">
					${stockHtml}
					${flowHtml}
					${variableHtml}
					${converterHtml}
					<br/>Total of ${numberOfPrimitives} primitives
				</div>
			</div>
		`;

		this.setHtml(htmlOut);
	}
}

