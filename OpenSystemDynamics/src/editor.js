/*

This file may distributed and/or modified under the
terms of the Affero General Public License (http://www.gnu.org/licenses/agpl-3.0.html).

*/
// Dialog window handlers 
/** @type {DefinitionEditor} */
var definitionEditor;
/** @type {ConverterDialog} */
var converterDialog;
/** @type {PreferencesDialog} */
var preferencesDialog;
/** @type {SimulationSettings} */
var simulationSettings;
/** @type {TimeUnitDialog} */
var timeUnitDialog;
/** @type {MacroDialog} */
var macroDialog;
/** @type {EquationListDialog} */
var equationList;
/** @type {DebugDialog} */
var debugDialog;
/** @type {AboutDialog} */
var aboutDialog;
/** @type {FullPotentialCSSDialog} */
var fullPotentialCssDialog;
/** @type {ThirdPartyLicensesDialog} */
var thirdPartyLicensesDialog;
/** @type {LicenseDialog} */
var licenseDialog;


// This values are not used by StochSD, as primitives cannot be resized in StochSD
// They are only used for exporting the model to Insight Maker
const type_size = {
	"stock": [80, 60],
	"variable": [60, 60],
	"converter": [80, 60],
	"text": [120, 60]
}

// Name type translations
// the keys are what the visuals have as type
// The values what new names should be based on when creating new visuals 
const type_basename = {
	timeplot: "TimePlot",
	compareplot: "ComparePlot",
	xyplot: "XyPlot",
	histoplot: "HistoPlot",
	table: "Table",
	rectangle: "Rectangle",
	ellipse: "Ellipse",
	line: "Line",
	numberbox: "Numberbox",
	text: "Text",
	stock: "Stock",
	variable: "Auxiliary",
	flow: "Flow",
	link: "Link",
	converter: "Converter",
	text: "Text",
	constant: "Parameter"
};

// Stores Visual objects and connections
/** @type {{ [id: string]: TwoPointer }} */
var connection_array = {};
/** @type {{ [id: string]: OnePointer }} */
var object_array = {};

// Stores state related to mouse
var last_click_object_clicked = false;
var last_clicked_element = null; // Points to the object we last clicked
var leftmouseisdown = false;
var mousedown_x = 0;
var mousedown_y = 0;
var lastMouseX = 0;
var lastMouseY = 0;
var empty_click_down = false;

// Stores log for the global log
var global_log = "";


// default svg values 
var defaultFill = "transparent";
var defaultStroke = "black";


function applicationReload() {
	environment.reloadingStarted = true;
	location.reload();
}

function preserveRestart() {
	History.toLocalStorage();
	localStorage.setItem("fileName", fileManager.fileName);
	localStorage.setItem("reloadPending", "1");
	applicationReload();
}

function restoreAfterRestart() {
	do_global_log("restoring");
	let reloadPending = localStorage.getItem("reloadPending");

	if (reloadPending == null) {
		// No reload is pending
		do_global_log("nothing pending to restore");

		// Clean up file manager - file handle
		fileManager.clean();

		if (Preferences.get("promptTimeUnitDialogOnStart") && isTimeUnitOk(getTimeUnits()) === false) {
			// if creating new file without OK timeUnit => promt TimeUnitDialog
			// prompt TimeUnitDialog is unit not set 
			timeUnitDialog.show();
		}
		return;
	}
	fileManager.init();
	do_global_log("removing pending flag");
	// Else remove the pending reload
	localStorage.removeItem("reloadPending");

	fileManager.fileName = localStorage.getItem("fileName");
	fileManager.updateTitle();

	do_global_log("restore the file");
	fileManager.fileName = localStorage.getItem("fileName");

	// Read the history from localStorage
	History.fromLocalStorage();

	if (Preferences.get("promptTimeUnitDialogOnStart") && isTimeUnitOk(getTimeUnits()) === false) {
		// if opening new file without OK timeUnit => promt TimeUnitDialog
		// prompt TimeUnitDialog is unit not set 
		timeUnitDialog.show();
	}
}

class History {
	static #undoStates = []
	static get undoStates() {
		return this.#undoStates
	}
	static set undoStates(value) {
		this.#undoStates = value
		this.#updateUndoRedoButtons()
	}
	static #undoIndex = -1
	static get undoIndex() {
		return this.#undoIndex
	}
	static set undoIndex(value) {
		this.#undoIndex = value
		this.#updateUndoRedoButtons()
	}
	static #updateUndoRedoButtons() {
		$("#btn_undo").prop("disabled", this.undoStates.length == 0 || this.undoIndex == 0)
		$("#btn_redo").prop("disabled", this.undoStates.length == 0 || this.undoIndex == this.undoStates.length - 1)
	}

	static init() {
		// We define this.undoIndex as pointing to the currently active undoState
		// If we are at the first step with no undo-states behind it is -1
		this.undoStates = [];
		this.undoIndex = -1;
		this.lastUndoState = "";
		this.undoLimit = 10;

		// Tells if the last state is saved to file
		// This is used for determining if the program should ask about saving
		History.unsavedChanges = false;

	}

	static storeUndoState() {
		// Create new XML for state
		let InsightMakerDocumentWriter = new InsightMakerDocument();
		InsightMakerDocumentWriter.appendPrimitives();
		let undoState = InsightMakerDocumentWriter.getXmlString();

		// Add to undo history if it is different then previous state
		if (this.lastUndoState != undoState) {
			// Preserves only states from 0 to undoIndex
			this.undoStates.splice(this.undoIndex + 1);

			this.undoStates.push(undoState);
			this.undoIndex = this.undoStates.length - 1;
			this.lastUndoState = undoState;
			this.unsavedChanges = true;

			if (this.undoLimit < this.undoStates.length) {
				this.undoStates = this.undoStates.slice(this.undoStates.length - this.undoLimit);
				this.undoIndex = this.undoStates.length - 1;
			}
		}
	}

	static forceCustomUndoState(newState) {
		this.undoStates = [];
		this.undoStates.push(newState);
		this.undoIndex = 0;
		this.lastUndoState = newState;
		this.unsavedChanges = false;
	}

	static doUndo() {
		if (this.undoIndex > 0) {
			this.undoIndex--;
			this.restoreUndoState();
		} else {
			xAlert("No more undo");
		}
	}

	static doRedo() {
		if (this.undoIndex < this.undoStates.length - 1) {
			this.undoIndex++;
			this.restoreUndoState();
		} else {
			xAlert("No more redo");
		}
	}

	static getCurrentState() {
		return this.undoStates[this.undoIndex];
	}

	static debug() {
		console.error("undo index " + this.undoIndex);
		console.error("history length " + this.undoStates.length);
		console.error(this.undoStates);
	}

	static restoreUndoState() {
		this.lastUndoState = this.undoStates[this.undoIndex];
		loadModelFromXml(this.lastUndoState);
	}

	static clearUndoHistory() {
		this.undoStates = [];
		this.undoIndex = -1;
	}

	static toLocalStorage() {
		localStorage.setItem("undoState_length", this.undoStates.length);

		for (let i in this.undoStates) {
			let state = this.undoStates[i];
			localStorage.setItem("undoState_" + i, state);
		}

		localStorage.setItem("undoIndex", this.undoIndex);
	}

	static fromLocalStorage() {
		this.clearUndoHistory();
		let undoState_length = localStorage.getItem("undoState_length");
		for (let i = 0; i < undoState_length; i++) {
			let state = localStorage.getItem("undoState_" + i);
			this.undoStates.push(state);
		}
		this.undoIndex = localStorage.getItem("undoIndex");
		this.restoreUndoState();
	}
}
History.init();

function loadModelFromXml(XmlString) {
	clearModel();
	stochsd_clear_sync();
	loadXML(XmlString);
	replaceDiagamsWithTimePlots();
	syncAllVisuals();
}

function showPluginMenu() {
	$(".pluginMenu").show();
}

function sendToParentFrame(returnobj, target) {
	results = {};
	results.target = target;
	results.returnobj = returnobj;
	parent.postMessage(JSON.stringify(results), "*");
}

function loadPlugin(pluginName) {
	sendToParentFrame({ "app_name": pluginName }, "load_app");
}

function setParentTitle(newTitle) {
	sendToParentFrame({ "title": newTitle }, "update_title");
}

function quitQuestion() {
	// How close event works
	// https://github.com/nwjs/nw.js/wiki/window
	saveChangedAlert(function () {
		environment.closeWindow()
	});
}

// NOTE: values for event.which should be used
// event.button will give incorrect results 
const mouse = { "left": 1, "middle": 2, "right": 3 };

class InfoBar {
	static init() {
		let infoDef = $(".info-bar__definition")[0];
		this.cmInfoDef = new CodeMirror(infoDef,
			{
				mode: "stochsd-dynamic-mode",
				theme: "stochsdtheme oneline",
				readOnly: "nocursor",
				lineWrapping: false
			}
		);
		this.infoRestricted = $(".info-bar__definition-restricted");
		this.infoDE = $(".info-bar__definition-error");
		$(infoDef).find(".CodeMirror").css("border", "none");
	}
	static setRestricted(isRestricted, primName) {
		// this.infoRestricted.html(isRestricted ? `<b>(${primName} ≥ 0)<b>` : "" );
		this.infoRestricted.html(isRestricted ? `(Restricted)` : "");
	}
	static update() {
		let selected_hash = get_selected_root_objects();
		let selected_array = [];
		for (let key in selected_hash) {
			selected_array.push(selected_hash[key]);
		}

		if (selected_array == 0) {
			this.cmInfoDef.setValue("Nothing selected");
			this.infoDE.html("");
			this.setRestricted(false);
		} else if (selected_array.length == 1) {
			let selected = selected_array[0];
			let primitive = selected_array[0].primitive;
			if (selected.is_ghost) {
				primitive = findID(primitive.getAttribute("Source"));
			}
			let name = primitive.getAttribute("name");
			let definition = getValue(primitive);
			this.infoDE.html(`<span class="warning">${DefinitionError.getMessage(primitive)}</span>`);

			let isRestricted = primitive.getAttribute("NonNegative") === "true" || primitive.getAttribute("OnlyPositive") === "true";
			this.setRestricted(isRestricted, name);

			let definitionLines = definition.split("\n");
			if (definitionLines[0] !== "") {
				this.cmInfoDef.setValue(`[${name}] = ${definitionLines[0]}`);
			} else {
				let type = selected.type;

				// Make first letter uppercase
				// let Type = type.charAt(0).toUpperCase() + type.slice(1); 
				let Type = type_basename[type];
				switch (type) {
					case ("numberbox"):
						let targetName = `${getName(findID(selected.primitive.getAttribute("Target")))}`
						this.cmInfoDef.setValue(`Numberbox: Value of [${targetName}]`);
						break;
					case ("timeplot"):
					case ("compareplot"):
					case ("table"):
					case ("xyplot"):
					case ("histoplot"):
						let names = selected.dialog.displayIdList.map(findID).filter(exist => exist).map(getName);
						this.cmInfoDef.setValue(`${Type}: ${names.map(name => ` [${name}]`)}`);
						break;
					case ("link"):
						let source = selected.getStartAttach() ? `[${getName(selected.getStartAttach().primitive)}]` : "NONE";
						let target = selected.getEndAttach() ? `[${getName(selected.getEndAttach().primitive)}]` : "NONE";
						this.cmInfoDef.setValue(`Link: ${source} -> ${target}`);
						break;
					default:
						this.cmInfoDef.setValue(`${Type} selected`);
				}
			}
		} else {
			this.cmInfoDef.setValue(`${selected_array.length} objects selected`);
			this.infoDE.html("");
			this.setRestricted(false);
		}
	}
}

defaultAttributeChangeHandler = function (primitive, attributeName, value) {
	let id = getID(primitive);
	let type = getType(primitive);
	let visualObject = get_object(id);
	if (visualObject) {
		visualObject.attributeChangeHandler(attributeName, value);
	}

	switch (attributeName) {
		case "name":
			set_name(id, value);
			break;
	}
	//~ do_global_log("tjohej "+type+" "+attributeName);
	if (type == "Numberbox" && attributeName == "Target") {
		let visualObject = get_object(id);
		// render() can only be done when the numberbox is fully loaded
		// Therefor we have to check that visualObject is not null
		if (visualObject) {
			visualObject.render();
		}
	}
}

defaultPositionChangeHandler = function (primitive) {
	let newPosition = getCenterPosition(primitive)
	let visualObject = object_array[getID(primitive)];
	if (visualObject) {
		visualObject.setPos(newPosition);
	}
}

defaultPrimitiveCreatedHandler = function (primitive) {
	syncVisual(primitive);
}

defaultPrimitiveBeforeDestroyHandler = function (primitive) {
	stochsd_delete_primitive_and_references(getID(primitive));
}

var sdsMacros = `### Imported Macros from StochSD ###
T() <- Unitless(Time())
DT() <- Unitless(TimeStep())
TS() <- Unitless(TimeStart())
TL() <- Unitless(TimeLength())
TE() <- Unitless(TimeEnd())
PoFlow(Lambda) <- RandPoisson(Dt()*Lambda)/DT()
PulseFcn(Start, Volume, Repeat) <- Pulse(Start, Volume/DT(), 0, Repeat) 
### End of StochSD Macros ###
### Put your own macro code below ###`;

// Add the StocSD macro-script to the beggning of the Macro
function appendStochSDMacros() {
	let macros = getMacros();
	if (macros === undefined) {
		macros = "";
	}
	if (macros.substring(0, sdsMacros.length) != sdsMacros) {
		macros = sdsMacros + "\n\n\n" + macros;
		setMacros(macros);
	}
}

// Replace macro with the StochSD macro-script
function setStochSDMacros() {
	let macros = sdsMacros + "\n\n\n";
	setMacros(macros);
}

let showMacros = function () {
	macroDialog.show();
};

function getLinkedPrimitives(primitive) {
	let result = [];
	let allLinks = primitives("Link");
	for (let link of allLinks) {
		if (link.target == primitive) {
			if (link.source != null) {
				result.push(link.source);
			}
		}
	}
	return result;
}

// External API support
window.addEventListener('message', callAPI, false);
function callAPI(e) {
	try {
		e.source.postMessage(eval(e.data), "*");
	} catch (err) {

	}
}

// sdsLoadFunctions is and must be called from Functions.js
function sdsLoadFunctions() {
	defineFunction("T", { params: [] }, function (x) {
		return new Material(simulate.time().toNum().value);
	});
	defineFunction("DT", { params: [] }, function (x) {
		return new Material(simulate.timeStep.toNum().value);
	});
	defineFunction("TS", { params: [] }, function (x) {
		return new Material(simulate.timeStart.toNum().value);
	});
	defineFunction("TL", { params: [] }, function (x) {
		return new Material(simulate.timeLength.toNum().value);
	});
	defineFunction("TE", { params: [] }, function (x) {
		return new Material(simulate.timeEnd.toNum().value);
	});
	defineFunction("PoFlow", { params: [{ name: "Rate", noUnits: true, noVector: true }] }, function (x) {
		let dt = simulate.timeStep.toNum().value;

		return new Material(RandPoisson(dt * x[0].toNum().value) / dt);
	});

}

function getVisibleNeighborhoodIds(id) {
	let neighbors = neighborhood(findID(id));
	let visibleNeighbors = neighbors.filter((neighbor) => { return (!neighbor.linkHidden) });
	return visibleNeighbors.map((neighbor) => { return neighbor.item.getAttribute("id"); });
}

function makePrimitiveName(primitiveName) {
	return "[" + primitiveName + "]";
}

function stripBrackets(primitiveName) {
	let cutFrom = primitiveName.lastIndexOf("[") + 1;
	let cutTo = primitiveName.indexOf("]");
	if (cutFrom == -1) {
		cutFrom = 0;
	}
	if (cutTo == -1) {
		cutTo = primitiveName.length;
	}
	return primitiveName.slice(cutFrom, cutTo);
}

function formatFunction(functionName) {
	return functionName + "()";
}

function warningHtml(message, specNotOk = false) {
	let noChanges = "";
	if (specNotOk) noChanges = "<br/><b>Your specification is not accepted!</b>";
	return (`<span class="warning">${message} ${noChanges}</span>`);
}

function noteHtml(message) {
	return (`<span class="note">Note:<br/>${message}</span>`);
}

// Param keys is array of string or a string 
function keyHtml(keys) {
	return Array.isArray(keys)
		? keys.map(key => `<kbd>${key}</kbd>`).join("+")
		: `<kbd>${keys}</kbd>`
}

function checkedHtml(value) {
	if (value) {
		return ' checked ';
	} else {
		return ' ';
	}
};

class EditorControll {
	static showEditor(primitive, annotations) {
		let primitiveId = getID(primitive);
		get_object(primitiveId).doubleClick();
	}
}

// But where the lines can be as long as required to print the variable
function stocsd_format(number, tdecimals, roundToZeroAt) {
	// tdecimals is optional and sets the number of decimals. It is rarly used (only in some tables)
	// Since the numbers automaticly goes to e-format when low enought

	// Used when e.g. the actuall error is reseted to null
	if (number == null) {
		return "";
	}

	// since its not written as E-format by default even as its <1E-7
	// Zero is a special case also or Round to zero when close 
	if (number == 0 || (roundToZeroAt && Math.abs(number) < roundToZeroAt)) {
		return "0";
	}

	// Check if number is to small to be viewed in field
	// If so, force e-format

	if (Math.abs(number) < Math.pow(10, (-tdecimals))) {
		return number.toExponential(2);
	}
	//Check if the number is to big to be view ed in the field
	if (Math.abs(number) > Math.pow(10, tdecimals)) {
		return number.toExponential(2);
	}

	// Else format it as a regular number, and remove ending zeros
	let stringified = number.toFixed(tdecimals);

	// Find the length of stringified, where the ending zeros have been removed
	let i = stringified.length;
	while (stringified.charAt(i - 1) == '0') {
		i = i - 1;
		// If we find a dot. Stop removing decimals
		if (stringified.charAt(i - 1) == '.') {
			i = i - 1;
			break;
		}
	}
	// Creates a stripped string without ending zeros
	let stripped = stringified.substring(0, i);
	return stripped;
}

function get_parent_id(id) {
	let parent_id = id.toString().split(".")[0];
	//~ do_global_log("x flowa "+parent_id);
	return parent_id;
}

function get_parent(child) {
	return get_object(get_parent_id(child.id));
}

// Get a list of all children for a parent
function getChildren(parentId) {
	let result = {}
	for (let key in object_array) {
		if (get_parent_id(key) == parentId && key != parentId) {
			result[key] = object_array[key];
		}
	}
	for (let key in connection_array) {
		if (get_parent_id(key) == parentId && key != parentId) {
			result[key] = connection_array[key];
		}
	}
	return result;
}

// Return true if parent has any selected children
function hasSelectedChildren(parentId) {
	// Make sure we actually work on parent element
	parentId = get_parent_id(parentId);

	// Find the children
	let children = getChildren(parentId);
	for (let id in children) {
		if (children[id].isSelected()) {
			return true;
		}
	}
	return false;
}
/**
 * 
 * @param {*} id
 * @param {"value" | "field"} field 
 */
function openPrimitiveDialog(id, field = "value") {
	let primitive = findID(id)
	if (getType(primitive) == "Ghost") {
		// If we click on a ghost change id to point to source
		id = findID(id).getAttribute("Source");
		primitive = findID(id)
	}
	primitiveType = getType(primitive)
	if (primitiveType == "Converter") {
		converterDialog.open(id, `.${field}-field`);
	} else {
		definitionEditor.open(id, `.${field}-field`);
	}
}

class BaseObject {
		/**
	 * @param {string} id 
	 * @param {string} type 
	 * @param {[number, number]} pos 
	 */
	constructor(id, type, pos) {
		this.id = id;
		this.type = type;
		this.selected = false;
		this.name_radius = 30;
		this.superClass = "baseobject";
		this.color = defaultStroke;
		// Warning: this.primitive can be null, since all DIM objects does not have a IM object such as anchors and flow_auxiliarys
		// We should therefor check if this.primitive is null, in case we dont know which class we are dealing with
		this.primitive = findID(this.id);

		this.element_array = [];
		this.selector_array = [];
		this.icons; 	// SVG.group with icons such as ghost and questionmark
		this.group = null;

		this.namePosList = [[0, this.name_radius + 8], [this.name_radius, 0], [0, -this.name_radius], [-this.name_radius, 0]];
	}

	setColor(color) {
		this.color = color;
		for (let element of this.element_array) {
			if (element.getAttribute("class") == "element") {
				element.setAttribute("stroke", this.color);
			} else if (element.getAttribute("class") == "name_element") {
				element.setAttribute("fill", this.color);
			} else if (element.getAttribute("class") == "highlight") {
				element.setAttribute("fill", this.color);
			}
		}
		// AnchorPoint has no primitive
		this.primitive?.setAttribute("Color", this.color);
	}

	updateDefinitionError() {
		let definitionErrorTypes = ["stock", "variable", "constant", "flow", "converter"];
		if (definitionErrorTypes.includes(this.type)) {
			DefinitionError.check(this.primitive);
			DefinitionError.has(this.primitive);
		}
	}

	getBoundRect() {
		// Override this function
		// This functions returns a hash map, e.i. {"minX": 10, "maxX": 20, "minY": 40, "maxY": 50}
		// The hashmap dictates in what rect mouse can click to create connections
	}

	getLinkMountPos(closeToPoint) {
		return this.getPos();
	}

	isSelected() {
		return this.selected;
	}

	clean() {
		// Clean all children
		let children = getChildren(this.id);
		for (let id in children) {
			children[id].clean();
			delete object_array[id];
		}

		this.clearImage();
	}
	clearImage() {
		// Do the cleaning
		for (let i in this.selector_array) {
			this.selector_array[i].remove();
		}
		for (let key in this.element_array) {
			this.element_array[key].remove();
		}
		if (!this.group)
			console.log(this.id, this.name, this.type);
		this.group.remove();
	}
	doubleClick() {
		// This function has to be overriden
	}
	afterNameChange() {
		// Do nothing. this method is supposed to be overriden by subclasses
	}
	afterMove(diff_x, diff_y) {
		// Override this		
	}
	attachEvent() {
		// This happens every time a connection is connected or disconnected
		// Or when the connections starting point is connected or disconnected
		// Override this
	}
	get name_pos() {
		return this._name_pos;
	}

	set name_pos(value) {
		//~ alert("name pos for "+this.id+" "+getStackTrace());
		//~ do_global_log("updating name pos to "+value);
		this._name_pos = Number(value);
		if (this.primitive) {
			this.primitive.setAttribute("RotateName", value.toString());
		}
	}
	getType() {
		return this.type;
	}
	nameDoubleClick() {

		if (this.is_ghost) {
			errorPopUp("You must rename a ghost by renaming the original.");
			return;
		}
		let id = get_parent_id(this.id)
		definitionEditor.open(id, ".name-field");
		event.stopPropagation();
	}

	setName(new_name) {
		if (this.name_element == null) {
			do_global_log("Element has no name");
			return;
		}
		this.name_element.innerHTML = new_name;
	}

	attributeChangeHandler(attributeName, value) {
		// Override this
	}
}

class OnePointer extends BaseObject {
		/**
	 * @param {string} id 
	 * @param {string} type 
	 * @param {[number, number]} pos 
	 */
	constructor(id, type, pos, extras = false) {
		super(id, type, pos);
		// Add object to global 
		object_array[id] = this;
		this.id = id;
		this.type = type;
		this.element_array = [];
		this.selector_array = [];
		this.group = null;
		this.superClass = "OnePointer";
		this.draggable = true; // Default value, change it afterwords if you want
		this.name_centered = false;
		this.pos = pos;
		this.is_ghost = false; // Default value
		if (extras != false) {
			do_global_log("has extras");
			if ("is_ghost" in extras) {
				this.is_ghost = extras["is_ghost"];
			}
		}
		do_global_log("is ghost " + this.is_ghost);

		this.loadImage();

		this.select();

		// Handled for when attribute changes in corresponding SimpleNode
		this.changeAttributeHandler = (attribute, value) => {
			if (attribute == "name") {
				this.setName(value);
			}
		}
	}

	getBoundRect() {
		let [x, y] = this.getPos();
		return { "minX": x - 10, "maxX": x + 10, "minY": y - 10, "maxY": y + 10 };
	}

	setPos(pos) {
		if (pos[0] == this.pos[0] && pos[1] == this.pos[1]) {
			// If the position has not changed we should not update it
			// This turned out to be a huge optimisation
			return;
		}
		// Recreating the array is intentional to avoid copying a reference
		//~ alert(" old pos "+this.pos[0]+","+this.pos[1]+" new pos "+pos[0]+","+pos[1]);
		this.pos = [pos[0], pos[1]];
	}

	/** @returns {[number, number]} */
	getPos() {
		// This must be done by splitting up the array and joining it again to avoid sending a reference
		// Earlier we had a bug that was caused by getPos was sent as reference and we got unwanted updates of the values
		return [this.pos[0], this.pos[1]];
	}


	loadImage() {
		let element_array = this.getImage();
		if (element_array == false) {
			alert("getImage() must be overriden to add graphics to this object");
		}

		this.element_array = element_array;

		for (let key in element_array) {
			if (element_array[key].getAttribute("class") == "highlight") {
				this.selector_array.push(element_array[key]);
			}
		}

		for (let key in element_array) {
			if (element_array[key].getAttribute("class") == "icons") {
				this.icons = this.element_array[key]
				break;
			}
		}

		if (this.is_ghost && this.icons) {
			this.icons.set("ghost", "visible");
		}


		// Set name element
		this.name_element = null;
		for (let key in element_array) {
			if (element_array[key].getAttribute("class") == "name_element") {
				this.name_element = element_array[key];
				$(this.name_element).dblclick((event) => {
					this.nameDoubleClick();
				});
			}
		}
		this.group = SVG.append(this.getLayer(), SVG.group(this.element_array));
		if (!this.group)
			console.log("group", this.id, this.primitive, this.name, this.type, this.getLayer() ,this.group);
		this.group.setAttribute("node_id", this.id);

		this.update();

		for (let key in this.element_array) {
			let element = this.element_array[key];
			$(element).on("mousedown", (event) => {
				primitive_mousedown(this.id, event);
			});
		}
		$(this.group).dblclick((event) => {
			if (!$(event.target).hasClass("name_element")) {
				this.doubleClick(this.id);
			}
		});
	}
	getLayer() {
		return false;
	}

	select() {
		this.selected = true;
		for (let i in this.selector_array) {
			this.selector_array[i].setAttribute("visibility", "visible");
		}
		if (this.icons) {
			this.icons.setColor("white");
		}
	}
	unselect() {
		this.selected = false;
		for (let i in this.selector_array) {
			this.selector_array[i].setAttribute("visibility", "hidden");
		}
		if (this.icons) {
			this.icons.setColor(this.color);
		}
	}
	update() {
		this.group.setAttribute("transform", "translate(" + this.pos[0] + "," + this.pos[1] + ")");

		let prim = this.is_ghost ? findID(this.primitive.getAttribute("Source")) : this.primitive;
		if (this.icons && prim) {
			const hasDefError = DefinitionError.has(prim);
			this.icons.set("questionmark", hasDefError ? "visible" : "hidden");
			this.icons.set("dice", (!hasDefError && hasRandomFunction(getValue(prim))) ? "visible" : "hidden");
		}

		if (!this.is_ghost) {
			this.updateGhosts();
		}
	}
	updateGhosts() {
		let ghostIds = findGhostsOfID(this.id);
		ghostIds.map(gId => {
			if (object_array[gId]) {
				object_array[gId].update();
			}
		});
	}
	updatePosition() {
		this.update();
	}
	getImage() {
		return false;
	}
}

class BasePrimitive extends OnePointer {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
	}
	doubleClick() {
		openPrimitiveDialog(get_parent_id(this.id));
	}
}

/** @typedef {"invalid" | "start" | "end" | "bezier1" | "bezier2" | "orthoMiddle"} AnchorType */
class AnchorPoint extends OnePointer {
	/**
	 * @param {string} id 
	 * @param {string} type 
	 * @param {[number, number]} pos 
	 * @param {AnchorType} anchorType 
	 */
	constructor(id, type, pos, anchorType) {
		super(id, type, pos);
		this.anchorType = anchorType;
		this.isSquare = false;
	}
	isAttached() {
		let parent = get_parent(this);
		if (!parent.getStartAttach) {
			return;
		}
		switch (this.anchorType) {
			case "start":
				return !!parent.getStartAttach();
			case "end":
				return !!parent.getEndAttach()
			default:
				// It's not a start or end anchor so it cannot be attached
				return false;
		}
	}
	setAnchorType(anchorType) {
		this.anchorType = anchorType;
	}
	getAnchorType() {
		return this.anchorType;
	}
	setVisible(newVisible) {
		if (newVisible) {
			for (let element of this.element_array) {
				// Show all elements except for selectors
				if (element.getAttribute("class") != "highlight") {
					element.setAttribute("visibility", "visible");
				}
			}
		}
		else {
			// Hide elements
			for (let element of this.element_array) {
				element.setAttribute("visibility", "hidden");
			}
		}
	}
	updatePosition() {
		this.update();
		let parent = get_parent(this);
		if (parent.start_anchor && parent.end_anchor) {
			parent.syncAnchorToPrimitive(this.anchorType);
		}
	}
	getImage() {
		if (this.isSquare) {
			return [
				SVG.rect(-4, -4, 8, 8, this.color, "white", "element"),
				SVG.rect(-4, -4, 8, 8, "none", this.color, "highlight")
			];
		} else {
			return [
				SVG.circle(0, 0, 5, this.color, "white", "element"),
				SVG.circle(0, 0, 5, "none", this.color, "highlight")
			];
		}

	}
	getLayer() {
		return SVG.anchorLayer;
	}
	makeSquare() {
		this.isSquare = true;
		this.reloadImage();
	}
	reloadImage() {
		this.clearImage();
		this.loadImage();
	}
	afterMove(diff_x, diff_y) {
		// This is an attempt to make bezier points move with the anchors points but id does not work well with undo
		// commented out until fixed
		let parentId = get_parent_id(this.id);
		let parent = get_object(parentId);

		if (parent.type == "link") {
			switch (this.anchorType) {
				case "start":
					{
						const [x, y] = parent.b1_anchor.getPos();
						parent.b1_anchor.setPos([x + diff_x, y + diff_y]);
					}
					break;
				case "end":
					{
						const [x, y] = parent.b2_anchor.getPos();
						parent.b2_anchor.setPos([x + diff_x, y + diff_y]);
					}
					break;
			}
		}
	}
}

class OrthoAnchorPoint extends AnchorPoint {
	constructor(id, type, pos, anchorType, index) {
		super(id, type, pos, anchorType);
		this.changed = true;
		this.index = index;
	}
}

function safeDivision(nominator, denominator) {
	// Make sure division by Zero does not happen 
	return denominator == 0 ? 9999999 : (nominator / denominator);
}

function sign(value) {
	return (value < 0) ? -1 : 1;
}

