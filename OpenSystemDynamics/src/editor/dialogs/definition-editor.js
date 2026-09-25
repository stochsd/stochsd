const functions = [
	{ name: "PoFlow", arguments: [{ name: "Lambda" }], desc: "PoFlow(Lambda) is short for RandPoisson(DT()*Lambda)/DT(). <br/><span class='note'>This should only be used in flows.</span><br/><br/>PoFlow(Lambda) generates a Poisson distributed random number of transfered entities with the expected rate of Lambda entities per time unit." },
	{ name: "Rand", arguments: [{ name: "Minimum", default: "0" }, { name: "Maximum", default: "1" }] },
	{ name: "RandBernoulli", arguments: [{ name: "Probability", note: "min: 0, max: 1" }] },
	{ name: "RandBinomial", arguments: [{ name: "Count" }, { name: "Probability" }] },
	{ name: "RandNormal", arguments: [{ name: "Mean" }, { name: "Standard Deviation" }], desc: "Generates a normally distributed random number with a mean and a standard deviation. The mean and standard deviation are optional and default to 0 and 1 respectively." },
	{ name: "RandLognormal", arguments: [{ name: "Mean" }, { name: "Standard Deviation" }] },
	{ name: "RandNegativeBinomial", arguments: [{ name: "Successes" }, { name: "probability" }] },
	{ name: "RandTriangular", arguments: [{ name: "minimum" }, { name: "maximum" }, { name: "peak" }] },
	{ name: "RandGamma", arguments: [{ name: "Alpha" }, { name: "Beta" }] },
	{ name: "RandBeta", arguments: [{ name: "Alpha" }, { name: "Beta" }] },
	{ name: "RandExp", arguments: [{ name: "Beta" }] },
	{ name: "RandPoisson", arguments: [{ name: "Lambda" }] },
	{ name: "Pulse", arguments: [{ name: "Time" }, { name: "Volume", default: "0" }, { name: "Repeat", default: "1" }] },
	{ name: "Step", arguments: [{ name: "Start" }, { name: "Height", default: "1" }] },
	{ name: "Ramp", arguments: [{ name: "Start" }, { name: "Finish" }, { name: "Height", default: "1" }] },
	{ name: "Delay", arguments: [{ name: "primitive" }, { name: "delay" }, { name: "initial value" }] },
	{ name: "Delay1", arguments: [{ name: "Primitive" }, { name: "Delay" }, { name: "Initial Value" }] },
	{ name: "Delay3", arguments: [{ name: "Primitive" }, { name: "Delay" }, { name: "Initial Value" }] },
	{ name: "Smooth", synonyms: "delay", arguments: [{ name: "Primitive" }, { name: "Length" }, { name: "Initial Value" }] },
	{ name: "Round", arguments: [{ name: "Value" }] },
	{ name: "Ceiling", synonyms: "round", arguments: [{ name: "Value" }] },
	{ name: "Floor", synonyms: "round", arguments: [{ name: "Value" }] },
	{ name: "Sin", arguments: [{ name: "Angle Radians", suggestions: ["pi"] }] },
	{ name: "Cos", arguments: [{ name: "Angle Radians", suggestions: ["pi"] }] },
	{ name: "Tan", arguments: [{ name: "Angle Radians", suggestions: ["pi"] }] },
	{ name: "ArcSin", arguments: [{ name: "Value" }] },
	{ name: "ArcCos", arguments: [{ name: "Value" }] },
	{ name: "ArcTan", arguments: [{ name: "Value" }] },
	{ name: "Log", note: "base-10 logarithm", synonyms: "base-10 logarithm", arguments: [{ name: "Value", suggestions: ["10"] }] },
	{ name: "Ln", note: "natural logarithm", synonyms: "natural logarithm", arguments: [{ name: "Value", suggestions: ["e"] }] },
	{ name: "Exp", arguments: [{ name: "Value" }] },
	{ name: "Max", synonyms: "maximum", arguments: { name: "...Values" } },
	{ name: "Min", synonyms: "minimum", arguments: { name: "...Values" } },
	{ name: "Sqrt", note: "square root", synonyms: "square root", arguments: [{ name: "Value" }] },
	{ name: "Sign", arguments: [{ name: "value" }] },
	{ name: "Abs", note: "absolute value", synonyms: "absolute", arguments: [{ name: "Value" }] },
	{ name: "IfThenElse", arguments: [{ name: "Condition" }, { name: "Then Value", note: "value if true" }, { name: "Else Value", note: "value if false" }] },
	{ name: "StopIf", arguments: [{ name: "Condidtion" }] },
	{ name: "T", note: "Time", synonyms: "time" },
	{ name: "DT", note: "Step Time", synonyms: "step time" },
	{ name: "TS", note: "Start Time", synonyms: "start time" },
	{ name: "TL", note: "Time Length", synonyms: "time length" },
	{ name: "TE", note: "Time End", synonyms: "time end" },
	{ name: "PastMax", synonyms: "max", arguments: [{ name: "Primitive" }, { name: "Period", default: "all time" }] },
	{ name: "PastMin", synonyms: "min", arguments: [{ name: "Primitive" }, { name: "Period", default: "all time" }] },
	{ name: "PastMedian", synonyms: "median", arguments: [{ name: "Primitive" }, { name: "Period", default: "all time" }] },
	{ name: "PastMean", synonyms: "mean", arguments: [{ name: "Primitive" }, { name: "Period", default: "all time" }] },
	{ name: "PastStdDev", synonyms: "standard deviation", arguments: [{ name: "Primitive" }, { name: "Period", default: "all time" }], desc: "Returns the standard deviation of the values a primitive has taken on over the course of the simulation. The second optional argument is a time window to limit the calculation." },
	{ name: "PastCorrelation", arguments: [{ name: "Primitive1" }, { name: "Primitive2" }, { name: "Period", default: "all time" }], desc: "Returns the correlation between the values that two primitives have taken on over the course of the simulation. The third optional argument is an optional time window to limit the calculation." },
	{ name: "Fix", arguments: [{ name: "Value" }, { name: "Period", default: "-1" }], desc: "Takes the dynamic value and forces it to be fixed over the course of the period. If period is -1, the value is held constant over the course of the whole simulation." },
]

