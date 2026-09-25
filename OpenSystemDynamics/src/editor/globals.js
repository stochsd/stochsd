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

const mouse = { 
	// Stores state related to mouse
	clickedOnObject: false,
	lastClickedPrimitive: null, // Points to the object we last clicked
	isLeftDown: false,
	downX: 0,
	downY: 0,
	x: 0,
	y: 0,
	emptyClickDown: false,
	// NOTE: values for event.which should be used
	// event.button will give incorrect results 
	left: 1, 
	middle: 2, 
	right: 3 
};


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