class StockVisual extends BasePrimitive {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
		this.updateDefinitionError();
		this.namePosList = [[0, 32], [27, 5], [0, -24], [-27, 5]];
	}

	getSize() {
		return [50, 38];
	}

	getBoundRect() {
		let pos = this.getPos()
		let size = this.getSize();
		return {
			"minX": pos[0] - size[0] / 2,
			"maxX": pos[0] + size[0] / 2,
			"minY": pos[1] - size[1] / 2,
			"maxY": pos[1] + size[1] / 2
		};
	}

	setPos(pos) {
		let diff = translate(neg(this.pos), pos);
		super.setPos(pos);
		let startConn = find_start_connections(this);
		for (let conn of startConn) {
			if (conn.type === "flow" && conn.isSelected() === false) {
				let oldConnPos = conn.start_anchor.getPos();
				let newConnPos = translate(oldConnPos, diff);
				conn.requestNewAnchorPos(newConnPos, conn.start_anchor.id);
			}
		}
		let endConn = find_end_connections(this);
		for (let conn of endConn) {
			if (conn.type === "flow" && conn.isSelected() === false) {
				let oldAnchorPos = conn.end_anchor.getPos();
				let newAnchorPos = translate(oldAnchorPos, diff);
				conn.requestNewAnchorPos(newAnchorPos, conn.end_anchor.id);
			}
		}
	}

	// Used for FlowVisual
	getFlowMountPos([xTarget, yTarget]) {
		const [xCenter, yCenter] = this.getPos();
		const [width, height] = this.getSize();
		const boxSlope = safeDivision(height, width);
		const targetSlope = safeDivision(yTarget - yCenter, xTarget - xCenter);
		let xEdge;
		let yEdge;
		if (isInLimits(-boxSlope, targetSlope, boxSlope)) { // Left or right of box
			xEdge = sign(xTarget - xCenter) * width / 2 + xCenter;
			if (isInLimits(yCenter - height / 2, yTarget, yCenter + height / 2)) { // if within box y-limits
				yEdge = yTarget;
			} else {
				yEdge = yCenter + sign(yTarget - yCenter) * height / 2
			}
		} else { // above or below box
			if (isInLimits(xCenter - width / 2, xTarget, xCenter + width / 2)) {	// If within box x-limits
				xEdge = xTarget;
			} else {
				xEdge = xCenter + sign(xTarget - xCenter) * width / 2;
			}
			yEdge = sign(yTarget - yCenter) * (height / 2) + yCenter;
		}
		return [xEdge, yEdge];
	}

	// Used for LinkVisual
	getLinkMountPos([xTarget, yTarget]) {
		// See "docs/code/mountPoints.svg" for math explanation 
		const [xCenter, yCenter] = this.getPos();
		const [width, height] = this.getSize();
		const boxSlope = safeDivision(height, width);
		const targetSlope = safeDivision(yTarget - yCenter, xTarget - xCenter);
		let xEdge;
		let yEdge;
		if (isInLimits(-boxSlope, targetSlope, boxSlope)) {
			const xSign = sign(xTarget - xCenter); // -1 if target left of box and 1 if target right of box 
			xEdge = xSign * (width / 2) + xCenter;
			yEdge = xSign * (width / 2) * targetSlope + yCenter;
		} else {
			const ySign = sign(yTarget - yCenter); // -1 if target above box and 1 if target below box
			xEdge = ySign * safeDivision(height / 2, targetSlope) + xCenter;
			yEdge = ySign * (height / 2) + yCenter;
		}
		return [xEdge, yEdge];
	}

	getImage() {
		const textElement = SVG.text(0, 39, this.primitive.getAttribute("name"), "name_element");
		textElement.setAttribute("fill", this.color);
		const size = this.getSize();
		const w = size[0];
		const h = size[1];
		return [
			SVG.rect(-w / 2, -h / 2, w, h, this.color, defaultFill, "element"),
			SVG.rect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, "none", this.color, "highlight"),
			textElement,
			SVG.icons(defaultStroke, defaultFill, "icons")
		];
	}
	getLayer() {
		return SVG.stockLayer;
	}
}

class NumberboxVisual extends BasePrimitive {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
		this.name_centered = true;
		update_name_pos(id);
		this.setSelectionSizeToText();

		this.runHandler = () => {
			this.render();
		}
		RunResults.subscribeRun(id, this.runHandler);

		this.dialog = new NumberboxDialog(this.id);
		this.dialog.subscribePool.subscribe(() => {
			this.render();
		});
	}
	setSelectionSizeToText() {
		const boundingRect = this.name_element.getBoundingClientRect();
		const elementRect = this.element_array[0];
		const selectorRect = this.selector_array[0];
		const marginX = 10;
		const marginY = 2;
		for (let rect of [elementRect, selectorRect]) {
			rect.setAttribute("width", boundingRect.width + marginX * 2);
			rect.setAttribute("height", boundingRect.height + marginY * 2);
			rect.setAttribute("x", -boundingRect.width / 2 - marginX);
			rect.setAttribute("y", -boundingRect.height / 2 - marginY);
		}
	}
	render() {
		if (this.targetID == null) {
			this.name_element.innerHTML = "-";
			this.setSelectionSizeToText();
			return;
		}
		let valueString = "";
		let lastValue = RunResults.getLastValue(this.targetID);
		if (lastValue || lastValue === 0) {
			let roundToZero = this.primitive.getAttribute("RoundToZero");
			let roundToZeroAtValue = -1;
			if (roundToZero === "true") {
				roundToZeroAtValue = this.primitive.getAttribute("RoundToZeroAtValue");
				if (isNaN(roundToZeroAtValue)) {
					roundToZeroAtValue = getDefaultAttributeValue("numberbox", "RoundToZeroAtValue");
				} else {
					roundToZeroAtValue = Number(roundToZeroAtValue);
				}
			}
			let number_length = JSON.parse(this.primitive.getAttribute("NumberLength"));
			let number_options = {
				"round_to_zero_limit": roundToZeroAtValue,
				"precision": number_length["usePrecision"] ? number_length["precision"] : undefined,
				"decimals": number_length["usePrecision"] ? undefined : number_length["decimal"]
			};
			valueString = format_number(lastValue, number_options);
		} else {
			valueString += "_";
		}
		let output = `${valueString}`;
		this.name_element.innerHTML = output;
		this.setSelectionSizeToText();

		// update color in case hide frame changes 
		this.setColor(this.color);

	}
	get targetID() {
		return Number(this.primitive.getAttribute("Target"));
	}
	set targetID(newTargetID) {
		this.primitive.setAttribute("Target", newTargetID);
		this.render();
	}
	afterNameChange() {
		this.setSelectionSizeToText();
	}
	getImage() {
		this.element = SVG.rect(-20, -15, 40, 30, this.color, defaultFill, "element");
		return [
			this.element,
			SVG.rect(-20, -15, 40, 30, "none", this.color, "highlight"),
			SVG.text(0, 0, "", "name_element", { "alignment-baseline": "middle", "style": "font-size: 16px", "fill": this.color }),
		];
	}
	setColor(color) {
		super.setColor(color);
		if (this.selected) {
			this.name_element.setAttribute("fill", "white");
		}
		let frameColor = this.primitive.getAttribute("HideFrame") === "true" ? "transparent" : color;
		this.element.setAttribute("stroke", frameColor);
	}
	select() {
		super.select();
		this.name_element.setAttribute("fill", "white");
	}
	unselect() {
		super.unselect();
		this.name_element.setAttribute("fill", this.color);
	}
	nameDoubleClick() {
		// Override this function
		// Do nothing - otherwise double clicked is called twice 
	}
	doubleClick() {
		this.dialog.show();
	}
	getLayer() {
		return SVG.plotLayer;
	}
}

class VariableVisual extends BasePrimitive {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
		this.updateDefinitionError();
		this.namePosList = [[0, 34], [23, 5], [0, -25], [-23, 5]];
	}

	getRadius() {
		return 20;
	}

	getBoundRect() {
		let pos = this.getPos();
		let radius = this.getRadius();
		return {
			"minX": pos[0] - radius,
			"maxX": pos[0] + radius,
			"minY": pos[1] - radius,
			"maxY": pos[1] + radius
		};
	}

	getImage() {
		return [
			SVG.circle(0, 0, this.getRadius(), this.color, defaultFill, "element"),
			SVG.text(0, 0, this.primitive.getAttribute("name"), "name_element", { "fill": this.color }),
			SVG.circle(0, 0, this.getRadius() - 2, "none", this.color, "highlight"),
			SVG.icons(defaultStroke, defaultFill, "icons")
		];
	}

	getLayer() {
		return SVG.variableLayer;
	}

	getLinkMountPos([xTarget, yTarget]) {
		// See "docs/code/mountPoints.svg" for math explanation 
		const [xCenter, yCenter] = this.getPos();
		const rTarget = distance([xCenter, yCenter], [xTarget, yTarget]);
		const dXTarget = xTarget - xCenter;
		const dYTarget = yTarget - yCenter;
		const dXEdge = safeDivision(dXTarget * this.getRadius(), rTarget);
		const dYEdge = safeDivision(dYTarget * this.getRadius(), rTarget);
		const xEdge = dXEdge + xCenter;
		const yEdge = dYEdge + yCenter;
		return [xEdge, yEdge];
	}
}

class ConstantVisual extends VariableVisual {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
		this.namePosList = [[0, 36], [25, 5], [0, -29], [-25, 5]];
	}

	getImage() {
		let r = this.getRadius();
		let rs = r - 3; // Selector radius 
		return [
			SVG.path(`M0,${r} ${r},0 0,-${r} -${r},0Z`, this.color, defaultFill, "element"),
			SVG.text(0, 0, this.primitive.getAttribute("name"), "name_element", { "fill": this.color }),
			SVG.path(`M0,${rs} ${rs},0 0,-${rs} -${rs},0Z`, "none", this.color, "highlight"),
			SVG.icons(defaultStroke, defaultFill, "icons")
		];
	}
	getLayer() {
		return SVG.constantLayer;
	}

	getRadius() {
		return 22;
	}

	getLinkMountPos([xTarget, yTarget]) {
		const [xCenter, yCenter] = this.getPos();
		const targetSlope = safeDivision(yCenter - yTarget, xCenter - xTarget);

		// "k" in the formula: y = kx + m
		const edgeSlope = -sign(targetSlope);

		// Where the line intercepts the x-axis ("m" in the formula: y = kx + m)
		const edgeIntercept = this.getRadius() * sign(yTarget - yCenter);

		// Relative coodinates relative center of ConstantVisual
		const xEdgeRel = safeDivision(edgeIntercept, targetSlope - edgeSlope);
		const yEdgeRel = edgeSlope * xEdgeRel + edgeIntercept;

		const xEdge = xEdgeRel + xCenter;
		const yEdge = yEdgeRel + yCenter;
		return [xEdge, yEdge];
	}
}

class ConverterVisual extends BasePrimitive {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
		this.updateDefinitionError();
		this.namePosList = [[0, 29], [23, 5], [0, -21], [-23, 5]];
	}
	getImage() {
		return [
			SVG.path("M-20 0  L-10 -15  L10 -15  L20 0  L10 15  L-10 15  Z", this.color, defaultFill, "element"),
			SVG.path("M-20 0  L-10 -15  L10 -15  L20 0  L10 15  L-10 15  Z", "none", this.color, "highlight", { "transform": "scale(0.87)" }),
			SVG.icons(defaultStroke, defaultFill, "icons"),
			SVG.text(0, 0, this.primitive.getAttribute("name"), "name_element", { "fill": this.color }),
		];
	}
	getLayer() {
		return SVG.converterLayer;
	}

	getLinkMountPos([xTarget, yTarget]) {
		// See "docs/code/mountPoints.svg" for math explanation 
		const [xCenter, yCenter] = this.getPos();
		const hexSlope = safeDivision(15.0, 10);  // placement of corner is at (10,15)
		const targetSlope = safeDivision(yTarget - yCenter, xTarget - xCenter);
		let xEdgeRel; 	// Relative x Position to center of Visual object.
		let yEdgeRel; 	// Relative y Position to center of Visual object.  
		if (hexSlope < targetSlope || targetSlope < -hexSlope) {
			const ySign = sign(yTarget - yCenter); 	// -1 if target above hexagon and 1 if target below hexagon 
			xEdgeRel = ySign * safeDivision(15, targetSlope);
			yEdgeRel = ySign * 15;
		} else if (0 < targetSlope && targetSlope < hexSlope) {
			const xSign = sign(xTarget - xCenter); // -1 if target left of hexagon and 1 if target right of hexagon
			xEdgeRel = xSign * safeDivision(30, (3 / 2) + targetSlope);
			yEdgeRel = xEdgeRel * targetSlope;
		} else {
			const xSign = sign(xTarget - xCenter); // -1 if target left of hexagon and 1 if target right of hexagon
			xEdgeRel = xSign * safeDivision(30, (3 / 2) - targetSlope);
			yEdgeRel = xEdgeRel * targetSlope;
		}
		const xEdge = xEdgeRel + xCenter;
		const yEdge = yEdgeRel + yCenter;
		return [xEdge, yEdge];
	}
	attachEvent() {
		do_global_log("this primitive");
		do_global_log(this.primitive);
		let linkedPrimitives = getLinkedPrimitives(this.primitive);
		do_global_log(linkedPrimitives);
		if (linkedPrimitives.length > 0) {
			do_global_log("choose yes");
			this.primitive.setAttribute("Source", linkedPrimitives[0].id);
		}
	}
	nameDoubleClick() {
		openPrimitiveDialog(this.id, "name")
	}
	doubleClick() {
		openPrimitiveDialog(this.id, "value")
	}
}

class TwoPointer extends BaseObject {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.id = id;
		this.type = type;
		this.selected = false;
		this.superClass = "TwoPointer";
		connection_array[this.id] = this;

		// anchors must exist before make graphics 
		this.createInitialAnchors(pos0, pos1);

		this.makeGraphics();
		$(this.group).on("mousedown", function (event) {
			let node_id = this.getAttribute("node_id");
			primitive_mousedown(node_id, event);
		});

		// this is done so anchor is ontop 
		this.start_anchor.reloadImage();
		this.end_anchor.reloadImage();
	}

	createInitialAnchors(pos0, pos1) {
		this.start_anchor = new AnchorPoint(this.id + ".start_anchor", "dummy_anchor", pos0, "start");
		this.end_anchor = new AnchorPoint(this.id + ".end_anchor", "dummy_anchor", pos1, "end");
	}

	getAnchors() {
		return [this.start_anchor, this.end_anchor];
	}

	getBoundRect() {
		return {
			"minX": this.getMinX(),
			"maxX": this.getMinX() + this.getWidth(),
			"minY": this.getMinY(),
			"maxY": this.getMinY() + this.getHeight()
		};
	}

	setColor(color) {
		super.setColor(color);
		this.start_anchor.setColor(color);
		this.end_anchor.setColor(color);
	}

	get startX() { return this.start_anchor.getPos()[0]; }
	get startY() { return this.start_anchor.getPos()[1]; }
	get endX() { return this.end_anchor.getPos()[0]; }
	get endY() { return this.end_anchor.getPos()[1]; }

	getPos() { return [(this.startX + this.endX) / 2, (this.startY + this.endY) / 2]; }
	getMinX() { return Math.min(this.startX, this.endX); }
	getMinY() { return Math.min(this.startY, this.endY); }
	getWidth() { return Math.abs(this.startX - this.endX); }
	getHeight() { return Math.abs(this.startY - this.endY); }

	unselect() {
		this.selected = false;
		for (let anchor of this.getAnchors()) {
			anchor.setVisible(false);
		}
	}
	select() {
		this.selected = true;
		for (let anchor of this.getAnchors()) {
			anchor.select();
			anchor.setVisible(true);
		}
	}

	update() {
		this.updateGraphics();
	}
	makeGraphics() {

	}
	updateGraphics() {

	}
	/** @param {AnchorType} anchorType */
	syncAnchorToPrimitive(anchorType) {
		// This function should sync anchor position to primitive 
		let primitive = findID(this.id);
		if (!primitive) return;
		switch (anchorType) {
			case "start":
				setSourcePosition(primitive, this.start_anchor.getPos());
				break;
			case "end":
				setTargetPosition(primitive, this.end_anchor.getPos());
				break;
		}
	}
}

class BaseConnection extends TwoPointer {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		/** @type {BaseObject} */
		this._start_attach = null;
		/** @type {BaseObject} */
		this._end_attach = null;
		this.positionUpdateHandler = () => {
			let primitive = findID(this.id);
			let sourcePoint = getSourcePosition(primitive);
			let targetPoint = getTargetPosition(primitive);
			this.start_anchor.setPos(sourcePoint);
			this.end_anchor.setPos(targetPoint);
			alert("Position got updated");
		}
	}

	isAcceptableStartAttach(attachVisual) {
		// function to decide if attachVisual is OK allowed to attach start to 
		return false;
	}
	isAcceptableEndAttach(attachVisual) {
		return false;
	}
	setStartAttach(new_start_attach) {
		if (new_start_attach != null && this.getEndAttach() == new_start_attach) {
			return;		// Will not attach if other anchor is attached to same
		}
		if (new_start_attach != null && this.isAcceptableStartAttach(new_start_attach) === false) {
			return; 	// Will not attach if not acceptable attachType
		}

		// Update the attachment primitive
		this._start_attach = new_start_attach;

		let sourcePrimitive = null;
		if (this._start_attach != null) {
			sourcePrimitive = findID(this._start_attach.id);
		}
		setSource(this.primitive, sourcePrimitive);

		// Trigger the attach event on the new attachment primitives
		this.triggerAttachEvents();
	}
	getStartAttach() {
		return this._start_attach;
	}
	setEndAttach(new_end_attach) {
		do_global_log("end_attach");
		if (new_end_attach != null && this.getStartAttach() == new_end_attach) {
			return; 	// Will not attach if other anchor is attached to same 
		}
		if (new_end_attach != null && this.isAcceptableEndAttach(new_end_attach) === false) {
			return;		// Will not attach if not acceptable attachType
		}

		// Update the attachment primitive
		this._end_attach = new_end_attach;
		let targetPrimitive = null;
		if (this._end_attach != null) {
			targetPrimitive = findID(this._end_attach.id);
		}
		setTarget(this.primitive, targetPrimitive);

		// Trigger the attach event on the new attachment primitives
		this.triggerAttachEvents();
	}
	getEndAttach() {
		return this._end_attach;
	}
	triggerAttachEvents() {
		// We must always trigger both start and end, since a change in the start might affect the logics of the primitive attach at the end of a link or flow
		if (this.getStartAttach() != null) {
			this.getStartAttach().attachEvent();
		}
		if (this.getEndAttach() != null) {
			this.getEndAttach().attachEvent();
		}
	}
	clean() {
		this.triggerAttachEvents();
		super.clean();
	}
	updateGraphics() {

	}
}

function getStackTrace() {
	try {
		let a = {};
		a.debug();
	} catch (ex) {
		return ex.stack;
	}
}


class FlowVisual extends BaseConnection {
	/** @type {StockVisual} */
	_start_attach;
	/** @type {StockVisual} */
	_end_attach;
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.updateDefinitionError();
		this.namePosList = [[0, 40], [31, 5], [0, -33], [-31, 5]]; 	// Textplacement when rotating text

		// List of anchors. Not start- and end-anchor. TYPE: [AnchorPoint]
		this.middleAnchors = [];

		this.valveIndex; 	// index to indicate what inbetween path valve is placed
		this.variableSide;	// bool to indicate what side of path variable is placed

		this.startCloud;
		this.endCloud;
		this.outerPath; 	// Black path element
		this.innerPath; 	// White path element
		this.arrowHeadPath; // Head of Arrow element
		this.flowPathGroup; // Group element with outer- inner- & arrowHeadPath within.
		this.valve;
		this.variable; 		// variable (only svg group-element with circle and text)
	}

	isAcceptableStartAttach(attachVisual) {
		return attachVisual.getType() === "stock";
	}

	isAcceptableEndAttach(attachVisual) {
		return attachVisual.getType() === "stock";
	}

	getRadius() {
		return 20;
	}

	getAnchors() {
		let anchors = [this.start_anchor];
		anchors = anchors.concat(this.middleAnchors);
		anchors = anchors.concat([this.end_anchor]);
		return anchors;
	}

	getPreviousAnchor(anchor_id) {
		let anchors = this.getAnchors();
		let anchor_ids = anchors.map(anchor => anchor.id);
		let prev_index = anchor_ids.indexOf(anchor_id) - 1;
		return prev_index >= 0 ? anchors[prev_index] : null;
	}

	getNextAnchor(anchor_id) {
		let anchors = this.getAnchors();
		let anchor_ids = anchors.map(anchor => anchor.id);
		let index = anchor_ids.indexOf(anchor_id);
		if (index === -1 && index === anchors.length - 1) {
			return null;
		} else {
			return anchors[index + 1];
		}
	}

	/**
	 * @param {number} requestedValue x-> or 1->y
	 * @param {string} anchorId 
	 * @param {number} dimensionIndex 
	 * @returns {number}
	 */
	requestNewAnchorDimension(requestedValue, anchorId, dimensionIndex) {
		/** @type {AnchorPoint} */
		const anchor = object_array[anchorId];
		let newValue = requestedValue;
		const anchorAttach = anchor.getAnchorType() === "start" 
			? this._start_attach 
			: anchor.getAnchorType() == "end" 
			? this._end_attach 
			: undefined;
		// if anchor is attached limit movement 
		if (anchorAttach) {
			// stockX or stockY
			const stockDimension = anchorAttach.getPos()[dimensionIndex];
			// stockWidth or stockHeight
			const stockSpanSize = anchorAttach.getSize()[dimensionIndex];
			newValue = clampValue(requestedValue, stockDimension - stockSpanSize / 2, stockDimension + stockSpanSize / 2);
		} else {
			// dont allow being closer than minDistance units to a neightbour node 
			const minDistance = 10;
			const prevAnchor = this.getPreviousAnchor(anchorId);
			const nextAnchor = this.getNextAnchor(anchorId);

			let requestPos = anchor.getPos();
			requestPos[dimensionIndex] = requestedValue;
			if ((prevAnchor && distance(requestPos, prevAnchor.getPos()) < minDistance) ||
				(nextAnchor && distance(requestPos, nextAnchor.getPos()) < minDistance)) {
				// set old value of anchor 
				newValue = anchor.getPos()[dimensionIndex];
			} else {
				// set requested value 
				newValue = requestedValue;
			}
		}

		const pos = anchor.getPos();
		pos[dimensionIndex] = newValue;
		anchor.setPos(pos);
		return newValue;
	}

	/**
	 * @param {[number, number]} newPosition 
	 * @param {string} anchorId 
	 */
	requestNewAnchorPos(newPosition, anchorId) {
		let [x, y] = newPosition;
		let mainAnchor = object_array[anchorId];

		let prevAnchor = this.getPreviousAnchor(anchorId);
		let nextAnchor = this.getNextAnchor(anchorId);

		let isPreviousAlongX = true;
		let isNextAlongX = true;

		if (prevAnchor && this.middleAnchors.length === 0) {
			const prevAnchorPos = prevAnchor.getPos();
			isPreviousAlongX = Math.abs(prevAnchorPos[0] - x) < Math.abs(prevAnchorPos[1] - y);
			isNextAlongX = !isPreviousAlongX;
		} else if (nextAnchor && this.middleAnchors.length === 0) {
			const nextAnchorPos = nextAnchor.getPos();
			isNextAlongX = Math.abs(nextAnchorPos[0] - x) < Math.abs(nextAnchorPos[1] - y);
			isPreviousAlongX = !isNextAlongX;
		} else {
			// if more than two anchor 
			let anchors = this.getAnchors();
			const [x1, y1] = anchors[0].getPos();
			const [x2, y2] = anchors[1].getPos();
			const isStartAlongX = Math.abs(x1 - x2) < Math.abs(y1 - y2);
			const index = anchors.map(anchor => anchor.id).indexOf(anchorId);
			isPreviousAlongX = ((index % 2) === 1) === isStartAlongX;
			isNextAlongX = !isPreviousAlongX;
		}

		if (prevAnchor) {
			// Get direction of movement or direction of previous anchor 
			if (isPreviousAlongX) {
				x = this.requestNewAnchorDimension(x, prevAnchor.id, 0);
			} else {
				y = this.requestNewAnchorDimension(y, prevAnchor.id, 1);
			}
		}
		if (nextAnchor) {
			if (isNextAlongX) {
				x = this.requestNewAnchorDimension(x, nextAnchor.id, 0);
			} else {
				y = this.requestNewAnchorDimension(y, nextAnchor.id, 1);
			}
		}
		mainAnchor.setPos([x, y]);
	}


	syncAnchorToPrimitive(anchorType) {
		// Save middle anchor points to primitive
		super.syncAnchorToPrimitive(anchorType);
		let middlePoints = "";
		for (i = 0; i < this.middleAnchors.length; i++) {
			let pos = this.middleAnchors[i].getPos();
			let x = pos[0];
			let y = pos[1];
			middlePoints += `${x},${y} `;
		}
		this.primitive.setAttribute("MiddlePoints", middlePoints);
	}

	getLinkMountPos([xTarget, yTarget]) {
		// See "docs/code/mountPoints.svg" for math explanation 
		const [xCenter, yCenter] = this.getVariablePos();
		const rTarget = distance([xCenter, yCenter], [xTarget, yTarget]);
		const dXTarget = xTarget - xCenter;
		const dYTarget = yTarget - yCenter;
		const dXEdge = safeDivision(dXTarget * this.getRadius(), rTarget);
		const dYEdge = safeDivision(dYTarget * this.getRadius(), rTarget);
		const xEdge = dXEdge + xCenter;
		const yEdge = dYEdge + yCenter;
		return [xEdge, yEdge];
	}

	moveValve() {
		if (this.variableSide) {
			this.valveIndex = (this.valveIndex + 1) % (this.middleAnchors.length + 1);
		}
		this.variableSide = !this.variableSide;

		this.primitive.setAttribute("ValveIndex", this.valveIndex);
		this.primitive.setAttribute("VariableSide", this.variableSide);

		// update_all_objects();
		update_relevant_objects("");
	}

	createMiddleAnchorPoint(x, y) {
		let index = this.middleAnchors.length;
		let newAnchor = new OrthoAnchorPoint(
			this.id + ".point" + index,
			"dummy_anchor",
			[x, y],
			"orthoMiddle",
			index
		);
		this.middleAnchors.push(newAnchor);
	}

	setStartAttach(new_start_attach) {
		super.setStartAttach(new_start_attach);
		// needs to update Links a few times to follow along
		for (let i = 0; i < 4; i++) update_twopointer_objects([]);
	}

	setEndAttach(new_end_attach) {
		super.setEndAttach(new_end_attach);
		for (let i = 0; i < 4; i++) update_twopointer_objects([]);
	}

	removeLastMiddleAnchorPoint() {
		// set valveIndex to 0 to avoid valveplacement bug 
		if (this.valveIndex === this.middleAnchors.length) {
			this.valveIndex = this.middleAnchors.length - 1;
		}
		let removedAnchor = this.middleAnchors.pop();
		delete_object(removedAnchor.id);
	}


	/**
	 * 
	 * @param {string} middlePointsString 
	 * @returns {[number, number][]}
	 */
	parseMiddlePoints(middlePointsString) {
		if (!middlePointsString) {
			return [];
		}
		// example input: "15,17 19,12 "

		// example ["15,17", "19,12"]
		const stringPoints = middlePointsString.trim().split(" ");

		// example [["15", "17"], ["19", "12"]]
		const stringDimension = stringPoints.map(stringPos => stringPos.split(","));

		// example [[15,17], [19,12]]
		const points = stringDimension.map(dim => [parseInt(dim[0]), parseInt(dim[1])]);

		return points;
	}

	loadMiddlePoints() {
		const middlePointsString = this.primitive.getAttribute("MiddlePoints");
		const points = this.parseMiddlePoints(middlePointsString);
		for (let point of points) {
			let index = this.middleAnchors.length;
			let newAnchor = new OrthoAnchorPoint(
				this.id + ".point" + index,
				"dummy_anchor",
				point,
				"orthoMiddle",
				index
			);
			this.middleAnchors.push(newAnchor);
		}
	}

	getBoundRect() {
		let pos = this.getVariablePos();
		let radius = this.getRadius();
		return {
			"minX": pos[0] - radius,
			"maxX": pos[0] + radius,
			"minY": pos[1] - radius,
			"maxY": pos[1] + radius
		};
	}

	getValvePos() {
		let points = this.getAnchors().map(anchor => anchor.getPos());
		let valveX = (points[this.valveIndex][0] + points[this.valveIndex + 1][0]) / 2;
		let valveY = (points[this.valveIndex][1] + points[this.valveIndex + 1][1]) / 2;
		return [valveX, valveY];
	}

	getValveRotation() {
		let points = this.getAnchors().map(anchor => anchor.getPos());
		let dir = neswDirection(points[this.valveIndex], points[this.valveIndex + 1]);
		let valveRot = 0;
		if (dir == "north" || dir == "south") {
			valveRot = 90;
		}
		return valveRot;
	}

	/** @returns {[number, number]} */
	getVariablePos() {
		let points = this.getAnchors().map(anchor => anchor.getPos());
		let dir = neswDirection(points[this.valveIndex], points[this.valveIndex + 1]);
		let variableOffset = [0, 0];
		if (dir == "north" || dir == "south") {
			if (this.variableSide) {
				variableOffset = [this.getRadius(), 0];
			} else {
				variableOffset = [-this.getRadius(), 0];
			}
		} else {
			if (this.variableSide) {
				variableOffset = [0, -this.getRadius()];
			} else {
				variableOffset = [0, this.getRadius()];
			}
		}
		let [valveX, valveY] = this.getValvePos();
		return [valveX + variableOffset[0], valveY + variableOffset[1]];
	}

	setColor(color) {
		this.color = color;
		this.primitive.setAttribute("Color", this.color);
		this.startCloud.setAttribute("stroke", color);
		this.endCloud.setAttribute("stroke", color);
		this.outerPath.setAttribute("stroke", color);
		this.arrowHeadPath.setAttribute("stroke", color);
		this.valve.setAttribute("stroke", color);
		this.variable.getElementsByClassName("element")[0].setAttribute("stroke", color);
		this.variable.getElementsByClassName("highlight")[0].setAttribute("fill", color);
		this.name_element.setAttribute("fill", color);
		this.getAnchors().map(anchor => anchor.setColor(color));
	}

	makeGraphics() {
		this.startCloud = SVG.cloud(this.color, defaultFill, { "class": "element" });
		this.endCloud = SVG.cloud(this.color, defaultFill, { "class": "element" });
		this.outerPath = SVG.widePath(5, this.color, { "class": "element" });
		this.innerPath = SVG.widePath(3, "white"); // Must have white ohterwise path is black
		this.arrowHeadPath = SVG.arrowHead(this.color, defaultFill, { "class": "element" });
		this.flowPathGroup = SVG.group([this.startCloud, this.endCloud, this.outerPath, this.innerPath, this.arrowHeadPath]);
		this.valve = SVG.path("M8,8 -8,-8 8,-8 -8,8 Z", this.color, defaultFill, "element");
		this.name_element = SVG.text(0, -this.getRadius(), "vairable", "name_element");
		this.icons = SVG.icons(defaultStroke, defaultFill, "icons");
		this.variable = SVG.group([
			SVG.circle(0, 0, this.getRadius(), this.color, "white", "element"),
			SVG.circle(0, 0, this.getRadius() - 2, "none", this.color, "highlight"),
			this.icons,
			this.name_element
		]);
		this.icons.setColor("white");
		this.middleAnchors = [];
		this.valveIndex = 0;
		this.variableSide = false;

		$(this.name_element).dblclick((event) => {
			this.nameDoubleClick();
		});

		this.group = SVG.append(SVG.flowLayer, SVG.group([this.flowPathGroup, this.valve, this.variable]));
		this.group.setAttribute("node_id", this.id);

		$(this.group).dblclick(() => {
			this.doubleClick(this.id);
		});
		this.updateGraphics();
	}

	getDirection() {
		// This function is used to determine which way the arrowHead should aim 
		let points = this.getAnchors().map(anchor => anchor.getPos());
		let len = points.length;
		let p1 = points[len - 1];
		let p2 = points[len - 2];
		return [p2[0] - p1[0], p2[1] - p1[1]];
	}

	shortenLastPoint(shortenAmount) {
		let points = this.getAnchors().map(anchor => anchor.getPos());
		let last = points[points.length - 1];
		let secondLast = points[points.length - 2];
		let sine = sin(last, secondLast);
		let cosine = cos(last, secondLast);
		let newLast = rotate([shortenAmount, 0], sine, cosine);
		newLast = translate(newLast, last);
		points[points.length - 1] = newLast;
		return points;
	}

	update() {
		// This function is similar to TwoPointer::update but it takes attachments into account

		// Get start position from attach
		// _start_attach is null if we are not attached to anything

		let points = this.getAnchors().map(anchor => anchor.getPos());
		let connectionStartPos = points[1];
		let connectionEndPos = points[points.length - 2];

		if (this.getStartAttach() != null && this.start_anchor != null) {
			let oldPos = this.start_anchor.getPos();
			let newPos = this.getStartAttach().getFlowMountPos(connectionStartPos);
			if (oldPos[0] != newPos[0] || oldPos[1] != newPos[1]) {
				this.requestNewAnchorPos(newPos, this.start_anchor.id);
			}
		}
		if (this.getEndAttach() != null && this.end_anchor != null) {
			let oldPos = this.end_anchor.getPos();
			let newPos = this.getEndAttach().getFlowMountPos(connectionEndPos);
			if (oldPos[0] != newPos[0] || oldPos[1] != newPos[1]) {
				this.requestNewAnchorPos(newPos, this.end_anchor.id);
			}
		}
		super.update();
		// update anchors 
		this.getAnchors().map(anchor => anchor.updatePosition());

		if (this.primitive && this.icons) {
			const hasDefError = DefinitionError.has(this.primitive);
			this.icons.set("questionmark", hasDefError ? "visible" : "hidden");
			this.icons.set("dice", (!hasDefError && hasRandomFunction(getValue(this.primitive))) ? "visible" : "hidden");
		}
	}

	updateGraphics() {
		let points = this.getAnchors().map(anchor => anchor.getPos());
		if (this.getStartAttach() == null) {
			this.startCloud.setVisibility(true);
			this.startCloud.setPosition(points[0], points[1]);
		} else {
			this.startCloud.setVisibility(false);
		}
		if (this.getEndAttach() == null) {
			this.endCloud.setVisibility(true);
			this.endCloud.setPosition(points[points.length - 1], points[points.length - 2]);
		} else {
			this.endCloud.setVisibility(false);
		}
		this.outerPath.setPoints(this.shortenLastPoint(12));
		this.innerPath.setPoints(this.shortenLastPoint(8));
		this.arrowHeadPath.setPosition(points[points.length - 1], this.getDirection());

		let [valveX, valveY] = this.getValvePos();
		let valveRot = this.getValveRotation();
		let [varX, varY] = this.getVariablePos();
		SVG.transform(this.valve, valveX, valveY, valveRot, 1);
		SVG.translate(this.variable, varX, varY);
		// Update
		this.startCloud.update();
		this.endCloud.update();
		this.outerPath.update();
		this.innerPath.update();
		this.arrowHeadPath.update();
	}

	unselect() {
		super.unselect();
		this.variable.getElementsByClassName("highlight")[0].setAttribute("visibility", "hidden");
		this.icons.setColor(this.color);
	}

	select() {
		super.select();
		this.variable.getElementsByClassName("highlight")[0].setAttribute("visibility", "visible");
		this.icons.setColor("white");
	}

	doubleClick() {
		openPrimitiveDialog(this.id);
	}
}