class FunctionHelper {
	static getHtml(cm) {
		let result = "<br/>"
		const func = FunctionHelper.updateFunctionHelp(cm)
		if (func) {
			func.note && (result = `<pre style="margin: 0;">${func.note}\n</pre>`)
			const args = func.arguments
				? (
					Array.isArray(func.arguments)
						? func.arguments.map((a, index) => {
							const argInfo = (a.note ? `Note: ${a.note}\n` : "") + (a.default ? `Default value: ${a.default}` : "")
							return func.argIndex == index
								? `<b style="position:relative; text-decoration:underline;" data-arg="${argInfo}">${a.name}</b>`
								: `${a.name}`
						}).join(", ")
						: `<b>${func.arguments.name}</b>`
				) : ""
			result += `<span class="example-code"><span class="cm-functioncall">${func.name}</span>(${args})</span>`
		}
		return result
	}
	static updateFunctionHelp(cm) {
		let func = undefined
		let cursor = cm.getCursor()
		let line = cm.getLine(cursor.line)
		const prevStr = line.substring(0, cursor.ch)
		const bracketStack = []
		let argIndex = 0
		for (let index = prevStr.length - 1; index >= 0; index--) {
			const current = prevStr[index]
			if (bracketStack.length == 0 && current == "(") {
				func = FunctionHelper.getFunctionData(prevStr, index)
				break;
			} else if (current == "," && bracketStack.length == 0)
				argIndex++
			else if (current == ")" || current == "]")
				bracketStack.push(current)
			else if (current == "(") {
				if (bracketStack[bracketStack.length - 1] == ")")
					bracketStack.pop()
				else
					break
			} else if (current == "[") {
				if (bracketStack[bracketStack.length - 1] == "]")
					bracketStack.pop()
				else
					break
			}
		}
		return func ? { ...func, argIndex } : undefined
	}
	static getFunctionData(str, lastIndex) {
		const match = str.substring(0, lastIndex).match(/\w+$/gi)
		return match && typeof match[0] == "string"
			? functions.find(f => f.name.toLowerCase() == match[0].toLowerCase())
			: undefined
	}
}