class RectangleVisual extends TwoPointer {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.dialog = new RectangleDialog(this.id);
		this.dialog.subscribePool.subscribe(() => {
			this.updateGraphics();
		});
	}
	makeGraphics() {
		this.element = SVG.rect(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), defaultStroke, "none", "element");

		// Invisible rect to more easily click
		this.clickRect = SVG.rect(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), "transparent", "none");
		this.clickRect.setAttribute("stroke-width", "10");

		this.coordRect = new CoordRect();
		this.coordRect.element = this.element;

		this.clickCoordRect = new CoordRect();
		this.clickCoordRect.element = this.clickRect;

		this.group = SVG.append(SVG.plotLayer, SVG.group([this.element, this.clickRect]));
		this.group.setAttribute("node_id", this.id);
		this.element_array = [this.element];
		for (let key in this.element_array) {
			this.element_array[key].setAttribute("node_id", this.id);
		}

		$(this.group).dblclick((event) => {
			this.doubleClick();
		});
	}
	doubleClick() {
		this.dialog.show();
	}
	updateGraphics() {
		this.element.setAttribute("stroke-dasharray", this.primitive.getAttribute("StrokeDashArray"));
		this.element.setAttribute("stroke-width", this.primitive.getAttribute("StrokeWidth"));
		// Update rect to fit start and end position
		this.coordRect.x1 = this.startX;
		this.coordRect.y1 = this.startY;
		// Prevent width from being 0 (then rect is not visible)
		let endx = (this.startX != this.endX) ? this.endX : this.startX + 1;
		let endy = (this.startY != this.endY) ? this.endY : this.startY + 1;
		this.coordRect.x2 = endx;
		this.coordRect.y2 = endy;
		this.coordRect.update();

		this.clickCoordRect.x1 = this.startX;
		this.clickCoordRect.y1 = this.startY;
		this.clickCoordRect.x2 = endx;
		this.clickCoordRect.y2 = endy;
		this.clickCoordRect.update();
	}
}


class EllipseVisual extends TwoPointer {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.dialog = new EllipseDialog(this.id);
		this.dialog.subscribePool.subscribe(() => {
			this.updateGraphics();
		});
	}
	makeGraphics() {
		let cx = (this.startX + this.endX) / 2;
		let cy = (this.startY + this.endY) / 2;
		let rx = Math.max(Math.abs(this.startX - this.endX) / 2, 1);
		let ry = Math.max(Math.abs(this.startY - this.endY) / 2, 1);
		this.element = SVG.ellipse(cx, cy, rx, ry, defaultStroke, "none", "element");
		this.clickEllipse = SVG.ellipse(cx, cy, rx, ry, "transparent", "none", "element", { "stroke-width": "10" });
		this.selector = SVG.rect(cx, cy, rx, ry, defaultStroke, defaultFill, "highlight", { "stroke-dasharray": "2 2" });

		this.selectorCoordRect = new CoordRect();
		this.selectorCoordRect.element = this.selector;
		this.element_array = [this.element];
		this.group = SVG.append(SVG.plotLayer, SVG.group([this.element, this.clickEllipse, this.selector]));
		this.group.setAttribute("node_id", this.id);

		$(this.group).dblclick(() => {
			this.doubleClick();
		});
	}
	doubleClick() {
		this.dialog.show();
	}
	updateGraphics() {
		let cx = (this.startX + this.endX) / 2;
		let cy = (this.startY + this.endY) / 2;
		let rx = Math.max(Math.abs(this.startX - this.endX) / 2, 1);
		let ry = Math.max(Math.abs(this.startY - this.endY) / 2, 1);
		this.element.setAttribute("cx", cx);
		this.element.setAttribute("cy", cy);
		this.element.setAttribute("rx", rx);
		this.element.setAttribute("ry", ry);
		this.element.setAttribute("stroke-dasharray", this.primitive.getAttribute("StrokeDashArray"));
		this.element.setAttribute("stroke-width", this.primitive.getAttribute("StrokeWidth"));
		this.clickEllipse.setAttribute("cx", cx);
		this.clickEllipse.setAttribute("cy", cy);
		this.clickEllipse.setAttribute("rx", rx);
		this.clickEllipse.setAttribute("ry", ry);
		this.selectorCoordRect.x1 = this.startX;
		this.selectorCoordRect.y1 = this.startY;
		this.selectorCoordRect.x2 = this.endX;
		this.selectorCoordRect.y2 = this.endY;
		this.selectorCoordRect.update();
	}

	select() {
		super.select();
		this.selector.setAttribute("visibility", "visible");
	}
	unselect() {
		super.unselect();
		this.selector.setAttribute("visibility", "hidden");
	}
}

class HtmlTwoPointer extends TwoPointer {
	updateHTML(html) {
		this.htmlElement.contentDiv.innerHTML = html;
	}
	clean() {
		super.clean();
		this.htmlElement.remove();
	}
}

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

		let types_to_display = idsToDisplay.map(findID).map(node => get_object(node.id).type);
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
		if (!(this.id in connection_array)) return;

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
				${idsToDisplay.map(id => `<li>${getName(findID(id))}</li>`).join("")}
			</ul>`);
		}
		this.chartDiv.innerHTML = (`
			<div class="empty-plot-header">Time Plot</div>
			${selected_str}
		`);
	}
}


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
				${idsToDisplay.map(id => `<li>${getName(findID(id))}</li>`).join("")}
			</ul>`);
		}
		this.chartDiv.innerHTML = (`
			<div class="empty-plot-header">Compare Simulations Plot</div>
			${selected_str}
		`);
	}
}

class TextAreaVisual extends HtmlTwoPointer {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);

		this.primitive = findID(id);

		this.dialog = new TextAreaDialog(id);
		this.dialog.subscribePool.subscribe(() => {
			this.render();
		});
		this.render();
	}
	updateGraphics() {
		// code for svg foreign
		this.htmlElement.setX(this.getMinX());
		this.htmlElement.setY(this.getMinY());
		this.htmlElement.setWidth(this.getWidth());
		this.htmlElement.setHeight(this.getHeight());

		this.coordRect.x1 = this.startX;
		this.coordRect.y1 = this.startY;
		this.coordRect.x2 = this.endX;
		this.coordRect.y2 = this.endY;
		this.coordRect.update();
	}
	makeGraphics() {
		this.element = SVG.append(SVG.plotLayer, SVG.rect(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), defaultStroke, "none", "element", ""));

		this.coordRect = new CoordRect();
		this.coordRect.element = this.element;

		this.htmlElement = SVG.append(SVG.plotLayer, SVG.foreign(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), "Text not renderd yet", "white"));

		$(this.htmlElement.cutDiv).mousedown((event) => {
			// This is an alternative to having the htmlElement in the group
			primitive_mousedown(this.id, event)
			mouseDownHandler(event);
			event.stopPropagation();
		});

		// Emergency solution since double clicking a ComparePlot or XyPlot does not always work.
		$(this.htmlElement.cutDiv).bind("contextmenu", () => {
			this.doubleClick();
		});

		$(this.htmlElement.cutDiv).dblclick(() => {
			this.doubleClick();
		});

		this.group = SVG.append(SVG.plotLayer, SVG.group([this.element]));
		this.group.setAttribute("node_id", this.id);

		this.element_array = [this.element];
		this.element_array = [this.htmlElement.contentDiv, this.element];
		for (let key in this.element_array) {
			this.element_array[key].setAttribute("node_id", this.id);
		}
	}
	doubleClick() {
		this.dialog.show();
	}
	render() {
		let newText = getName(this.primitive);
		let hideFrame = this.primitive.getAttribute("HideFrame") === "true";
		if (hideFrame && removeSpacesAtEnd(newText).length !== 0) {
			this.element.setAttribute("visibility", "hidden");
		} else {
			this.element.setAttribute("visibility", "visible");
		}
		// space is replaced with span "&nbsp;" does not work since it does not work with overflow-wrap: break-word
		// Replace <, >, space, new line
		let formatedText = newText
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/ /g, "<span style='display:inline-block; width:5px;'></span>")
			.replace(/\n/g, "<br/>");
		this.updateHTML(formatedText);
	}
	setColor(color) {
		super.setColor(color);
		this.htmlElement.style.color = color;
	}
}

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
				${idsToDisplay.map(id => `<li>${getName(findID(id))}</li>`).join("")}
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
					renderer: (this.primitive.getAttribute("XLogScale") === "true") ? $.jqplot.LogAxisRenderer : $.jqplot.LinearAxisRenderer,
					min: axisLimits.xaxis.auto ? undefined : axisLimits.xaxis.min,
					max: axisLimits.xaxis.auto ? undefined : axisLimits.xaxis.max,
					ticks: axisLimits.xaxis.auto ? undefined : this.getTicks(Number(axisLimits.xaxis.min), Number(axisLimits.xaxis.max)),
				},
				yaxis: {
					label: this.serieYName,
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
        				<tr><td>${this.serieXName} </td><td> = </td><td>%1$.3p</td></tr>
						<tr><td>${this.serieYName} </td><td> = </td><td>%2$.3p</td></tr>
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
				${idsToDisplay.map(id => `<li>${getName(findID(id))}</li>`).join("")}
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

class LineVisual extends TwoPointer {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.dialog = new LineDialog(this.id);
		this.dialog.subscribePool.subscribe(() => {
			this.updateGraphics();
		});
	}
	makeGraphics() {
		this.line = SVG.line(this.startX, this.startY, this.endX, this.endY, defaultStroke, defaultFill, "element");
		this.clickLine = SVG.line(this.startX, this.startY, this.endX, this.endY, "transparent", "none", "element", { "stroke-width": "10" });
		this.arrowHeadStart = SVG.arrowHead(defaultStroke, defaultStroke, { "class": "element" });
		this.arrowHeadEnd = SVG.arrowHead(defaultStroke, defaultStroke, { "class": "element" });
		let arrowPathPoints = [[8, 0], [13, -5], [0, 0], [13, 5]];
		this.arrowHeadStart.setTemplatePoints(arrowPathPoints);
		this.arrowHeadEnd.setTemplatePoints(arrowPathPoints);

		this.group = SVG.append(SVG.svgElement, 
			SVG.group([this.line, this.arrowHeadStart, this.arrowHeadEnd, this.clickLine])
		);
		this.group.setAttribute("node_id", this.id);
		this.element_array = [this.line, this.arrowHeadStart, this.arrowHeadEnd];
		for (let key in this.element_array) {
			this.element_array[key].setAttribute("node_id", this.id);
		}
		$(this.group).dblclick((event) => {
			this.doubleClick();
		});
	}
	doubleClick() {
		this.dialog.show();
	}
	updateGraphics() {
		this.line.setAttribute("stroke-width", this.primitive.getAttribute("StrokeWidth"));
		this.line.setAttribute("stroke-dasharray", this.primitive.getAttribute("StrokeDashArray"));

		let lineStartPos = [this.startX, this.startY];
		let lineEndPos = [this.endX, this.endY];
		let arrowHeadStart = this.primitive.getAttribute("ArrowHeadStart") === "true";
		let arrowHeadEnd = this.primitive.getAttribute("ArrowHeadEnd") === "true";
		this.arrowHeadStart.setAttribute("visibility", arrowHeadStart ? "visible" : "hidden");
		this.arrowHeadEnd.setAttribute("visibility", arrowHeadEnd ? "visible" : "hidden");
		if (arrowHeadStart || arrowHeadEnd) {
			/* Shorten line as not to go past arrowHeadEnd */
			let shortenAmount = 8;
			let sine = sin([this.endX, this.endY], [this.startX, this.startY]);
			let cosine = cos([this.endX, this.endY], [this.startX, this.startY]);
			let endOffset = rotate([shortenAmount, 0], sine, cosine);
			if (arrowHeadStart) {
				lineStartPos = translate(neg(endOffset), [this.startX, this.startY]);
				this.arrowHeadStart.setPosition([this.startX, this.startY], [this.endX - this.startX, this.endY - this.startY]);
				this.arrowHeadStart.update();
			}
			if (arrowHeadEnd) {
				lineEndPos = translate(endOffset, [this.endX, this.endY]);
				this.arrowHeadEnd.setPosition([this.endX, this.endY], [this.startX - this.endX, this.startY - this.endY]);
				this.arrowHeadEnd.update();
			}
		}

		this.line.setAttribute("x1", lineStartPos[0]);
		this.line.setAttribute("y1", lineStartPos[1]);
		this.line.setAttribute("x2", lineEndPos[0]);
		this.line.setAttribute("y2", lineEndPos[1]);
		this.clickLine.setAttribute("x1", this.startX);
		this.clickLine.setAttribute("y1", this.startY);
		this.clickLine.setAttribute("x2", this.endX);
		this.clickLine.setAttribute("y2", this.endY);
	}
	setColor(color) {
		super.setColor(color);
		this.arrowHeadStart.setAttribute("fill", color);
		this.arrowHeadEnd.setAttribute("fill", color);
	}
}

class LinkVisual extends BaseConnection {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);

		// reload image of anchor to make sure anchor is ontop
		this.b1_anchor.reloadImage();
		this.b2_anchor.reloadImage();
	}

	createInitialAnchors(pos0, pos1) {
		// Used to keep a local coordinate system between start- and endAnchor
		// startLocal = [0,0], endLocal = [1,0]
		this.b1Local = [0.3, 0.0];
		this.b2Local = [0.7, 0.0];
		super.createInitialAnchors(pos0, pos1);
		this.b1_anchor = new AnchorPoint(this.id + ".b1_anchor", "dummy_anchor", [0, 0], "bezier1");
		this.b2_anchor = new AnchorPoint(this.id + ".b2_anchor", "dummy_anchor", [0, 0], "bezier2");
		this.keepRelativeHandlePositions();
		this.b1_anchor.makeSquare();
		this.b2_anchor.makeSquare();
	}

	getAnchors() {
		return [this.start_anchor, this.b1_anchor, this.b2_anchor, this.end_anchor];
	}

	worldToLocal(worldPos) {
		// localPos(worldPos) = inv(S)*inv(R)*inv(T)*worldPos
		let origoWorld = this.start_anchor.getPos();
		let oneZeroWorld = this.end_anchor.getPos();
		let scaleFactor = distance(origoWorld, oneZeroWorld);
		let sine = sin(origoWorld, oneZeroWorld);
		let cosine = cos(origoWorld, oneZeroWorld);
		let S_pWorld = translate(worldPos, neg(origoWorld));
		let RS_pWorld = rotate(S_pWorld, -sine, cosine);
		let posWorld = scale(RS_pWorld, [0, 0], 1 / scaleFactor);
		return posWorld;
	}
	localToWorld(localPos) {
		// worldPos(localPos) = T*R*S*localPos
		let origoWorld = this.start_anchor.getPos();
		let oneZeroWorld = this.end_anchor.getPos();
		let scaleFactor = distance(origoWorld, oneZeroWorld);
		let sine = sin(origoWorld, oneZeroWorld);
		let cosine = cos(origoWorld, oneZeroWorld);
		let S_pLocal = scale(localPos, [0, 0], scaleFactor);
		let RS_pLocal = rotate(S_pLocal, sine, cosine);
		let posWorld = translate(RS_pLocal, origoWorld);
		return posWorld;
	}
	unselect() {
		this.selected = false;
		if (hasSelectedChildren(this.id)) {
			for (let i in this.highlight_on_select) {
				this.highlight_on_select[i].setAttribute("stroke", "black");
			}
		} else {
			let children = getChildren(this.id);
			for (let id in children) {
				let object = get_object(id);
				if ('setVisible' in object) {
					object.setVisible(false);
				}
			}
		}

		// Hide beizer lines
		for (let element of this.showOnlyOnSelect) {
			element.setAttribute("visibility", "hidden");
		}
	}
	select(selectChildren = true) {
		let children = getChildren(this.id);
		for (let id in children) {
			let object = get_object(id);
			if ('setVisible' in object) {
				object.setVisible(true);
			}
		}
		for (let i in this.highlight_on_select) {
			this.highlight_on_select[i].setAttribute("stroke", "red");
		}

		if (selectChildren) {
			// This for loop is partly redundant and should be integrated in later code
			for (let anchor of this.getAnchors()) {
				anchor.select();
				anchor.setVisible(true);
			}
		}

		// Show beizer lines
		for (let element of this.showOnlyOnSelect) {
			element.setAttribute("visibility", "visible");
		}
	}
	updateClickArea() {
		this.click_area.x1 = this.curve.x1;
		this.click_area.y1 = this.curve.y1;
		this.click_area.x2 = this.curve.x2;
		this.click_area.y2 = this.curve.y2;
		this.click_area.x3 = this.curve.x3;
		this.click_area.y3 = this.curve.y3;
		this.click_area.x4 = this.curve.x4;
		this.click_area.y4 = this.curve.y4;
		this.click_area.update();
	}

	isAcceptableStartAttach(attachVisual) {
		let okAttachTypes = ["stock", "variable", "constant", "converter", "flow"];
		return okAttachTypes.includes(attachVisual.getType());
	}

	isAcceptableEndAttach(attachVisual) {
		let okAttachTypes = ["stock", "variable", "converter", "flow"];
		if (attachVisual.getType() === "converter") {
			let linkedPrims = getLinkedPrimitives(findID(attachVisual.id)).filter((prim) => {
				// filter out linked primitives that have the same source as this link.
				let source = findID(this.id).source;
				if (source) {
					return getID(prim) !== getID(source);
				}
				return false;
			});
			// only allow converter to have one ingoing link 
			return linkedPrims.length < 1;
		}
		return okAttachTypes.includes(attachVisual.getType()) && attachVisual.is_ghost !== true;
	}

	setStartAttach(new_start_attach) {
		super.setStartAttach(new_start_attach)
		if (this._end_attach) {
			this._end_attach.updateDefinitionError();
			this._end_attach.update();
		}
	}
	setEndAttach(new_end_attach) {
		let old_end_attach = this._end_attach;
		super.setEndAttach(new_end_attach);
		if (new_end_attach != null && new_end_attach.getType() == "stock") {
			this.dashLine();
		} else {
			this.undashLine();
		}
		if (old_end_attach) {
			old_end_attach.updateDefinitionError();
			old_end_attach.update();
		}
		if (new_end_attach) {
			new_end_attach.updateDefinitionError();
			new_end_attach.update();
		}
	}

	clean() {
		// remove end_attach to make sure end_attach value error is updated 
		this.setEndAttach(null);
		super.clean();
	}
	clearImage() {
		super.clearImage();
		// curve must be removed seperatly since it is not part of any group 
		this.curve.remove();
	}

	setColor(color) {
		this.color = color;
		this.primitive.setAttribute("Color", this.color);
		this.curve.setAttribute("stroke", color);
		this.arrowPath.setAttribute("stroke", color);
		this.start_anchor.setColor(color);
		this.end_anchor.setColor(color);
		this.b1_anchor.setColor(color);
		this.b2_anchor.setColor(color);
		this.b1_line.setAttribute("stroke", color);
		this.b2_line.setAttribute("stroke", color);
	}

	makeGraphics() {
		let [x1, y1] = this.start_anchor.getPos();
		let [x2, y2] = this.b1_anchor.getPos();
		let [x3, y3] = this.b2_anchor.getPos();
		let [x4, y4] = this.end_anchor.getPos();

		this.arrowPath = SVG.fromString(`<path d="M0,0 -4,12 4,12 Z" stroke="black" fill="white"/>`);
		this.arrowHead = SVG.group([this.arrowPath]);
		SVG.translate(this.arrowHead, x4, y4);

		this.click_area = SVG.curve("twoway",x1, y1, x2, y2, x3, y3, x4, y4, { "pointer-events": "all", "stroke": "transparent", "stroke-width": "10" });
		this.curve = SVG.append(SVG.linkLayer, 
			SVG.curve("oneway", x1, y1, x2, y2, x3, y3, x4, y4, { "stroke": "black", "stroke-width": "1" })
		);
		this.click_area.draggable = false;
		this.curve.draggable = false;

		// curve is not included in group since it is one-way and will therefore span an area
		// The area will be clickable if included in the group 
		this.group = SVG.append(SVG.linkLayer, 
			SVG.group([this.click_area, this.arrowHead])
		);
		this.group.setAttribute("node_id", this.id);

		this.b1_line = SVG.append(SVG.linkLayer, SVG.line(x1, y1, x2, y2, "black", "black", "", { "stroke-dasharray": "5 5" }));
		this.b2_line = SVG.append(SVG.linkLayer, SVG.line(x4, y4, x3, y3, "black", "black", "", { "stroke-dasharray": "5 5" }));

		this.showOnlyOnSelect = [this.b1_line, this.b2_line];

		this.element_array = this.element_array.concat([this.b1_line, this.b2_line]);
	}
	dashLine() {
		this.curve.setAttribute("stroke-dasharray", "6 4");
	}
	undashLine() {
		this.curve.setAttribute("stroke-dasharray", "");
	}
	resetBezierPoints() {
		let obj1 = this.getStartAttach();
		let obj2 = this.getEndAttach();
		if (!obj1 || !obj2) {
			return;
		}
		this.start_anchor.setPos(obj1.getLinkMountPos(obj2.getPos()));
		this.end_anchor.setPos(obj2.getLinkMountPos(obj1.getPos()));
		this.resetBezier1();
		this.resetBezier2();
		this.update();
	}
	resetBezier1() {
		this.b1Local = [0.3, 0];
	}
	resetBezier2() {
		this.b2Local = [0.7, 0];
	}
	syncAnchorToPrimitive(anchorType) {
		super.syncAnchorToPrimitive(anchorType);

		let startpos = this.start_anchor.getPos();
		let endpos = this.end_anchor.getPos();
		let b1pos = this.b1_anchor.getPos();
		let b2pos = this.b2_anchor.getPos();

		switch (anchorType) {
			case "start":
				this.curve.x1 = startpos[0];
				this.curve.y1 = startpos[1];
				this.curve.update();

				this.b1_line.setAttribute("x1", startpos[0]);
				this.b1_line.setAttribute("y1", startpos[1]);
				break;
			case "end":
				this.curve.x4 = endpos[0];
				this.curve.y4 = endpos[1];
				this.curve.update();


				this.b2_line.setAttribute("x1", endpos[0]);
				this.b2_line.setAttribute("y1", endpos[1]);
				break;
			case "bezier1":
					this.curve.x2 = b1pos[0];
					this.curve.y2 = b1pos[1];
					this.curve.update();

					this.b1_line.setAttribute("x2", b1pos[0]);
					this.b1_line.setAttribute("y2", b1pos[1]);

					this.primitive.setAttribute("b1x", b1pos[0]);
					this.primitive.setAttribute("b1y", b1pos[1]);
				break;
			case "bezier2":
					this.curve.x3 = b2pos[0];
					this.curve.y3 = b2pos[1];
					this.curve.update();

					this.b2_line.setAttribute("x2", b2pos[0]);
					this.b2_line.setAttribute("y2", b2pos[1]);

					this.primitive.setAttribute("b2x", b2pos[0]);
					this.primitive.setAttribute("b2y", b2pos[1]);
				break;
		}
		this.updateClickArea();
	}
	updateGraphics() {
		// The arrow is pointed from the second bezier point to the end
		let b2pos = this.b2_anchor.getPos();

		let xdiff = this.endX - b2pos[0];
		let ydiff = this.endY - b2pos[1];
		let angle = Math.atan2(xdiff, -ydiff) * (180 / Math.PI);
		SVG.transform(this.arrowHead, this.endX, this.endY, angle, 1);

		// Update end position so that we get the drawing effect when link is created
		this.curve.x4 = this.endX;
		this.curve.y4 = this.endY;
		this.curve.update();
	}
	update() {
		// This function is similar to TwoPointer::update but it takes attachments into account

		// Get start position from attach
		// _start_anchor is null if we are currently creating the connection
		// _start_attach is null if we are not attached to anything

		if (this.getStartAttach() != null && this.start_anchor != null) {
			if (this.getStartAttach().getPos) {
				let oldPos = this.start_anchor.getPos();
				let newPos = this.getStartAttach().getLinkMountPos(this.b1_anchor.getPos());
				// If start point have moved reset b1
				if (oldPos[0] != newPos[0] || oldPos[1] != newPos[1]) {
					this.start_anchor.setPos(newPos);
				}
			}
		}
		if (this.getEndAttach() != null && this.end_anchor != null) {
			if (this.getEndAttach().getPos) {
				let oldPos = this.end_anchor.getPos();
				let newPos = this.getEndAttach().getLinkMountPos(this.b2_anchor.getPos());
				// If end point have moved reset b2
				if (oldPos[0] != newPos[0] || oldPos[1] != newPos[1]) {
					this.end_anchor.setPos(newPos);
				}
			}
		}
		this.keepRelativeHandlePositions();
		// update anchors 
		this.getAnchors().map(anchor => anchor.updatePosition());
		this.updateGraphics();
	}
	keepRelativeHandlePositions() {
		this.b1_anchor.setPos(this.localToWorld(this.b1Local));
		this.b2_anchor.setPos(this.localToWorld(this.b2Local));
	}
	setHandle1Pos(newPos) {
		this.b1Local = this.worldToLocal(newPos);
	}
	setHandle2Pos(newPos) {
		this.b2Local = this.worldToLocal(newPos);
	}
}

class BaseTool {
	static init() {
		this.middleDownX = 0;
		this.middleDownY = 0;
		this.downScrollPosX = 0;
		this.downScrollPosY = 0;
	}
	static leftMouseDown(x, y) {
		// Is triggered when mouse goes down for this tool
	}
	static mouseMove(x, y, shiftKey) {
		// Is triggered when mouse moves
	}
	static leftMouseUp(x, y, shiftKey) {
		// Is triggered when mouse goes up for this tool
	}
	static rightMouseDown(x, y) {
		// Is triggered when right mouse is clicked for this tool 
	}
	static enterTool(mouseButton) {
		// Is triggered when the tool is selected
	}
	static leaveTool() {
		// Is triggered when the tool is deselected
	}
}
BaseTool.init();

class RunTool extends BaseTool {
	static enterTool() {
		/* Check that all primitives are defined */
		let definitionErrorPrims = DefinitionError.getAllPrims();
		if (definitionErrorPrims.length !== 0) {
			let prim = definitionErrorPrims[0];
			let name = prim.getAttribute("name");
			let color = prim.getAttribute("Color");
			let alert = new XAlertDialog(`
				Definition Error in <b style="color:${color};">${name}</b>: <br/><br/>
				&nbsp &nbsp ${DefinitionError.getMessage(prim)}
			`, () => {
				get_object(getID(prim)).doubleClick();
			});
			alert.setTitle("Unable to Simulate");
			alert.show();
			unselect_all();
			(object_array[prim.id] ?? connection_array[prim.id]).select();
			InfoBar.update();
		} else {
			RunResults.runPauseSimulation();
		}
		ToolBox.setTool("mouse");
	}
}

class StepTool extends BaseTool {
	static enterTool() {
		RunResults.stepSimulation();
		ToolBox.setTool("mouse");
	}
}

class ResetTool extends BaseTool {
	static enterTool() {
		RunResults.resetSimulation();
		ToolBox.setTool("mouse");
	}
}

class DeleteTool extends BaseTool {
	static enterTool() {
		let selected_ids = Object.keys(get_selected_root_objects());
		if (selected_ids.length == 0) {
			xAlert("You must select at least one primitive to delete");
			ToolBox.setTool("mouse");
			return;
		}
		delete_selected_objects();
		History.storeUndoState();
		InfoBar.update();
		ToolBox.setTool("mouse");
	}
}
DeleteTool.init();

class UndoTool extends BaseTool {
	static enterTool() {
		History.doUndo();
		ToolBox.setTool("mouse");
	}
}
UndoTool.init();

class RedoTool extends BaseTool {
	static enterTool() {
		History.doRedo();
		ToolBox.setTool("mouse");
	}
}
RedoTool.init();

class OnePointCreateTool extends BaseTool {
	constructor() {
		this.rightClickMode = false;
	}
	static enterTool(mouseButton) {
		this.rightClickMode = (mouseButton === mouse.right);
	}
	static create(x, y) {
		// This function should be over written
	}
	static leftMouseDown(x, y) {
		unselect_all();
		this.create(x, y);
		update_relevant_objects([]);
		InfoBar.update();
	}
	static leftMouseUp(x, y) {
		if (!this.rightClickMode) {
			ToolBox.setTool("mouse");
		}
	}
	static rightMouseDown(x, y) {
		unselect_all();
		ToolBox.setTool("mouse");
		InfoBar.update();
	}
}

class NumberboxTool extends OnePointCreateTool {
	static init() {
		this.targetPrimitive = null;
		this.numberboxable_primitives = ["stock", "variable", "constant", "converter", "flow"];
	}
	static create(x, y) {
		// The right place to  create primitives and elements is in the tools-layers
		let primitive_name = findFreeName(type_basename["text"]);
		let size = type_size["text"];

		this.primitive = createPrimitive(name, "Numberbox", [x, y], [0, 0]);
		this.primitive.setAttribute("Target", this.targetPrimitive);
	}
	static enterTool() {
		let selected_ids = Object.keys(get_selected_root_objects());
		if (selected_ids.length != 1) {
			if (selected_ids.length == 0) {
				xAlert("You must first select a primitive for the Number Box.");
			} else {
				xAlert("You must first select exactly one primitive for the Number Box.");
			}
			ToolBox.setTool("mouse");
			return;
		}

		let selected_object = get_object(selected_ids[0]);
		if (this.numberboxable_primitives.indexOf(selected_object.type) == -1) {
			xAlert("This primitive can not have a Number Box");
			ToolBox.setTool("mouse");
			return;
		}
		if (isPrimitiveGhost(findID(selected_ids[0]))) {
			this.targetPrimitive = findID(selected_ids[0]).getAttribute("Source");
		} else {
			this.targetPrimitive = selected_ids[0];
		}
	}
}
NumberboxTool.init();


class StockTool extends OnePointCreateTool {
	static create(x, y) {
		// The right place to  create primitives and elements is in the tools-layers
		let primitive_name = findFreeName(type_basename["stock"]);
		let size = type_size["stock"];
		let new_stock = createPrimitive(primitive_name, "Stock", [x - size[0] / 2, y - size[1] / 2], size);
	}
}

class RotateNameTool extends BaseTool {
	static enterTool() {
		let selection = get_selected_objects();
		for (let node_id in selection) {
			rotate_name(node_id);
		}
		ToolBox.setTool("mouse");
	}
	static leaveTool() {
		History.storeUndoState();
	}
}

class MoveValveTool extends BaseTool {
	static enterTool() {
		let selection = get_selected_objects();
		for (let node_id in selection) {
			let obj = get_object(node_id);
			if (obj.type == "flow") {
				obj.moveValve();
			}
		}
		ToolBox.setTool("mouse");
	}
}

class StraightenLinkTool extends BaseTool {
	static enterTool() {
		for (let node_id in get_selected_objects()) {
			let key = get_parent_id(node_id);
			let obj = get_object(key);
			if (obj.type == "link") {
				obj.resetBezierPoints();
			}
		}
		ToolBox.setTool("mouse");
	}

}

class GhostTool extends OnePointCreateTool {
	static init() {
		this.id_to_ghost = null;
		this.ghostable_primitives = ["stock", "variable", "constant", "converter"];
	}
	static create(x, y) {
		let source = findID(this.id_to_ghost);
		let ghost = makeGhost(source, [x, y]);
		ghost.setAttribute("RotateName", "0");
		syncVisual(ghost);
		let DIM_ghost = get_object(ghost.getAttribute("id"));
		source.subscribeAttribute(DIM_ghost.changeAttributeHandler);
	}
	static enterTool() {
		let selectedIds = get_selected_ids();
		// filter out non root object, e.g. anchors 
		let selectedObjects = selectedIds.filter(id => !id.includes(".")).map(get_object);
		if (selectedObjects.length != 1) {
			xAlert("You must first select exactly one primitive to ghost");
			ToolBox.setTool("mouse");
			return;
		}
		let selectedObject = selectedObjects[0];
		if (selectedObject.is_ghost) {
			xAlert("You cannot ghost a ghost");
			ToolBox.setTool("mouse");
			return;
		}
		if (this.ghostable_primitives.indexOf(selectedObject.type) == -1) {
			xAlert(`This primitive is not ghostable`);
			ToolBox.setTool("mouse");
			return;
		}
		this.id_to_ghost = selectedObjects[0].id;
	}
}
GhostTool.init();

class ConverterTool extends OnePointCreateTool {
	static create(x, y) {
		// The right place to  create primitives and elements is in the tools-layers
		let primitive_name = findFreeName(type_basename["converter"]);
		let size = type_size["converter"];
		let new_converter = createPrimitive(primitive_name, "Converter", [x - size[0] / 2, y - size[1] / 2], size);
	}
}

class VariableTool extends OnePointCreateTool {
	static create(x, y) {
		// The right place to  create primitives and elements is in the tools-layers
		let primitive_name = findFreeName(type_basename["variable"]);
		let size = type_size["variable"];
		let newVariable = createPrimitive(
			primitive_name,
			"Variable",
			[x - size[0] / 2, y - size[1] / 2],
			size,
			{ "isConstant": false }
		);
	}
}

class ConstantTool extends OnePointCreateTool {
	static create(x, y) {
		let primitiveName = findFreeName(type_basename["constant"]);
		let size = type_size["variable"];
		let newConstant = createPrimitive(
			primitiveName,
			"Variable",
			[x - size[0] / 2, y - size[1] / 2],
			size,
			{ "isConstant": true }
		);
	}
}

function get_only_selected_anchor_id() {
	// returns null if more is selected than one anchor is selected, else returns object {parent_id: ... , child_id: ... }
	let selection = get_selected_objects();
	let keys = [];
	for (let key in selection) {
		keys.push(key);
	}
	if (keys.length === 1 && selection[keys[0]].getType() === "dummy_anchor") {
		// only one anchor in selection
		return { "parent_id": get_parent_id(keys[0]), "child_id": keys[0] };
	} else if (keys.length === 2) {
		if (get_object(keys[0]).getType() === "dummy_anchor" && get_object(keys[1]).getType() === "dummy_anchor") {
			// both anchors are dummies 
			return null;
		} else if (get_parent_id(keys[0]) === get_parent_id(keys[1])) {
			// one anchor and parent object selected 
			let parent_id = null;
			let child_id = null;
			if (get_parent_id(keys[0]) === keys[0]) {
				child_id = keys[1];
				parent_id = keys[0];
			} else {
				child_id = keys[0];
				parent_id = keys[1];
			}
			return { "parent_id": parent_id, "child_id": child_id };
		}
	}
	return null;
}

function get_single_primitive_id_selected() {
	// will give object { "parent_id": ..., "children_ids": [...] } or null if more objects selected 
	let selection = get_selected_objects();
	let keys = [];
	for (let key in selection) {
		keys.push(key);
	}
	let object_ids = { "children_ids": [] };
	if (keys.length > 0) {
		object_ids["parent_id"] = get_parent_id(keys[0]);
		for (let key of keys) {
			if (get_parent_id(key) !== object_ids["parent_id"]) {
				return null;
			} else if (get_parent_id(key) !== key) {
				object_ids["children_ids"].push(key);
			}
		}
		return object_ids;
	}
	return null;
}

function get_only_link_selected() {
	let object_ids = get_single_primitive_id_selected();
	if (object_ids !== null && get_object(object_ids["parent_id"]).getType() === "link") {
		return object_ids;
	}
	return null;
}

class MouseTool extends BaseTool {
	static leftMouseDown(x, y) {
		mousedown_x = x;
		mousedown_y = y;
		do_global_log("last_click_object_clicked " + last_click_object_clicked);
		if (!last_click_object_clicked) {
			empty_click_down = true;
			RectSelector.start(mousedown_x, mousedown_y);
		}

		let selected_anchor = get_only_selected_anchor_id();
		// Only one anchor is selected AND that that anchor has attaching capabilities 
		if (selected_anchor && connection_array[selected_anchor.parent_id].getStartAttach) {
			let parent = connection_array[selected_anchor.parent_id];
			// Detach anchor 
			switch (object_array[selected_anchor.child_id].getAnchorType()) {
				case "start":
					parent.setStartAttach(null);
					break;
				case "end":
					parent.setEndAttach(null);
					break;
			}
		}

		// Reset it for use next time
		last_click_object_clicked = false;
	}
	static mouseMove(x, y, shiftKey) {
		let diff_x = x - mousedown_x;
		let diff_y = y - mousedown_y;
		mousedown_x = x;
		mousedown_y = y;

		if (empty_click_down) {
			RectSelector.move(mousedown_x, mousedown_y);
			return;
		}
		// We only come here if some object is being dragged
		// Otherwise we will trigger empty_click_down
		let only_selected_anchor = get_only_selected_anchor_id();
		let only_selected_link = get_only_link_selected();
		if (only_selected_anchor) {
			// Use equivalent tool type
			// 	RectangleVisual => RectangleTool
			// 	LinkVisual => LinkTool
			let parent = connection_array[only_selected_anchor["parent_id"]];
			let tool = ToolBox.tools[parent.type];
			tool.mouseMoveSingleAnchor(x, y, shiftKey, only_selected_anchor["child_id"]);
			parent.update();
		} else if (only_selected_link) {
			// special exeption for links of links is being draged directly 
			LinkTool.mouseRelativeMoveSingleAnchor(diff_x, diff_y, shiftKey, only_selected_link["parent_id"] + ".b1_anchor");
			LinkTool.mouseRelativeMoveSingleAnchor(diff_x, diff_y, shiftKey, only_selected_link["parent_id"] + ".b2_anchor");
			let parent = connection_array[only_selected_link["parent_id"]];
			parent.update();
		} else {
			let move_array = get_selected_objects();
			this.defaultRelativeMove(move_array, diff_x, diff_y);
		}
	}
	static defaultRelativeMove(move_objects, diff_x, diff_y) {
		let objectMoved = false;
		for (let key in move_objects) {
			if (move_objects[key].draggable == undefined) {
				continue;
			}
			if (move_objects[key].draggable == false) {
				do_global_log("skipping because of no draggable");
				continue;
			}

			objectMoved = true;
			// This code is not very optimised. If we want to optimise it we should just find the objects that needs to be updated recursivly
			rel_move(key, diff_x, diff_y);
		}
		if (objectMoved) {
			// TwoPointer objects depent on OnePointer object (e.g. AnchorPoint, Stock, Auxiliary etc.)
			// Therefore they must be updated seprately 
			let ids = [];
			for (let key in move_objects) {
				ids.push(move_objects[key].id);
			}
			update_relevant_objects(ids);
		}
	}
	static leftMouseUp(x, y) {
		// Check if we selected only 1 anchor element and in that case detach it;
		let selected_anchor = get_only_selected_anchor_id();

		if (selected_anchor && connection_array[selected_anchor.parent_id].getStartAttach) {
			let parent = connection_array[selected_anchor.parent_id];
			let tool = ToolBox.tools[parent.getType()];
			tool.mouseUpSingleAnchor(x, y, false, selected_anchor.child_id);
		}

		if (empty_click_down) {
			RectSelector.stop();
			empty_click_down = false;
		}
	}
	static rightMouseDown(x, y) {
		let only_selected_anchor = get_only_selected_anchor_id();
		if (only_selected_anchor &&
			connection_array[only_selected_anchor["parent_id"]].getType() === "flow" &&
			object_array[only_selected_anchor["child_id"]].getAnchorType() === "end") {
			FlowTool.rightMouseDown(x, y);
		}
	}
}

class TwoPointerTool extends BaseTool {
	static init() {
		this.primitive = null; // The primitive in Insight Maker engine we are creating
		this.current_connection = null; // The visual we are working on right now
		this.type = "flow";
		this.rightClickMode = false;
	}
	static enterTool(mouseButton) {
		this.rightClickMode = (mouseButton === mouse.right);
	}
	static getType() {
		return "none";
	}
	static createTwoPointer(x, y, name) {
		// Override this and do a for example: 
		// Example: this.primitive = createConnector(name, "Flow", null,null);
		// Example: this.current_connection = new FlowVisual(this.primitive.id,this.getType(),[x,y]);
	}
	static leftMouseDown(x, y) {
		unselect_all();

		// Looks for element under mouse. 
		let start_element = find_element_under(x, y);

		// Finds free name for primitive. e.g. "stock1", "stock2", "variable1" etc. (Visible to the user)
		let primitive_name = findFreeName(type_basename[this.getType()]);
		this.createTwoPointer(x, y, primitive_name);

		// subscribes to changes in insight makers x and y positions. (these valus are then saved)
		this.primitive.subscribePosition(this.current_connection.positionUpdateHandler);
		if (start_element != null && this.current_connection.getStartAttach) {
			this.current_connection.setStartAttach(get_parent(start_element));
		}
		this.current_connection.setName(primitive_name);

		// make sure start anchor is synced with primitive 
		this.current_connection.syncAnchorToPrimitive("start");
	}
	static mouseMove(x, y, shiftKey) {
		// Function used during creation of twopointer
		if (this.current_connection == null) {
			return;
		}
		this.current_connection.select();
		let move_node_id = `${this.current_connection.id}.end_anchor`;
		this.mouseMoveSingleAnchor(x, y, shiftKey, move_node_id);
	}
	static mouseMoveSingleAnchor(x, y, shiftKey, node_id) {
		// Function used both during creation and later moving of anchor point 
		let moveObject = get_object(node_id);
		let parent = get_parent(moveObject);
		if (shiftKey) {
			let [oppositeX, oppositeY] = [parent.startX, parent.startY];
			if (parent.start_anchor.id === node_id) {
				[oppositeX, oppositeY] = [parent.endX, parent.endY];
			}
			let sideX = x - oppositeX;
			let sideY = y - oppositeY;
			let shortSideLength = Math.min(Math.abs(sideX), Math.abs(sideY));
			let signX = Math.sign(sideX);
			let signY = Math.sign(sideY);
			moveObject.setPos([oppositeX + signX * shortSideLength, oppositeY + signY * shortSideLength]);
		} else {
			moveObject.setPos([x, y]);
		}
		parent.update();
		object_array[node_id].updatePosition();
	}
	static leftMouseUp(x, y, shiftKey) {
		this.current_connection.update();
		this.current_connection = null;
		last_clicked_element = null;
		if (this.rightClickMode === false) {
			ToolBox.setTool("mouse");
		}
	}
	static rightMouseDown(x, y) {
		ToolBox.setTool("mouse");
	}
	static leaveTool() {
		last_clicked_element = null;
	}
}

class FlowTool extends TwoPointerTool {
	static init() {
		super.init();
		// Is to prevent error if rightdown happens before leftdown 
		// can be either "x" or "y" 
		this.direction = "";
	}
	static leftMouseDown(x, y) {

	}
	static mouseMove(x, y) {
		if (this.current_connection) {
			this.mouseMoveSingleAnchor(x, y, false, this.current_connection.end_anchor.id);
		} else {
			// First time moving mouse 
			this.firstLeftMouseMove(x, y);
		}
	}
	static firstLeftMouseMove(x, y) {
		// does not create anything until the first leftMouseMove have been triggered 
		super.leftMouseDown(x, y);
	}
	static mouseMoveSingleAnchor(x, y, shiftKey, anchor_id) {
		// Function used both during creation and later moving of anchor point 
		let mainAnchor = get_object(anchor_id);
		let parent = get_parent(mainAnchor);

		parent.requestNewAnchorPos([x, y], anchor_id);
		parent.update();
		// update connecting links 
		find_connections(parent).map(conn => conn.update());
	}
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Flow", null, null);
		setNonNegative(this.primitive, false); 			// What does this do?

		this.current_connection = new FlowVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
		this.current_connection.name_pos = Number(this.primitive.getAttribute("RotateName"));

		unselect_all_other_anchors(this.current_connection.id, this.current_connection.end_anchor.id);
		update_name_pos(this.primitive.id);
	}
	static rightMouseDown(x, y) {
		if (leftmouseisdown) {
			let only_selected_anchor = get_only_selected_anchor_id();
			if (only_selected_anchor) {
				let parent = connection_array[only_selected_anchor["parent_id"]];
				let child = object_array[only_selected_anchor["child_id"]];
				if (parent.getType() === "flow" && child.getAnchorType() === "end") {
					let prevAnchorPos = parent.getPreviousAnchor(child.id).getPos();
					if (distance(prevAnchorPos, [x, y]) < 10) {
						if (parent.middleAnchors.length > 0) {
							// remove last middle anchor
							parent.removeLastMiddleAnchorPoint();
						}
					} else {
						// Add middle anchor 
						parent.createMiddleAnchorPoint(x, y);
						unselect_all_other_anchors(parent.id, child.id);
					}
				}
			}
		} else {
			// bugfix: unselect to not unattach on next empty click
			unselect_all();
			ToolBox.setTool("mouse");
		}
	}
	static leftMouseUp(x, y, shiftKey) {
		if (this.current_connection) {
			this.mouseUpSingleAnchor(x, y, shiftKey, this.current_connection.end_anchor.id);
			this.current_connection = null;
			last_clicked_element = null;

			if (this.rightClickMode === false) {
				// bugfix: unselect to not unattach on next empty click
				unselect_all();
				ToolBox.setTool("mouse");
			}
		}
	}
	static mouseUpSingleAnchor(x, y, shiftKey, node_id) {
		attach_anchor(object_array[node_id]);
	}
	static getType() {
		return "flow";
	}
}
FlowTool.init();


function cleanUnconnectedLinks() {
	let allLinks = primitives("Link");
	for (let link of allLinks) {
		let ends = getEnds(link);
		if ((ends[0] == null) || (ends[1] == null)) {
			removePrimitive(link);
		}
	}
}


class TextAreaTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		let primitive_name = findFreeName(type_basename["text"]);
		this.primitive = createConnector(primitive_name, "TextArea", null, null);
		this.current_connection = new TextAreaVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static getType() {
		return "text";
	}
}

class RectangleTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Rectangle", null, null);
		this.current_connection = new RectangleVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static getType() {
		return "rectangle";
	}
}
RectangleTool.init();


class EllipseTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Ellipse", null, null);
		this.current_connection = new EllipseVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static getType() {
		return "ellipse";
	}
}

class LineTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Line", null, null);
		this.current_connection = new LineVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static getType() {
		return "line";
	}
	static mouseMoveSingleAnchor(x, y, shiftKey, node_id) {
		// Function used both during creation and later moving of anchor point 
		let moveObject = get_object(node_id);
		let parent = get_parent(moveObject);
		if (shiftKey) {
			let [oppositeX, oppositeY] = [parent.startX, parent.startY];
			if (parent.start_anchor.id === node_id) {
				[oppositeX, oppositeY] = [parent.endX, parent.endY];
			}
			let sideX = x - oppositeX;
			let sideY = y - oppositeY;
			let shortSideLength = Math.min(Math.abs(sideX), Math.abs(sideY));
			let longSideLength = Math.max(Math.abs(sideX), Math.abs(sideY));
			if (3 * shortSideLength < longSideLength) {
				// Place Horizontal or vertical
				if (Math.abs(sideX) < Math.abs(sideY)) {
					// place vertical |
					moveObject.setPos([oppositeX, y]);
				} else {
					// place Horizontal -
					moveObject.setPos([x, oppositeY]);
				}
			} else {
				// place at 45 degree angle 
				let signX = Math.sign(sideX);
				let signY = Math.sign(sideY);
				moveObject.setPos([oppositeX + signX * shortSideLength, oppositeY + signY * shortSideLength]);
			}
		} else {
			moveObject.setPos([x, y]);
		}
		parent.update();
		object_array[node_id].updatePosition();
	}
}
LineTool.init();

class TableTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Table", null, null);
		this.current_connection = new TableVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x, y);
		setDisplayIds(this.primitive, this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "table";
	}
}
TableTool.init();

class TimePlotTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "TimePlot", null, null);
		this.current_connection = new TimePlotVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		let sides = this.initialSelectedIds.map(() => "L");
		super.leftMouseDown(x, y);
		setDisplayIds(this.primitive, this.initialSelectedIds, sides);
		this.current_connection.render();
	}
	static getType() {
		return "timeplot";
	}
}

class ComparePlotTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "ComparePlot", null, null);
		this.current_connection = new ComparePlotVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x, y)
		setDisplayIds(this.primitive, this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "compareplot";
	}
}
ComparePlotTool.init();

class XyPlotTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "XyPlot", null, null);
		this.current_connection = new XyPlotVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x, y)
		setDisplayIds(this.primitive, this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "xyplot";
	}
}
XyPlotTool.init();


class HistoPlotTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "HistoPlot", null, null);
		this.current_connection = new HistoPlotVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x, y);
		setDisplayIds(this.primitive, this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "histoplot";
	}
}

class LinkTool extends TwoPointerTool {
	static createTwoPointer(x, y, name) {
		this.primitive = createConnector(name, "Link", null, null);
		this.current_connection = new LinkVisual(this.primitive.id, this.getType(), [x, y], [x + 1, y + 1]);
	}
	static mouseMoveSingleAnchor(x, y, shiftKey, node_id) {
		let anchor_type = node_id.split(".")[1];
		if (anchor_type === "start_anchor" || anchor_type === "end_anchor") {
			let moveObject = get_object(node_id);
			let parent = get_parent(moveObject);
			moveObject.setPos([x, y]);
			parent.update();
		} else if (anchor_type === "b1_anchor") {
			let parent = connection_array[get_parent_id(node_id)];
			parent.setHandle1Pos([x, y]);
			parent.update();
		} else if (anchor_type === "b2_anchor") {
			let parent = connection_array[get_parent_id(node_id)];
			parent.setHandle2Pos([x, y]);
			parent.update();
		}
	}
	static mouseRelativeMoveSingleAnchor(diff_x, diff_y, shiftKey, move_node_id) {
		let start_pos = get_object(move_node_id).getPos();
		this.mouseMoveSingleAnchor(start_pos[0] + diff_x, start_pos[1] + diff_y, shiftKey, move_node_id);
	}
	static mouseUpSingleAnchor(x, y, shiftKey, node_id) {
		this.mouseMoveSingleAnchor(x, y, shiftKey, node_id);
		let anchor = object_array[node_id];
		let parent = get_parent(anchor);
		if (anchor.getAnchorType() === "start" || anchor.getAnchorType() === "end") {
			attach_anchor(anchor);
			parent.update();
			if (parent.getStartAttach() === null || parent.getEndAttach() === null) {
				// delete link is not attached at both ends 
				delete_selected_objects();
			}
		} else if (anchor.getAnchorType() === "bezier1" || anchor.getAnchorType() === "bezier2") {
			parent.update();
		}
	}
	static leftMouseUp(x, y, shiftKey) {
		this.mouseUpSingleAnchor(x, y, shiftKey, this.current_connection.end_anchor.id);

		this.current_connection = null;
		last_clicked_element = null;
		if (this.rightClickMode === false) {
			ToolBox.setTool("mouse");
		}
	}
	static getType() {
		return "link";
	}
}
LinkTool.init();

function attach_anchor(anchor) {
	[x, y] = anchor.getPos();
	let parentConnection = get_parent(anchor);

	let elements_under = find_elements_under(x, y);
	let anchor_element = null;
	let attach_to = null;


	// Find unselected stock element
	for (let i = 0; i < elements_under.length; i++) {
		let element = elements_under[i];

		let elemIsNotSelected = !element.isSelected();
		let elemIsNotParentOfAnchor = element[i] != parentConnection;
		if (elemIsNotSelected && elemIsNotParentOfAnchor) {
			attach_to = element;
			break;
		}
	}
	if (attach_to == null) {
		return false;
	}

	switch (anchor.getAnchorType()) {
		case "start":
			parentConnection.setStartAttach(attach_to);
			break;
		case "end":
			parentConnection.setEndAttach(attach_to);
			break;
	}

	parentConnection.update();
	return true;
}

var currentTool = MouseTool;

class CoordRect {
	constructor() {
		this.x1 = 0;
		this.y1 = 0;
		this.x2 = 0;
		this.y2 = 0;
		this.element = null; // This is set at page ready
	}
	setVisible(new_visible) {
		this.element.setAttribute("visibility", new_visible ? "visible" : "hidden");
	}
	xmin() {
		return this.x1 < this.x2 ? this.x1 : this.x2;
	}
	ymin() {
		return this.y1 < this.y2 ? this.y1 : this.y2;
	}
	width() {
		return Math.abs(this.x2 - this.x1);
	}
	height() {
		return Math.abs(this.y2 - this.y1);
	}
	update() {
		this.element.setAttribute("x", this.xmin());
		this.element.setAttribute("y", this.ymin());

		this.element.setAttribute("width", this.width());
		this.element.setAttribute("height", this.height());
	}
}

class RectSelector {
	/** @type {CoordRect} coordRect */
	static coordRect;
	static init() {
		RectSelector.coordRect = new CoordRect();
		RectSelector.coordRect.element = SVG.append(SVG.svgElement, SVG.rect(-30, -30, 60, 60, "black", "none", "rect-selector"));
		RectSelector.coordRect.element.setAttribute("stroke-dasharray", "4 4");
		RectSelector.coordRect.setVisible(false);
	}
	/** 
	 * @param {number} x  
	 * @param {number} y 
	*/
	static start(x, y) {
		unselect_all();
		RectSelector.coordRect.setVisible(true);
		RectSelector.coordRect.x1 = x;
		RectSelector.coordRect.y1 = y;
		RectSelector.coordRect.x2 = x;
		RectSelector.coordRect.y2 = y;
		RectSelector.coordRect.update();
	}
	/** 
	 * @param {number} x  
	 * @param {number} y 
	*/
	static move(x, y) {
		RectSelector.coordRect.x2 = x;
		RectSelector.coordRect.y2 = y;
		RectSelector.coordRect.update();
		unselect_all();
		let select_array = RectSelector.getObjectsWithin();
		for (let key in select_array) {
			let parent = get_parent(select_array[key]);
			parent.select(false); // We also select the parent but not all of its anchors
			select_array[key].select();
		}
	}
	static stop() {
		RectSelector.coordRect.setVisible(false);
		let select_array = RectSelector.getObjectsWithin();
		for (let key in select_array) {
			select_array[key].select();
		}
	}
	static getObjectsWithin() {
		let return_array = {};
		for (let key in object_array) {
			if (RectSelector.isWithin(key)) {
				return_array[key] = object_array[key];
			}
		}
		return return_array;
	}
	/** @param {string} nodeId  */
	static isWithin(nodeId) {
		return (
			object_array[nodeId].pos[0] >= this.coordRect.xmin() &&
			object_array[nodeId].pos[1] >= this.coordRect.ymin() &&
			object_array[nodeId].pos[0] <= this.coordRect.xmin() + this.coordRect.width() &&
			object_array[nodeId].pos[1] <= this.coordRect.ymin() + this.coordRect.height()
		);
	}
}

function tool_deletePrimitive(id) {
	let primitive = findID(id);

	removePrimitive(primitive);

	// Delete ghosts
	let ghostIDs = findGhostsOfID(id);
	for (let i in ghostIDs) {
		tool_deletePrimitive(ghostIDs[i]);
	}
	cleanUnconnectedLinks();
	detachFlows(id);
	RunResults.removeResultsForId(id);
}

function detachFlows(id) {
	for (let key in connection_array) {
		let connection = connection_array[key];
		if (connection.type == "flow") {
			if (connection.getStartAttach() && connection.getStartAttach().id == id) {
				connection.setStartAttach(null);
				connection.update();
			}
			if (connection.getEndAttach() && connection.getEndAttach().id == id) {
				connection.setEndAttach(null);
				connection.update();
			}
		}
	}
}

function get_selected_root_objects() {
	let result = {};
	let all_objects = get_all_objects();
	for (let key in all_objects) {
		let parent = get_parent(all_objects[key]);

		// If any element is selected we add its parent
		if (all_objects[key].isSelected()) {
			result[parent.id] = parent;
		}
	}
	return result;
}

function get_root_objects() {
	let result = {};
	let all_objects = get_all_objects();
	for (let key in all_objects) {
		if (key.indexOf(".") == -1) {
			result[key] = all_objects[key];
		}
	}
	return result;
}

function delete_selected_objects() {
	// Delete all objects that are selected
	let selection = get_selected_root_objects();
	for (let key in selection) {
		// check if object not already deleted
		// e.i. link gets deleted automatically if any of it's attachments gets deleted
		if (get_object(key)) {
			tool_deletePrimitive(key);
		}
	}
}

function get_selected_objects() {
	let return_array = {};
	for (let key in object_array) {
		if (object_array[key].isSelected()) {
			return_array[key] = object_array[key];
		}
	}
	for (let key in connection_array) {
		if (connection_array[key].isSelected()) {
			return_array[key] = connection_array[key];
		}
	}
	return return_array;
}

function get_selected_ids() {
	return Object.keys(get_selected_objects());
}

function delete_connection(key) {
	if (!(key in connection_array)) {
		return;
	}
	let start_anchor = connection_array[key].start_anchor;
	let end_anchor = connection_array[key].end_anchor;
	let auxiliary = connection_array[key].auxiliary;
	connection_array[key].group.remove();
	delete connection_array[key];

	// Must be done last otherwise the anchors will respawn	
	delete_object(start_anchor.id);
	delete_object(end_anchor.id);
	delete_object(auxiliary.id);
}
function delete_object(node_id) {
	let object_to_delete = object_array[node_id];

	// Delete all references to the object in the connections
	if (object_to_delete.hasOwnProperty("parent_id")) {
		delete_connection(object_to_delete.parent_id);
	}

	for (let i in object_to_delete.selector_array) {
		object_to_delete.selector_array[i].remove();
	}
	for (let key in object_to_delete.element_array) {
		object_to_delete.element_array[key].remove();
	}
	object_to_delete.group.remove();
	delete object_to_delete;
	delete object_array[node_id];
}
function primitive_mousedown(node_id, event, new_primitive) {
	last_clicked_element = get_object(node_id);
	// If we left click directly on the anchors we dont want anything but them selected
	if (event.which === mouse.left) {
		if (last_clicked_element.type == "dummy_anchor") {
			let elementId = get_parent_id(last_clicked_element.id);
			unselect_all_but(elementId);
		} else if (get_only_selected_anchor_id()) {
			unselect_all();
		}
		if (last_clicked_element.isSelected()) {
			if (event.shiftKey) {
				last_clicked_element.unselect();
			}
		} else {
			if (!event.shiftKey) {
				// We don't want to unselect an eventual parent
				// As that will hide other anchors
				let parent_id = get_parent_id(node_id);
				unselect_all_but(parent_id);
			}
			last_clicked_element.select();
		}
		last_click_object_clicked = true;
	}
}

// only updates diagrams, tables, and XyPlots if needed 
function update_relevant_objects(ids) {
	for (let key in object_array) {
		// dont update dummy_anchors, the twopointer parent of the dummy anchor has responsibility of the dummy_anchors 
		if (object_array[key].type !== "dummy_anchor") {
			object_array[key].update();
		}
	}
	update_twopointer_objects(ids);
}

// only updates diagrams, tables, and XyPlots if needed 
function update_twopointer_objects(ids) {
	for (let key in connection_array) {
		let onlyIfRelevant = ["timeplot", "xyplot", "compareplot", "histoplot", "table"];
		if (onlyIfRelevant.includes(connection_array[key].type)) {
			if (ids.includes(key)) {
				connection_array[key].update();
			}
		} else {
			connection_array[key].update();
		}
	}
}

function update_all_objects() {
	for (let key in object_array) {
		object_array[key].update();
	}
	for (let key in connection_array) {
		connection_array[key].update();
	}
}

function get_all_objects() {
	/** @type {{[id: string]: BaseObject }} */
	let result = {}
	for (let key in object_array) {
		result[key] = object_array[key];
	}
	for (let key in connection_array) {
		result[key] = connection_array[key];
	}
	return result;
}

function get_object(id) {
	if (typeof object_array[id] != "undefined") {
		return object_array[id];
	}
	if (typeof connection_array[id] != "undefined") {
		return connection_array[id];
	}
	return false;
}

/** @param {string} id @param {string} new_name */
function set_name(id, new_name) {
	let tobject = get_object(id);
	if (!tobject) {
		return;
	}
	tobject.setName(new_name);
	tobject.afterNameChange();
}
/** @param {string} node_id @param {number} diff_x @param {number} diff_y */
function rel_move(node_id, diff_x, diff_y) {
	let primitive = findID(node_id);
	if (primitive != null) {
		// If its a real primitive (stoch, variable etc) update it in the engine
		let oldPos = getCenterPosition(primitive);
		let newPos = [oldPos[0] + diff_x, oldPos[1] + diff_y];
		setCenterPosition(primitive, newPos);
	} else {
		// If its not a real primtiive but rather an anchor point updated the position only graphically
		object_array[node_id].pos[0] += diff_x;
		object_array[node_id].pos[1] += diff_y;
	}
	object_array[node_id].updatePosition();
	object_array[node_id].afterMove(diff_x, diff_y);
}