class Autocomplete {
	static getCompletions(cm, options, prim) {
		let cursor = cm.getCursor()
		let line = cm.getLine(cursor.line)
		let start = cursor.ch
		let end = cursor.ch
		while (start && /\w/.test(line.charAt(start - 1))) --start
		while (end < line.length && /\w/.test(line.charAt(end))) ++end
		const prevStr = line.substring(0, cursor.ch)
		return {
			list: [
				...this.getPrimitiveNames(line, cursor, prim),
				...((/\[\w*$/gi).test(prevStr) ? [] : this.getFunctions(line, cursor)),
			],
			from: { line: cursor.line, ch: start },
			to: { line: cursor.line, ch: end },
		}
	}
	/* row:string, cursor: Cursor */
	static getFunctions(line, cursor) {
		let start = cursor.ch
		let end = cursor.ch
		while (start && /\w/.test(line.charAt(start - 1))) --start
		while (end < line.length && /\w/.test(line.charAt(end))) ++end
		let word = line.substring(start, end)
		let suggestions = []
		functions.forEach(f => {
			const nameMatch = f.name.toLowerCase().startsWith(word.toLowerCase())
			const synonymMatch = f.synonyms ? f.synonyms.split(" ").some(n => n.toLowerCase().startsWith(word.toLowerCase())) : false
			if (nameMatch || synonymMatch) {
				suggestions.push({
					matchScore: nameMatch ? 2 : 1,
					className: "cm-functioncall",
					displayText: f.name,
					text: `${f.name}()`,
					note: f.note ? f.note : "",
					from: { line: 0, ch: start },
					to: { line: 0, ch: end },
					render: Autocomplete.render
				})
			}
		});
		return suggestions.sort((a, b) => b.matchScore - a.matchScore)
	}
	static getPrimitiveNames(line, cursor, prim) {
		let start = cursor.ch
		let end = cursor.ch
		while (start && /\w/.test(line.charAt(start - 1))) --start
		while (end < line.length && /\w/.test(line.charAt(end))) ++end
		let word = line.substring(start, end)
		if ((/\[/gi).test(line.charAt(start - 1))) --start;
		const linkedPrims = getLinkedPrimitives(prim)
		return linkedPrims.filter(prim => getName(prim).toLowerCase().startsWith(word.toLowerCase())).map(prim => {
			const name = getName(prim)
			return {
				className: "cm-primitive",
				displayText: `[${name}]`,
				text: `[${name}]`,
				note: "primitive",
				from: { line: 0, ch: start },
				to: { line: 0, ch: end },
				render: Autocomplete.render
			}
		})
	}
	static render(elem, self, cur) {
		elem.style.display = "flex"
		elem.style.width = "100%"
		elem.style.justifyContent = "space-between"
		elem.style.boxSizing = "border-box"
		let preview = document.createElement("span")
		cur.className && preview.classList.add(cur.className)
		preview.innerText = cur.displayText
		let note = document.createElement("i")
		note.innerText = cur.note ?? ""
		note.style.paddingLeft = "1em"
		note.style.fontWeight = "normal"
		note.style.color = "#888"
		elem.appendChild(preview)
		elem.appendChild(note)
	}
}

class DefinitionEditor extends jqDialog {
	/** @type {Primitive} */
	primitive;

	constructor() {
		super();
		this.accordionBuilt = false;
		this.setTitle("Equation Editor");
		this.primitive = null;

		// read more about display: table, http://www.mattboldt.com/kicking-ass-with-display-table/
		this.setHtml(`
			<div class="table">
  				<div class="table-row">
					<div class="table-cell" style="width: 30rem; height: 20rem;">
						<div class="primitive-settings" style="padding: 10px 20px 20px 0px">
							<b>Name:</b><br/>
							<input class="name-field enter-apply cm-primitive" style="width: 100%;" type="text" value=""><br/>
							<div class="name-warning-div"></div><br/>
							<div style="display: flex; justify-content: space-between; width: 100%; align-items: baseline;">
								<b>Definition:</b><span>${this.renderHelpButtonHtml("definition-help")}</span>
							</div>
							<textarea class="value-field enter-apply" cols="30" rows="30"></textarea>
							<div class="function-helper" style="width: 100%; margin: 0.4em 0.2em;" ></div>
							<div class="primitive-references-div" style="width: 100%; overflow-x: auto" ><!-- References goes here-->
							</div>
							<div class="restrict-to-non-negative-div">
								<br/>
								<label>
								<input class="restrict-to-non-negative-checkbox enter-apply" type="checkbox"/>
								Restrict to non-negative values</label>
								<div class="restrict-note-div"></div>
							</div>
						</div>
					</div>
					<div class="table-cell">
					<div style="width:240px;"></div> <!-- div here to show entire window on open since next div has position:absolute -->
    				<div style="position: absolute; top: 20px; bottom: 0px; overflow-y: scroll; width: 230px; padding: 10px 20px 20px 0px;">
						<div class="accordion-cluster">
						</div> <!--End of accordion-cluster. Programming help is inserted here-->
					</div>
  				</div>
			</div>
		`);

		let value_field = document.getElementsByClassName("value-field")[0];
		this.cmValueField = new CodeMirror.fromTextArea(value_field,
			{
				mode: "stochsd-dynamic-mode",
				theme: "stochsdtheme oneline",
				lineWrapping: false,
				lineNumbers: false,
				matchBrackets: true,
				extraKeys: {
					"Esc": () => {
						this.dialogParameters.buttons["Cancel"]();
					},
					"Enter": () => {
						this.dialogParameters.buttons["Apply"]();
					},
					"Shift-Tab": () => {
						this.nameField.focus();
					},
					"Ctrl-Space": "autocomplete"
				},
				hintOptions: {
					hint: (cm, options) => Autocomplete.getCompletions(cm, options, this.primitive)
				}
			}
		);

		this.cmValueField.on("cursorActivity", () => {
			const functionHelperDiv = $(this.dialogContent).find(".function-helper")
			if (Preferences.get("showFunctionHelper")) {
				functionHelperDiv.css("height", "5em");
				functionHelperDiv.html(FunctionHelper.getHtml(this.cmValueField))
			} else
				functionHelperDiv.css("height", "")
		});

		$(this.dialogContent).find(".name-field").keyup((event) => {
			let newName = stripBrackets($(event.target).val());
			let nameFree = isNameFree(newName, this.primitive.id);
			// valid according to insight maker
			let validName = validPrimitiveName(newName, this.primitive);
			// valid for tools StatRes etc.
			let validToolVarName = isValidToolName(newName);
			if (nameFree && validName && validToolVarName) {
				$(event.target).css("background-color", "white");
				$(this.dialogContent).find(".name-warning-div").html("");
			} else {
				$(event.target).css("background-color", "pink");
				if (!nameFree) {
					$(this.dialogContent).find(".name-warning-div").html(warningHtml(`Name <b>${newName}</b> is taken.`));
				} else if (newName === "") {
					$(this.dialogContent).find(".name-warning-div").html(warningHtml(`Name cannot be empty.`));
				} else if (!validToolVarName) {
					// not allowed by StatRes and Other tools 
					$(this.dialogContent).find(".name-warning-div").html(warningHtml(`
						Allowed characters are: <br/>
						<b>A-Z</b>, <b>a-z</b>, <b>_</b> (anywhere)
						<br/><b>0-9</b> (if not first character)
					`));
				} else if (!validName) {
					// not allowed according to insightmaker
					$(this.dialogContent).find(".name-warning-div").html(warningHtml(`Name cannot contain bracket, parenthesis, or quote`));
				}
			}
		});

		$(this.dialogContent).find(".enter-apply").keydown((event) => {
			if (!event.shiftKey) {
				if (event.key == "Enter") {
					event.preventDefault();
					this.applyChanges();
				}
			}
		});

		this.valueField = $(this.dialogContent).find(".value-field").get(0);
		this.nameField = $(this.dialogContent).find(".name-field").get(0);
		this.referenceDiv = $(this.dialogContent).find(".primitive-references-div").get(0);
		this.restrictNonNegativeCheckbox = $(this.dialogContent).find(".restrict-to-non-negative-checkbox").get(0);
		this.restrictNonNegativeDiv = $(this.dialogContent).find(".restrict-to-non-negative-div").get(0);
		this.restrictNote = $(this.dialogContent).find(".restrict-note-div").get(0);

		$(this.restrictNonNegativeCheckbox).click(() => {
			this.updateRestrictNoteText();
		});

		/** @param {import("./functionCategories").FunctionDetails[]} functionList */
		let functionListToHtml = function (functionList) {
			let filterFunctionTemplate = (functionTemplate) => {
				return functionTemplate.replace(/\$\$/g, "").replace(/##/g, "").replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/ /g, " ");
			};
			let result = "<ul>";
			let codeSnippetName = "";
			let codeTemplate = "";
			let codeHelp = "";
			for (let i = 0; i < functionList.length; i++) {
				const func = functionList[i];
				let example = "";
				if (func.example) {
					if (func.example.result) {
						example = `<br/><br/><b>Example</b><pre style="padding:0;margin:0;">${func.example.definition}</pre><br/><b>Returns:</b><br/> ${func.example.result}`;
					} else {
						example = `<br/><br/><b>Example</b><br/><pre style="padding:0;margin:0;">${func.example.definition}</pre>`;
					}
				}
				codeSnippetName = func.name;
				codeTemplate = `${filterFunctionTemplate(func.replacement)}`;
				let cmClassName = codeTemplate.includes("(") ? "cm-functioncall" : "";
				codeHelp = `${func.description} ${example}`;
				codeHelp = codeHelp.replace(/\'/g, "&#39;");
				codeHelp = codeHelp.replace(/\"/g, "&#34;");
				result += `<li class = "function-help click-function ${cmClassName}" data-template="${codeTemplate}" title="${codeHelp}">${codeSnippetName}</li>`;
			}
			result += "</ul>";
			return result;
		};

		for (let i = 0; i < functionCategories.length; i++) {
			$(".accordion-cluster").append(`<div>
				<h3 class="function-category">${functionCategories[i].name}</h3>
					<div>
					${functionListToHtml(functionCategories[i].functions)
				}
					</div>
				</div>`);
		}

		$(this.dialogContent).find(".click-function").click((event) => this.templateClick(event));

		/* Positioning 
			This is done to avoid blocking the button with the tooltip
			https://api.jqueryui.com/position/
		*/
		$(".accordion-cluster").tooltip({
			position: { my: "left+5 center", at: "right center" },
			classes: { "ui-tooltip": "tooltip" },
			content: function () {
				return $(this).prop('title');
			}
		});


		if (this.defaultFocusSelector) {
			let valueFieldDom = $(this.dialogContent).find(this.defaultFocusSelector).get(0);
			valueFieldDom.focus();
			let inputLength = valueFieldDom.value.length;
			valueFieldDom.setSelectionRange(0, inputLength);
		}

	}
	open(id, defaultFocusSelector = null) {
		$(this.dialogContent).find(".name-field").css("background-color", "white");
		$(this.dialogContent).find(".name-warning-div").html("");
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
		this.defaultFocusSelector = defaultFocusSelector;

		this.updateHelpText();

		const oldValue = getValue(this.primitive).replace(/\\n/g, "\n");
		const oldName = getName(this.primitive);
		const oldNameBrackets = makePrimitiveName(oldName);
		const color = this.primitive.getAttribute("Color")
		this.setTitle(`<span style="${color ? `color: ${color};`: ""}">${oldNameBrackets}</span> properties`);

		$(this.nameField).val(oldNameBrackets);
		$(this.nameField).css("color", color);
		this.cmValueField.setValue(oldValue);

		// Handle restrict to non-negative
		if (["Flow", "Stock"].indexOf(getType(this.primitive)) != -1) {
			// If element has restrict to non-negative
			$(this.restrictNonNegativeDiv).show();
			let restrictNonNegative = getNonNegative(this.primitive);
			$(this.restrictNonNegativeCheckbox).prop("checked", restrictNonNegative);
		} else {
			// Otherwise hide that option
			$(this.restrictNonNegativeDiv).hide();
		}
		this.updateRestrictNoteText();


		// Create reference list
		let referenceList = getLinkedPrimitives(this.primitive);

		// Sort reference list by name
		referenceList.sort(function (a, b) {
			let nameA = getName(a);
			let nameB = getName(b);
			if (nameA < nameB) return -1;
			if (nameA > nameB) return 1;
			return 0;
		})

		let referenceListToHtml = (referenceList) => {
			let result = "";
			for (let linked of referenceList) {
				const color = linked.getAttribute("Color");
				let name = "[" + getName(linked) + "]";
				result += `<span class = "linked-reference click-function cm-primitive ${color ? "cm-" + color : ""}" data-template="${name}">${name}</span>&nbsp;</br>`;
			}
			return result;
		}

		let referenceHTML = "";
		if (!(this.primitive.value.nodeName === "Variable" && this.primitive.getAttribute("isConstant") === "true")) {
			if (referenceList.length > 0) {
				referenceHTML = "<b>Linked primitives:</b><br/>" + referenceListToHtml(referenceList);
			} else {
				referenceHTML = "No linked primitives";
			}
		}
		$(this.referenceDiv).html(referenceHTML);

		$(this.referenceDiv).find(".click-function").click((event) => this.templateClick(event));

		// refresh in order to show cursor 
		this.cmValueField.refresh();

		if (this.defaultFocusSelector) {
			if (this.defaultFocusSelector === ".value-field") {
				this.cmValueField.focus();
				this.cmValueField.execCommand("selectAll");
			} else {
				let valueFieldDom = $(this.dialogContent).find(this.defaultFocusSelector).get(0);
				valueFieldDom.focus();
				let inputLength = valueFieldDom.value.length;
				valueFieldDom.setSelectionRange(0, inputLength);
			}
		}
	}
	updateHelpText() {
		let typeSpecificTexts = {
			"Stock": "The initial value of the stock is set in the definition. (The stock's value over time increases or decreases by inflows and outflows.)",
			"Flow": "The content in a stock will enter or leave through a flow at the rate determined by the definition.",
			"Variable": "The auxiliary will take on the value calculated from the definition. The value will be recalculated as the simulation progresses.",
			"Constant": "The parameter will take on the value calculated from the definition. The value will be recalculated as the simulation progresses."
		}
		this.setHelpButtonInfo("definition-help", "Definition Help",
			`<div style="max-width: 400px;">
			<p>${typeSpecificTexts[getTypeNew(this.primitive)]}</p>
			<b>Key bindings:</b>
			<ul style="margin: 0.5em 0; padding-left: 2em;">
				<li>${keyHtml("Esc")} &rarr; Cancel changes</li>
				<li>${keyHtml("Enter")} &rarr; Apply changes</li>
				<li>${keyHtml(["Shift", "Enter"])} &rarr; add new line</li>
				<li>
				${keyHtml(["Ctrl", "Space"])} &rarr; Show autocomplete definition
				<ul>
					<li>Navigate with suggestions with ${keyHtml("&uarr;")} and ${keyHtml("&darr;")}</li>
					<li>Select with ${keyHtml("Enter")}</li>
					<li>Close suggestions with ${keyHtml("Esc")}</li>
				</ul>
				<img src="./graphics/autocomplete.png" style="width: 100%;" />
				</li>
			</ul>
			<b>Tip:</b><br/>
			<p style="margin: 0.5em 0;"> With a "#" after the definition you may add a comment.
			</p>
		</div>`);
	}
	updateRestrictNoteText() {
		let checked = $(this.restrictNonNegativeCheckbox).prop("checked");
		if (checked) {
			$(this.restrictNote).html(noteHtml(`
				Restricting to non-negative values may have unintended consequences.<br/>
				Use only when you have a well motivated reason.
			`));
		} else {
			$(this.restrictNote).html("");
		}
	}
	templateClick(event) {
		let templateData = $(event.target).data("template");
		let start = this.cmValueField.getCursor("start");
		let end = this.cmValueField.getCursor("end");

		if (typeof templateData == "object") {
			templateData = "[" + templateData.toString() + "]";
		}
		this.cmValueField.replaceRange(templateData, start, end);
		this.cmValueField.focus();
	}
	beforeClose() {
		this.closeAccordion();
	}
	buildAccordion() {
		// Uses the trick of creating multiple accordions
		// So that they can be independetly opened and closed
		// http://stackoverflow.com/questions/3479447/jquery-ui-accordion-that-keeps-multiple-sections-open
		$(".accordion-cluster > div").accordion({
			heightStyle: "content",
			active: false,
			header: "h3",
			collapsible: true
		});
	}
	closeAccordion() {
		$(".accordion-cluster > div").accordion({
			active: false
		});
	}
	afterShow() {
		// Building the accordion must be done while the window is visible for accordions to work correctly
		// We therefor build it the first time the dialog is shown and store it in this.accordionBuilt
		if (!this.accordionBuilt) {
			this.buildAccordion();
			this.accordionBuilt = true;
		}
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
				if (isNameFree(newName) && validPrimitiveName(newName, this.primitive) && isValidToolName(newName)) {
					setName(this.primitive, newName);
					changeReferencesToName(this.primitive.id, oldName, newName);
				}
			}

			// Handle restrict to non-negative
			let restrictNonNegative = $(this.restrictNonNegativeCheckbox).prop("checked");
			setNonNegative(this.primitive, restrictNonNegative);

			let visualObject = object_array[this.primitive.id];
			if (visualObject) {
				visualObject.update();
			}
			visualObject = connection_array[this.primitive.id];
			if (visualObject) {
				visualObject.update();
			}
		}
	}
}
/** @param {string} htmlContent */
function printContentInNewWindow(htmlContent) {
	const printWindow = window.open('', '', 'height=1000,width=1000,screenX=50,screenY=50');
	printWindow.document.title = "Equation List";
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.type = "text/css";
	link.href = "editor.css";
	printWindow.document.head.appendChild(link);
	printWindow.document.body.innerHTML = htmlContent;

	setTimeout(() => {
		printWindow.print();
		printWindow.close();
	}, 400);
}

/** @param {HTMLElement[]} elementsToHide */
function hideAndPrint(elementsToHide) {
	for (let element of elementsToHide) {
		$(element).hide();
	}
	window.print();
	for (let element of elementsToHide) {
		$(element).show();
	}
}