function positionToModel() {

}


function unselect_all_other_anchors(parent_id, child_id_to_select) {
	unselect_all();
	let parent = connection_array[parent_id];
	parent.select();
	for (let anchor of parent.getAnchors()) {
		if (anchor.id !== child_id_to_select) {
			anchor.unselect();
		}
	}
}

function unselect_all() {
	for (let key in object_array) {
		object_array[key].unselect();
	}
	for (let key in connection_array) {
		connection_array[key].unselect();
	}
}

function unselect_all_but(dont_unselect_id) {
	for (let key in object_array) {
		if (key != dont_unselect_id) {
			object_array[key].unselect();
		}
	}
	for (let key in connection_array) {
		if (key != dont_unselect_id) {
			connection_array[key].unselect();
		}
	}
}

function rotate_name(node_id) {
	let object = get_object(node_id);
	if (object.name_pos < 3) {
		object.name_pos++;
	} else {
		object.name_pos = 0;
	}
	update_name_pos(node_id);
}

function update_name_pos(node_id) {
	let object = get_object(node_id);
	let name_element = object.name_element;
	// Some objects does not have name element
	if (name_element == null) {
		return;
	}
	// For fixed names (used only by text element)
	if (object.name_centered) {
		name_element.setAttribute("x", 0); //Set path's data
		name_element.setAttribute("y", 0); //Set path's data
		name_element.setAttribute("text-anchor", "middle");
		return;
	}

	let visualObject = get_object(node_id);
	let pos = visualObject.namePosList[visualObject.name_pos];
	name_element.setAttribute("x", pos[0]); //Set path's data
	name_element.setAttribute("y", pos[1]); //Set path's data

	switch (get_object(node_id).name_pos) {
		case 0:
			// Below
			name_element.setAttribute("text-anchor", "middle");
			break;
		case 1:
			// To the right
			name_element.setAttribute("text-anchor", "start");
			break;
		case 2:
			// Above
			name_element.setAttribute("text-anchor", "middle");
			break;
		case 3:
			// To the left
			name_element.setAttribute("text-anchor", "end");
			break;
	}
}

class MousePan {
	/** @type {{x: number, y: number}} */
	static downAt;
	static middleIsDown;
	static init() {
		document.body.addEventListener("mouseleave", () => MousePan.end())
	}
	static start(x, y) {
		this.downAt = {x, y};
		this.middleIsDown = true;
		SVG.svgElement.classList.add("panning")
	}
	static move(x, y) {
		SVG.svgElement.parentElement.scrollBy(this.downAt.x - x, this.downAt.y - y);
	}
	static end() {
		SVG.svgElement.classList.remove("panning")
		this.middleIsDown = false;
	}
 }

function mouseDownHandler(event) {
	do_global_log("mouseDownHandler");
	if (!isTimeUnitOk(getTimeUnits()) && Preferences.get("forceTimeUnit")) {
		event.preventDefault();
		timeUnitDialog.show();
		return;
	}
	let offset = $(SVG.svgElement).offset();
	let x = event.pageX - offset.left;
	let y = event.pageY - offset.top;
	do_global_log("x:" + x + " y:" + y);
	switch (event.which) {
		case mouse.left:
			// if left mouse button down
			leftmouseisdown = true;
			currentTool.leftMouseDown(x, y);
			break;
		case mouse.middle: 
			event.preventDefault()
			MousePan.start(x, y)
			break;
		case mouse.right:
			// if right mouse button down
			currentTool.rightMouseDown(x, y);
			break;
	}
}
function mouseMoveHandler(event) {
	let offset = $(SVG.svgElement).offset();
	let x = event.pageX - offset.left;
	let y = event.pageY - offset.top;

	lastMouseX = x;
	lastMouseY = y;

	if (leftmouseisdown) {
		currentTool.mouseMove(x, y, event.shiftKey);
	}
	if (MousePan.middleIsDown) {
		event.preventDefault()
		MousePan.move(x, y)
	}
	
}
function mouseUpHandler(event) {
	if (event.which === mouse.left) {
		if (!leftmouseisdown) {
			return;
		}
		// does not work to store UndoState here, because mouseUpHandler happens even when we are outside the svg (click buttons etc)
		do_global_log("mouseUpHandler");
		let offset = $(SVG.svgElement).offset();
		let x = event.pageX - offset.left;
		let y = event.pageY - offset.top;

		currentTool.leftMouseUp(x, y, event.shiftKey);
		leftmouseisdown = false;
		InfoBar.update();
		History.storeUndoState();		
	} else if (event.which == mouse.middle) {
		event.preventDefault()
		MousePan.end()
	}
}

function find_elements_under(x, y) {
	let found_array = [];
	let objects = get_all_objects();
	// Having "flow" in this list causes a bug with flows that does not place properly
	//~ let attachable_object_types = ["flow", "stock", "variable"];
	let attachable_object_types = ["flow", "stock", "constant", "variable", "converter"];
	for (key in objects) {
		if (objects[key].type == "dummy_anchor") {
			// We are only intressted in primitive-objects. not dummy_anchors
			continue;
		}
		if (attachable_object_types.indexOf(objects[key].type) == -1) {
			// We skip if the object is not attachable
			continue;
		}
		let rect = objects[key].getBoundRect();
		if (isInLimits(rect.minX, x, rect.maxX) && isInLimits(rect.minY, y, rect.maxY)) {
			found_array.push(objects[key]);
		}
	}
	do_global_log("found array(" + found_array.length + ") " + found_array.map((x) => x.id).join(","));
	return found_array;
}

function find_element_under(x, y) {
	elements_under = find_elements_under(x, y);
	if (elements_under.length > 0) {
		do_global_log("find_element_under choose " + elements_under[0].id);
		return elements_under[0];
	} else {
		return null;
	}
}

function stochsd_clear_sync() {
	let root_object_array = get_root_objects();
	for (let id in root_object_array) {
		if (findID(id) == null) {
			stochsd_delete_primitive(id);
		}
	}
}

class ToolBox {
	static init() {
		this.tools = {
			"mouse": MouseTool,
			"delete": DeleteTool,
			"undo": UndoTool,
			"redo": RedoTool,
			"stock": StockTool,
			"converter": ConverterTool,
			"variable": VariableTool,
			"constant": ConstantTool,
			"flow": FlowTool,
			"link": LinkTool,
			"rotatename": RotateNameTool,
			"movevalve": MoveValveTool,
			"straightenlink": StraightenLinkTool,
			"ghost": GhostTool,
			"text": TextAreaTool,
			"rectangle": RectangleTool,
			"ellipse": EllipseTool,
			"line": LineTool,
			"table": TableTool,
			"timeplot": TimePlotTool,
			"compareplot": ComparePlotTool,
			"xyplot": XyPlotTool,
			"histoplot": HistoPlotTool,
			"numberbox": NumberboxTool,
			"run": RunTool,
			"step": StepTool,
			"reset": ResetTool
		};
	}
	static setTool(toolName, whichMouseButton) {
		if (toolName in this.tools) {
			$(".tool-button").removeClass("pressed");
			$("#btn_" + toolName).addClass("pressed");

			currentTool.leaveTool();
			currentTool = this.tools[toolName];
			currentTool.enterTool(whichMouseButton);
		} else {
			errorPopUp("The tool " + toolName + " does not exist");
		}
	}
	static getTool() {

	}
}
ToolBox.init();

class ClipboardItem {
	constructor(id) {
		this.id = id;
		this.absolutePosition = [0, 0];
		this.relativePosition = [0, 0];
	}
}

class Clipboard {
	static init() {
		this.copiedItems = [];
	}
	static copyObject(clipboardItem) {
		let parent = graph.children[0].children[0];
		let vertex = simpleCloneNode2(findID(clipboardItem.id), parent);
		let relativePosition = clipboardItem.relativePosition;
		setCenterPosition(vertex, [lastMouseX + relativePosition[0], lastMouseY + relativePosition[1]]);
		let oldName = getName(vertex);
		setName(vertex, findFreeName(oldName + "_"));
		syncAllVisuals();
	}
	static copy() {
		this.copiedItems = [];
		let rawSelectedIdArray = get_selected_ids();

		// Create parentIdArray as we are only intressted in copying parent nodes
		let parentIdArray = [];
		for (let i in rawSelectedIdArray) {
			let parentId = get_parent_id(rawSelectedIdArray[i]);
			if (parentIdArray.indexOf(parentId) == -1) {
				parentIdArray.push(parentId);
			}
		}

		// Create clipboard items
		for (let i in parentIdArray) {
			let clipboardItem = new ClipboardItem(parentIdArray[i]);
			let tmp_object = get_object(parentIdArray[i]);

			let absolutePosition = tmp_object.getPos();
			clipboardItem.absolutePosition = absolutePosition;

			this.copiedItems.push(clipboardItem);
		}

		// Create position list to calculate relative positions
		let positionList = [];
		for (let i in this.copiedItems) {
			positionList.push(this.copiedItems[i].absolutePosition);
			do_global_log(JSON.stringify(positionList));
		}
		let centerPosition = centerCoordinates(positionList);
		do_global_log("Center positio" + JSON.stringify(centerPosition));


		// Calculate rel positions for objects
		for (let i in this.copiedItems) {
			do_global_log("hoj " + JSON.stringify(positionDifference(this.copiedItems[i].absolutePosition, centerPosition)));
			this.copiedItems[i].relativePosition = positionDifference(this.copiedItems[i].absolutePosition, centerPosition);
		}
	}
	static paste() {
		for (let i in this.copiedItems) {
			this.copyObject(this.copiedItems[i]);
		}
	}
}
Clipboard.init();

function showDebug() {
	$("#btn_debug").show();
}

function hashUpdate() {
	if (location.hash == "#debug") {
		showDebug();
	}
}


// https://stackoverflow.com/questions/7083693/detect-if-page-has-finished-loading
// Initilzing without everything load = $(document).ready caused bugs. $(window).load solves this
$(window).load(function () {
	$("a").click((e) => {
		// Important to use "currentTarget" instead of "target", because sometimes
		// the <a> element is outside a <button>
		// .currentTarget will point to the <a> but .target will point to the <button>
		let url = e.currentTarget.href;
		if (environment.openLink(url)) {
			e.preventDefault();
		}
	});
	DragAndDrop.init();
	SVG.init()
	MousePan.init()
	RectSelector.init();
	Preferences.setup();

	$(".tool-button").mousedown(function (event) {
		let toolName = $(this).attr("data-tool");
		ToolBox.setTool(toolName, event.which);
	});

	$(window).bind('hashchange', hashUpdate);
	hashUpdate();

	if (Settings.showDebug) {
		showDebug();
	}

	$(document).keydown(function (event) {
		// Only works if no dialog is open
		if (jqDialog.blockingDialogOpen) {
			return;
		}
		if (event.key == "Delete") {
			DeleteTool.enterTool();
		}
		let moveSize = 2;
		if (event.shiftKey) {
			moveSize = 16;
		}
		if (event.key == "ArrowRight") {
			MouseTool.mouseMove(mousedown_x - moveSize, mousedown_y, false);
			event.preventDefault();
		}
		if (event.key == "ArrowUp") {
			MouseTool.mouseMove(mousedown_x, mousedown_y - moveSize, false);
			event.preventDefault();
		}
		if (event.key == "ArrowLeft") {
			MouseTool.mouseMove(mousedown_x + moveSize, mousedown_y, false);
			event.preventDefault();
		}
		if (event.key == "ArrowDown") {
			MouseTool.mouseMove(mousedown_x, mousedown_y + moveSize, false);
			event.preventDefault();
		}
		if (event.ctrlKey) {
			if (event.key == "1" || event.key.toLowerCase() == "r") {
				event.preventDefault();
				RunTool.enterTool();
			}
			if (event.key == "2") {
				event.preventDefault();
				StepTool.enterTool();
			}
			if (event.key == "3") {
				event.preventDefault();
				ResetTool.enterTool();
			}
			if (event.key.toLowerCase() == "o") {
				event.preventDefault();
				$("#btn_load").click();
			}
			if (event.key.toLowerCase() == "s") {
				event.preventDefault();
				$("#btn_save").click();
			}
			if (event.key.toLowerCase() == "p") {
				event.preventDefault();
				$("#btn_print_model").click();
			}
			if (event.key.toLowerCase() == "a") {
				for (let id in object_array) { object_array[id].select(); }
				for (let id in connection_array) { connection_array[id].select(); }
			}
			if (event.key.toLowerCase() == "z") {
				History.doUndo();
			}
			if (event.key.toLowerCase() == "y") {
				History.doRedo();
			}
			if (event.key.toLowerCase() == "c") {
				// Clipboard.copy();
			}
			if (event.key.toLowerCase() == "v") {
				// Clipboard.paste();
				// History.storeUndoState();
			}
		}
		environment.keyDown(event);
	});

	$(SVG.svgElement).mousedown(mouseDownHandler);
	SVG.svgElement.addEventListener('contextmenu', function (event) {
		event.preventDefault();
		return false;
	}, false);
	// the mousemove and mouseup event needs to be attached to the html to allow swipping the mouse outside
	$("html").mousemove(mouseMoveHandler);
	$("html").mouseup(mouseUpHandler);
	ToolBox.setTool("mouse");
	$("#btn_file").click(async function () {
		await updateRecentsMenu();
	});
	$("#btn_new").click(function () {
		saveChangedAlert(function () {
			fileManager.newModel();
		});
	});
	$("#btn_load").click(function () {
		saveChangedAlert(function () {
			fileManager.loadModel();
		});
	});
	$("#btn_save").click(function () {
		History.storeUndoState();
		fileManager.saveModel();
	});
	$("#btn_save_as").click(function () {
		History.storeUndoState();
		fileManager.saveModelAs();
	});
	$("#btn_recent_clear").click(function () {
		yesNoAlert("Are you sure you want to clear Recent List?", (answer) => {
			if (answer === "yes") {
				fileManager.clearRecent();
			}
		});
	});
	$("#btn_simulation_settings").click(function () {
		simulationSettings.show();
	});
	$("#progress-bar").dblclick(function () {
		simulationSettings.show();
	})
	$("#btn_equation_list").click(function () {
		equationList.show();
	});
	$("#btn_print_model").click(function () {
		printDiagram();
	});
	$("#btn_black").click(function () {
		setColorToSelection("black");
	});
	$("#btn_grey").click(function () {
		setColorToSelection("silver");
	});
	$("#btn_red").click(function () {
		setColorToSelection("red");
	});
	$("#btn_deeppink").click(function () {
		setColorToSelection("deeppink");
	});
	$("#btn_brown").click(function () {
		setColorToSelection("brown");
	});
	$("#btn_orange").click(function () {
		setColorToSelection("orange");
	});
	$("#btn_gold").click(function () {
		setColorToSelection("gold");
	});
	$("#btn_olive").click(function () {
		setColorToSelection("olive");
	});
	$("#btn_green").click(function () {
		setColorToSelection("green");
	});
	$("#btn_teal").click(function () {
		setColorToSelection("teal");
	});
	$("#btn_blue").click(function () {
		setColorToSelection("blue");
	});
	$("#btn_purple").click(function () {
		setColorToSelection("purple");
	});
	$("#btn_magenta").click(function () {
		setColorToSelection("magenta");
	});
	$("#btn_macro").click(function () {
		macroDialog.show();
	});
	$("#btn_debug").click(function () {
		debugDialog.show();
	});
	$("#btn_about").click(function () {
		aboutDialog.show();
	});
	$("#btn_preferences").click(function () {
		preferencesDialog.show();
	});
	$("#btn_fullpotentialcss").click(function () {
		fullPotentialCssDialog.show();
	});
	$("#btn_license").click(function () {
		licenseDialog.show();
	});
	$("#btn_thirdparty").click(function () {
		thirdPartyLicensesDialog.show();
	});
	$("#btn_restart").click(function () {
		saveChangedAlert(function () {
			applicationReload();
		});
	});
	$("#btn_preserve_restart").click(function () {
		preserveRestart();
	});
	$(".btn_load_plugin").click((event) => {
		let pluginName = $(event.target).data("plugin-name");
		loadPlugin(pluginName);
	});
	$("#btn_timeunit").click(function () {
		timeUnitDialog.show();
	})
	if (fileManager.hasSaveAs()) {
		$("#btn_save_as").show();
	}
	if (fileManager.hasRecentFiles()) {
		for (let i = 0; i < Settings.MaxRecentFiles; i++) {
			$(`#btn_recent_${i}`).click(async function (event) {
				saveChangedAlert(async function () {
					let recentIndex = parseInt(event.currentTarget.getAttribute("data-recent-index"));
					await fileManager.loadRecentByIndex(recentIndex);
					setTimeout(() => {
						updateTimeUnitButton();
						InfoBar.update();
					}, 200);
				});
			});
		}
	}
	macroDialog = new MacroDialog();
	definitionEditor = new DefinitionEditor();
	converterDialog = new ConverterDialog();
	preferencesDialog = new PreferencesDialog();
	simulationSettings = new SimulationSettings();
	timeUnitDialog = new TimeUnitDialog();
	equationList = new EquationListDialog();
	debugDialog = new DebugDialog();
	aboutDialog = new AboutDialog();
	fullPotentialCssDialog = new FullPotentialCSSDialog();
	thirdPartyLicensesDialog = new ThirdPartyLicensesDialog();
	licenseDialog = new LicenseDialog();

	// When the program is fully loaded we create a new model
	//~ fileManager.newModel();

	nwController.ready();
	environment.ready();
	fileManager.ready();
	restoreAfterRestart();
	RunResults.updateProgressBar();
	updateTimeUnitButton();

	History.unsavedChanges = false;
	InfoBar.init();
});

function updateTimeUnitButton() {
	if (isTimeUnitOk(getTimeUnits())) {
		$("#timeunit-value").html(getTimeUnits());
	} else {
		$("#timeunit-value").html(warningHtml("None", false));
	}
}

function find_connections(visual) {
	return find_start_connections(visual).concat(find_end_connections(visual));
}

function find_start_connections(visual) {
	let connections_array = Array(0);
	for (key in connection_array) {
		if (connection_array[key].getStartAttach && connection_array[key].getStartAttach() == visual) {
			connections_array.push(connection_array[key]);
		}
	}
	return connections_array;
}

function find_end_connections(visual) {
	let connections_array = Array(0);
	for (key in connection_array) {
		if (connection_array[key].getEndAttach && connection_array[key].getEndAttach() == visual) {
			connections_array.push(connection_array[key]);
		}
	}
	return connections_array;
}


function removePlotReferences(id) {
	for (let plotId in connection_array) {
		let visual = connection_array[plotId];
		let type = visual.type
		switch (type) {
			case ("timeplot"):
			case ("xyplot"):
			case ("table"):
			case ("compareplot"):
				visual.removePlotReference(id);
				break;
			default:
			/** Do nothing */
		}
	}
}

function stochsd_delete_primitive_and_references(id) {
	let numboxes = primitives("Numberbox").filter(n => n.getAttribute("Target") == id);
	removePlotReferences(id);

	/** Deleting visual object */
	stochsd_delete_primitive(id);

	numboxes.map(removePrimitive);
}

function stochsd_delete_primitive(id) {
	let stochsd_object = get_object(id);
	if (stochsd_object) {
		stochsd_object.clean();
	}

	if (object_array[id]) {
		delete object_array[id];
	} else if (connection_array[id]) {
		delete connection_array[id];
	} else {
		do_global_log("primitive with id " + id + " does not exist");
	}
}

function isLocal() {
	return true; // Expose additional debugging and error messages
}

function export_txt(fileName, data) {
	// Create Blob and attach it to ObjectURL
	let blob = new Blob([data], { type: "octet/stream" }),
		url = window.URL.createObjectURL(blob);

	// Create download link and click it
	let a = document.createElement("a");
	a.style.display = "none";
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();

	// The setTimeout is a fix to make it work in Firefox
	// Without it, the objectURL is removed before the click-event is triggered
	// And the download does not work
	setTimeout(function () {
		window.URL.revokeObjectURL(url);
		a.remove();
	}, 1);
};

function export_model() {
	export_txt("a.txt", blankGraphTemplate);
}
var blankGraphTemplate = `<mxGraphModel>
<root>
<mxCell id="0"/>
<mxCell id="1" parent="0"/>
<Display name="Default Display" Note="" Type="Time Series" xAxis="Time (%u)" yAxis="" yAxis2="" showMarkers="false" showLines="true" showArea="false" ThreeDimensional="false" Primitives="" Primitives2="" AutoAddPrimitives="false" ScatterplotOrder="X Primitive, Y Primitive" Image="Display" FlipHorizontal="false" FlipVertical="false" LabelPosition="Bottom" legendPosition="Automatic" id="43">
<mxCell style="display" parent="1" vertex="1" visible="0">
<mxGeometry x="10" y="10" width="64" height="64" as="geometry"/>
</mxCell>
</Display>
<Setting Note="" Version="36" TimeLength="100" TimeStart="0" TimeStep="1" TimeUnits="" StrictUnits="true" Units="" HiddenUIGroups="Validation,User Interface" SolutionAlgorithm="RK1" BackgroundColor="white" Throttle="-1" Macros="" SensitivityPrimitives="" SensitivityRuns="50" SensitivityBounds="50, 80, 95, 100" SensitivityShowRuns="false" article="{&quot;comments&quot;:true, &quot;facebookUID&quot;: &quot;&quot;}" StyleSheet="{}" id="2">
<mxCell parent="1" vertex="1" visible="0">
<mxGeometry x="20" y="20" width="80" height="40" as="geometry"/>
</mxCell>
</Setting>
</root>
</mxGraphModel>`;
loadXML(blankGraphTemplate);

function addMissingPrimitiveAttributes(prim) {
	// default primitive to get missing attributes 
	let primitive_type = prim.value.nodeName.toLowerCase();
	let default_primitive = primitiveBank[primitive_type];
	if (default_primitive) {
		for (let attr of default_primitive.attributes) {
			// check fow missing attributes 
			if (prim.getAttribute(attr.name) === null) {
				prim.setAttribute(attr.name, attr.value);
			}
		}
	} else {
		console.error(`No default primitive for ${prim.value.nodeName}`);
	}
}

// Take a primitive from the engine(tprimitve) and makes a visual object from it
function syncVisual(tprimitive) {
	let stochsd_object = get_object(tprimitive.id);
	if (stochsd_object != false) {
		return false;
	}

	addMissingPrimitiveAttributes(tprimitive);

	let nodeType = tprimitive.value.nodeName;
	switch (nodeType) {
		case "Numberbox":
			{
				let position = getCenterPosition(tprimitive);
				let visualObject = new NumberboxVisual(tprimitive.id, "numberbox", position);
				visualObject.setColor(tprimitive.getAttribute("Color"));
				visualObject.render();
			}
			break;
		case "Table":
		case "XyPlot":
		case "HistoPlot":
			{
				dimClass = null;
				switch (nodeType) {
					case "Table":
						dimClass = TableVisual;
						break;
					case "XyPlot":
						dimClass = XyPlotVisual;
						break;
					case "HistoPlot":
						dimClass = HistoPlotVisual;
						break;
				}
				let source_pos = getSourcePosition(tprimitive);
				let target_pos = getTargetPosition(tprimitive);

				let connection = new dimClass(tprimitive.id, nodeType.toLowerCase(), source_pos, target_pos);

				connection.setColor(tprimitive.getAttribute("Color"));

				// Insert correct primtives
				let primitivesString = tprimitive.getAttribute("Primitives");
				if (primitivesString !== "") {
					let idsToDisplay = primitivesString.split(",");
					connection.dialog.setIdsToDisplay(idsToDisplay);
				}

				connection.update();
				connection.render();
			}
			break;
		case "Diagram":
		case "TimePlot":
		case "ComparePlot":
			{
				dimClass = null;
				switch (nodeType) {
					case "Diagram":
					case "TimePlot":
						dimClass = TimePlotVisual;
						break;
					case "ComparePlot":
						dimClass = ComparePlotVisual;
						break;
				}
				let source_pos = getSourcePosition(tprimitive);
				let target_pos = getTargetPosition(tprimitive);

				let connection = new dimClass(tprimitive.id, nodeType.toLowerCase(), source_pos, target_pos);

				connection.setColor(tprimitive.getAttribute("Color"));

				// Insert correct primtives
				let primitivesString = tprimitive.getAttribute("Primitives");
				let idsToDisplay = primitivesString.split(",");
				let sidesString = tprimitive.getAttribute("Sides");
				if (primitivesString) {
					if (sidesString) {
						connection.dialog.setIdsToDisplay(idsToDisplay, sidesString.split(","));
					} else {
						connection.dialog.setIdsToDisplay(idsToDisplay);
					}
				}

				connection.update();
				connection.render();
			}
			break;
		case "Line":
		case "Rectangle":
		case "Ellipse":
			{
				dimClass = null;
				switch (nodeType) {
					case "Line":
						dimClass = LineVisual;
						break;
					case "Rectangle":
						dimClass = RectangleVisual;
						break;
					case "Ellipse":
						dimClass = EllipseVisual;
						break;
				}
				let source_pos = getSourcePosition(tprimitive);
				let target_pos = getTargetPosition(tprimitive);

				let connection = new dimClass(tprimitive.id, nodeType.toLowerCase(), source_pos, target_pos);

				connection.setColor(tprimitive.getAttribute("Color"));

				connection.update();
			}
			break;
		case "TextArea":
			{
				let source_pos = getSourcePosition(tprimitive);
				let target_pos = getTargetPosition(tprimitive);

				let connection = new TextAreaVisual(tprimitive.id, "text", source_pos, target_pos);

				connection.setColor(tprimitive.getAttribute("Color"));

				connection.update();
			}
			break;
		case "Stock":
			{
				let position = getCenterPosition(tprimitive);
				let visualObject = new StockVisual(tprimitive.id, "stock", position);
				set_name(tprimitive.id, tprimitive.getAttribute("name"));

				visualObject.setColor(tprimitive.getAttribute("Color"));

				visualObject.name_pos = Number(tprimitive.getAttribute("RotateName"));
				update_name_pos(tprimitive.id);
			}
			break;
		case "Converter":
			{
				let position = getCenterPosition(tprimitive);
				let visualObject = new ConverterVisual(tprimitive.id, "converter", position);
				set_name(tprimitive.id, tprimitive.getAttribute("name"));

				visualObject.setColor(tprimitive.getAttribute("Color"));

				visualObject.name_pos = Number(tprimitive.getAttribute("RotateName"));
				update_name_pos(tprimitive.id);
			}
			break;
		case "Ghost":
			{
				let source_primitive = findID(tprimitive.getAttribute("Source"));
				let source_type = source_primitive.value.nodeName;
				//~ do_global_log("id is "+tprimitive.id);
				let position = getCenterPosition(tprimitive);
				let visualObject = null;
				switch (source_type) {
					case "Converter":
						visualObject = new ConverterVisual(tprimitive.id, "converter", position, { "is_ghost": true });
						break;
					case "Variable":
						if (source_primitive.getAttribute("isConstant") == "true") {
							visualObject = new ConstantVisual(tprimitive.id, "variable", position, { "is_ghost": true });
						} else {
							visualObject = new VariableVisual(tprimitive.id, "variable", position, { "is_ghost": true });
						}
						break;
					case "Stock":
						visualObject = new StockVisual(tprimitive.id, "stock", position, { "is_ghost": true });
						break;
				}
				set_name(tprimitive.id, tprimitive.getAttribute("name"));

				visualObject.setColor(tprimitive.getAttribute("Color"));

				visualObject.name_pos = Number(tprimitive.getAttribute("RotateName"));
				update_name_pos(tprimitive.id);
			}
			break;
		case "Variable":
			{
				//~ do_global_log("VARIABLE id is "+tprimitive.id);
				let position = getCenterPosition(tprimitive);
				let visualObject;
				if (tprimitive.getAttribute("isConstant") == "false") {
					visualObject = new VariableVisual(tprimitive.id, "variable", position);
				} else {
					visualObject = new ConstantVisual(tprimitive.id, "constant", position);
				}
				set_name(tprimitive.id, tprimitive.getAttribute("name"));

				visualObject.setColor(tprimitive.getAttribute("Color"));

				visualObject.name_pos = Number(tprimitive.getAttribute("RotateName"));
				update_name_pos(tprimitive.id);
			}
			break;
		case "Flow":

			let source_pos = getSourcePosition(tprimitive);
			let target_pos = getTargetPosition(tprimitive);

			let connection = new FlowVisual(tprimitive.id, "flow", source_pos, target_pos);

			connection.name_pos = Number(tprimitive.getAttribute("RotateName"));
			update_name_pos(tprimitive.id);

			connection.loadMiddlePoints();

			connection.setColor(tprimitive.getAttribute("Color"));
			connection.valveIndex = parseInt(tprimitive.getAttribute("ValveIndex"));
			connection.variableSide = (tprimitive.getAttribute("VariableSide") === "true");

			if (tprimitive.source != null) {
				// Attach to object
				connection.setStartAttach(get_object(tprimitive.source.getAttribute("id")));
			}
			if (tprimitive.target != null) {
				// Attach to object
				connection.setEndAttach(get_object(tprimitive.target.getAttribute("id")));
			}
			connection.update();

			set_name(tprimitive.id, getName(tprimitive));
			break;
		case "Link":
			{
				let source_pos = getSourcePosition(tprimitive);
				let target_pos = getTargetPosition(tprimitive);

				let connection = new LinkVisual(tprimitive.id, "link", source_pos, target_pos);

				connection.setColor(tprimitive.getAttribute("Color"));

				if (tprimitive.source != null) {
					// Attach to object
					connection.setStartAttach(get_object(tprimitive.source.getAttribute("id")));
				}
				if (tprimitive.target != null) {
					// Attach to object
					connection.setEndAttach(get_object(tprimitive.target.getAttribute("id")));
				}
				let bezierPoints = [
					tprimitive.getAttribute("b1x"),
					tprimitive.getAttribute("b1y"),
					tprimitive.getAttribute("b2x"),
					tprimitive.getAttribute("b2y")
				];

				if (bezierPoints.indexOf(null) == -1) {
					connection.setHandle1Pos([Number(bezierPoints[0]), Number(bezierPoints[1])]);
					connection.setHandle2Pos([Number(bezierPoints[2]), Number(bezierPoints[3])]);
				} else {
					// bezierPoints does not exist. Create them
					connection.resetBezierPoints();
				}
				for (let i = 0; i < 8; i++) {
					// the anchor and the handle are co-dependent 
					// This means that moving the handle moves the anchor which moves the handle ... etc.
					// this continues until a stable position is reached.
					// To get around this the Link gets calculated a few times to reach a stable position.
					connection.update();
				}
			}
			break;
	}
}

// This function is important. It takes all the relevant primitives from the engine
// And make visual objects from them
// This is executed after loading a file or loading a whole new state such as after undo
function syncAllVisuals() {
	for (let type of saveblePrimitiveTypes) {
		let primitive_list = primitives(type);
		for (key in primitive_list) {
			try {
				syncVisual(primitive_list[key]);
			} catch (exception) {
				removePrimitive(primitive_list[key]);
				alert("Error while loading corrupted primitive of type " + type + ". Removing corrupted primitive to avoid propagated errors.");
				//~ alert("Error while loading corrupted primitive of type "+type+". Removing corrupted primitive to avoid propagated errors. \n\nError happened at: "+exception.stack);
				throw exception;
			}
		}
	}
	update_all_objects();
	unselect_all();
}

function findFreeName(basename) {
	let counter = 0;
	let testname;
	do {
		counter++;
		testname = basename + counter.toString();
	} while (findName(testname) != null)
	return testname;
}

syncAllVisuals();

class SubscribePool {
	constructor() {
		this.subscribers = [];
	}
	subscribe(handler) {
		this.subscribers.push(handler);
	}
	publish(message) {
		for (let i in this.subscribers) {
			this.subscribers[i](message);
		}
	}
}

class runOverlay {
	static init() {
		$(document).ready(() => {
			$("#svgBlockOverlay").mousedown(() => {
				$("#svgBlockOverlay").css("opacity", 0.5);
				yesNoAlert("Do you want to terminate the simulation now to change the model?", function (answer) {
					$("#svgBlockOverlay").css("opacity", 0);
					if (answer == "yes") {
						RunResults.resetSimulation();
					}
				});

			});
		});
	}
	static block() {
		unselect_all();
		$("#svgBlockOverlay").show();
	}
	static unblock() {
		$("#svgBlockOverlay").hide();
	}
}
runOverlay.init();

// Not yet implemented
function setColorToSelection(color) {
	let objects = get_selected_objects();
	for (let id in objects) {
		let obj = get_object(id);
		get_parent(obj).setColor(color);
	}
	History.storeUndoState();
}

function printDiagram() {
	unselect_all();
	InfoBar.update();
	// Write filename and date into editor-footer 
	let fileName = fileManager.fileName;

	let d = new Date();
	let month = d.getMonth() + 1 < 10 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
	let day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
	let hours = d.getHours() < 10 ? `0${d.getHours()}` : d.getHours();
	let minutes = d.getMinutes() < 10 ? `0${d.getMinutes()}` : `${d.getMinutes()}`;
	let fullDate = `${d.getFullYear().toString()}-${month}-${day} ${hours}:${minutes} (yyyy-mm-dd hh:mm)`;

	$(".editor-footer").css("display", "block");
	if (fileName.length > 0) {
		$(".editor-footer-filepath").html(fileName);
	} else {
		$(".editor-footer-filepath").html("Unnamed file");
	}

	$(".editor-footer-date").html(fullDate);

	hideAndPrint([$("#topPanel").get(0)]);
	$(".editor-footer").css("display", "none");
}

function removeNewLines(string) {
	let newString = string;
	newString = newString.replace(/\\n/g, " ");
	return newString;
}

function seperateFolderAndFilename(file_path) {
	let seperator = "\\";
	if (file_path.includes("/")) {
		seperator = "/";
	}
	let segments = file_path.split(seperator);
	let path = "";
	for (let i = 0; i < segments.length - 1; i++) {
		path += segments[i] + seperator;
	}
	return { "path": path, "name": segments[segments.length - 1] };
}

async function updateRecentsMenu() {
	if (!fileManager.hasRecentFiles()) {
		return;
	}
	let recent = await fileManager.getRecentDisplayList();
	if (recent.length > 0) {
		$('#recent_title').show();
		$('#btn_recent_clear').show();
	} else {
		$('#recent_title').hide();
		$('#btn_recent_clear').hide();
	}
	for (let i = 0; i < Settings.MaxRecentFiles; i++) {
		if (i < recent.length) {
			$(`#btn_recent_${i}`).show();
			let file = seperateFolderAndFilename(recent[i]);
			$(`#btn_recent_${i}`).html(`<span class="recent-path">${file.path}</span><span class="recent-name">${file.name}</span>`);
			$(`#btn_recent_${i}`).attr("data-recent-index", i.toString());
		} else {
			$(`#btn_recent_${i}`).hide();
		}
	}
}

class RunResults {
	/** @type {"none" | "running" | "stopped" | "stepping" | "paused"} */
	static runState;

	static init() {
		this.runState = "none";
		// Is always null if simulation is not running
		// Is a data structure returned from runModel if simulation is running it
		this.simulationController = null;
		this.varnameList = [];
		this.varIdList = [];
		this.results = [];
		this.runSubscribers = {};
		this.updateFrequency = 100;
		this.updateCounter = 0; // Updates everytime updateCounter goes down to zero
		this.simulationTime = 0;
	}
	static createHeader() {
		// Get list of primitives that we want to observe from the model
		let primitive_array = getPrimitiveList();

		// Create list of ids, id0 is reserved for time 
		this.varIdList = [0].concat(getID(primitive_array)).map(Number);

		// Create list of names
		this.varnameList = ["Time"].concat(getName(primitive_array));

		// Reset results
		this.results = [];
	}
	static toCsv() {
		// Under development
		let out = "";

		//~ let namesToDisplay = IdsToDisplay.map(findID).map(getName);
		let first = true;
		out += "Time"
		for (let id of this.varIdList) {
			let primitive = findID(id);
			if (primitive) {
				out += "," + getName(primitive);
			}
		}
		out += "\n";

		for (let row_index in this.results) {
			//~ for(let column_index in ["Time"].concat(namesToDisplay)) {
			first = true;
			for (let column_index in this.varIdList) {
				if (first) {
					out += stocsd_format(this.results[row_index][column_index], 6);
					first = false;
				} else {
					out += "," + stocsd_format(this.results[row_index][column_index], 6);
				}
			}
			out += "\n";
		}
		return out;
	}
	static storeResults(res) {
		// This method is executed after the simulation is finished
		// res is the result of the simulation
		let index = this.results.length;
		while (index < res.periods) {
			let time = res.times[index];
			this.simulationTime = res.times[index];
			let currentRunResults = [];
			currentRunResults.push(time);
			for (let key in this.varIdList) {
				if (key == 0) {
					// On location 0 we always have time
					continue;
				}
				//~ do_global_log(JSON.stringify(res));
				let value = res.value(findID(this.varIdList[key]))[index];
				currentRunResults.push(value);
			}
			this.push(currentRunResults);
			index++;
		}
		//~ this.triggerRunFinished();
	}
	static removeResultsForId(id) {
		let index = this.varIdList.indexOf(parseInt(id));
		if (index !== -1) {
			// remove id
			this.varIdList.splice(index, 1);


			// remove name
			this.varnameList.splice(index, 1);

			// remove data 
			this.results.map(row => {
				row.splice(index, 1);
			});
		}
	}
	static runPauseSimulation() {
		switch (this.runState) {
			case "running":
				this.pauseSimulation();
				break;
			case "paused":
				this.resumeSimulation();
				break;
			default:
				this.runSimulation();
		}
	}
	static resumeSimulation() {
		$("#imgRunPauseTool").attr("src", "graphics/pause.svg");
		this.runState = "running";
		// Simulation controller can only be null if the first pause event has never triggered
		// In such a case it is enought to just change this.runState, otherwise we also have to trigger the controllers resume() function.
		if (this.simulationController != null) {

			this.simulationController.resume();
			// We have a bug that happens some times on resume because simulationController is null
			// Find out when it happens
			//~ console.error(getStackTrace());
		}
	}
	static runSimulation() {
		this.simulationDone = false;
		this.stopSimulation();
		$("#imgRunPauseTool").attr("src", "graphics/pause.svg");
		this.createHeader();
		if (getTimeLength() / getTimeStep() < 1000) {
			setPauseInterval(getTimeLength() / 10);
		} else {
			// We can only take 1000 iterations between every update to avoid the feeling of program freezing
			setPauseInterval(getTimeStep() * 1000);
		}
		this.runState = "running";
		runOverlay.block();
		this.simulationController = runModel({
			rate: -1,
			onPause: (res) => {
				// We always need to do this, even if we paused the simulation, otherwise we cannot unpause
				// Here is the only place we can get a handle to the simulationController
				this.simulationController = res;

				// If still running continue with next cycle
				if (this.runState == "running") {
					this.updateProgressBar();
					this.setProgressStatus(false);
					do_global_log("length " + this.results.length)
					if (this.simulationController == null) {
						do_global_log("simulation controller is null")
					}
					this.continueRunSimulation()
				}
			},
			onSuccess: (res) => {
				// Run finished

				// On especially longer simulation onSuccess is called multible times
				// This is a hack to get around that 
				if (this.simulationDone === false) {
					this.simulationDone = true;
					// In some cases onPause was never executed and in such cases we need to do store Result directly on res
					this.storeResults(res);
					this.updateProgressBar();
					this.setProgressStatus(true);
					this.triggerRunFinished();
					this.stopSimulation();
				} else {
					console.log("Extra onSuccess call from IM-engine");
				}
			},
			onError: (res) => {
				do_global_log("onError stop simulation");
				this.stopSimulation();
			}
		});
	}
	static continueRunSimulation() {
		this.storeResults(this.simulationController);
		if (this.updateCounter == 0) {
			this.updateCounter = this.updateFrequency;
		}
		this.updateCounter -= 1;
		this.simulationController.resume();
	}
	static stepSimulation() {
		/* experiment
		if (this.runState == "running") {
			this.resetSimulation();
			this.simulationController = null;
			this.runState = "stepping";
			return;
		}
		*/
		// if stepping was already started
		if (this.simulationController != null) {
			this.simulationController.resume();
			return;
		}
		// Else start the stepping
		this.stopSimulation();
		this.createHeader();
		//~ alert("stepping init");
		setPauseInterval(getTimeStep());
		runOverlay.block();
		runModel({
			onPause: (res) => {
				this.simulationDone = false;
				this.storeResults(res);
				this.updateProgressBar();
				this.setProgressStatus(false);
				this.triggerRunFinished();
				this.simulationController = res;
			},
			onSuccess: (res) => {
				this.simulationDone = true;
				runOverlay.unblock();
				this.storeResults(res);
				this.updateProgressBar();
				this.setProgressStatus(true);
				this.triggerRunFinished();
			},
			onError: (res) => {
				this.stopSimulation();
			}
		});
	}
	static setProgressStatus(done) {
		done
			? $("#progress-bar").attr("data-done", "")
			: $("#progress-bar").removeAttr("data-done")
	}
	static updateProgressLength() {
		let progress = clampValue(this.getRunProgressFraction(), 0, 1);
		$("#progress-bar")[0].style.setProperty("--progress", `${100 * progress}%`)
	}
	static updateProgressText() {
		let number_options = { precision: 3 };
		let currentTime = format_number(this.getRunProgress(), number_options);
		let startTime = format_number(this.getRunProgressMin(), number_options);
		let endTime = format_number(this.getRunProgressMax(), number_options);
		let timeStep = this.getTimeStep();
		let alg_str = getAlgorithm() === "RK1" ? "Euler" : "RK4";
		$("#progress-bar-text").html(`${startTime} / ${currentTime} / ${endTime} </br> ${alg_str}(DT = ${timeStep})`);
	}
	static updateProgressBar() {
		this.updateProgressLength()
		this.updateProgressText()
	}
	static pauseSimulation() {
		this.runState = "paused";
		$("#imgRunPauseTool").attr("src", "graphics/run.svg");
	}
	static resetSimulation() {
		this.stopSimulation();
		this.createHeader();
		this.updateProgressBar();
		this.triggerRunFinished();
	}
	static stopSimulation() {
		runOverlay.unblock();
		endRunningSimulation();
		this.runState = "stopped";
		this.simulationController = null;
		$("#imgRunPauseTool").attr("src", "graphics/run.svg");
		this.updateCounter = 0;
	}
	static subscribeRun(id, handler) {
		this.runSubscribers[id] = handler;
	}
	static push(newRow) {
		this.results.push(newRow);
	}
	static getResults() {
		return this.results;
	}
	static getLastValue(primitiveId) {
		let lastRow = this.getLastRow();
		if (lastRow == null) {
			//~ alert("early return");
			return null;
		}
		let varIdIndex = this.varIdList.indexOf(Number(primitiveId));
		return lastRow[varIdIndex];
	}
	static getTimeStep() {
		if (primitives("Setting")[0]) {
			return primitives("Setting")[0].getAttribute("TimeStep");
		} else if (this.results && 1 < this.results.length) {
			return `${this.results[1][0] - this.results[0][0]}`;
		}
		return "0";
	}
	static getRunProgress() {
		let lastRow = this.getLastRow();
		// If we have no last row return null
		if (lastRow == null && primitives("Setting")[0]) {
			return parseFloat(primitives("Setting")[0].getAttribute("TimeStart"));
		}
		// else return time
		return lastRow[0];
	}
	static getRunProgressFraction() {
		return (this.getRunProgress() - this.getRunProgressMin()) / (this.getRunProgressMax() - this.getRunProgressMin());
	}
	static getRunProgressMax() {
		return getTimeStart() + getTimeLength()
	}
	static getRunProgressMin() {
		return getTimeStart();
	}
	static getLastRow() {
		//~ alert(this.results.length);
		if (this.results.length != 0) {
			return this.results[this.results.length - 1];
		} else {
			return null;
		}
	}
	static getSelectiveIdResults(varIdList) {
		// Make sure the varIdList stored as numbers and not strings
		varIdList = varIdList.map(Number);

		// Contains the indexes from this.results that we want to return
		let selectedVarIdIndexes = [0]; // The first index is always 0 for time
		for (let i in varIdList) {
			let varIdIndex = this.varIdList.indexOf(varIdList[i]);
			selectedVarIdIndexes.push(varIdIndex);
		}
		do_global_log("this.varIdList " + JSON.stringify(this.varIdList) + " varIdList " + JSON.stringify(varIdList));
		let returnResults = [];
		for (let row_index in this.results) {
			let tmpRow = [];
			for (let column_index in selectedVarIdIndexes) {
				let wantedIndex = selectedVarIdIndexes[column_index];
				if (wantedIndex != -1) {
					tmpRow.push(this.results[row_index][wantedIndex]);
				} else {
					tmpRow.push(null);
				}
			}
			returnResults.push(tmpRow);
		}
		return returnResults;
	}
	static getFilteredSelectiveIdResults(varIdList, start, length, step) {
		let unfilteredResults = this.getSelectiveIdResults(varIdList);
		let filteredResults = [];
		let printInterval = step / getTimeStep();
		let printCounter = 1;

		for (let row_index in unfilteredResults) {
			let time = unfilteredResults[row_index][0];
			if (time < start) {
				continue;
			}
			if (time == start) {
				printCounter = printInterval;
			}
			if (time > start + length) {
				// End of loop
				return filteredResults;
			}
			if (printCounter < printInterval) {
				printCounter++;
				continue;
			} else {
				printCounter = 1;
			}
			filteredResults.push(unfilteredResults[row_index]);
		}
		// Make sure last value is added
		if (filteredResults.length !== 0 && unfilteredResults.length !== 0) {
			if (filteredResults[filteredResults.length - 1][0] !== unfilteredResults[unfilteredResults.length - 1][0]) {
				filteredResults.push(unfilteredResults[unfilteredResults.length - 1]);
			}
		}
		return filteredResults;
	}
	static triggerRunFinished() {
		for (let id in this.runSubscribers) {
			if (findID(id)) {
				this.runSubscribers[id]();
			} else {
				delete this.runSubscribers[id];
			}
		}
	}
}
RunResults.init();

class jqDialog {
	static init() {
		// This is a static attribute that prevents delete key etc to be relevant when a dialog is open
		jqDialog.blockingDialogOpen = false;
	}
	constructor(title = null, contentHTML = null, size = null) {
		this.dialog = null;

		this.contentHTML = "Empty dialog";
		this.title = "Title";
		this.size = [600, 400];

		if (contentHTML) {
			this.contentHTML = contentHTML;
		}
		if (title) {
			this.title = title;
		}
		if (size) {
			this.size = size;
		}

		this.visible = false;
		// Decides if we this dialog should lock the background
		this.modal = true;
		let frm_dialog_resize = true;

		this.dialogDiv = document.createElement("div");
		this.dialogDiv.setAttribute("title", this.title);
		this.dialogDiv.setAttribute("style", "font-size: 13px; display: inline-block");
		this.dialogDiv.style.display = "none";

		this.dialogContent = document.createElement("div");
		this.dialogContent.innerHTML = this.contentHTML;

		this.dialogDiv.appendChild(this.dialogContent);
		document.body.appendChild(this.dialogDiv);

		this.dialogContent.setAttribute("style", "display: inline-block");


		this.dialogParameters = {
			autoOpen: false,
			modal: this.modal, // Adds overlay on background
			resizable: false,
			resize: (event, ui) => {
				this.resize(event, ui);
			},
			resizeStart: (event, ui) => {
				this.resizeStart(event, ui);
			},
			resizeStop: (event, ui) => {
				this.resizeStop(event, ui);
			},
			position: {
				my: "center",
				at: "center",
				of: window
			},
			beforeClose: () => {
				this.beforeClose();
			},
			close: () => {
				this.visible = false;
				jqDialog.blockingDialogOpen = false;
				this.afterClose();
			},
			width: this.size[0],
			height: this.size[1],
			open: (event, ui) => {
				if (this.dialogParameters.modal) {
					jqDialog.blockingDialogOpen = true;
				}

				let windowWidth = $(window).width();
				let windowHeight = $(window).height();
				$(event.target).css("maxWidth", (windowWidth - 50) + "px");
				$(event.target).css("maxHeight", (windowHeight - 50) + "px");
			}
		};
		this.dialogParameters.buttons = {
			"Cancel": () => {
				$(this.dialog).dialog('close');
			},
			"Apply": () => {
				this.applyChanges();
			}
		};
		this.dialogParameters.width = "auto";
		this.dialogParameters.height = "auto";
		this.beforeCreateDialog();
		this.dialog = $(this.dialogDiv).dialog(this.dialogParameters);
	}
	bindEnterApplyEvents() {
		$(this.dialogContent).find(".enter-apply").keydown(event => {
			if (!event.shiftKey) {
				if (event.key === "Enter") {
					event.preventDefault();
					this.applyChanges();
				}
			}
		});
	}
	renderHelpButtonHtml(helpId) {
		return (`<button id="${helpId}" class="help-button enter-apply" tabindex="-1" >
			?
		</button>`);
	}

	setHelpButtonInfo(helpId, title, contentHTML) {
		$(this.dialogContent).find(`#${helpId}`).unbind();
		$(this.dialogContent).find(`.enter-apply#${helpId}`).keydown(event => {
			if (!event.shiftKey) {
				if (event.key === "Enter") {
					event.preventDefault();
					this.applyChanges();
				}
			}
		});
		$(this.dialogContent).find(`#${helpId}`).click(event => {
			let dialog = new XAlertDialog(contentHTML);
			$(dialog.dialogContent).find(".accordion").accordion({
				heightStyle: "content",
				active: false,
				header: "h3",
				collapsible: true
			});
			dialog.setTitle(title);
			dialog.show();
		})
	}

	applyChanges() {
		this.makeApply();
		$(this.dialog).dialog('close');
		// We add a delay to make sure we closed first

		setTimeout(() => {
			History.storeUndoState();
			InfoBar.update();
		}, 200);
	}
	makeApply() {

	}
	getWidth() {
		return this.dialog.width();
	}
	getHeight() {
		return this.dialog.height();
	}
	resize(event, ui) {

	}
	resizeStart(event, ui) {

	}
	resizeStop(event, ui) {

	}
	beforeCreateDialog() {

	}
	beforeClose() {

	}
	afterClose() {

	}
	beforeShow() {

	}
	afterShow() {

	}
	show() {
		this.beforeShow();
		this.dialog.dialog("open");
		this.visible = true;
		this.afterShow();
	}
	setTitle(newTitle) {
		this.title = newTitle;
		this.dialog.dialog("option", "title", this.title);
	}
	getTitle() {
		return this.title;
	}
	setHtml(newHtml) {
		this.dialogContent.innerHTML = newHtml;
	}
	getHtml() {
		return this.dialogContent.innerHTML;
	}
}
// Needed for the static init of this class
jqDialog.init();




/** 
 * @typedef {Object} Primitive
 * @property {string} type - Type of primitive, e.g. "Stock", "Flow", "Variable", "Converter", "Ghost", "Link"
 * @property {string} id - Unique identifier for the primitive
 * @property {Element} value - The XML Element representing the primitive
 * @property {(name: string) => any} getAttribute - Function to get an attribute value by name
 * @property {(name: string, value: any) => void} setAttribute - Function to set an attribute value by name
 * */

/**
 * @returns {Primitive[]} - Returns a list of all primitives of type "Stock", "Flow", "Variable", and "Converter"
 */
function getPrimitiveList() {
	const primitiveList = primitives("Stock").concat(primitives("Flow")).concat(primitives("Variable")).concat(primitives("Converter"));
	return primitiveList;
}

class XAlertDialog extends jqDialog {
	/** @param {string} message @param {() => void} closeHandler */
	constructor(message, closeHandler = null) {
		super();
		this.setTitle("Alert");
		this.message = message;
		this.setHtml(message);
		this.closeHandler = closeHandler;
	}
	afterClose() {
		if (this.closeHandler) {
			this.closeHandler();
		}
	}
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			"OK": () => {
				$(this.dialog).dialog('close');
			}
		};
	}
}
function xAlert(message, closeHandler) {
	let dialog = new XAlertDialog(message, closeHandler);
	dialog.show();
}

class YesNoDialog extends jqDialog {
	constructor(message, closeHandler) {
		super();
		this.setTitle("");
		this.message = message;
		this.setHtml(message);
		this.closeHandler = closeHandler;
		this.answer = "no";
	}
	afterClose() {
		if (this.closeHandler) {
			this.closeHandler(this.answer);
		}
	}
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			"Yes": () => {
				this.answer = "yes";
				$(this.dialog).dialog('close');
			},
			"No": () => {
				this.answer = "no";
				$(this.dialog).dialog('close');
			}
		};
	}
}
function yesNoAlert(message, closeHandler) {
	let dialog = new YesNoDialog(message, closeHandler);
	dialog.show();
}

class YesNoCancelDialog extends jqDialog {
	constructor(message, closeHandler) {
		super();
		this.setTitle("");
		this.message = message;
		this.setHtml(message);
		this.closeHandler = closeHandler;
		this.answer = "cancel";
	}
	afterClose() {
		if (this.closeHandler) {
			this.closeHandler(this.answer);
		}
	}
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			"Yes": () => {
				this.answer = "yes";
				$(this.dialog).dialog('close');
			},
			"No": () => {
				this.answer = "no";
				$(this.dialog).dialog('close');
			},
			"Cancel": () => {
				this.answer = "cancel";
				$(this.dialog).dialog('close');
			}
		};
	}
}
function yesNoCancelAlert(message, closeHandler) {
	let dialog = new YesNoCancelDialog(message, closeHandler);
	dialog.show();
}

function saveChangedAlert(continueHandler) {
	// If we have no unsaved changes we just continue directly	
	if (!History.unsavedChanges) {
		continueHandler();
		return;
	}
	// Else ask if we want to save first
	yesNoCancelAlert("You have unsaved changes. Do you want to save first?", function (answer) {
		switch (answer) {
			case "yes":
				fileManager.finishedSaveHandler = continueHandler;
				fileManager.saveModel();
				break;
			case "no":
				continueHandler();
				break;
			case "cancel":
				break;
		}
	});
}

class HtmlComponent {
	/** @param {DisplayDialog} parent */
	constructor(parent) {
		this.componentId = "component-" + Math.ceil(Math.random() * (2 ** 32)).toString(16)
		this.parent = parent;
		this.primitive = parent.primitive;
	}
	find(selector) {
		return $(this.parent.dialogContent).find(selector);
	}
	render() { return "<p>EmptyComponent</p>"; }
	bindEvents() { }
	applyChange() { }
}


class PlotPeriodComponent extends HtmlComponent {
	render() {
		let auto_plot_per = JSON.parse(this.primitive.getAttribute("AutoPlotPer"));
		let plot_per = Number(this.primitive.getAttribute("PlotPer"));
		if (auto_plot_per) {
			plot_per = this.parent.getDefaultPlotPeriod();
		}
		return (`
			<table class="modern-table zebra" title="Distance between points in time units. \n (Should not be less then Time Step)" >
				<tr>
					<th>
						Plot Period: 
					</th>
					<td style="padding:1px;">
						<input style="" class="plot-per-field limit-input enter-apply" type="number" value="${plot_per}" ${auto_plot_per ? "disabled" : ""}/>
					</td>
					<td>
						Auto
						<input style="" class="plot-per-auto-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(auto_plot_per)}/>
					</td>
				</tr>
			</table>
			<div class="plot-per-warning" ></div>
		`);
	}
	checkValidPlotPer() {
		let plotPerStr = this.find(".plot-per-field").val();
		let warningDiv = this.find(".plot-per-warning");
		if (isNaN(plotPerStr) || plotPerStr === "") {
			warningDiv.html(warningHtml(`Plot Period must be a decimal number`, true));
			return false;
		} else if (Number(plotPerStr) <= 0) {
			warningDiv.html(warningHtml(`Plot Period must be &gt;0`, true));
			return false;
		}
		warningDiv.html("");
		return true;
	}
	bindEvents() {
		this.find(".plot-per-auto-checkbox").change(event => {
			let plot_per_field = this.find(".plot-per-field");
			plot_per_field.prop("disabled", event.target.checked);

			let plot_per = Number(this.primitive.getAttribute("PlotPer"));
			if (event.target.checked) {
				plot_per = this.parent.getDefaultPlotPeriod();
			}
			plot_per_field.val(plot_per);
		});
		this.find(".plot-per-field").keyup(() => {
			this.checkValidPlotPer();
		});
	}
	applyChange() {
		if (this.checkValidPlotPer()) {
			let auto_plot_per = this.find(".plot-per-auto-checkbox").prop("checked");
			let plot_per = Number(this.find(".plot-per-field").val());
			this.primitive.setAttribute("AutoPlotPer", auto_plot_per);
			this.primitive.setAttribute("PlotPer", plot_per);
		}
	}

}

/**
 * @param labels = [{ text, attribute }]
 */
class LabelTableComponent extends HtmlComponent {
	constructor(parent, labels) {
		super(parent);
		this.labels = labels;
	}
	render() {
		return (`
			<table class="modern-table zebra">
				${this.labels.map(label => {
			return (`<tr>
						<th>${label.text}:</th>
						<td style="padding:1px;" >
							<input style="width: 150px;" class="${label.attribute}-field enter-apply" spellcheck="false" type="text" value="${this.primitive.getAttribute(label.attribute)}"/>
						</td>
					</tr>`);
		}).join("")}
			</table>
		`);
	}
	applyChange() {
		this.labels.forEach(label => {
			let labelChoosen = removeSpacesAtEnd(this.find(`.${label.attribute}-field`).val());
			this.primitive.setAttribute(label.attribute, labelChoosen);
		})
	}
}

/**
 * @param checkboxes = [{ text, attribute }]
 */
// Checkboxhtml
class CheckboxTableComponent extends HtmlComponent {
	constructor(parent, checkboxes) {
		super(parent);
		this.checkboxes = checkboxes;
	}
	render() {
		return (`
			<table class="modern-table zebra">
				${this.checkboxes.map(checkbox => {
			return (`<tr>
						<td>
							<input class="${checkbox.attribute}-checkbox enter-apply" type="checkbox" ${checkedHtml(this.primitive.getAttribute(checkbox.attribute) === "true")}>
						</td>
						<th style="text-align: left;">${checkbox.text}</th>
					</tr>`)
		}).join("")}
			</table>
		`);
	}

	applyChange() {
		this.checkboxes.forEach(checkbox => {
			let boolChosen = this.find(`.${checkbox.attribute}-checkbox`).prop("checked");
			this.primitive.setAttribute(checkbox.attribute, boolChosen);
		})
	}
}

class PrimitiveSelectorComponent extends HtmlComponent {
	constructor(parent, displayLimit) {
		super(parent);
		this.displayIds = [];
		this.displayLimit = displayLimit;
	}
	renderIncludedList() {
		return (`<table id=${this.componentId} class="primitive-selector">
			<tr>
				<th></th>
				<th>Added Primitives</td>
			</tr>
			${this.displayIds.map(id => {
			const primitive = findID(id)
			const type = getTypeNew(primitive).toLowerCase()
			const color = primitive?.getAttribute("Color")
			const isRandom = hasRandomFunction(getValue(primitive))
			return `<tr>
					<td style="padding: 0;">
						<button 
							class="primitive-remove-button enter-apply" 
							data-id="${id}">
							-
						</button>
						</td>
						<td style="width: 100%;">
						<div class="center-vertically-container">
							<div style="width: 1.75rem; padding-right: 0.25rem;">
								${PrimitiveSvgPreview.create(type, { color, dice: isRandom })}
							</div>
							<span class="cm-primitive cm-${color}">
							${getName(primitive)}
							<span>
						</div>
						</td>
				</tr>
			`}).join("")}
		</table>`);
	}
	updateIncludedList() {
		let htmlContent = "No primitives selected";
		if (this.displayIds.length > 0) {
			htmlContent = this.renderIncludedList();
		}
		this.find(".included-list-div").html(htmlContent);
		this.parent.bindEnterApplyEvents();
		this.find(`#${this.componentId} .primitive-remove-button`).click(event => {
			this.removeButtonHandler(event);
			this.updateIncludedList();
			this.updateExcludedList();
		});
	}
	removeButtonHandler(event) {
		let removeId = $(event.target).attr("data-id");
		let removeIndex = this.displayIds.indexOf(removeId);
		if (removeIndex !== -1) {
			this.displayIds.splice(removeIndex, 1);
		}
	}
	updateExcludedList() {
		let searchWord = this.find(".primitive-filter-input").val();

		let searchLowercase = searchWord.toLowerCase();
		let results = this.getSearchPrimitiveResults(searchLowercase);
		let get_highlight_match = (name, match) => {
			let index = name.toLowerCase().indexOf(match.toLowerCase());
			if (index === -1 || match === "") {
				return name;
			} else {
				return `${name.slice(0, index)}<mark>${name.slice(index, index + match.length)}</mark>${name.slice(index + match.length, name.length)}`
			}
		}
		let htmlContent = "";
		if (results.length > 0) {
			let limitReached = this.displayLimit && this.displayIds.length >= this.displayLimit;
			htmlContent = (`<table class="primitive-selector"> 
				${results.map(p => {
				const type = getTypeNew(p).toLowerCase()
				const color = p?.getAttribute("Color")
				const isRandom = hasRandomFunction(getValue(p));
				return `<tr>
						<td style="padding: 0;">
							<button class="primitive-add-button enter-apply" data-id="${getID(p)}" 
								${limitReached ? "disabled" : ""} 
								${limitReached ? `title="Max ${this.displayLimit} primitives selected"` : ""}>
								+
							</button>
						</td>
						<td style="width: 100%;">
						<div class="center-vertically-container">
							<div style="width: 1.75rem; padding-right: 0.25rem;">
								${PrimitiveSvgPreview.create(type.toLowerCase(), { color, dice: isRandom })}
							</div>
							<span class="cm-primitive cm-${color}">${get_highlight_match(getName(p), searchWord)}<span>
						</div>
						</td>
					</tr>
				`}).join("")}
			</table>`);
		} else if (searchLowercase === "") {
			htmlContent = (`<div>No more primitives to add.</div>`);
		} else {
			htmlContent = (noteHtml(`No primitive matches search: <br/><b>${searchWord}</b>`));
		}
		this.find(".excluded-list-div").html(htmlContent);
		this.parent.bindEnterApplyEvents();
		this.find(".primitive-add-button").click((event) => {
			this.addButtonHandler(event);
			this.updateIncludedList();
			this.find(".primitive-filter-input").val("");
			this.updateExcludedList();
		});
	}
	addButtonHandler(event) {
		let addId = $(event.target).attr("data-id");
		this.displayIds.push(addId);
	}
	render() {
		this.displayIds = getDisplayIds(this.primitive);

		return (`
			<div class="included-list-div" style="border: 1px solid black;"></div>
			<div class="vertical-space"></div>
			<div class="center-vertically-container">
				<img style="height: 22px; padding: 0px 5px;" src="graphics/exchange.svg"/>
				<input type="text" class="primitive-filter-input enter-apply" placeholder="Find Primitive ..." style="height: 18px; width: 220px;"> 
			</div>
			<div class="excluded-list-div" style="max-height: 300px; overflow: auto; border: 1px solid black;"></div>
		`);
	}
	bindEvents() {
		this.find(".primitive-filter-input").keyup(() => {
			this.updateExcludedList();
		});
		this.updateIncludedList();
		this.updateExcludedList();
	}
	getSearchPrimitiveResults(searchLowercase) {
		let prims = this.parent.getAcceptedPrimitiveList();
		let results = [];

		let compareByTypeAndName = (a, b) => { // sort by type and by alphabetical 
			let orderDiff = order.indexOf(getTypeNew(a)) - order.indexOf(getTypeNew(b))
			if (orderDiff !== 0) {
				return orderDiff;
			} else { // else sort alphabetically
				return getName(a).toLowerCase() > getName(b).toLowerCase() ? 1 : -1;
			}
		}

		let compareBySearchWord = (a, b) => { // sort by what search word appears first 
			let charMatch = getName(a).toLowerCase().indexOf(searchLowercase) - getName(b).toLowerCase().indexOf(searchLowercase);
			if (charMatch !== 0) {
				return charMatch;
			} else { // else sort alphabetically 
				return getName(a).toLowerCase() > getName(b).toLowerCase() ? 1 : -1;
			}
		}

		let order = ["Stock", "Flow", "Variable", "Constant", "Converter"];
		results = prims.filter(p => // filter already added primitives 
			this.displayIds.includes(getID(p)) === false
		).filter(p => // filter search
			getName(p).toLowerCase().includes(searchLowercase)
		).sort(searchLowercase === "" ? compareByTypeAndName : compareBySearchWord);

		return results;
	}
	applyChange() {
		setDisplayIds(this.primitive, this.displayIds);
	}
}


class LineOptionsComponent extends HtmlComponent {
	render() {
		let options = JSON.parse(this.primitive.getAttribute("LineOptions"));
		return (`
			<table class="modern-table zebra">
				<tr>
					<th>Type</th><th>Pattern</th><th>Width</th>
				</tr>
				${Object.keys(options).map(key => (`<tr>
					<td>${type_basename[key]}</td>
					<td>
						<select data-key="${key}" class="line-pattern-select enter-apply" style="font-family: monospace;">
						<option value="[1]"		${options[key].pattern[0] === 1 ? "selected" : ""}>&#8212;&#8212;&#8212;&#8212;&#8212;&#8212;</option>
						<option value="[10, 5]" ${options[key].pattern[0] === 10 ? "selected" : ""}>------</option>
						</select>
					</td>
					<td>
						<select data-key="${key}" class="line-width-select enter-apply">
						<option value=1 ${options[key].width === 1 ? "selected" : ""}>1</option>
						<option value=2 ${options[key].width === 2 ? "selected" : ""}>2</option>
						<option value=3 ${options[key].width === 3 ? "selected" : ""}>3</option>
						</select>
					</td>
				</tr>`)).join("")}
			</table>
		`);
	}
	applyChange() {
		let options = JSON.parse(this.primitive.getAttribute("LineOptions"));

		let patternOptions = this.find(".line-pattern-select");
		let widthOptions = this.find(".line-width-select");
		for (let i = 0; i < widthOptions.length; i++) {
			let selectedWidth = JSON.parse($(widthOptions[i]).find(" :selected").val());
			let selectedPattern = JSON.parse($(patternOptions[i]).find(" :selected").val());

			options[$(widthOptions[i]).attr("data-key")]["width"] = selectedWidth;
			options[$(patternOptions[i]).attr("data-key")]["pattern"] = selectedPattern;
		}
		this.primitive.setAttribute("LineOptions", JSON.stringify(options));
	}
}


// This is the super class dor ComparePlotDialog and TableDialog
class DisplayDialog extends jqDialog {
	constructor(id) {
		super();
		this.primitive = findID(id);
		this.displayIdList = [];
		this.subscribePool = new SubscribePool();
		this.acceptedPrimitveTypes = ["Stock", "Flow", "Variable", "Converter"];
		this.displayLimit = undefined;
		this.components = [];
	}
	getDefaultPlotPeriod() {
		return getTimeStep();
	}
	clearRemovedIds() {
		for (let id of this.displayIdList) {
			if (findID(id) == null) {
				this.setDisplayId(id, false);
			}
		}
	}
	getAcceptedPrimitiveList() {
		let results = [];
		let primitiveList = getPrimitiveList();
		for (let primitive of primitiveList) {
			this.acceptsId(primitive.id) && results.push(primitive);
		}
		return results;
	}
	acceptsId(id) {
		let type = getType(findID(id));
		return (this.acceptedPrimitveTypes.indexOf(type) != -1);
	}
	removeIdToDisplay(id) {
		let idxToRemove = this.displayIdList.indexOf(id);
		idxToRemove !== -1 && this.displayIdList.splice(idxToRemove, 1);
	}
	addIdToDisplay(id) {
		let index = this.displayIdList.indexOf(id)
		index === -1 && this.displayIdList.push(id)
	}
	setDisplayId(id, value) {
		let oldIdIndex = this.displayIdList.indexOf(id);
		switch (value) {
			case true:
				// Check that the id can be added
				if (!this.acceptsId(id)) {
					return;
				}
				// Check if id already in this.displayIdList
				if (oldIdIndex != -1) {
					return;
				}
				// Add the value
				this.displayIdList.push(id.toString());

				break;
			case false:
				// Check if id is not in the list
				if (oldIdIndex == -1) {
					return;
				}
				this.displayIdList.splice(oldIdIndex, 1);
				break;
		}
	}
	getDisplayId(id) {
		id = id.toString();
		return this.displayIdList.indexOf(id) != -1
	}
	setIdsToDisplay(idList) {
		this.displayIdList = [];
		idList.forEach((id) => this.setDisplayId(id, true))
	}
	getIdsToDisplay() {
		this.clearRemovedIds();
		return this.displayIdList;
	}
	afterClose() {
		this.subscribePool.publish("window closed");
	}
	makeApply() {
		this.components.forEach(column => column.forEach(component => component.applyChange()));
	}
	beforeShow() {
		this.setHtml(`<div class="table">
			<div class="table-row">
				${this.components.map(column => `<div class="table-cell">
					${column.map(component => component.render()).join(`<div class="vertical-space"></div>`)}
				</div>`).join("")}
			</div>
		</div>`);
		this.components.forEach(column => column.forEach(component => component.bindEvents()));
		this.bindEnterApplyEvents();
	}
}
/**
 * @param axisOptions [{text, key, isTimeAxis}]
 */
class AxisLimitsComponent extends HtmlComponent {
	constructor(parent, axisOptions) {
		super(parent);
		this.axisOptions = axisOptions;
	}
	render() {
		let axisLimits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		return (`
		<table class="modern-table zebra">
			<tr>
				${["Axis", "Min", "Max", "Auto"].map(title => `<th>${title}</th>`).join("")}
			</tr>
			${this.axisOptions.map(axis => {
			let limit = axisLimits[axis.key];
			let min = axis.isTimeAxis && limit.auto ? getTimeStart() : limit.min;
			let max = axis.isTimeAxis && limit.auto ? getTimeStart() + getTimeLength() : limit.max;
			return (`<tr>
					<td style="text-align:center; padding:0px 6px">${axis.text}</td>
					<td style="padding:1px;">
						<input class="${axis.key}-min-field limit-input enter-apply" type="number" ${limit.auto ? "disabled" : ""} value="${min}">
					</td>
					<td style="padding:1px;">
						<input class="${axis.key}-max-field limit-input enter-apply" type="number" ${limit.auto ? "disabled" : ""} value="${max}">
					</td>
					<td>
						<input class="${axis.key}-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(limit.auto)}>
					</td>
				</tr>`);
		}).join("")}
		</table>
		<div class="axis-limits-warning-div" ></div>`);
	}
	bindEvents() {
		let axisLimits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		this.axisOptions.forEach(axis => {
			let limit = axisLimits[axis.key];
			this.find(`.${axis.key}-checkbox`).change(event => {
				let checkboxAuto = $(event.target).prop("checked");
				// Disable/enable input boxes 
				this.find(`.${axis.key}-min-field, .${axis.key}-max-field`).prop("disabled", checkboxAuto);

				// Set input values
				let min = axis.isTimeAxis && checkboxAuto ? getTimeStart() : limit.min;
				let max = axis.isTimeAxis && checkboxAuto ? getTimeStart() + getTimeLength() : limit.max;
				this.find(`.${axis.key}-min-field`).val(min);
				this.find(`.${axis.key}-max-field`).val(max);

				this.checkValidAxisLimits();
			});
		});

		this.find("input[type='text'].limit-input").keyup(() => {
			this.checkValidAxisLimits();
		});
	}

	checkValidAxisLimits() {
		let warningDiv = this.find(".axis-limits-warning-div");

		let hasFaultReduce = (acc, axis) => {
			let min = this.find(`.${axis.key}-min-field`).val();
			let max = this.find(`.${axis.key}-max-field`).val();
			return acc || isNaN(min) || isNaN(max);
		}

		let shouldWarn = this.axisOptions.reduce(hasFaultReduce, false);
		if (shouldWarn) {
			warningDiv.html(warningHtml(`Axis limits must be decimal numbers`, true));
			return false;
		} else {
			warningDiv.html("");
			return true;
		}
	}

	applyChange() {
		if (this.checkValidAxisLimits()) {
			let axisLimits = JSON.parse(this.parent.primitive.getAttribute("AxisLimits"));
			this.axisOptions.forEach(axis => {
				axisLimits[axis.key].auto = this.find(`.${axis.key}-checkbox`).prop("checked");
				axisLimits[axis.key].min = Number(this.find(`.${axis.key}-min-field`).val());
				axisLimits[axis.key].max = Number(this.find(`.${axis.key}-max-field`).val());
			});
			this.primitive.setAttribute("AxisLimits", JSON.stringify(axisLimits));
		}
	}
}

class TimePlotSelectorComponent extends PrimitiveSelectorComponent {
	constructor(parent) {
		super(parent);
		this.sides = [];
	}
	renderIncludedList() {
		return (`<table id="${this.componentId}" class="primitive-selector">
			<tr>
				${["", "Added Primitives", "Left", "Right"].map(title => `<th>${title}</th>`).join("")}
			</tr>
			${this.displayIds.map((id, index) => {
			const selectedSide = this.sides[index];
			const primitive = findID(id);
			const type = getTypeNew(primitive);
			const color = primitive?.getAttribute("Color")
			const isRandom = hasRandomFunction(getValue(primitive));
			return (`<tr>
					<td style="padding: 0;">
						<button 
							class="primitive-remove-button enter-apply" 
							data-id="${id}">
							-
						</button>
						</td>
						<td style="width: 100%;">
						<div class="center-vertically-container">
							<div style="width: 1.75rem; padding-right: 0.25rem;">
								${PrimitiveSvgPreview.create(type.toLowerCase(), { color, dice: isRandom })}
							</div>
							<span class="cm-primitive cm-${color}">
								${getName(primitive)}
							</span>
						</div>
						</td>
						<td style="padding: 0; text-align: center;">
							<input type="radio" name="id-${id}" class="side-radio" value="L" data-id="${id}"
								${checkedHtml(selectedSide === "L")}
							/>
						</td>
						<td style="padding: 0; text-align: center;">
							<input type="radio" name="id-${id}" class="side-radio" value="R" data-id="${id}"
								${checkedHtml(selectedSide === "R")}
							/>
						</td>
				</tr>
			`)
		}).join("")}
		</table>`);
	}
	updateIncludedList() {
		super.updateIncludedList();
		this.find(".side-radio").change(event => {
			this.switchSideHandler(event);
		});
	}
	switchSideHandler(event) {
		let value = $(event.target).val();
		let id = $(event.target).attr("data-id");
		let index = this.displayIds.indexOf(id);
		if (index !== -1) {
			this.sides[index] = value;
		}
	}
	removeButtonHandler(event) {
		let removeId = $(event.target).attr("data-id");
		let removeIndex = this.displayIds.indexOf(removeId);
		if (removeIndex !== -1) {
			this.displayIds.splice(removeIndex, 1);
			this.sides.splice(removeIndex, 1);
		}
	}
	addButtonHandler(event) {
		let addId = $(event.target).attr("data-id");
		this.displayIds.push(addId);
		this.sides.push("L");
	}
	render() {
		this.sides = getDisplaySides(this.primitive);
		return super.render();
	}
	applyChange() {
		setDisplayIds(this.primitive, this.displayIds, this.sides);
	}
}

class TimePlotDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Time Plot Properties");
		this.components = [
			[new TimePlotSelectorComponent(this)],
			[
				new PlotPeriodComponent(this),
				new AxisLimitsComponent(this, [
					{ text: "Time", key: "timeaxis", isTimeAxis: true },
					{ text: "Left", key: "leftaxis" },
					{ text: "Right", key: "rightaxis" },
				]),
				new LabelTableComponent(this, [
					{ text: "Title", attribute: "TitleLabel" },
					{ text: "Left", attribute: "LeftAxisLabel" },
					{ text: "Right", attribute: "RightAxisLabel" }
				]),
				new LineOptionsComponent(this),
				new CheckboxTableComponent(this, [
					{ text: "Numbered Lines", attribute: "HasNumberedLines" },
					{ text: "Colour from Primitive", attribute: "ColorFromPrimitive" },
					{ text: "Show Data when hovering", attribute: "ShowHighlighter" },
				])
			]
		];
	}
}

class GenerationsComponent extends HtmlComponent {
	/** @type {DataGenerations} */
	gens;
	/**
	 * @param {DataGenerations} gens 
	 */
	constructor(parent, gens) {
		super(parent)
		this.gens = gens
	}
	render() {
		const result = (`<div id=${this.componentId} style="max-height: 300px; overflow-x: auto;">
			${this.renderTable()}
		</div>`);
		return result;
	}
	renderTable() {
		const generationsHtml = `<table class="modern-table" style="width: 100%;">
			<tr>
				<th>#</th><th>Primitive</th><th>Label</th><th></th>
			</tr>
			${this.gens.map((value, index) => `
			${value.index == 0 && value.genIndex != 0 ? `<tr style="background-color: #ccc;"><td colspan="4"></td></tr>` : ""}
			<tr>
				<td>${index + 1}</td>
				<td>
					<div class="center-vertically-container">
						<div style="width: 1.75rem; padding-right: 0.25rem;">
							${PrimitiveSvgPreview.create(value.type.toLowerCase(), { color: value.color, dice: value.isRandom })}
						</div>
						<span class="cm-primitive cm-${value.color}">${value.name}</span>
					</div>
				</td>
				<td>
					<input type="text" class="sim-label enter-apply" style="width: 100%; text-align: left;" data-gen-index="${value.genIndex}" data-id="${value.id}" value="${value.label}"/>
				</td>
				<td style="padding:0;" >
					<button class="primitive-remove-button enter-apply" title="Delete Simulation" data-gen-index="${value.genIndex}" data-id="${value.id}">X</button>
				</td>
			</tr>`).join("")}
		</table>`
		const clearButtonHtml = `<table class="modern-table zebra" style="width:100%; text-align:center;"><tr><td>
			<button class="clear-button enter-apply">Clear Results</button>
		</td></tr></table>`
		return `<div id="${this.componentId}">
			${this.gens.idGen.length != 0 ? generationsHtml : ""}
			${clearButtonHtml}
		</div>`
	}
	applyChange() {
		let fields = this.find(`#${this.componentId} input[type="text"].sim-label`);
		this.find(`#${this.componentId} input[type="text"].sim-label`).each((index) => {
			const elem = $(fields[index]);
			const genIndex = elem.attr("data-gen-index");
			const id = elem.attr("data-id");
			const value = elem.val();
			this.gens.setLabel(genIndex, id, value);
		});
	}
	bindEvents() {
		this.find(`#${this.componentId} .primitive-remove-button`).click(event => {
			const button = $(event.currentTarget);
			this.gens.removeSim(button.attr("data-gen-index"), button.attr("data-id"));
			// re-render table
			this.find(`#${this.componentId}`).html(this.renderTable());
			this.bindEvents();
		})
		this.find(".clear-button").click((event) => {
			$(event.currentTarget).prop("disabled", true);
			let id = getID(this.primitive);
			let parentVisual = connection_array[id];
			parentVisual.clearGenerations();
			this.find(`#${this.componentId}`).html(this.renderTable());
			this.bindEvents();
		});
	}
}

class ComparePlotDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Compare Simulations Plot Properties");

		this.components = [
			[new PrimitiveSelectorComponent(this)],
			[
				new PlotPeriodComponent(this),
				new AxisLimitsComponent(this, [
					{ text: "Time", key: "timeaxis", isTimeAxis: true },
					{ text: "Y-Axis", key: "yaxis" }
				]),
				new LabelTableComponent(this, [
					{ text: "Title", attribute: "TitleLabel" },
					{ text: "Y-Axis Label", attribute: "LeftAxisLabel" }
				]),
				new LineOptionsComponent(this),
				new CheckboxTableComponent(this, [
					{ text: "Numbered Lines", attribute: "HasNumberedLines" },
					{ text: "Colour from Primitive", attribute: "ColorFromPrimitive" },
					{ text: "Show Data when hovering", attribute: "ShowHighlighter" },
				])
			],
			[new GenerationsComponent(this, connection_array[this.primitive.id].gens)]
		];
	}
}

class HistogramOptionsComponent extends HtmlComponent {
	constructor(parent) {
		super(parent);
		this.tableData = {
			headers: ["", "Value", "Auto"],
			rows: [
				{ label: "Upper Bound", classPrefix: "upper-bound", attribute: "UpperBound" },
				{ label: "Lower Bound", classPrefix: "lower-bound", attribute: "LowerBound" },
				{ label: "No. Bars", classPrefix: "num-bars", attribute: "NumberOfBars" }
			]
		};
	}
	render() {
		return (`<table class="modern-table zebra">
			<tr>	
				${this.tableData.headers.map(header => `<th>${header}</th>`).join("")}
			</tr>
			${this.tableData.rows.map(row => {
			let value = this.primitive.getAttribute(row.attribute);
			let auto = this.primitive.getAttribute(`${row.attribute}Auto`) === "true";
			return (`<tr>
				<td><b>${row.label}:</b></td>
				<td><input class="${row.classPrefix}-field enter-apply" type="number" value=${value} ${auto ? "disabled" : ""} /></td>
				<td><input class="${row.classPrefix}-auto-checkbox enter-apply" type="checkbox" ${checkedHtml(auto)} /></td>
			</tr>`)
		}).join("")}
		</table>`);
	}
	bindEvents() {
		this.tableData.rows.forEach(row => {
			let valueField = this.find(`.${row.classPrefix}-field`);
			let checkbox = this.find(`.${row.classPrefix}-auto-checkbox`);

			checkbox.click(event => {
				let auto = $(event.currentTarget).prop("checked");
				valueField.prop("disabled", auto);
			});
		});
	}
	applyChange() {
		this.tableData.rows.forEach(row => {
			let value = this.find(`.${row.classPrefix}-field`).val();
			let auto = this.find(`.${row.classPrefix}-auto-checkbox`).prop("checked");
			this.primitive.setAttribute(`${row.attribute}Auto`, auto);
			if (!auto && !isNaN(value)) {
				this.primitive.setAttribute(row.attribute, value);
			}
		});
	}
}

class RadioCompontent extends HtmlComponent {
	/**
	 * @param {{header: string, name: string, attribute, options: [{value: string, label: string}]}} data 
	 */
	constructor(parent, data) {
		super(parent);
		this.data = data;
	}
	render() {
		return (`<table class="modern-table zebra">
			<tr><th colspan="2" >${this.data.header}</th></tr>
			${this.data.options.map(option => {
			let checkString = checkedHtml(this.primitive.getAttribute(this.data.attribute) === option.value);
			return (`<tr>
					<td>
						<input type="radio" id="${option.value}" class="enter-apply" name="${this.data.name}" value="${option.value}" ${checkString} >
					</td>
					<td>
						<label for="${option.value}" >${option.label}</label>
					</td>
				</tr>`);
		}).join("")}
		</table>`);
	}
	applyChange() {
		let value = this.find(`input[name="${this.data.name}"]:checked`).val();
		this.primitive.setAttribute(this.data.attribute, value);
	}
}

class HistoPlotDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Histogram Plot Properties");
		this.displayLimit = 1;

		this.components = [
			[new PrimitiveSelectorComponent(this, 1)],
			[
				new HistogramOptionsComponent(this),
				new RadioCompontent(this, {
					header: "Select Scaling Type",
					name: "scaling",
					attribute: "ScaleType",
					options: [
						{ value: "Histogram", label: "Histogram" },
						{ value: "PDF", label: "Probability Density Function" }
					]
				})
			]
		];
	}
}

class XySelectorComponent extends PrimitiveSelectorComponent {
	renderIncludedList() {
		let axies = ["X", "Y"];
		return (`<table id="${this.componentId}" class="primitive-selector">
				<tr>
					<th></th>
					<th>Added Primitives</td>
					<th>Axis</th>
				</tr>
				${this.displayIds.map((id, index) => {
					const primitive = findID(id)
					const type = getTypeNew(primitive).toLowerCase()
					const color = primitive?.getAttribute("Color")
					const isRandom = hasRandomFunction(getValue(primitive))
					return `<tr>
						<td style="padding: 0;">
							<button 
								class="primitive-remove-button enter-apply" 
								data-id="${id}">
								-
							</button>
							</td>
							<td style="width: 100%;">
							<div class="center-vertically-container">
								<div style="width: 1.75rem; padding-right: 0.25rem;">
									${PrimitiveSvgPreview.create(type, { color, dice: isRandom })}
								</div>
								<span class="cm-primitive cm-${color}">
								${getName(primitive)}
								</span>
							</div>
						</td>
						<td style="font-size: 20px; text-align: center;">${axies[index]}</td>
					</tr>
				`}).join("")}
			</table>`);
	}
}

class XyPlotDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("XY Plot Properties");

		this.components = [
			[new XySelectorComponent(this, 2)],
			[
				new PlotPeriodComponent(this),
				new AxisLimitsComponent(this, [
					{ text: "X-Axis", key: "xaxis" },
					{ text: "Y-Axis", key: "yaxis" }
				]),
				new CheckboxTableComponent(this, [
					{ text: "Show Line", attribute: "ShowLine" },
					{ text: "Show Markers", attribute: "ShowMarker" },
					{ text: "Mark Start (🔴)", attribute: "MarkStart" },
					{ text: "Mark End (🟩)", attribute: "MarkEnd" },
					{ text: "Show Data when hovering", attribute: "ShowHighlighter" }
				]),
				new LabelTableComponent(this, [{ text: "Title", attribute: "TitleLabel" }]),
				new RadioCompontent(this, {
					header: "Line Width",
					name: "line-width",
					attribute: "LineWidth",
					options: [
						{ value: "1", label: "Thin" },
						{ value: "2", label: "Thick" }
					]
				})
			]
		];
	}
}

class TableData {
	constructor() {
		this.namesToDisplay = [];
		this.results = [];
	}
	exportCSV() {
		let string = this.getAsString(",");
		fileManager.exportFile(string, ".csv");
	}
	exportTSV() {
		let string = this.getAsString("\t");
		fileManager.exportFile(string, ".tsv");
	}
	getAsString(seperator) {
		let str = "Time" + seperator;
		for (let i = 0; i < this.namesToDisplay.length; i++) {
			let name = this.namesToDisplay[i];
			str += `${name}`;
			if (i != this.namesToDisplay.length - 1) {
				str += seperator;
			}
		}
		str += "\n";
		for (let row of this.results) {
			for (let i = 0; i < row.length; i++) {
				let value = row[i];
				if (value !== null) {
					str += value.toString();
				}
				if (i != row.length - 1) {
					str += seperator;
				}
			}
			str += "\n";
		}
		return str;

	}
}

class TableLimitsComponent extends HtmlComponent {
	render() {
		let limits = JSON.parse(this.primitive.getAttribute("TableLimits"));
		let startValue = limits.start.auto ? getTimeStart() : limits.start.value;
		let endValue = limits.end.auto ? getTimeStart() + getTimeLength() : limits.end.value;
		let stepValue = limits.step.auto ? this.parent.getDefaultPlotPeriod() : limits.step.value;
		return (`
		<table class="modern-table zebra">
			${["", "Value", "Auto"].map(header => `<th>${header}</th>`).join("")}
			<tr>
				<th>From</th>
				<td style="padding:1px;">
					<input class="limit-input start-field enter-apply" ${limits.start.auto ? "disabled" : ""} value="${startValue}" type="number">
				</td>
				<td><input class="limit-input start-auto-checkbox enter-apply" type="checkbox"  ${checkedHtml(limits.start.auto)}/></td>
			</tr><tr>
				<th>To</th>
				<td style="padding:1px;">
					<input class="limit-input end-field enter-apply" ${limits.end.auto ? "disabled" : ""} value="${endValue}" type="number">
				</td>
				<td><input class="limit-input end-auto-checkbox enter-apply" type="checkbox" ${checkedHtml(limits.end.auto)}/>
				</td>
			</tr><tr title="Step &#8805; DT should hold">
				<th>Step</th>
				<td style="padding:1px;">
					<input class="limit-input step-field enter-apply" ${limits.step.auto ? "disabled" : ""} value="${stepValue}" type="number">
				</td>
				<td><input class="limit-input step-auto-checkbox enter-apply" type="checkbox" ${checkedHtml(limits.step.auto)}/></td>
			</tr>
		</table>
		<div class="limits-warning-div warning"></div>`);
	}
	bindEvents() {
		let limits = JSON.parse(this.primitive.getAttribute("TableLimits"));
		this.find(".start-auto-checkbox").change(event => {
			let startAuto = $(event.target).prop("checked");
			this.find(".start-field").prop("disabled", startAuto);
			this.find(".start-field").val(startAuto ? getTimeStart() : limits.start.value);
		});
		this.find(".end-auto-checkbox").change(event => {
			let endAuto = $(event.target).prop("checked");
			this.find(".end-field").prop("disabled", endAuto);
			this.find(".end-field").val(endAuto ? getTimeStart() + getTimeLength() : limits.end.value);
		});
		this.find(".step-auto-checkbox").change(event => {
			let stepAuto = $(event.target).prop("checked");
			this.find(".step-field").prop("disabled", stepAuto);
			this.find(".step-field").val(stepAuto ? getTimeStep() : limits.step.value);
		});
		this.find("input[type='text'].limit-input").keyup(event => {
			this.checkValidTableLimits();
		});
	}
	checkValidTableLimits() {
		let warningDiv = this.find(".limits-warning-div");
		let startStr = this.find(".start-field").val();
		let endStr = this.find(".end-field").val();
		let stepStr = this.find(".step-field").val();
		if (isNaN(startStr) || startStr === "") {
			warningDiv.html(warningHtml(`"From" must be a decimal number`, true));
			return false;
		} else if (isNaN(endStr) || endStr === "") {
			warningDiv.html(warningHtml(`"To" must be a decimal number`, true));
			return false;
		} else if (isNaN(stepStr) || stepStr === "") {
			warningDiv.html(warningHtml(`"Step" must be a decimal number`, true));
			return false;
		} else if (Number(stepStr) <= 0) {
			warningDiv.html(warningHtml(`"Step" must be &gt;0`, true));
			return false;
		}
		warningDiv.html("");
		return true;
	}
	applyChange() {
		if (this.checkValidTableLimits()) {
			let limits = JSON.parse(this.primitive.getAttribute("TableLimits"));

			limits.start.value = Number(this.find(".start-field").val());
			limits.end.value = Number(this.find(".end-field").val());
			limits.step.value = Number(this.find(".step-field").val());

			limits.start.auto = this.find(".start-auto-checkbox").prop("checked");
			limits.end.auto = this.find(".end-auto-checkbox").prop("checked");
			limits.step.auto = this.find(".step-auto-checkbox").prop("checked");
			this.primitive.setAttribute("TableLimits", JSON.stringify(limits));
		}
	}
}

class ExportDataComponent extends HtmlComponent {
	render() {
		return (`<table class="modern-table zebra">
			<tr>
				<td>
					<button class="export-csv">
						Export Table (CSV)
					</button>
				</td>
			</tr>
			<tr>
				<td>
					<button class="export-tsv">
						Export Table (TSV)
					</button>
				</td>
			</tr>
		</table>`);
	}
	bindEvents() {
		this.find(".export-csv").click(event => {
			if (this.parent.data) {
				this.parent.data.exportCSV();
			}
		});

		this.find(".export-tsv").click(event => {
			if (this.parent.data) {
				this.parent.data.exportTSV();
			}
		});
	}
}


class ArithmeticPrecisionComponent extends HtmlComponent {
	render() {
		let numLength = JSON.parse(this.primitive.getAttribute("NumberLength"));
		let options = [{ key: "precision", label: "Precision" }, { key: "decimal", label: "Decimal" }];
		return (`<table class="modern-table zebra">
			${options.map(option => {
			let key = option.key;
			let isChecked = numLength.usePrecision === (option.key === "precision");
			let disabled = isChecked ? "" : "disabled";
			return (`<tr>
					<td>
						<input class="num-len-radio enter-apply" type="radio" id="${key}" name="num-len" value="${key}" ${checkedHtml(isChecked)}>
					</td>
					<td>
						<label for="${key}" >${option.label}</label>
					</td>
					<td>
						<input class="${key}-field enter-apply" type="number" ${disabled} value="${numLength[key]}">
					</td>
				</tr>`);
		}).join("")}
			
		</table>
		<div class="num-len-warn-div"></div>`);
	}
	bindEvents() {
		this.find(".num-len-radio[name='num-len']").change(event => {
			let selectedKey = event.target.value;
			let otherKey = (selectedKey === "precision") ? "decimal" : "precision";

			let selectedField = this.find(`.${selectedKey}-field`);
			let otherField = this.find(`.${otherKey}-field`);

			selectedField.prop("disabled", false);
			otherField.prop("disabled", true);

			this.checkValidNumberLength(selectedField.val());
		});
		this.find(".precision-field, .decimal-field").keyup(event => {
			this.checkValidNumberLength(event.target.value);
		});
	}

	checkValidNumberLength(value) {
		if (isNaN(value)) {
			$(".num-len-warn-div").html(warningHtml(`${value} is not a decimal number.`, true));
			return false;
		} else if (Number.isInteger(parseFloat(value)) === false) {
			$(".num-len-warn-div").html(warningHtml(`${value} is not an integer.`, true));
			return false;
		} else if (parseInt(value) < 0) {
			$(".num-len-warn-div").html(warningHtml(`${value} is negative.`, true));
			return false;
		} else if (parseInt(value) >= 12) {
			$(".num-len-warn-div").html(warningHtml(`${value} is above the limit of 12.`, true));
			return false;
		} else {
			$(".num-len-warn-div").html("");
			return true;
		}
	}
	applyChange() {
		let numLength = JSON.parse(this.primitive.getAttribute("NumberLength"));
		let selected = this.find("input[name='num-len']:checked").val();
		let usePrecision = selected === "precision";

		let value = this.find(`.${selected}-field`).val();
		if (this.checkValidNumberLength(value)) {
			numLength[selected] = parseInt(value);
			numLength.usePrecision = usePrecision;
			this.primitive.setAttribute("NumberLength", JSON.stringify(numLength));
		}
	}
}

class RoundToZeroComponent extends HtmlComponent {
	render() {
		let roundToZero = this.primitive.getAttribute("RoundToZero") === "true";
		let roundToZeroAtValue = this.primitive.getAttribute("RoundToZeroAtValue");
		let disabled = roundToZero ? "" : "disabled";
		return (`
			<table class="modern-table zebra">
				<tr>
					<td>
						<input class="round-to-zero-checkbox enter-apply" type="checkbox" ${checkedHtml(roundToZero)} /> 
						Show <b>0</b> when <i>abs(value) &lt;</i> 
						<input class="round-to-zero-field enter-apply" type="number" value="${roundToZeroAtValue}" ${disabled}/>
					</td>
				</tr>
				<tr>
					<td style="text-align: center;">
						<button class="default-round-to-zero-button enter-apply">Reset to Default</button>
					</td>
				</tr>
			</table>
			<span class="round-to-zero-warning-div warning" style="margin: 5px 0px;"></span>
		`);
	}
	bindEvents() {
		let roundToZeroCheckbox = this.find(".round-to-zero-checkbox");
		let roundToZeroField = this.find(".round-to-zero-field");

		// set default button listener
		this.find(".default-round-to-zero-button").click(() => {
			// fetches default for numberbox, but this is also used for table 
			// Should be fixes so it fetches default for the type of object the dialog belongs to  
			this.setRoundToZero(getDefaultAttributeValue("numberbox", "RoundToZero") === "true");
			roundToZeroField.val(getDefaultAttributeValue("numberbox", "RoundToZeroAtValue"));
			this.checkValidRoundAtZeroAtField();
		});

		roundToZeroCheckbox.click(() => {
			this.setRoundToZero(roundToZeroCheckbox.prop("checked"));
		});

		roundToZeroField.keyup((event) => {
			this.checkValidRoundAtZeroAtField();
		});
	}
	setRoundToZero(roundToZero) {
		this.find(".round-to-zero-checkbox").prop("checked", roundToZero);
		this.find(".round-to-zero-field").prop("disabled", !roundToZero);
		this.checkValidRoundAtZeroAtField();
	}

	checkValidRoundAtZeroAtField() {
		let roundToZeroFieldValue = this.find(".round-to-zero-field").val();
		if (this.find(".round-to-zero-checkbox").prop("checked")) {
			if (isNaN(roundToZeroFieldValue)) {
				this.setNumberboxWarning(true, `<b>${roundToZeroFieldValue}</b> is not a decimal number.`);
				return false;
			} else if (roundToZeroFieldValue == "") {
				this.setNumberboxWarning(true, "No value choosen.");
				return false;
			} else if (Number(roundToZeroFieldValue) >= 1) {
				this.setNumberboxWarning(true, "Value must be less then 1.");
				return false;
			} else if (Number(roundToZeroFieldValue) <= 0) {
				this.setNumberboxWarning(true, "Value must be strictly positive.");
				return false;
			} else {
				this.setNumberboxWarning(false);
				return true;
			}
		} else {
			this.setNumberboxWarning(false);
			return false;
		}
	}

	setNumberboxWarning(isVisible, htmlMessage) {
		let message = isVisible ? warningHtml(htmlMessage, true) : "";
		let visibility = isVisible ? "visible" : "hidden";
		this.find(".round-to-zero-warning-div").html(message);
		this.find(".round-to-zero-warning-div").css("visibility", visibility);
	}

	applyChange() {
		if (this.primitive) {
			let roundToZero = this.find(".round-to-zero-checkbox").prop("checked");
			this.primitive.setAttribute("RoundToZero", roundToZero);

			if (this.checkValidRoundAtZeroAtField()) {
				let roundToZeroAtValue = this.find(".round-to-zero-field").val();
				this.primitive.setAttribute("RoundToZeroAtValue", roundToZeroAtValue);
			}
		}
	}
}

class TableDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Table Properties");

		this.components = [
			[new PrimitiveSelectorComponent(this)],
			[
				new TableLimitsComponent(this),
				new ArithmeticPrecisionComponent(this),
				new RoundToZeroComponent(this),
				new ExportDataComponent(this)
			]
		];
	}
}


class NewModelDialog extends jqDialog {
	// This dialog is not used.
	// At start TimeUnitDialog is used instead 
	constructor() {
		super();
		this.setTitle("New model");
	}
	beforeShow() {
		this.setHtml(`
		<table class="modern-table zebra">
		<tr>
			<td>Time units</td>
			<td style="padding:1px;">
				<input class="input-timeunits enter-apply" name="length" style="width:100px;" value="" type="text">
				<!--
				<button class="input-timeunits-default-value" data-default-value="Years">Years</button>
				<button class="input-timeunits-default-value" data-default-value="Minutes">Minutes</button>
				-->
			</td>
		</tr>
		</table>
		`);
		this.bindEnterApplyEvents();

		$(this.dialogContent).find(".input-timeunits-default-value").click((event) => {
			let selectedUnit = $(event.target).data("default-value");
			$(this.dialogContent).find(".input-timeunits").val(selectedUnit);
			this.makeApply();
		});
	}
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			"Create": () => {
				this.makeApply();
			}
		};
	}
	beforeClose() {
		// If the users closes the window without choosing anything
		// We currently does not use default values for this
		// if($(this.dialogContent).find(".input-timeunits").val().trim()=="") {
		// 	setTimeUnits("tu");
		//	updateTimeUnitButton();
		//}
	}
	makeApply() {
		let timeUnits = $(this.dialogContent).find(".input-timeunits").val();
		if (!isTimeUnitOk(timeUnits.trim())) {
			xAlert("You have to enter a time unit for the model, e.g. Years or Minutes");
			return;
		}
		setTimeUnits(timeUnits);
		updateTimeUnitButton();

		$(this.dialog).dialog('close');
	}
}


class PreferencesDialog extends jqDialog {
	constructor() {
		super();
		this.setTitle("Preferences");
	}
	beforeShow() {
		const preferences = Preferences.get()
		this.setHtml(`<div class="preferences">${Object.entries(preferencesTemplate).map(([key, info]) => {
			const id = "preference-" + key
			return `<div class="preference">
				<div style="display: flex; justify-content: space-between;">
					<span class="title">${info.title}</span>
					<button class="btn_reset" id="reset-${key}" >Reset</button>
				</div>
				${info.type == "boolean"
					? `<div>
					<input id="${id}" name="${key}" type="checkbox" ${checkedHtml(preferences[key])}>
					<label for="${id}">${info.description}<label/>
				</div>`
					: ""}
				${info.image ? `<img src="${info.image}"/>` : ""}
			</div>`
		}).join("")}`)
		Object.entries(preferencesTemplate).forEach(([key, info]) => {
			$(this.dialogContent).find(`#reset-${key}`).on("click", () => {
				if (info.type == "boolean")
					$(this.dialogContent).find("#preference-" + key).prop("checked", info.default)
			})
		})
	}
	makeApply() {
		const preferences = Preferences.get()
		Object.entries(preferencesTemplate).forEach(([key, info]) => {
			const element = $(this.dialogContent).find("#preference-" + key)
			const value = info.type == "boolean" ? element.is(":checked") : undefined
			preferences[key] = value
		})
		Preferences.store(preferences)
	}
}

class SimulationSettings extends jqDialog {
	constructor() {
		super();
		this.setTitle("Simulation Settings");
	}
	beforeShow() {
		let start = getTimeStart();
		let length = getTimeLength();
		let step = getTimeStep();
		let timeUnit = getTimeUnits();
		this.setHtml(`
		<table class="modern-table zebra">
		<tr>
			<td>Start Time</td>
			<td style="padding:1px;">
				<input class="input-start enter-apply" name="start" style="width:100px;" value="${start}" type="number">
				&nbsp ${timeUnit} &nbsp
			</td>
		</tr><tr>
			<td>Length</td>
			<td style="padding:1px;">
				<input class="input-length enter-apply" name="length" style="width:100px;" value="${length}" type="number">
				&nbsp ${timeUnit} &nbsp
			</td>
		</tr><tr>
			<td>Time Step</td>
			<td style="padding:1px;">
				<input class="input-step enter-apply" name="step" style="width:100px;" value="${step}" type="number">
				&nbsp ${timeUnit} &nbsp
			</td>
		</tr><tr>
			<td>Method</td>
			<td style="padding:1px;"><select class="input-method enter-apply" style="width:104px">
			<option value="RK1" ${(getAlgorithm() == "RK1") ? "selected" : ""}>Euler</option>
			<option value="RK4" ${(getAlgorithm() == "RK4") ? "selected" : ""}>RK4</option>
			</select></td>
		</tr>
		</table>
		<div class="simulation-settings-warning"></div>
		`);

		this.bindEnterApplyEvents();

		this.start_field = $(this.dialogContent).find(".input-start");
		this.length_field = $(this.dialogContent).find(".input-length");
		this.step_field = $(this.dialogContent).find(".input-step");
		this.warning_div = $(this.dialogContent).find(".simulation-settings-warning");
		this.method_select = $(this.dialogContent).find(".input-method");

		this.start_field.keyup(() => this.checkValidTimeSettings());
		this.length_field.keyup(() => this.checkValidTimeSettings());
		this.step_field.keyup(() => this.checkValidTimeSettings());
		this.method_select.change(() => this.checkValidTimeSettings());

		this.checkValidTimeSettings();
	}

	checkValidTimeSettings() {
		if (isNaN(this.start_field.val()) || this.start_field.val().trim() === "") {
			this.warning_div.html(warningHtml(`Start <b>${this.start_field.val()}</b> is not a decimal number.`, true));
			return false;
		} else if (isNaN(this.length_field.val()) || this.length_field.val().trim() === "") {
			this.warning_div.html(warningHtml(`Length <b>${this.length_field.val()}</b> is not a decimal number.`, true));
			return false;
		} else if (isNaN(this.step_field.val()) || this.step_field.val().trim() === "") {
			this.warning_div.html(warningHtml(`Step <b>${this.step_field.val()}</b> is not a decimal number.`, true));
			return false;
		} else if (Number(this.length_field.val()) <= 0) {
			this.warning_div.html(warningHtml(`Length must be &gt;0`, true));
			return false;
		} else if (Number(this.step_field.val()) <= 0) {
			this.warning_div.html(warningHtml(`Step must be &gt;0`, true));
			return false;
		} else if (Settings.limitSimulationSteps && Number(this.length_field.val()) / Number(this.step_field.val()) > 1e5) {
			let iterations = Math.ceil(Number(this.length_field.val()) / Number(this.step_field.val()));
			let iters_str = format_number(iterations, { use_e_format_upper_limit: 1e5, precision: 3 });
			this.warning_div.html(warningHtml(`
				This Length requires ${iters_str} time steps. <br/>
				The limit is 10<sup>5</sup> time steps per simulation.
			`, true));
			return false;

		} else if (Settings.limitSimulationSteps && Number(this.length_field.val()) / Number(this.step_field.val()) > 1e4) {
			let iterations = Math.ceil(Number(this.length_field.val()) / Number(this.step_field.val()));
			let iters_str = format_number(iterations, { use_e_format_upper_limit: 1e4, precision: 3 });
			this.warning_div.html(noteHtml(`
				This Length requires ${iters_str} time steps. <br/>
				More than 10<sup>4</sup> time steps per simulation <br/>
				may significantly slow down the simulation.`
			));
			return true;
		} else if ($(this.method_select).find(":selected").val() === "RK4") {
			this.warning_div.html(noteHtml(`
				Do not use RK4 without a good reason, <br/>
				and NEVER if the model contains discontinuities <br/>
				(e.g. <b>Pulse</b>, <b>Step</b> or <b>Random numbers</b>)!
			`));
			return true;
		}

		this.warning_div.html("");
		return true;
	}

	makeApply() {
		let validSettings = this.checkValidTimeSettings();
		if (validSettings) {
			setTimeStart(this.start_field.val());
			setTimeLength(this.length_field.val());
			setTimeStep(this.step_field.val());
			let method = $(".input-method :selected").val();
			setAlgorithm(method);
		}
	}
}

class TimeUnitDialog extends jqDialog {
	constructor() {
		super();
		this.validName = false;
		this.setTitle("Set Time Unit");
		this.setHtml(`
			<div style="min-height: 70px; margin: 8px 0px;">
				Specify the Time Unit to enable model building.</br></br>
				<div style="display: flex; justify-content: space-between; width: 100%; align-items: baseline;">
					<b>Time Unit:</b><span>${this.renderHelpButtonHtml("timeunit-help")}</span>
				</div>
				<input class="timeunit-field enter-apply" style="width:100%; box-sizing: border-box;" type="text"/>
				<div style="margin-top: 4px;" class="complain-div"></div>
			</div>
		`);

		this.setHelpButtonInfo("timeunit-help", "Time Unit Help", `<div style="max-width: 400px;">
			<p>It is crucial to be consistent and choose one, and only one, time unit across the model. The time unit can e.g. be second, minute, hour, day, week, month, year, century, or whatever you choose. For a generic model you can specify it as e.g. "Time Unit", "t.u." or "tu".</p>
			<b>Key bindings:</b>
			<ul style="margin: 0.5em 0;">
				<li>${keyHtml("Esc")} &rarr; Cancels changes</li>
				<li>${keyHtml("Enter")} &rarr; Applies changes</li>
			</ul>
		</div>
		`)

		$(this.dialogContent).find(".timeunit-field").keyup((event) => {
			this.showComplain(this.checkValid());
		});
		$(this.dialogContent).find(".enter-apply").keydown(event => {
			if (event.key === "Enter") {
				event.preventDefault();
				this.dialogParameters.buttons["Apply"]();
			}
		});
	}
	beforeShow() {
		$(this.dialogContent).find(".timeunit-field").val(getTimeUnits());
	}
	afterShow() {
		$(this.dialog).find(".timeunit-field").get(0).focus();
	}
	checkValid() {
		let value = $(this.dialogContent).find(".timeunit-field").val();
		return isTimeUnitOk(value);
	}
	showComplain(ok) {
		let complainDiv = $(this.dialogContent).find(".complain-div");
		if (ok) {
			complainDiv.html("");
		} else {
			complainDiv.html(warningHtml(`Time Unit must contain character A-Z or a-z.`));
		}
	}
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			"Apply": (event) => {
				if (this.checkValid()) {
					let timeUnit = $(this.dialogContent).find(".timeunit-field").val();
					setTimeUnits(timeUnit);
					$(this.dialog).dialog('close');
					$("#timeunit-value").html(timeUnit);
					History.storeUndoState();
				} else {
					this.showComplain(this.validName);
				}
			}
		};
	}
}


class GeometryDialog extends DisplayDialog {
	renderStrokeHtml() {
		let strokeWidths = ["1", "2", "3", "4", "5", "6"];
		let primWidth = this.primitive.getAttribute("StrokeWidth");
		return (`
			<table class="modern-table zebra">
				<tr>
					<td>Line Width: </td>
					<td>
						<select class="width-select enter-apply">
						${strokeWidths.map(w => (`
							<option value="${w}" ${primWidth === w ? "selected" : ""}>${w}</option>
						`))}
						</select>
					</td>
				</tr>
				<tr>
					<td>Dashes: </td>
					<td>
						<select class="dash-select enter-apply">
						<option value="" 	${this.primitive.getAttribute("StrokeDashArray") === "" ? "selected" : ""}	 >––––––</option>
						<option value="8 4" ${this.primitive.getAttribute("StrokeDashArray") === "8 4" ? "selected" : ""}>– – – –</option>
						</select>
					</td>
				</tr>
			</table>
		`);
	}

	beforeShow() {
		this.setHtml(`<div>${this.renderStrokeHtml()}</div>`);
		this.bindEnterApplyEvents();
	}
	makeApply() {
		let dashArray = $(this.dialogContent).find(".dash-select :selected").val();
		let strokeWidth = $(this.dialogContent).find(".width-select :selected").val();
		this.primitive.setAttribute("StrokeDashArray", dashArray);
		this.primitive.setAttribute("StrokeWidth", strokeWidth);
	}
}

class RectangleDialog extends GeometryDialog {
	beforeShow() {
		this.setTitle("Rectangle Properties");
		super.beforeShow();
	}
}

class EllipseDialog extends GeometryDialog {
	beforeShow() {
		this.setTitle("Ellipse Properties");
		super.beforeShow();
	}
}

class LineDialog extends GeometryDialog {
	renderArrowCheckboxHtml() {
		let arrowStart = this.primitive.getAttribute("ArrowHeadStart") === "true";
		let arrowEnd = this.primitive.getAttribute("ArrowHeadEnd") === "true";
		return (`
			<table class="modern-table zebra">
				<tr>
					<td>Arrow head at start point:</td>
					<td><input class="arrow-start-checkbox enter-apply" type="checkbox" ${checkedHtml(arrowStart)} /></td>
				</tr>
				<tr>
					<td>Arrow head at end point:</td>
					<td><input class="arrow-end-checkbox enter-apply" type="checkbox" ${checkedHtml(arrowEnd)} /></td>
				</tr>
			</table>
		`);
	}
	beforeShow() {
		this.setTitle("Arrow/Line Properties");
		this.setHtml(`<div>
			${this.renderArrowCheckboxHtml()}
			<div class="vertical-space"></div>
			${this.renderStrokeHtml()}
		</div>`);
		this.bindEnterApplyEvents();
	}
	makeApply() {
		this.primitive.setAttribute("ArrowHeadStart", $(this.dialogContent).find(".arrow-start-checkbox").prop("checked"));
		this.primitive.setAttribute("ArrowHeadEnd", $(this.dialogContent).find(".arrow-end-checkbox").prop("checked"));
		super.makeApply();
	}
}

class NumberboxDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Number Box Properties");

		this.components = [
			new ArithmeticPrecisionComponent(this),
			new RoundToZeroComponent(this),
			new CheckboxTableComponent(this, [{ text: "Hide Frame", attribute: "HideFrame" }])
		];
	}
	beforeShow() {
		this.targetPrimitive = findID(this.primitive.getAttribute("Target"));
		if (this.targetPrimitive) {
			let primitiveName = makePrimitiveName(getName(this.targetPrimitive));
			this.setHtml(`
				<div>
					<p>Value of ${primitiveName}</p>
					${this.components.map(comp => comp.render()).join('<div class="vertical-space"></div>')}
				</div>
			`);
			this.components.forEach(comp => comp.bindEvents());
		} else {
			this.setHtml(`
				Target primitive not found
			`);
		}
		this.bindEnterApplyEvents();
	}
	makeApply() {
		this.components.forEach(comp => comp.applyChange());
	}
}

class ConverterDialog extends jqDialog {
	constructor() {
		super();
		// [number,number][]
		this.currentValues = [];
		this.setHtml(`
			<div style="display: grid; grid-template-columns: auto auto; grid-gap: 1rem; max-height: 80vh;">
				<div class="primitive-settings" style="padding: 1rem 0;">
						<b>Name:</b><br/>
						<input class="name-field" style="width: 100%;" type="text" value=""><br/><br/>
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
				let data = event.text.map(row => row.split("\t"))
				data = data.filter(row => row.length === 2 && this.isValidCellValue(row[0]) && this.isValidCellValue(row[1]));
				if (data.length >= 1) {
					cm.setValue(data.map(d => d.join(",\t")).join(";\n"))
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
			this.inLinkParagraph.innerHTML = `Ingoing Link: ${getName(linkedIn[0])}`;
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

		this.setTitle(`${oldNameBrackets} properties`);

		$(this.nameField).val(oldNameBrackets);
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
			let visualObject = object_array[this.primitive.id];
			if (visualObject) {
				visualObject.update();
			}
		}
	}
}

function global_log_update() {
	let log = "";
	log += "<br/>";
	log += global_log + "<br/>";
	$(".log").html(log);
}

function do_global_log(line) {
	if (Settings.showDebug) {
		global_log = line + "; " + (new Date()).getMilliseconds() + "<br/>" + global_log;
		global_log_update();
	}
}

class DebugDialog extends jqDialog {
	constructor() {
		super();
		this.nameField = null;
		this.setTitle("Debug");
		this.setHtml(`
			<div id="log_panel" style="z-index: 10; position: absolute; left: 0px; top: 0px; height: 90%; overflow-x: visible">
				This windows is only for developers of StochSD. If you are not developing StochSD you probably dont need this.<br/>
				<button class="btn_clear_log">clear</button>
				<div class="log" style="width: 100%; height: 90%; overflow-y: scroll;">
				</div>
			</div>
		`);

		$(this.dialogContent).find(".btn_clear_log").click((event) => {
			global_log = "";
			global_log_update();
		});
	}
	beforeCreateDialog() {
		this.dialogParameters.modal = false;
		this.dialogParameters.width = 600;
		this.dialogParameters.height = 400;
	}
}

class CloseDialog extends jqDialog {
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			"Close": () => {
				$(this.dialog).dialog('close');
			}
		};
	}
}

class AboutDialog extends CloseDialog {
	constructor() {
		super();
		this.setTitle("About StochSD");
		this.setHtml(`
			<div style="min-width:300px; max-width: 800px;">
			<img src="graphics/stochsd_high.png" style="width: 128px; height: 128px"/><br/>
			<b>StochSD version ${stochsd.version} (YYYY.MM.DD)</b><br/>
			<br/>
			<b>StochSD</b> (<u>Stoch</u>astic <u>S</u>ystem <u>D</u>ynamics) is an extension of System Dynamics into the field of 	<b>stochastic modelling</b>. In particular, you can make statistical analyses from multiple simulation runs.<br/>
			<br/>
			StochSD is an open source program based on the <a target="_blank" href="http://insightmaker.com">Insight Maker engine</a> (insightmaker.com) developed by Scott Fortmann-Roe. However, the graphic package of Insight Maker is replaced to make StochSD open for use as well as modifications and extensions. The file handling system is also rewritten. Finally, tools for optimisation, sensitivity analysis and statistical analysis are supplemented.<br/>
			<br/>
			StochSD was developed by Leif Gustafsson, Erik Gustafsson and Magnus Gustafsson, Uppsala University, Uppsala, Sweden.<br/>
			Mail: leif.gunnar.gustafsson@gmail.com 
			</div>
		`);
	}
}

class FullPotentialCSSDialog extends CloseDialog {
	constructor() {
		super();
		this.setTitle("What is Full Potential CSS?");
		this.setHtml(`
		<div style="min-width: 300px; max-width: 1300px; overflow-y: auto;">
		<p>A real SYSTEM can be <i>described</i> as a well-defined CONCEPTUAL MODEL in text, figure and values. This conceptual model can then be <i>realised</i> as an executable <b>Micro Model</b> where each object is represented as an entity, or as an executable <b>Macro Model</b> where a 'Population' of entities are aggregated into a few stages. For example:</p>
		<table class="modern-table zebra center-horizontally">
			<tr><th></th><th>Micro approach</th><th>Macro approach</th></tr>
			<tr><td>Flowing water</td><td>H<sub>2</sub>O molecules</td><td>A river</td></tr>
			<tr><td>A disease process</td><td>Individual level (Medicine)</td><td>Population level (Epidemiology)</td></tr>
			<tr><td>Biology</td><td>Individual of a species</td><td>Ecological system</td></tr>
			<tr><td>Traffic</td><td>Individual vehicles</td><td>Traffic flows</td></tr>
		</table>
		<p>Regardless of whether you choose a micro approach using <b>Discrete Event Simulation</b> (DES) or a macro approch using <b>Continuous System Simulation</b> (CSS), the results should be <b>consistent</b> (contradiction free), i.e. averages, variations, correlation, etc. should be the same. See the Figure.</p>
		<img src="graphics/what_is_fp_css.png" style="display: block; max-width: 700px; margin: 0 auto;"/>
		<p>Consistency is usually not obtained for <b>Classical CSS</b>. However, if the <b>Full Potential CSS</b> approach is followed, you can obtain results consistent with those from a micro model.</p>
		<h3>Full Potential CSS requirements</h3>
		<p>To correctly <i>realise</i> a <b>Conceptual model</b> into an <b>CSS model</b> the following rules must be applied:</p>
		<ol>
			<li>Discrete objects must be modelled as discrete (unless they can be regarded as continuous according to the Law of Large Numbers). Continuous matter should be modelled as continuous.</li>
			<li>Attribute values are realised by multiple parallel sub-structures (Attribute expansion). </li>
			<li>Distribution of the sojourn (stay) times in a stage are obtained by modelling the stage by a structure of compartments in series and/or parallel. (Stage-to-compartment expansion).</li>
			<li>
				Uncertainties of different types must realise the description in the well-defined conceptual model. This applies to:<br/>
				&bull; Model structure &bull; Initial values &bull; Transitions &bull; Environmental influences &bull; Signals 
			</li>
		</ol>
		<p>Classical CSS cannot fulfil these conditions – but Full Potential CSS can! If one of several of these issues is part of the conceptul model, Full Potential CSS provides the way to correctly implement them in a CSS model.</p>
		<p>To do so Full Potential CSS requires devices to model discrete/continuous/combined processes and to handle the different types of uncertainties as well as multiple simulations followed by a statistical analysis and presentation of the results in statistical terms.</p>
		<p style="display: flex; flex-direction: row;">
			<img src="graphics/stochsd_high.png" style="width: 32px; height: 32px; position: inline; margin-right: 8px;"> 
			<span><i style="display: flex; flex-direction: column; justify-content: center; height: 100%;">StochSD is a package that can accomplish this.</i></span>
		</p>
		<p>
			At <a target="_blank" href="https://stochsd.sourceforge.io/homepage/" >StochSD’s homepage</a> you find the theoretical papers describing this in detail. You also find Example Models that demonstrates the necessity of following the Full Potential rules. Further there are five Laboratory Exercises that teaches model building and simulation in CSS. &#x25A0;
		</p>
		</div>
		`);
		$(this.dialogContent).find("a").css("color", "blue");
		$(this.dialogContent).find("a").click((event) => {
			let url = event.currentTarget.href;
			if (environment.openLink(url)) {
				event.preventDefault();
			}
		});
	}
}

class LicenseDialog extends CloseDialog {
	constructor() {
		super();
		this.setTitle("StochSD License");

		let currentYear = new Date().getFullYear();
		this.setHtml(`
		<p style="display: inline-block">
		Copyright 2010-${currentYear} StochSD-Team and Scott Fortmann-Roe. All rights reserved.<br/>

		The Insight Maker Engine was contributed to StochSD project from
		Insight Maker project by Scott Fortmann-Roe, <a target="_blank" href="https://insightmaker.com">https://Insightmaker.com<a><br/>
		</p><br/>
		<iframe style="width: 700px; height: 500px;" src="license.html"/>
		</div>
		`);
	}
}

class ThirdPartyLicensesDialog extends CloseDialog {
	constructor() {
		super();
		this.setTitle("Third-party Licenses");

		this.setHtml(`
		<iframe style="width: 700px; height: 500px;" src="third-party-licenses.html"/>
		</div>
		`);
	}
}

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

		this.setTitle(oldNameBrackets + " properties");

		$(this.nameField).val(oldNameBrackets);
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
class MacroDialog extends jqDialog {
	constructor() {
		super();
		this.setTitle("Macro");
		this.seed = "";
		this.setHtml(`
		<div style="display: flex;">
			<div style="min-width: 400px;" >
				<textarea class="macro-text enter-apply" cols="30" rows="10"></textarea>
			</div>
			<div style="padding:0; margin-left: 1em;">
				${this.renderHelpButtonHtml("macro-help")}
				<table class="modern-table zebra" title="SetRandSeed makes stochstics simulations reproducable." style="margin-top: 1em;">
					<tr>	
						<td style="padding:1px;">
							Seed = <input class="seed-field" type="number" />
						</td>
					</tr>
					<tr>
						<td>
							<button class="set-seed-button" disabled>SetRandSeed</button>
						</td>
					</tr>
				</table>
			</div>
		</div>
		`);

		this.setHelpButtonInfo("macro-help", "Macro Help", `<div style="max-width: 400px;">
			<p>Macros allow you to define code that can be used in the model. For example, you can here define your own functions, or set a seed value to make the simulation reproducible.</p>
			<b>Examples:</b>
			<div class="accordion">
				<h3>Define single-line function</h3>
				<div>
					<p class="example-code">
						myFn(a, b, c) &lt;- sin((a+b+c)/(a*b*c))
					</p>
				</div>
				<h3>Define multi-line function</h3>
				<div>
					<p class="example-code">
						Function myFn(a, b, c) <br/>
						x &lt;- (a+b+c) <br/>
						y &lt;- (a*b*c) <br/>
						return sin(x/y) <br/>
						End Function <br/>
					</p>
				</div>
				<h3>Set seed for reproducible stochastic simulations.</h3>
				<div>
					<p>To make a stochastic simulation model <i>reproducible</i>, you have to lock the <i>seed</i> for the random number generators in the model. Then the same sequences of random numbers will be generated for each simulation run. This can be done with the following line.</p>
					<div class="example-code">SetRandSeed(37)</div>
					<p>By changing the argument, you will get another (reproducible) simulation run.</p>
				</div>
			</div>
			<br/>
			<b>Key bindings (for macro text input):</b>
			<ul style="margin: 0.5em 0;">
				<li>${keyHtml("Esc")} &rarr; Cancels changes</li>
				<li>${keyHtml("Enter")} &rarr; Applies changes</li>
				<li>${keyHtml(["Shift", "Enter"])} &rarr; Adds new line</li>
			</ul>
		</div>`);

		this.cmMacroField = new CodeMirror.fromTextArea(document.getElementsByClassName("macro-text")[0],
			{
				mode: "stochsd-dynamic-mode",
				theme: "stochsdtheme resize",
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
					"Ctrl-Space": "autocomplete"
				},
				hintOptions: {
					hint: (cm, options) => Autocomplete.getCompletions(cm, options, this.primitive)
				}
			}
		);
		this.cmMacroField.refresh()

		this.setSeedButton = $(this.dialogContent).find(".set-seed-button");
		$(this.dialogContent).find(".seed-field").keyup((event) => {
			this.seed = $(event.target).val();
			if (event.key === "Enter" && this.seed.length !== 0) {
				this.setSeedButton.click();
			} else {
				this.setSeedButton.attr("disabled", this.seed.length === 0);
			}
		});
		this.setSeedButton.click((event) => {
			const macro = this.cmMacroField.getValue();
			this.cmMacroField.setValue(`${macro}\nSetRandSeed(${this.seed})`);
			this.cmMacroField.focus();
		});
		this.bindEnterApplyEvents();
	}
	beforeShow() {
		this.cmMacroField.setValue(getMacros());
	}
	afterShow() {
		this.updateSize();
		this.cmMacroField.refresh()
	}
	resize() {
		this.updateSize();
	}
	updateSize() { }
	makeApply() {
		setMacros(this.cmMacroField.getValue());
	}
}

class TextAreaDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Text");
		this.setHtml(`<div style="height: 100%;">
			<div style="display: flex; justify-content: space-between; width: 100%; align-items: baseline;">
					<b>Text:</b><span>${this.renderHelpButtonHtml("text-help")}</span>
			</div>
			<textarea class="text enter-apply" style="resize: none;"></textarea>
			<div class="vertical-space"></div>
			<table class="modern-table zebra"><tr title="Only hides when there is any text.">
				<td>Hide frame when there is text:</td>
				<td><input type="checkbox" class="hide-frame-checkbox enter-apply" /></td>
			</tr></table>
		</div>`);

		this.setHelpButtonInfo("text-help", "Text Help", `<div style="max-width: 400px;">
			<b>Key bindings:</b>
			<ul style="margin: 0.5em 0;">
				<li>${keyHtml("Esc")} &rarr; Cancels changes</li>
				<li>${keyHtml("Enter")} &rarr; Applies changes</li>
				<li>${keyHtml(["Shift", "Enter"])} &rarr; Adds new line</li>
			</ul>
		</div>`);

		this.textArea = $(this.dialogContent).find(".text");
		this.hideFrameCheckbox = $(this.dialogContent).find(".hide-frame-checkbox");
		this.bindEnterApplyEvents();
	}
	beforeShow() {
		let oldText = getName(this.primitive);
		this.textArea.val(oldText);
		this.hideFrameCheckbox.prop("checked", this.primitive.getAttribute("HideFrame") === "true");
		$(this.dialogContent).find(".text").focus();
	}
	afterShow() {
		this.updateSize();
	}
	resize() {
		this.updateSize();
	}
	updateSize() {
		let width = this.getWidth();
		let height = this.getHeight();
		this.textArea.width(width - 10);
		this.textArea.height(height - 70);
	}
	beforeCreateDialog() {
		this.dialogParameters.width = "500";
		this.dialogParameters.height = "400";
	}
	makeApply() {
		let newText = $(this.dialogContent).find(".text").val();
		setName(this.primitive, newText);
		this.primitive.setAttribute("HideFrame", this.hideFrameCheckbox.prop("checked"));
	}
}

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

// Override the message function used by the insight maker engine so that we can catch error popups
if (typeof mxUtils == "undefined") {
	window.mxUtils = {};
	window.mxUtils.alert = function (message, closeHandler) {
		xAlert("Message from engine:  " + message, closeHandler);
	}
}
