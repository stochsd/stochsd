/*

This file may distributed and/or modified under the
terms of the Affero General Public License (http://www.gnu.org/licenses/agpl-3.0.html).

*/

// Dialoge window handlers 
var equationEditor;
var converterDialog;
var simulationSettings;
var timeUnitDialog;
var macroDialog;
var equationList;
var debugDialog;
var aboutDialog;
var thirdPartyLicensesDialog;
var licenseDialog;

// This values are not used by StochSD, as primitives cannot be resized in StochSD
// They are only used for exporting the model to Insight Maker
const type_size = {
	"stock":			[80, 60],
	"variable":		[60, 60],
	"converter":	[80, 60],
	"text":				[120, 60]
}

const type_basename = {
	"timeplot": 	"TimePlot",
	"compareplot":	"ComparePlot",
	"xyplot":		"XyPlot",
	"histoplot":	"HistoPlot",
	"table":		"Table",
	"rectangle": 	"Rectangle",
	"ellipse": 		"Ellipse",
	"line":			"Line",
	"numberbox": 	"Numberbox",
	"text":			"Text",
	"stock":			"Stock",
	"variable":		"Auxiliary",
	"flow":				"Flow",
	"link":				"Link",
	"converter":	"Converter",
	"text":				"Text",
	"constant":		"Parameter"
};

last_connection = null;

// Stores Visual objects and connections
var connection_array = {};
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
	localStorage.setItem("fileName",fileManager.fileName);
	localStorage.setItem("reloadPending", "1");
	applicationReload();
}

function restoreAfterRestart() {
	do_global_log("restoring");
	let reloadPending = localStorage.getItem("reloadPending");
	
	if (reloadPending == null) {
		// No reload is pending
		do_global_log("nothing pending to restore");
		if(Settings.promptTimeUnitDialogOnStart && isTimeUnitOk(getTimeUnits()) === false) {
			// if creating new file without OK timeUnit => promt TimeUnitDialog
			// prompt TimeUnitDialog is unit not set 
			timeUnitDialog.show();
		}
		return;
	}
	do_global_log("removing pending flag");
	// Else remove the pending reload
	localStorage.removeItem("reloadPending");
	
	fileManager.fileName = localStorage.getItem("fileName");
	fileManager.updateTitle();
	
	do_global_log("restore the file");
	fileManager.fileName = localStorage.getItem("fileName");
	
	// Read the history from localStorage
	History.fromLocalStorage();
	
	if(Settings.promptTimeUnitDialogOnStart && isTimeUnitOk(getTimeUnits()) === false ) {
		// if opening new file without OK timeUnit => promt TimeUnitDialog
		// prompt TimeUnitDialog is unit not set 
		timeUnitDialog.show();
	}
}

class History {
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

		// Add to undo history if it is different then previus state
		if (this.lastUndoState != undoState) {
			// Preserves only states from 0 to undoIndex
			this.undoStates.splice(this.undoIndex+1);
			
			this.undoStates.push(undoState);
			this.undoIndex = this.undoStates.length-1;
			this.lastUndoState = undoState;
			this.unsavedChanges = true;

			if (this.undoLimit < this.undoStates.length) {
				this.undoStates = this.undoStates.slice(this.undoStates.length - this.undoLimit);
				this.undoIndex = this.undoStates.length-1;
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
			this.undoIndex --;
			this.restoreUndoState();	
		} else {
			xAlert("No more undo");
		}
	}
	
	static doRedo() {
		if (this.undoIndex < this.undoStates.length-1) {
			this.undoIndex ++;
			this.restoreUndoState();
		} else {
			xAlert("No more redo");
		}
	}
	
	static getCurrentState() {
		return this.undoStates[this.undoIndex];
	}
	
	static debug() {
		console.error("undo index "+this.undoIndex);
		console.error("history length "+this.undoStates.length);
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
		
		for(let i in this.undoStates) {
			let state = this.undoStates[i];
			localStorage.setItem("undoState_"+i, state);
		}
		
		localStorage.setItem("undoIndex", this.undoIndex);
	}
	
	static fromLocalStorage() {
		this.clearUndoHistory();
		let undoState_length = localStorage.getItem("undoState_length");
		for(let i = 0; i < undoState_length; i++) {
			let state = localStorage.getItem("undoState_"+i);
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
	syncAllVisuals();
}

function showPluginMenu() {
	$(".pluginMenu").show();
}

function sendToParentFrame(returnobj,target) {
	results = {};
	results.target = target;
	results.returnobj = returnobj;
	parent.postMessage(JSON.stringify(results), "*");
}

function loadPlugin(pluginName) {	
	sendToParentFrame({"app_name":pluginName}, "load_app");
}

function setParentTitle(newTitle) {	
	sendToParentFrame({"title":newTitle}, "update_title");
}

function quitQuestion() {
	// How close event works
	// https://github.com/nwjs/nw.js/wiki/window
	saveChangedAlert(function() {
		environment.closeWindow()
	});
}

function makeKeyboardCodes() {
	let keyboard = {};
	for(let tkey = 0; tkey <= 255; tkey++) {
		keyboard[String.fromCharCode(tkey)] = tkey;
	}
	//~ alert(key["B"]);
	keyboard["delete"] = 46;
	keyboard["+"] = 187;
	keyboard["-"] = 189;
	keyboard["enter"] = 13;
	keyboard["right"] = 37;
	keyboard["up"] = 38;
	keyboard["left"] = 39;
	keyboard["down"] = 40;
	return keyboard;
}

const keyboard = makeKeyboardCodes();

// NOTE: values for event.which should be used
// event.button will give incorrect results 
const mouse = {"left": 1, "middle": 2, "right": 3};

function updateWindowSize() {
	let windowWidth = $(window).width();
	let windowHeight = $(window).height();
	
	$("#coverEverythingDiv").width(windowWidth);
	$("#coverEverythingDiv").height(windowHeight);
	
	// resizing of the svgplane must be done after everything else is resized to fit with the new height of the toolbar
	// The resize of the toolbar is decided by css depending on how many lines the toolbar is so its very hard if we would calculate this size in advanced
	// Instead we wait until it is resized and then adopt to the result
	setTimeout(function() {
		let svgPosition = $("#svgplanebackground").position();
		$("#svgplanebackground").width(windowWidth-18);
		$("#svgplanebackground").height(windowHeight-svgPosition.top);
	},100);
	
	updateLinkBar();

}

function updateLinkBar() {
	let linkBarLeft = $(window).width()-30-$(".info-bar__im-link").width();
	$(".info-bar__im-link").css("left", linkBarLeft)
}

defaultAttributeChangeHandler = function(primitive, attributeName, value) {
	let id = getID(primitive);
	let type = getType(primitive);
	let visualObject = get_object(id);
	if (visualObject) {
		visualObject.attributeChangeHandler(attributeName, value);
	}
	
	switch(attributeName) {
		case "name":
			set_name(id,value);
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

defaultPositionChangeHandler = function(primitive) {
	let newPosition = getCenterPosition(primitive)
	let visualObject = object_array[getID(primitive)];
	if (visualObject) {
		visualObject.setPos(newPosition);
	}
}

defaultPrimitiveCreatedHandler = function(primitive) {
	syncVisual(primitive);
}

defaultPrimitiveBeforeDestroyHandler = function(primitive) {
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
		macros = sdsMacros+"\n\n\n"+macros;
		setMacros(macros);
	}
}

// Replace macro with the StochSD macro-script
function setStochSDMacros() {
	let macros = sdsMacros+"\n\n\n";
	setMacros(macros);
}

let showMacros = function() {
	macroDialog.show();
};

function getLinkedPrimitives(primitive) {
	let result = [];
	let allLinks = primitives("Link");
	for(let link of allLinks) {
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

function getFunctionHelpData() {
	let helpData = [
		["Mathematical Functions", [
			["Round", "Round(##Value$$)", "Rounds a number to the nearest integer.", ["Round(3.6)", "4"]],
			["Round Up", "Ceiling(##Value$$)", "Rounds a number up to the nearest integer.", ["Ceiling(3.6)", "4"]],
			["Round Down", "Floor(##Value$$)", "Rounds a number down to the nearest integer.", ["Floor(3.6)", "3"]],
			["Cos", "Cos(##Angle$$)", "Finds the cosine of an angle.", ["Cos({180 Degrees})", "-1"]],
			["ArcCos", "ArcCos(##Value$$)", "Finds the arc-cosine of a value. The result includes units.", ["ArcCos(0)", "{90 Degrees}"]],
			["Sin", "Sin(##Angle$$)", "Finds the sine of an angle.", ["Sin({180 Degrees})", "0"]],
			["ArcSin", "ArcSin(##Value$$)", "Finds the arc-sine of a value.  The result includes units.", ["ArcSin(1)", "{90 Degrees}"]],
			["Tan", "Tan(##Angle$$)", "Finds the tangent of an angle.", ["Tan({Pi/4 Radians})", "1"]],
			["ArcTan", "ArcTan(##Value$$)", "Finds the arc-tangent of a value. The result includes units.", ["ArcTan(1)", "{45 Degrees}"]],
			["Log", "Log(##Value$$)", "Returns the base-10 logarithm of a number.", ["Log(1000)", "3"]],
			["Ln", "Ln(##Value$$)", "Returns the natural logarithm of a number.", ["Ln(e^2)", "2"]],
			["Exp", "Exp(##Value$$)", "Returns e taken to a power.", ["Exp(1)", "e"]],
			["Sum", "Sum(##Values$$)", "Returns the sum of a vector or list of numbers.", ["Sum(7, 5, 6)", "18"]],
			["Product", "Product(##Values$$)", "Returns the product of a vector or list of numbers.", ["Product(2, 4, -1)", "-8"]],
			["Maximum", "Max(##Values$$)", "Returns the largest of a vector or list of numbers.", ["Max(2, 4, -1)", "4"]],
			["Minimum", "Min(##Values$$)", "Returns the smallest of a vector or list of numbers.", ["Min(2, 4, -1, 3)", "-1"]],
			["Mean", "Mean(##Values$$)", "Returns the mean of a vector or list of numbers.", ["Mean(2, 7, 3)", "4"]],
			["Median", "Median(##Values$$)", "Returns the median of a vector or list of numbers.", ["Median(2, 7, 3)", "3"]],
			["Standard Deviation", "StdDev(##Values$$)", "Returns the standard deviation of a vector or list of numbers.", ["StdDev(1, 2, 3)", "1"]],
			["Absolute Value", "Abs(##Value$$)", "Returns the absolute value of a number.", ["Abs(-23)", "23"]],
			["Mod", "##(Value One)$$ mod ##(Value Two)$$", "Returns the remainder of the division of two numbers.", ["13 mod 5", "3"]],
			["Square Root", "Sqrt(##Value$$)", "Returns the square root of a number.", ["Sqrt(9)", "3"]],
			["Sign", "Sign(##Value$$)", "1 if the value is greater than 0, -1 if it is less than 0, and 0 if it is 0.", ["Sign(-12)", "-1"]],
			["Pi", "pi", "The value 3.14159265."],
			["e", "e", "The value 2.71828183."],
			["Logit", "Logit(##Value$$)", "Returns the logit transformation of the value. Converts values on a 0 to 1 scale to a -Infinity to Infinity scale.", ["Logit(0.5)", "0"]],
			["Expit", "Expit(##Value$$)", "Returns the expit transformation of the value. Converts values on a -Infinity to Infinity scale to a 0 to 1 scale.", ["Expit(0)", "0.5"]]
		]],
		["Time Functions", [
			["Current Time", "T()", "The current time excluding units."],
			["Time Start", "TS()", "The simulation start time excluding units."],
			["Time Step", "DT()", "The simulation time step excluding units."],
			["Time Length", "TL()", "The total length of the simulation excluding units."],
			["Time End", "TE()", "The time at which the simulation ends excluding units."]
			
			/*
			["Current Time with Units", "Time()", "The current time including units.", "IfThenElse(Time() > 10, 15, 0)"],
			["Time Start with Units", "TimeStart()", "The simulation start time including units."],
			["Time Step with Units", "TimeStep()", "The simulation time step including units."],
			["Time Length with Units", "TimeLength()", "The total length of the simulation including units."],
			["Time End with Units", "TimeEnd()", "The time at which the simulation ends including units.", ["TimeStart() + TimeLength() = TimeEnd()", "True"]]
			*/
		]],
		["Historical Functions", [
			["Delay", "Delay(##[Primitive]$$, ##Delay Length$$, ##Default Value$$)", "Returns the value of a primitive for a specified length of time ago. Default Value stands in for the primitive value in the case of negative times.", "Delay([Income], 5)"],
			["Delay1", "Delay1(##[Primitive]$$, ##Delay Length$$, ##Initial Value$$)", "Returns a smoothed, first-order exponential delay of the value of a primitive. The Initial Value is optional.", "Delay1([Income], 5, 10000)"],
			["Delay3", "Delay3(##[Primitive]$$, ##Delay Length$$, ##Initial Value$$)", "Returns a smoothed, third-order exponential delay of the value of a primitive. The Initial Value is optional.", "Delay3([Income], {20 Months}, 10000)"],
			["Smooth", "Smooth(##[Primitive]$$, ##Length$$, ##Initial Value$$)", "Returns a smoothing of a primitive's past values. Results in an averaged curve fit. Length affects the weight of past values. The Initial Value is optional."],
			["PastValues", "PastValues(##[Primitive]$$, ##Period = All Time$$)", "Returns the values a primitive has taken on over the course of the simulation as a vector. The second optional argument is a time window to limit the depth of the history.", ["Sum(PastValues([Income]))", "Total past income"]],
			["Maximum", "PastMax(##[Primitive]$$, ##Period = All Time$$)", "Returns the maximum of the values a primitive has taken on over the course of the simulation. The second optional argument is a time window to limit the calculation.", ["PastMax([Income], 10)", "The maximum income in the past 10 time units"]],
			["Minimum", "PastMin(##[Primitive]$$, ##Period = All Time$$)", "Returns the minimum of the values a primitive has taken on over the course of the simulation. The second optional argument is a time window to limit the calculation.", ["PastMin([Income], 10)", "The minimum income in the past 10 units of time"]],
			["Median", "PastMedian(##[Primitive]$$, ##Period = All Time$$)", "Returns the median of the values a primitive has taken on over the course of the simulation. The second optional argument is a time window to limit the calculation."],
			["Mean", "PastMean(##[Primitive]$$, ##Period = All Time$$)", "Returns the mean of the values a primitive has taken on over the course of the simulation. The second optional argument is a time window to limit the calculation."],
			["Standard Deviation", "PastStdDev(##[Primitive]$$, ##Period = All Time$$)", "Returns the standard deviation of the values a primitive has taken on over the course of the simulation. The second optional argument is a time window to limit the calculation."],
			["Correlation", "PastCorrelation(##[Primitive]$$, ##[Primitive]$$, ##Period = All Time$$)", "Returns the correlation between the values that two primitives have taken on over the course of the simulation. The third optional argument is an optional time window to limit the calculation.", ["PastCorrelation([Income], [Expenditures], 10)", "The correlation between income and expenditures over the past 10."]],
			["Fix", "Fix(##Value$$, ##Period=-1$$)", "Takes the dynamic value and forces it to be fixed over the course of the period. If period is -1, the value is held constant over the course of the whole simulation.", ["Fix(Rand(), 5)", "Chooses a new random value every five time units"]]
		]],
		["Random Number Functions", [
			["Poisson Flow", "PoFlow(##Lambda$$)", "PoFlow(Lambda) is short for RandPoisson(DT()*Lambda)/DT(). <br/>This should only be used in flows."],
			["Uniform Distribution", "Rand(##Minimum$$, ##Maximum$$)", "Generates a uniformly distributed random number between the minimum and maximum. The minimum and maximum are optional and default to 0 and 1 respectively.", ["Rand()", "0.7481"]],
			["Normal Distribution", "RandNormal(##Mean$$, ##Standard Deviation$$)", "Generates a normally distributed random number with a mean and a standard deviation. The mean and standard deviation are optional and default to 0 and 1 respectively.", ["RandNormal(10, 1)", "11.23"]],
			["Lognormal Distribution", "RandLognormal(##Mean$$, ##Standard Deviation$$)", "Generates a log-normally distributed random number with a mean and a standard deviation."],
			["Binary Distribution", "RandBoolean(##Probability$$)", "Returns 1 with the specified probability, otherwise 0. The probability is optional and defaults to 0.5: a coin flip.", ["RandBoolean(0.1)", "False"]],
			["Binomial Distribution", "RandBinomial(##Count$$, ##Probability$$)", "Generates a binomially distributed random number. The number of successes in Count random events each with Probability of success."],
			["Negative Binomial", "RandNegativeBinomial(##Successes$$, ##Probability$$)", "Generates a negative binomially distributed random number. The number of random events each with Probability of success required to generate the specified Successes."],
			["Poisson Distribution", "RandPoisson(##Lambda$$)", "Generates a Poisson distributed random number."],
			["Triangular Distribution", "RandTriangular(##Minimum$$, ##Maximum$$, ##Peak$$)", "Generates a triangularly distributed random number."],
			["Exponential Distribution", "RandExp(##Lambda$$)", "Generates an exponentially distributed random number with the specified rate parameter."],
			["Gamma Distribution", "RandGamma(##Alpha$$, ##Beta$$)", "Generates a Gamma distributed random number."],
			["Beta Distribution", "RandBeta(##Alpha$$, ##Beta$$)", "Generates a Beta distributed random number."],
			["Custom Distribution", "RandDist(##X$$, ##Y$$)", "Generates a random number according to a custom distribution. Takes two vectors with the x- and y-coordinates respectively of points defining the distribution. Points are interpolated linearly. The distribution does not have to be normalized such that its area is 1, but the points must be sorted from smallest to largest x locations. You may also pass a single vector containing pairs of {x, y} coordinates (e.g. { {1, 0}, {3, 4}, {4, 0} } ).", ["RandDist({0, 1, 2, 3}, {0, 5, 1, 0})", "1.2"]]
		]],
		["General Functions", [
			["Unitless", "Unitless(##Value$$)", "Returns a unitless version of its input.", "Unitless(TimeStep())"],
			["If Then Else", "IfThenElse(##Test Condition$$, ##Value if True$$, ##Value if False$$)", "Tests a condition and returns one value if the condition is true and another value if the condition is false.", ["IfThenElse(20 > 10, 7, 5)", "7"]],
			["Lookup", "Lookup(##Value$$, ##Values Vector$$, ##Results Vector$$)", "Finds the Value in the Values Vector and returns the corresponding item in the Results Vector. If the exact Value is not found in the Values Vector, linear interpolation of the nearby values will be used.", ["Lookup(6, {5, 7}, {10, 15})", "12.5"]],
			["PulseFcn", "PulseFcn(##Time$$, ##Volume$$, ##Repeat)", "Creates a pulse input at the specified time with the specified Volume. Repeat is optional and will create a pulse train with the specified time if positive..", "Pulse(0, 5, 2)"],
			["Step", "Step(##Start$$, ##Height=1$$)", "Creates an input that is initially set to 0 and after the time of Start is set to Height. Height defaults to 1.", "Step(10, 5)"],
			["Ramp", "Ramp(##Start$$, ##Finish$$, ##Height=1$$)", "Creates a ramp input which moves linearly from 0 to Height between the Start and Finish times. Before Start, the value is 0; after Finish, the value is Height. Height defaults to 1.", "Ramp(10, 20, 5)"],
			["Pause", "Pause()", "Pauses the simulation and allows sliders to be adjusted. Often used in combination with an IfThenElse function.", "IfThenElse(T() = 20, Pause(), 0)"],
			["Stop", "Stop()", "Immediately terminates the simulation. Often used in combination with an IfThenElse function.", "IfThenElse(Rand() < 0.01, Stop(), 0)"]
		]],
		["Programming Functions", [
			["Variables", "##Variable$$ <- ##Value$$", "Assigns a value to a reusable variable.", ['x <- 10\nx^2', "100"]],
			["If-Then-Else", "If ##Condition$$ Then\n  ##Expression$$\nElse If ##Condition$$ Then\n  ##Expression$$\nElse\n  ##Expression$$\nEnd If", "Test one or more conditions and selectively execute code based on these tests."],
			["While Loop", "While ##Condition$$\n  ##Expression$$\nEnd Loop", "Repeats an action until a condition is no longer true.", ['x <- 1\nWhile x < 10\n  x <- x*2\nEnd Loop\nx', "16"]],
			["For-In Loop", "For ##Variable$$ in ##Vector$$\n  ##Expression$$\nEnd Loop", "Repeats an action for each element in a vector.", ['sum <- 0\nFor x in {1, 10, 27}\n  sum <- sum + x\nEnd Loop\nsum', "38"]],
			["Functions", "Function ##Name$$()\n  ##Expression$$\nEnd Function", "Creates a reusable function.", ['Function Square(x)\n  x^2\nEnd Function\nSquare(5)', "25"]],
			["Anonymous Functions", "##Variable$$ <- Function()\n  ##Expression$$\nEnd Function", "Creates an anonymous function.", ['square <- Function(x)\n  x^2\nEnd Function\nsquare(5)', "25"]],
			["Anonymous Functions", "Function() ##Expression$$", "Creates a single-line anonymous function.", ['{1, 2, 3}.Map(Function(value) value^2 - value)', "{0, 2, 6}"]],
			["Throwing Errors", "throw '##Message$$'", "Passes an error message up to the nearest Try-Catch block or aborts the simulation with the error message.", 'throw "Error: Index out of range."'],
			["Error Handling", "Try\n  ##Expression$$\nCatch ##ErrorString$$\n  ##Expression // Handle the error$$\nEnd Try", 'Attempts to execute some code. If an error occurs, the error is passed as a string variable to the catch block which will then be executed. The catch block will not be executed unless an error occurs.', 'Try\n  mean(x)\nCatch err\n  alert("Could not calculate the mean of the variable. Error Message: "+err)\nEnd Try']
		]],
		["Statistical Distributions", [
			["CDFNormal", "CDFNormal(##x$$, ##Mean=0$$, ##StandardDeviation=1$$)", "Returns the value of x in the CDF of the Normal Distribution.", ["CDFNormal(1.96)", "0.975"]],
			["PDFNormal", "PDFNormal(##x$$, ##Mean=0$$, ##StandardDeviation=1$$)", "Returns the value of x in the PDF of the Normal Distribution.", ["PDFNormal(1.5, 0, 1)", "0.12"]],
			["InvNormal", "InvNormal(##p$$, ##Mean=0$$, ##StandardDeviation=1$$)", "Returns the value of p in the inverse CDF of the Normal Distribution.", ["InvNormal(0.975)", "1.96"]],
			["CDFLognormal", "CDFLognormal(##x$$, ##Mean=0$$, ##StandardDeviation=1$$)", "Returns the value of x in the CDF of the Lognormal Distribution."],
			["PDFLognormal", "PDFLognormal(##x$$, ##Mean=0$$, ##StandardDeviation=1$$)", "Returns the value of x in the PDF of the Lognormal Distribution."],
			["InvLognormal", "InvLognormal(##p$$, ##Mean=0$$, ##StandardDeviation=1$$)", "Returns the value of p in the inverse CDF of the Lognormal Distribution."],
			["CDFt", "CDFt(##x$$, ##DegreesOfFreedom$$)", "Returns the value of x in the CDF of Student's t Distribution."],
			["PDFt", "PDFt(##x$$, ##DegreesOfFreedom$$)", "Returns the value of x in the PDF of Student's t Distribution."],
			["Invt", "Invt(##p$$, ##DegreesOfFreedom$$)", "Returns the value of p in the inverse CDF of Student's t Distribution."],
			["CDFF", "CDFF(##x$$, ##DegreesOfFreedom1$$, ##DegreesOfFreedom2$$)", "Returns the value of x in the CDF of the F Distribution."],
			["PDFF", "PDFF(##x$$, ##DegreesOfFreedom1$$, ##DegreesOfFreedom2$$)", "Returns the value of x in the PDF of the F Distribution."],
			["InvF", "InvF(##p$$, ##DegreesOfFreedom1$$, ##DegreesOfFreedom2$$)", "Returns the value of p in the inverse CDF of the F Distribution."],
			["CDFChiSquared", "CDFChiSquared(##x$$, ##DegreesOfFreedom$$)", "Returns the value of x in the CDF of the Chi-Squared Distribution."],
			["PDFChiSquared", "PDFChiSquared(##x$$, ##DegreesOfFreedom$$)", "Returns the value of x in the PDF of the Chi-Squared Distribution."],
			["InvChiSquared", "InvChiSquared(##p$$, ##DegreesOfFreedom$$)", "Returns the value of p in the inverse CDF of the Chi-Squared Distribution."],
			["CDFExponential", "CDFExponential(##x$$, ##Rate$$)", "Returns the value of x in the CDF of the Exponential Distribution."],
			["PDFExponential", "PDFExponential(##x$$, ##Rate$$)", "Returns the value of x in the PDF of the Exponential Distribution."],
			["InvExponential", "InvExponential(##p$$, ##Rate$$)", "Returns the value of p in the inverse CDF of the Exponential Distribution."],
			["CDFPoisson", "CDFPoisson(##x$$, ##Lambda$$)", "Returns the value of x in the CDF of the Poisson Distribution."],
			["PMFPoisson", "PMFPoisson(##x$$, ##Lambda$$)", "Returns the value of x in the PMF of the Poisson Distribution."]
		]]

	];
	helpData = helpData.sort(function(a, b) {
		let categoryA = a[0];
		let categoryB = b[0];
		if (categoryA < categoryB) return -1;
		if (categoryA > categoryB) return 1;
		return 0;
	});
	return helpData;
}

function hasRandomFunction(value) {
	let helpData;
	if (value) {
		helpData = getFunctionHelpData();
		let randomFunctions = [];
		for (let help of helpData) {
			if (help[0] === "Random Number Functions") {
				randomFunctions = help[1].map(h => h[1].substring(0, h[1].indexOf("#"))); 
				break;
			}
		}
		return randomFunctions.some(elem => value.includes(elem));
	}
	return false;
}

// sdsLoadFunctions is and must be called from Functions.js
function sdsLoadFunctions() {
	defineFunction("T", {params:[]}, function(x) {
        return new Material(simulate.time().toNum().value);
	});
    defineFunction("DT", {params:[]}, function(x) {
        return new Material(simulate.timeStep.toNum().value);
	});
	defineFunction("TS", {params:[]}, function(x) {
        return new Material(simulate.timeStart.toNum().value);
	});
	defineFunction("TL", {params:[]}, function(x) {
        return new Material(simulate.timeLength.toNum().value);
	});
	defineFunction("TE", {params:[]}, function(x) {
        return new Material(simulate.timeEnd.toNum().value);
	});
    defineFunction("PoFlow", {params:[{name:"Rate", noUnits:true, noVector:true}]}, function(x) {
        let dt = simulate.timeStep.toNum().value;
        
        return new Material(RandPoisson(dt*x[0].toNum().value)/dt);
	});

	// The code should do the same as the macro:
	// PulseFcn(Start, Volume, Repeat) <- Pulse(Start, Volume/DT(), 0, Repeat) 
	defineFunction("PulseFcn", { params:[{name: "Start Time",  vectorize: true}, {name: "Volume",  vectorize: true, defaultVal: 1}, {name: "Width",  vectorize: true, defaultVal: 0}, {name: "Repeat Period",  vectorize: true, defaultVal: 0}]}, function(x) {
		// Width can not be set in this version of pulse
		// Width was parameter x[2] in the old pulse function but here repeat is x[2] instead

		let start = x[0].toNum();
		let volume = new Material(1);
		let width = new Material(0);
		let repeat = new Material(0);
		let height = null; // Is calculated later
		
		let DT = simulate.timeStep.toNum().value;

		if (x.length > 1) {
			volume = x[1].toNum();
			if (x.length > 2) {
				repeat = x[2].toNum();
			}
		}
		if (! start.units) {
			start.units = simulate.timeUnits;
		}
		if (! width.units) {
			width.units = simulate.timeUnits;
		}
		if (! repeat.units) {
			repeat.units = simulate.timeUnits;
		}
		
		height = new Material(volume/DT);

		if (repeat.value <= 0) {
			if (eq(simulate.time(), start) || greaterThanEq(simulate.time(), start) && lessThanEq(simulate.time(), plus(start, width))) {
				return height;
			}
		} else if (greaterThanEq(simulate.time(), start)) {
			let x = minus(simulate.time(), mult(functionBank["floor"]([div(minus(simulate.time(), start), repeat)]), repeat));
			let dv = minus(simulate.time(), start);
			if (minus(functionBank["round"]([div(dv, repeat)]), div(dv, repeat)).value == 0 || (greaterThanEq(x, start) && lessThanEq(x, plus(start, width)))) {
				return height;
			}
		}
		return new Material(0, height.units);
	});
	
	
}

function getVisibleNeighborhoodIds(id) {
	let neighbors = neighborhood(findID(id));
	let visibleNeighbors = neighbors.filter((neighbor) => { return (!neighbor.linkHidden) });
	return visibleNeighbors.map((neighbor) => { return neighbor.item.getAttribute("id");});
}

function makePrimitiveName(primitiveName)  {
	return "["+primitiveName+"]";
}

function stripBrackets(primitiveName) {
	let cutFrom = primitiveName.lastIndexOf("[")+1;
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
	return functionName+"()";
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
	if(number == null) {
		return "";
	}

	// since its not written as E-format by default even as its <1E-7
	// Zero is a special case also or Round to zero when close 
    if(number == 0 || (roundToZeroAt && Math.abs(number) < roundToZeroAt)) {
		return "0";
	}

	// Check if number is to small to be viewed in field
	// If so, force e-format

	if(Math.abs(number)<Math.pow(10,(-tdecimals))) {
        return number.toExponential(2);
	}
	//Check if the number is to big to be view ed in the field
	if(Math.abs(number)>Math.pow(10,tdecimals)) {
        return number.toExponential(2);
	}

	// Else format it as a regular number, and remove ending zeros
	let stringified = number.toFixed(tdecimals);

	// Find the length of stringified, where the ending zeros have been removed
	let i = stringified.length;
	while(stringified.charAt(i-1)=='0') {
		i=i-1;
		// If we find a dot. Stop removing decimals
		if(stringified.charAt(i-1)=='.') {
			i=i-1;
			break;
		}
	}
	// Creates a stripped string without ending zeros
	let stripped = stringified.substring(0,i);
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

function is_family(id1, id2) {
	let parent_id1 = id1.toString().split(".")[0];
	let parent_id2 = id2.toString().split(".")[0];
	if (parent_id1 == parent_id2) {
		return true;
	} else {
		return false;
	}
}

// Get a list of all children for a parent
function getChildren(parentId) {
	let result = {}
	for(let key in object_array) {
		if (get_parent_id(key) == parentId && key != parentId) {
			result[key] = object_array[key];
		}
	}
	for(let key in connection_array) {
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
	for(let id in children) {
		if (children[id].isSelected()) {
			return true;
		}
	}
	return false;
}

function default_double_click(id) {
	let primitive_type = getType(findID(id));
	if (primitive_type == "Ghost") {
		// If we click on a ghost change id to point to source
		id = findID(id).getAttribute("Source");
	}
	equationEditor.open(id, ".value-field");
}

class BaseObject {
	constructor(id,type,pos) {
		this.id = id;
		this.type = type;
		this.selected = false;
		this.name_radius = 30;
		this.superClass = "baseobject";
		this.color = defaultStroke;
		// Warning: this.primitve can be null, since all DIM objects does not have a IM object such as anchors and flow_auxiliarys
		// We should therefor check if this.primitive is null, in case we dont know which class we are dealing with
		this.primitive = findID(this.id);
		
		this.element_array = [];
		this.selector_array = [];
		this.icons; 	// svg_group with icons such as ghost and questionmark
		this.group = null;
		
		this.namePosList = [[0, this.name_radius+8], [this.name_radius, 0], [0, -this.name_radius], [-this.name_radius, 0]];
	}

	setColor(color) {
		this.color = color;
		for (let element of this.element_array) {
			if (element.getAttribute("class") == "element") {
				element.setAttribute("stroke", this.color);
			} else if(element.getAttribute("class") == "name_element") {
				element.setAttribute("fill", this.color);
			} else if(element.getAttribute("class") == "selector") {
				element.setAttribute("fill", this.color);
			}
		}
		if (this.primitive) {
			// AnchorPoint has no primitve
			this.primitive.setAttribute("Color", this.color);
		}
	}

	updateValueError() {
		let valueErrorTypes = ["stock", "variable", "constant", "flow", "converter"];
		if (valueErrorTypes.includes(this.type)) {
			let VE = checkValueError(this.primitive, getValue(this.primitive));
			this.primitive.setAttribute("ValueError", VE ? VE : "");
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
		for(let id in children) {
			children[id].clean();
			delete object_array[id];
		}
		
		this.clearImage();
	}
	clearImage() {
		// Do the cleaning
		for(let i in this.selector_array) {
			this.selector_array[i].remove();
		}
		for(let key in this.element_array) {
			this.element_array[key].remove();
		}
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
		equationEditor.open(id, ".name-field");
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
	constructor(id, type, pos, extras = false) {
		super(id,type,pos);
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
		do_global_log("is ghost "+this.is_ghost);

		this.loadImage();

		this.select();
		
		// Handled for when attribute changes in corresponding SimpleNode
		this.changeAttributeHandler = (attribute,value) => {
			if (attribute == "name") {
				this.setName(value);
			}
		}
	}

	getBoundRect() {
		let [x, y] = this.getPos();
		return {"minX": x-10, "maxX": x+10, "minY": y-10, "maxY": y+10};
	}

	setPos(pos) {
		if (pos[0] == this.pos[0] && pos[1] == this.pos[1]) {
			// If the position has not changed we should not update it
			// This turned out to be a huge optimisation
			return;
		}
		// Recreating the array is intentional to avoid copying a reference
		//~ alert(" old pos "+this.pos[0]+","+this.pos[1]+" new pos "+pos[0]+","+pos[1]);
		this.pos = [pos[0],pos[1]];
	}
		
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
		
		for(let key in element_array) {
			if (element_array[key].getAttribute("class") == "selector") {
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
		for(let key in element_array) {
			if (element_array[key].getAttribute("class") == "name_element") {
				this.name_element = element_array[key];
				$(this.name_element).dblclick((event) => {
					this.nameDoubleClick();
				});
			}
		}
		this.group = svg_group(this.element_array);
		this.group.setAttribute("class", "testgroup");
		this.group.setAttribute("node_id", this.id);
		
		this.update();

		for(let key in this.element_array) {
			let element = this.element_array[key];
			$(element).on("mousedown",(event) => {
				primitive_mousedown(this.id, event);
			});
		}
		$(this.group).dblclick((event) => {
			if (!$(event.target).hasClass("name_element")) {
				this.doubleClick(this.id);
			}
		});
	}
	
	select() {
		this.selected = true;
		for(let i in this.selector_array) {
			this.selector_array[i].setAttribute("visibility", "visible");
		}
		if (this.icons) {
			this.icons.set_color("white");
		}
	}
	unselect() {
		this.selected = false;
		for(let i in this.selector_array) {
			this.selector_array[i].setAttribute("visibility", "hidden");
		}
		if (this.icons) {
			this.icons.set_color(this.color);
		}
	}
	update() {
		this.group.setAttribute("transform", "translate("+this.pos[0]+","+this.pos[1]+")");
		
		let prim = this.is_ghost ? findID(this.primitive.getAttribute("Source")) : this.primitive;
		if (this.icons) {
			let VE = prim.getAttribute("ValueError");
			this.icons.set("questionmark", VE ? "visible" : "hidden");
			this.icons.set("dice", ( ! VE && hasRandomFunction(getValue(prim))) ? "visible" : "hidden");
		}

		if ( ! this.is_ghost) {
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
		default_double_click(get_parent_id(this.id));
	}
}

const anchorTypeEnum = {
	invalid:1,
	start:2,
	end:3,
	bezier1:4,
	bezier2:5,
	orthoMiddle:6
}
class AnchorPoint extends OnePointer {
	constructor(id, type, pos, anchorType) {
		super(id, type, pos);
		this.anchorType = anchorType;
		this.isSquare = false;
	}
	isAttached() {
		let parent = get_parent(this);
		if (! parent.getStartAttach) {
			return;
		}
		switch(this.anchorType) {
			case anchorTypeEnum.start:
				if (parent.getStartAttach()) {
					return true;
				} else {
					return false;
				}
			break;
			case anchorTypeEnum.end:
				if (parent.getEndAttach()) {
					return true;
				} else {
					return false;
				}
			break;
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
			for(let element of this.element_array) {
				// Show all elements except for selectors
				if (element.getAttribute("class") != "selector") {
					element.setAttribute("visibility", "visible");
				}
			}
		}
		else {
			// Hide elements
			for(let element of this.element_array) {
				element.setAttribute("visibility", "hidden");
			}
		}
	}
	updatePosition() {
		this.update();
		let parent = get_parent(this);
		if (parent.start_anchor && parent.end_anchor)  {
			parent.syncAnchorToPrimitive(this.anchorType);	
		}
	}
	getImage() {
		if (this.isSquare) {
			return [
				svg_rect(-4, -4, 8, 8, this.color, "white", "element"),
				svg_rect(-4, -4, 8, 8, "none", this.color, "selector")
			];
		} else {
			return [
				svg_circle(0, 0, 4, this.color, "white", "element"),
				svg_circle(0, 0, 4, "none", this.color, "selector")
			];
		}
		
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
		// This is an attempt to make beizer points move with the anchors points but id does not work well with undo
		// commeted out until fixed
		let parentId = get_parent_id(this.id);
		let parent = get_object(parentId);
		
		if (parent.type == "link") {
			switch(this.anchorType) {
				case anchorTypeEnum.start:
				{
					let oldPos = parent.b1_anchor.getPos();
					parent.b1_anchor.setPos([oldPos[0]+diff_x, oldPos[1]+diff_y]);
				}
				break;
				case anchorTypeEnum.end:
				{
					let oldPos = parent.b2_anchor.getPos();
					parent.b2_anchor.setPos([oldPos[0]+diff_x, oldPos[1]+diff_y]);
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
	if (denominator == 0) {
		return 9999999; 
	} else {
		return nominator/denominator;
	}
}

function sign(value) {
	if (value < 0) {
		return -1;
	} else {
		return 1;
	}
}

class StockVisual extends BasePrimitive {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
		this.updateValueError();
		this.namePosList = [[0, 32], [27, 5], [0, -24], [-27, 5]];
	}

	getSize() {
		return [50, 38];
	}

	getBoundRect() {
		let pos = this.getPos()
		let size = this.getSize();
		return {
			"minX": pos[0] - size[0]/2, 
			"maxX": pos[0] + size[0]/2, 
			"minY": pos[1] - size[1]/2, 
			"maxY": pos[1] + size[1]/2 
		};
	}

	setPos(pos) {
		let diff = translate(neg(this.pos), pos);
		super.setPos(pos);
		let startConn = find_start_connections(this);
		for(let conn of startConn) {
			if (conn.type === "flow" && conn.isSelected() === false) {
				let oldConnPos = conn.start_anchor.getPos();
				let newConnPos = translate(oldConnPos, diff);
				conn.requestNewAnchorPos(newConnPos, conn.start_anchor.id);
			}
		}
		let endConn = find_end_connections(this);
		for(let conn of endConn) {
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
		const targetSlope = safeDivision(yTarget-yCenter, xTarget-xCenter);
		let xEdge;
		let yEdge; 
		if (isInLimits(-boxSlope, targetSlope, boxSlope)) { // Left or right of box
			xEdge = sign(xTarget-xCenter)*width/2 + xCenter;
			if (isInLimits(yCenter-height/2, yTarget, yCenter+height/2)) { // if within box y-limits
				yEdge = yTarget;
			} else {
				yEdge = yCenter + sign(yTarget-yCenter)*height/2
			}
		} else { // above or below box
			if (isInLimits(xCenter-width/2, xTarget, xCenter+width/2)) {	// If within box x-limits
				xEdge = xTarget;
			} else {
				xEdge = xCenter + sign(xTarget-xCenter)*width/2;
			}
			yEdge = sign(yTarget-yCenter) * (height/2) + yCenter;
		}
		return [xEdge, yEdge];
	}

	// Used for LinkVisual
	getLinkMountPos([xTarget, yTarget]) {
		// See "docs/code/mountPoints.svg" for math explanation 
		const [xCenter, yCenter] = this.getPos();
		const [width, height] = this.getSize();
		const boxSlope = safeDivision(height, width);
		const targetSlope = safeDivision(yTarget-yCenter, xTarget-xCenter);
		let xEdge;
		let yEdge; 
		if (isInLimits(-boxSlope, targetSlope, boxSlope)) {
			const xSign = sign(xTarget-xCenter); // -1 if target left of box and 1 if target right of box 
			xEdge = xSign * (width/2) + xCenter;
			yEdge = xSign * (width/2) * targetSlope + yCenter;
		} else {
			const ySign = sign(yTarget-yCenter); // -1 if target above box and 1 if target below box
			xEdge = ySign * safeDivision(height/2, targetSlope) + xCenter;
			yEdge = ySign * (height/2) + yCenter;
		}
		return [xEdge, yEdge];
	}

	getImage() {
		// let textElem = svg_text(0, 39, "stock", "name_element");
		let textElem = svg_text(0, 39, this.primitive.getAttribute("name"), "name_element");
		textElem.setAttribute("fill", this.color);
		let size = this.getSize();
		let w = size[0];
		let h = size[1];
		return [
			svg_rect(-w/2,-h/2, w, h,  this.color,  defaultFill, "element"),
			svg_rect(-w/2+2, -h/2+2, w-4, h-4, "none", this.color, "selector"),
			textElem,
			svg_icons(defaultStroke, defaultFill, "icons")
		];
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
		this.dialog.subscribePool.subscribe(()=>{
			this.render();
		});
	}
	setSelectionSizeToText() {
		let boundingRect = this.name_element.getBoundingClientRect();
		let elementRect = this.element_array[0];
		let selectorRect = this.selector_array[0];
		let marginX = 10;
		let marginY = 2;
		for(let rect of [elementRect,selectorRect]) {
			rect.setAttribute("width",boundingRect.width+marginX*2);
			rect.setAttribute("height",boundingRect.height+marginY*2);
			rect.setAttribute("x",-boundingRect.width/2-marginX);
			rect.setAttribute("y",-boundingRect.height/2-marginY);
		}
	}
	render() {
		if (this.targetID == null) {
			this.name_element.innerHTML = "-";
			this.setSelectionSizeToText();
			return;		
		}
		let valueString = "";
		let primitiveName = "";
		let lastValue = RunResults.getLastValue(this.targetID);
		let imPrimtiive = findID(this.targetID);
		if (imPrimtiive) {
			primitiveName += makePrimitiveName(getName(imPrimtiive));
		} else {
			primitiveName += "Unkown primitive";
		}
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
			valueString += stocsd_format(lastValue, 6, roundToZeroAtValue);
		} else {
			valueString += "_";
		}
		let output = `${valueString}`;
		this.name_element.innerHTML = output;
		this.setSelectionSizeToText();
	}
	get targetID() {
		return Number(this.primitive.getAttribute("Target"));
	}
	set targetID(newTargetID) {
		this.primitive.setAttribute("Target",newTargetID);
		this.render();
	}
	afterNameChange() {
		this.setSelectionSizeToText();
	}
	getImage() {
		return [
			svg_rect(-20,-15,40,30, this.color, defaultFill, "element"),
			svg_rect(-20,-15,40,30, "none", this.color, "selector"),
			svg_text(0,0, "", "name_element",{"alignment-baseline": "middle", "style": "font-size: 16px", "fill": this.color}),
		];	
	}
	setColor(color) {
		super.setColor(color);
		this.select();
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
}

class VariableVisual extends BasePrimitive {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
		this.updateValueError();
		this.namePosList = [[0, 34],[23, 5],[0, -25],[-23, 5]];
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

	getImage () {
		return [
			svg_circle(0,0,this.getRadius(), this.color, defaultFill, "element"),
			svg_text(0,0, this.primitive.getAttribute("name"), "name_element", {"fill": this.color}),
			svg_circle(0,0,this.getRadius()-2, "none", this.color, "selector"),
			svg_icons(defaultStroke, defaultFill, "icons")
		];
	}

	getLinkMountPos([xTarget, yTarget]) {
		// See "docs/code/mountPoints.svg" for math explanation 
		const [xCenter, yCenter] = this.getPos();
		const rTarget = distance([xCenter, yCenter], [xTarget, yTarget]);
		const dXTarget = xTarget - xCenter;
		const dYTarget = yTarget - yCenter;
		const dXEdge = safeDivision(dXTarget*this.getRadius(), rTarget);
		const dYEdge = safeDivision(dYTarget*this.getRadius(), rTarget);
		const xEdge = dXEdge + xCenter; 
		const yEdge = dYEdge + yCenter;
		return [xEdge, yEdge]; 
	}
}

class ConstantVisual extends VariableVisual {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
		this.namePosList = [[0, 36],[25, 5],[0, -29],[-25, 5]];
	}

	getImage() {
		let r = this.getRadius();
		let rs = r - 3; // Selector radius 
		return [
			svg_path(`M0,${r} ${r},0 0,-${r} -${r},0Z`, this.color, defaultFill, "element"),
			svg_text(0, 0, this.primitive.getAttribute("name"), "name_element", {"fill": this.color}),
			svg_path(`M0,${rs} ${rs},0 0,-${rs} -${rs},0Z`, "none", this.color, "selector"),
			svg_icons(defaultStroke, defaultFill, "icons")
		];
	}

	getRadius() {
		return 22;
	}

	getLinkMountPos([xTarget, yTarget]) {
		const [xCenter, yCenter] = this.getPos();
		const targetSlope = safeDivision(yCenter-yTarget, xCenter-xTarget);
		
		// "k" in the formula: y = kx + m
		const edgeSlope = -sign(targetSlope);

		// Where the line intercepts the x-axis ("m" in the formula: y = kx + m)
		const edgeIntercept = this.getRadius()*sign(yTarget - yCenter);
		
		// Relative coodinates relative center of ConstantVisual
		const xEdgeRel = safeDivision(edgeIntercept, targetSlope-edgeSlope);
		const yEdgeRel = edgeSlope*xEdgeRel + edgeIntercept;
		
		const xEdge = xEdgeRel + xCenter;
		const yEdge = yEdgeRel + yCenter;
		return [xEdge, yEdge];
	}
}

class ConverterVisual extends BasePrimitive {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
		this.updateValueError();
		this.namePosList = [[0, 29],[23, 5],[0, -21],[-23, 5]];
	}
	getImage() {
		return [
			svg_path("M-20 0  L-10 -15  L10 -15  L20 0  L10 15  L-10 15  Z", this.color, defaultFill, "element"),
			svg_path("M-20 0  L-10 -15  L10 -15  L20 0  L10 15  L-10 15  Z", "none", this.color, "selector", {"transform": "scale(0.87)"}),
			svg_icons(defaultStroke, defaultFill, "icons"),
			svg_text(0,0, this.primitive.getAttribute("name"), "name_element", {"fill": this.color}),
		];
	}

	getLinkMountPos([xTarget, yTarget]) {
		// See "docs/code/mountPoints.svg" for math explanation 
		const [xCenter, yCenter] = this.getPos();
		const hexSlope = safeDivision(15.0, 10);  // placement of corner is at (10,15)
		const targetSlope = safeDivision(yTarget-yCenter, xTarget-xCenter);
		let xEdgeRel; 	// Relative x Position to center of Visual object.
		let yEdgeRel; 	// Relative y Position to center of Visual object.  
		if (hexSlope < targetSlope || targetSlope < -hexSlope) {
			const ySign = sign(yTarget - yCenter); 	// -1 if target above hexagon and 1 if target below hexagon 
			xEdgeRel = ySign*safeDivision(15, targetSlope);
			yEdgeRel = ySign*15; 
		} else if (0 < targetSlope && targetSlope < hexSlope) {
			const xSign = sign(xTarget - xCenter); // -1 if target left of hexagon and 1 if target right of hexagon
			xEdgeRel = xSign*safeDivision(30, (3/2)+targetSlope);
			yEdgeRel = xEdgeRel*targetSlope;
		} else {
			const xSign = sign(xTarget - xCenter); // -1 if target left of hexagon and 1 if target right of hexagon
			xEdgeRel = xSign*safeDivision(30, (3/2)-targetSlope);
			yEdgeRel = xEdgeRel*targetSlope;
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
		} else {
			do_global_log("choose no");
			this.primitive.setAttribute("Source", "Time");
		}
	}
	nameDoubleClick() {
		converterDialog.open(this.id, ".name-field");
	}
	
	doubleClick() {
		converterDialog.open(this.id, ".value-field");
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
		$(this.group).on("mousedown",function(event) {
			let node_id = this.getAttribute("node_id");
			primitive_mousedown(node_id, event);
		});
		
		// this is done so anchor is ontop 
		this.start_anchor.reloadImage();
		this.end_anchor.reloadImage();

		last_connection = this;
	}

	createInitialAnchors(pos0, pos1) {
		this.start_anchor = new AnchorPoint(this.id+".start_anchor", "dummy_anchor", pos0, anchorTypeEnum.start);
		this.end_anchor = new AnchorPoint(this.id+".end_anchor", "dummy_anchor", pos1, anchorTypeEnum.end);
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

	getPos() { return [(this.startX + this.endX)/2,(this.startY + this.endY)/2]; }
	getMinX() { return Math.min(this.startX, this.endX); }
	getMinY() { return Math.min(this.startY, this.endY); }
	getWidth() { return Math.abs(this.startX - this.endX); }
	getHeight() { return Math.abs(this.startY - this.endY); }

	unselect() {
		this.selected = false;
		for(let anchor of this.getAnchors()) {
			anchor.setVisible(false);
		}
	}
	select() {
		this.selected = true;
		for(let anchor of this.getAnchors()) {
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
	syncAnchorToPrimitive(anchorType) {
		// This function should sync anchor position to primitive 
		let Primitive = findID(this.id);
		switch(anchorType) {
			case anchorTypeEnum.start:
				setSourcePosition(Primitive, this.start_anchor.getPos());
			break;
			case anchorTypeEnum.end:
				setTargetPosition(Primitive, this.end_anchor.getPos());
			break;
		}
	}
}

class BaseConnection extends TwoPointer {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this._start_attach = null;
		this._end_attach = null;
		this.positionUpdateHandler = () => {
			let primitive = findID(this.id);
			let sourcePoint = getSourcePosition(primitive);
			let targetPoint = getTargetPosition(primitive);
			this.start_anchor.setPos(sourcePoint);
			this.end_anchor.setPos(targetPoint);
			alert("Position got updated");
		}
		last_connection = this;
	}

	isAcceptableStartAttach(attachVisual) {
		// function to decide if attachVisual is ok allowed to attach start to 
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
		if (new_end_attach != null && this.isAcceptableEndAttach(new_end_attach) === false ) {
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
	} catch(ex) {
		return ex.stack;
	}
}


class FlowVisual extends BaseConnection {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.updateValueError();
		this.namePosList = [[0,40],[31,5],[0,-33],[-31,5]]; 	// Textplacement when rotating text
		
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
		if (index === -1 && index === anchors.length-1) {
			return null;
		} else {
			return anchors[index+1];
		}
	}

	requestNewAnchorDim(reqValue, anchor_id, dimIndex) {
		// reqValue is x or y 
		let anchor = object_array[anchor_id];
		let anchorAttach = false;
		let newValue = reqValue;
		if (anchor.getAnchorType() === anchorTypeEnum.start) {
			anchorAttach = this._start_attach;
		} else if (anchor.getAnchorType() === anchorTypeEnum.end) {
			anchorAttach = this._end_attach;
		}
		// if anchor is attached limit movement 
		if (anchorAttach) {
			// stockX or stockY
			let stockDim = anchorAttach.getPos()[dimIndex];
			// stockWidth or stockHeight
			let stockSpanSize = anchorAttach.getSize()[dimIndex];
			newValue = clampValue(reqValue, stockDim-stockSpanSize/2, stockDim+stockSpanSize/2);
		} else {	
			// dont allow being closer than minDistance units to a neightbour node 
			let minDistance = 10;
			let prevAnchor = this.getPreviousAnchor(anchor_id);
			let nextAnchor = this.getNextAnchor(anchor_id);

			let requestPos = anchor.getPos();
			requestPos[dimIndex] = reqValue;
			if ((prevAnchor && distance(requestPos, prevAnchor.getPos()) < minDistance) ||
			  	(nextAnchor && distance(requestPos, nextAnchor.getPos()) < minDistance) ) {
				// set old value of anchor 
				newValue = anchor.getPos()[dimIndex];
			} else {
				// set requested value 
				newValue = reqValue;
			}
		}
		
		let pos = anchor.getPos();
		pos[dimIndex] = newValue;
		anchor.setPos(pos);
		return newValue;
	}

	requestNewAnchorX(x, anchor_id) {
		return this.requestNewAnchorDim(x, anchor_id, 0);
	}

	requestNewAnchorY(y, anchor_id) {
		return this.requestNewAnchorDim(y, anchor_id, 1);
	}

	requestNewAnchorPos(newPos, anchor_id) {
		let [x, y] = newPos;
		let mainAnchor = object_array[anchor_id];

		let prevAnchor = this.getPreviousAnchor(anchor_id);
		let nextAnchor = this.getNextAnchor(anchor_id);

		let prev_moveInX = true;
		let next_moveInX = true;

		if (prevAnchor && this.middleAnchors.length === 0) {
			let prevAnchorPos = prevAnchor.getPos();
			prev_moveInX = Math.abs(prevAnchorPos[0] - x) < Math.abs(prevAnchorPos[1] - y);
			next_moveInX = ! prev_moveInX;
		} else if (nextAnchor && this.middleAnchors.length === 0) {
			let nextAnchorPos = nextAnchor.getPos();
			next_moveInX = Math.abs(nextAnchorPos[0] - x) < Math.abs(nextAnchorPos[1] - y);
			prev_moveInX = ! next_moveInX;
		} else {
			// if more than two anchor 
			let anchors = this.getAnchors();
			let [x1, y1] = anchors[0].getPos();
			let [x2, y2] = anchors[1].getPos();
			let flow_start_direction_x = Math.abs(x1 - x2) < Math.abs(y1 - y2);
			let index = anchors.map(anchor => anchor.id).indexOf(anchor_id);			
			prev_moveInX = ((index%2) === 1) === flow_start_direction_x;
			next_moveInX = ! prev_moveInX;
		}

		if (prevAnchor) {
			// Get direction of movement or direction of previous anchor 
			if ( prev_moveInX ) {
				x = this.requestNewAnchorX(x, prevAnchor.id);
			} else {
				y = this.requestNewAnchorY(y, prevAnchor.id);
			}
		}
		if (nextAnchor) {
			if ( next_moveInX ) {
				x = this.requestNewAnchorX(x, nextAnchor.id);
			} else {
				y = this.requestNewAnchorY(y, nextAnchor.id);
			}
		}
		mainAnchor.setPos([x,y]);
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
		const dXEdge = safeDivision(dXTarget*this.getRadius(), rTarget);
		const dYEdge = safeDivision(dYTarget*this.getRadius(), rTarget);
		const xEdge = dXEdge + xCenter; 
		const yEdge = dYEdge + yCenter;
		return [xEdge, yEdge]; 
	}

	moveValve() {
		if (this.variableSide) {
			this.valveIndex = (this.valveIndex+1)%(this.middleAnchors.length+1);
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
			this.id+".point"+index, 
			"dummy_anchor", 
			[x, y], 
			anchorTypeEnum.orthoMiddle, 
			index
		);
		this.middleAnchors.push(newAnchor);
	}

	removeLastMiddleAnchorPoint() {
		// set valveIndex to 0 to avoid valveplacement bug 
		if (this.valveIndex === this.middleAnchors.length) {
			this.valveIndex = this.middleAnchors.length-1;
		}
		let removedAnchor = this.middleAnchors.pop();
		delete_object(removedAnchor.id);
	}
	
	parseMiddlePoints(middlePointsString) {
		if (middlePointsString == "") {
			return [];
		}
		// example input: "15,17 19,12 "
		
		// example ["15,17", "19,12"]
		let stringPoints = middlePointsString.trim().split(" ");
		
		// example [["15", "17"], ["19", "12"]]
		let stringDimension = stringPoints.map(stringPos => stringPos.split(","));
		
		// example [[15,17], [19,12]]
		let points = stringDimension.map(dim => [parseInt(dim[0]), parseInt(dim[1])]);

		return points;
	}

	loadMiddlePoints() {
		let middlePointsString = this.primitive.getAttribute("MiddlePoints");
		if (! middlePointsString) {
			return [];
		}
		let points = this.parseMiddlePoints(middlePointsString);
		for (let point of points) {
			let index = this.middleAnchors.length;
			let newAnchor = new OrthoAnchorPoint(
				this.id+".point"+index, 
				"dummy_anchor", 
				point,
				anchorTypeEnum.orthoMiddle, 
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
		let valveX = (points[this.valveIndex][0]+points[this.valveIndex+1][0])/2;
		let valveY = (points[this.valveIndex][1]+points[this.valveIndex+1][1])/2;
		return [valveX, valveY];
	}

	getValveRotation() {
		let points = this.getAnchors().map(anchor => anchor.getPos());
		let dir = neswDirection(points[this.valveIndex], points[this.valveIndex+1]);
		let valveRot = 0;
		if (dir == "north" || dir == "south") {
			valveRot = 90;
		}
		return valveRot;
	}

	getVariablePos() {
		let points = this.getAnchors().map(anchor => anchor.getPos());
		let dir = neswDirection(points[this.valveIndex], points[this.valveIndex+1]);
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
		return [valveX+variableOffset[0], valveY+variableOffset[1]];
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
		this.variable.getElementsByClassName("selector")[0].setAttribute("fill", color);
		this.name_element.setAttribute("fill", color);
		this.getAnchors().map(anchor => anchor.setColor(color));
	}

	makeGraphics() {
		this.startCloud = svg_cloud(this.color, defaultFill, {"class": "element"});
		this.endCloud = svg_cloud(this.color, defaultFill, {"class": "element"});
		this.outerPath = svg_wide_path(5, this.color, {"class": "element"});
		this.innerPath = svg_wide_path(3, "white"); // Must have white ohterwise path is black
		this.arrowHeadPath = svg_arrow_head(this.color, defaultFill, {"class": "element"});
		this.flowPathGroup = svg_group([this.startCloud, this.endCloud, this.outerPath, this.innerPath, this.arrowHeadPath]);
		this.valve = svg_path("M8,8 -8,-8 8,-8 -8,8 Z", this.color, defaultFill, "element");
		this.name_element = svg_text(0, -this.getRadius(), "vairable", "name_element");
		this.icons = svg_icons(defaultStroke, defaultFill, "icons");
		this.variable = svg_group(
			[svg_circle(0, 0, this.getRadius(), this.color, "white", "element"), 
			svg_circle(0, 0, this.getRadius()-2, "none", this.color, "selector"),
			this.icons,	
			this.name_element]
		);
		this.icons.set_color("white");
		this.middleAnchors = [];
		this.valveIndex = 0;
		this.variableSide = false;
		
		$(this.name_element).dblclick((event) => {	
			this.nameDoubleClick();
		});
		
		this.group = svg_group([this.flowPathGroup, this.valve, this.variable]);
		this.group.setAttribute("node_id",this.id);

		$(this.group).dblclick(() => {
			this.doubleClick(this.id);
		});
		this.updateGraphics();
	}
	
	getDirection() {
		// This function is used to determine which way the arrowHead should aim 
		let points = this.getAnchors().map(anchor => anchor.getPos());
		let len = points.length;
		let p1 = points[len-1];
		let p2 = points[len-2];
		return [p2[0]-p1[0], p2[1]-p1[1]];
	}

	shortenLastPoint(shortenAmount) {
		let points = this.getAnchors().map(anchor => anchor.getPos());
		let last = points[points.length-1];
		let secondLast = points[points.length-2];
		let sine = sin(last, secondLast);
		let cosine = cos(last, secondLast);
		let newLast = rotate([shortenAmount, 0], sine, cosine);
		newLast = translate(newLast, last);
		points[points.length-1] = newLast;
		return points;
	}

	update() {
		// This function is similar to TwoPointer::update but it takes attachments into account
		
		// Get start position from attach
		// _start_attach is null if we are not attached to anything
		
		let points = this.getAnchors().map(anchor => anchor.getPos());
		let connectionStartPos = points[1];
		let connectionEndPos = points[points.length-2]; 

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
		this.getAnchors().map( anchor => anchor.updatePosition() );

		if(this.primitive && this.icons) {
			let VE = this.primitive.getAttribute("ValueError");
			if (VE) {
				this.icons.set("questionmark", "visible");
			} else {
				this.icons.set("questionmark", "hidden");
			}
			this.icons.set("dice", (! VE && hasRandomFunction(getValue(this.primitive)) ) ? "visible" : "hidden");
		}
	}
	
	updateGraphics() {
		let points = this.getAnchors().map(anchor => anchor.getPos());
		if (this.getStartAttach() == null) {
			this.startCloud.set_visibility(true);
			this.startCloud.set_pos(points[0], points[1]);
		} else {
			this.startCloud.set_visibility(false);
		}
		if (this.getEndAttach() == null) {
			this.endCloud.set_visibility(true);
			this.endCloud.set_pos(points[points.length-1], points[points.length-2]);
		} else {
			this.endCloud.set_visibility(false);
		}
		this.outerPath.setPoints(this.shortenLastPoint(12));
		this.innerPath.setPoints(this.shortenLastPoint(8));
		this.arrowHeadPath.set_pos(points[points.length-1], this.getDirection());

		let [valveX, valveY] = this.getValvePos();
		let valveRot = this.getValveRotation();
		let [varX, varY] = this.getVariablePos();
		svg_transform(this.valve, valveX, valveY, valveRot, 1);
		svg_translate(this.variable, varX, varY);
		// Update
		this.startCloud.update();
		this.endCloud.update();
		this.outerPath.update();
		this.innerPath.update();
		this.arrowHeadPath.update();
	}
	
	unselect() {
		super.unselect();
		this.variable.getElementsByClassName("selector")[0].setAttribute("visibility", "hidden");
		this.icons.set_color(this.color);
	}

	select() {
		super.select();
		this.variable.getElementsByClassName("selector")[0].setAttribute("visibility", "visible");
		this.icons.set_color("white");
	}
	
	doubleClick() {
		default_double_click(this.id);
	}
}

class RectangleVisual extends TwoPointer {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.dialog = new RectangleDialog(this.id);
		this.dialog.subscribePool.subscribe(()=>{
			this.updateGraphics();
		});
	}
	makeGraphics() {
		this.element = svg_rect(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), defaultStroke, "none", "element");

		// Invisible rect to more easily click
		this.clickRect = svg_rect(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), "transparent", "none");
		this.clickRect.setAttribute("stroke-width", "10");

		this.coordRect = new CoordRect();
		this.coordRect.element = this.element;

		this.clickCoordRect = new CoordRect();
		this.clickCoordRect.element = this.clickRect;

		this.group = svg_group([this.element, this.clickRect]);
		this.group.setAttribute("node_id",this.id);
		this.element_array = [this.element];
		for(let key in this.element_array) {
			this.element_array[key].setAttribute("node_id",this.id);
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
		this.dialog.subscribePool.subscribe(()=>{
			this.updateGraphics();
		});
	}
	makeGraphics() {
		let cx = (this.startX + this.endX)/2;
		let cy = (this.startY + this.endY)/2;
		let rx = Math.max(Math.abs(this.startX - this.endX)/2, 1);
		let ry = Math.max(Math.abs(this.startY - this.endY)/2, 1);
		this.element = svg_ellipse(cx, cy, rx, ry, defaultStroke, "none", "element");
		this.clickEllipse = svg_ellipse(cx, cy, rx, ry, "transparent", "none","element", {"stroke-width": "10"});
		this.selector = svg_rect(cx, cy, rx, ry, defaultStroke, defaultFill, "selector", {"stroke-dasharray": "2 2"});

		this.selectorCoordRect = new CoordRect();
		this.selectorCoordRect.element = this.selector;
		this.element_array = [this.element];
		this.group = svg_group( [this.element, this.clickEllipse, this.selector]);
		this.group.setAttribute("node_id", this.id);

		$(this.group).dblclick(() => {
			this.doubleClick();
		});
	}
	doubleClick() {
			this.dialog.show();
	}
	updateGraphics() {
		let cx = (this.startX + this.endX)/2;
		let cy = (this.startY + this.endY)/2;
		let rx = Math.max(Math.abs(this.startX - this.endX)/2, 1);
		let ry = Math.max(Math.abs(this.startY - this.endY)/2, 1);
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
	removePlotReference(id) {
		if (this.dialog.displayIdList.includes(id)) {
			this.dialog.removeIdToDisplay(id);
			this.render();
		}
	}
	render() {
		html = "";
		html += "<table class='sticky-table'><thead><tr>";
		
		let IdsToDisplay = this.dialog.getIdsToDisplay();
		this.primitive.setAttribute("Primitives",IdsToDisplay.join(","));
		do_global_log(IdsToDisplay);
		this.data.namesToDisplay = IdsToDisplay.map(findID).map(getName);
		do_global_log("names to display");
		do_global_log(JSON.stringify(this.data.namesToDisplay));
		let limits = JSON.parse(this.primitive.getAttribute("TableLimits"));

		let start_time = limits.start.auto ? getTimeStart() : limits.start.value;
		let end_time = limits.end.auto ? getTimeStart()+getTimeLength() : limits.end.value;
		let time_step = limits.step.auto ? this.dialog.getDefaultPlotPeriod() : limits.step.value;
		let length = end_time - start_time;
		this.data.results = RunResults.getFilteredSelectiveIdResults(IdsToDisplay, start_time, length, time_step);
		
		// Make header
		html += "<th class='time-header-cell'>Time</th>";
		for(let i in this.data.namesToDisplay) {
			html += `<th class="prim-header-cell">${this.data.namesToDisplay[i]}</th>`;
		}
		// Make content
		html += "</thead><tbody>";

		let time_step_str = `${getTimeStep()}`;
		let decimals = decimals_in_value_string(time_step_str);

		for(let row_index in this.data.results) {
			html += "<tr>";
			for(let column_index in ["Time"].concat(this.data.namesToDisplay)) {
				// We must get the data in column_index+1 since column 1 is reserved for time
				let roundToZero = this.primitive.getAttribute("RoundToZero");
				let roundToZeroAtValue = -1;
				if (roundToZero === "true") {
					roundToZeroAtValue = this.primitive.getAttribute("RoundToZeroAtValue");
					if (isNaN(roundToZeroAtValue)) {
						roundToZeroAtValue = getDefaultAttributeValue("table", "RoundToAtZeroValue");
					} else {
						roundToZeroAtValue = Number(roundToZeroAtValue);
					}
				}
				if (column_index == 0) {
					let valueString = format_number(
						this.data.results[row_index][column_index], 
						{ "round_to_zero_limit": roundToZeroAtValue,  "decimals": decimals }
					);
					html += `<td class="time-value-cell">${valueString}</td>`;
				} else {
					let valueString = format_number(
						this.data.results[row_index][column_index], 
						{ "round_to_zero_limit": roundToZeroAtValue,  "precision": 3 }
					);
					html += `<td class="prim-value-cell">${valueString}</td>`;
				}
			}
			html += "</tr>";
		}
		html += "</tbody></table>";
		
		if (this.data.results.length === 0) {
			// show this when empty table 
			html += (`<div class="empty-plot-header">Table</div>`);
		}
		this.updateHTML(html);
		this.dialog.data = this.data;
	}

	makeGraphics() {
		this.dialog = new TableDialog(this.id);
		this.dialog.subscribePool.subscribe(()=>{
			this.render();
		});
		this.element = svg_rect(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), defaultStroke, "none", "element", "");
		this.htmlElement = svg_foreignobject(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), "table not renderd yet", "white");
		$(this.htmlElement.innerDiv).mousedown((event) => {
			// This is an alternative to having the htmlElement in the group
				primitive_mousedown(this.id,event)
				mouseDownHandler(event);
				event.stopPropagation();
		});
		
		$(this.htmlElement.scrollDiv).dblclick(()=>{
			this.dialog.show();
		});
		
		this.coordRect = new CoordRect();
		this.coordRect.element = this.element;
		
		this.group = svg_group([this.element]);
		this.group.setAttribute("node_id",this.id);	
		
		this.element_array = [this.element];
		this.element_array = [this.htmlElement.scrollDiv, this.element];
		for(let key in this.element_array) {
			this.element_array[key].setAttribute("node_id",this.id);
		}
	}
	updateGraphics() {
		// Update rect to fit start and end position
		this.coordRect.x1 = this.startX;
		this.coordRect.y1 = this.startY;
		this.coordRect.x2 = this.endX;
		this.coordRect.y2 = this.endY;
		this.coordRect.update();
		
		this.htmlElement.setAttribute("x",this.getMinX());
		this.htmlElement.setAttribute("y",this.getMinY());
		
		this.htmlElement.setAttribute("width",this.getWidth());
		this.htmlElement.setAttribute("height",this.getHeight());
		
		$(this.htmlElement.cutDiv).css("width",this.getWidth());
		$(this.htmlElement.cutDiv).css("height",this.getHeight());
		$(this.htmlElement.scrollDiv).css("width",this.getWidth());
		$(this.htmlElement.scrollDiv).css("height",this.getHeight());
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
		this.targetElement.style.left = (this.getMinX()+this.targetBorder+1)+"px";
		this.targetElement.style.top = (this.getMinY()+this.targetBorder+1)+"px";
		this.targetElement.style.width = "2px";
		this.targetElement.style.height = "2px";
		document.getElementById("svgplanebackground").appendChild(this.targetElement);
		
		$(this.targetElement).mousedown((event) => {
			// This is an alternative to having the htmlElement in the group
				primitive_mousedown(this.id,event)
				mouseDownHandler(event);
				event.stopPropagation();
		});
		
		$(this.targetElement).dblclick(()=>{
			this.doubleClick(this.id);
		});

		// Emergency solution since double clicking a ComparePlot or XyPlot does not always work.
		$(this.targetElement).bind("contextmenu", (event)=> {
			this.doubleClick(this.id);
		});

		this.element = svg_rect(this.getMinX(), this.getMinY(), this.getWidth(), this.getHeight(), defaultStroke, "white", "element",	"");

		this.coordRect = new CoordRect();
		this.coordRect.element = this.element;
		
		this.group = svg_group([this.element]);
		this.group.setAttribute("node_id", this.id);	
		
		this.element_array = [this.element];
		for(let key in this.element_array) {
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
		
		let svgoffset = $("#svgplane").offset();
		
		
		this.targetElement.style.left = (this.getMinX()+this.targetBorder+1)+"px";
		this.targetElement.style.top = (this.getMinY()+this.targetBorder+1)+"px";
		
		this.targetElement.style.width = (this.getWidth()-(2*this.targetBorder))+"px";
		this.targetElement.style.height = (this.getHeight()-(2*this.targetBorder))+"px";
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
	updateGraphics() {
		super.updateGraphics();
		let newWidth = `${$(this.targetElement).width()-10}px`;
		let newHeight = `${$(this.targetElement).height()-10}px`;
		let oldWidth = this.chartDiv.style.width;
		let oldHeight = this.chartDiv.style.height;
		if (oldWidth !== newWidth || oldHeight !== newHeight) {
			this.chartDiv.style.width = newWidth;
			this.chartDiv.style.height = newHeight;
			this.updateChart();
		}
	}
	makeGraphics() {
		super.makeGraphics();
		
		this.chartId = this.id+"_chart";
		let html = `<div id="${this.chartId}" style="width:0px; height:0px; z-index: 100;"></div>`;
		this.updateHTML(html);
		this.chartDiv = document.getElementById(this.chartId);
	}
}

class TimePlotVisual extends PlotVisual {
	constructor(id, type, pos0, pos1) {
		super(id, type, pos0, pos1);
		this.runHandler = () => {
			this.fetchData();
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
		this.dialog.subscribePool.subscribe(()=>{
			this.render();
		});
	}
	removePlotReference(id) {
		if (this.dialog.displayIdList.includes(id)) {
			this.dialog.removeIdToDisplay(id);
			this.render();
		}
	}
	fetchData() {
		this.fetchedIds = this.dialog.getIdsToDisplay();
		this.fetchedIds.map(id => {
			if (findID(id) === null) {
				this.dialog.removeIdToDisplay(id);
			}
		});
		this.fetchedIds = this.dialog.getIdsToDisplay();
		
		this.data.resultIds = ["time"].concat(this.fetchedIds);
		let plot_per = Number(this.primitive.getAttribute("PlotPer"));
		this.data.results = RunResults.getFilteredSelectiveIdResults(this.fetchedIds, getTimeStart(), getTimeLength(), plot_per);
	}
	render() {
		// Remove deleted primitves 
		let idsToDisplay = this.dialog.getIdsToDisplay();
		let sides = this.dialog.getSidesToDisplay();
		this.primitive.setAttribute("Primitives", idsToDisplay.join(","));
		this.primitive.setAttribute("Sides", sides.join(","));
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
			let plotPerIdx = Math.floor(this.data.results.length/4);
			for (let i = 0; i < this.data.results.length; i++) {
				let row = this.data.results[i];
				let time = Number(row[0]);
				let value = Number(row[resultColumn]);
				let showNumHere = i%plotPerIdx === Math.floor((plotPerIdx/2 + (plotPerIdx*lineCount)/8)%plotPerIdx);
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
		for(let i = 0; i < idsToDisplay.length; i++) {
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
			label += ((sides.includes("R") && sides.includes("L")) ? ((sides[i] === "L") ? " - L": " - R") : (""));
			this.serieSettingsArray.push(
				{
					showLabel: true,
					lineWidth: this.widthsToDisplay[i],
					label: label, 
					yaxis: (sides[i] === "L") ? "yaxis": "y2axis",
					linePattern: this.patternsToDisplay[i], 
					color: this.primitive.getAttribute("ColorFromPrimitive") === "true" ? this.colorsToDisplay[i] : undefined,
					shadow: false,
					showMarker: false,
					pointLabels: {
						show: true,
						edgeTolerance: 0,
						ypadding: 0,
						location: "n"
					}
				}
			);
		}

		do_global_log("serieArray "+JSON.stringify(this.serieArray));

		do_global_log(JSON.stringify(this.serieSettingsArray));
		
		// We need to ad a delay and respond to events first to make this work in firefox
		setTimeout(() => {
			this.updateChart();
		 },200);
		
	}
	updateChart() {
		if (this.serieArray == null || this.serieArray.length == 0) {
			this.setEmptyPlot();
			return;
		}
		$(this.chartDiv).empty();

		let axis_limits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		this.plot = $.jqplot(this.chartId, this.serieArray, {  
			title: this.primitive.getAttribute("TitleLabel"),
			series: this.serieSettingsArray,
			grid: {
				background: "white",
				shadow: false
			},
			axes: {
				xaxis: {
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					label: "Time",
					min: axis_limits.timeaxis.auto ? getTimeStart() : axis_limits.timeaxis.min,
					max: axis_limits.timeaxis.auto ? getTimeStart()+getTimeLength() : axis_limits.timeaxis.max 
				},
				yaxis: {
					renderer: (this.primitive.getAttribute("LeftLogScale")==="true") ? $.jqplot.LogAxisRenderer : $.jqplot.LinearAxisRenderer,
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					label: this.primitive.getAttribute("LeftAxisLabel"),
					min: axis_limits.leftaxis.auto ? undefined : axis_limits.leftaxis.min,
					max: axis_limits.leftaxis.auto ? undefined : axis_limits.leftaxis.max
				},
				y2axis: {
					renderer: (this.primitive.getAttribute("RightLogScale")==="true") ? $.jqplot.LogAxisRenderer : $.jqplot.LinearAxisRenderer,
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					label: this.primitive.getAttribute("RightAxisLabel"),
					min: axis_limits.rightaxis.auto ? undefined : axis_limits.rightaxis.min,
					max: axis_limits.rightaxis.auto ? undefined : axis_limits.rightaxis.max,
					tickOptions: {
						showGridline: false
					}
				}
			},
			highlighter: {
				show: true,
				sizeAdjust: 1.5,
				tooltipAxes: "xy",
				formatString: "Time = %.5p<br/>Value = %.5p",
				useAxesFormatters: false
			},
			legend: {
				show: true,
				placement: 'outsideGrid'
			 }
		});
		if (axis_limits.leftaxis.auto && this.serieSettingsArray.map(ss => ss["yaxis"]).includes("yaxis")) {
			if ( ! isNaN(this.plot.axes.yaxis.min) && ! isNaN(this.plot.axes.yaxis.max) ) {
				axis_limits.leftaxis.min = this.plot.axes.yaxis.min; 
				axis_limits.leftaxis.max = this.plot.axes.yaxis.max; 
			}
		}
		if (axis_limits.rightaxis.auto && this.serieSettingsArray.map(ss => ss["yaxis"]).includes("y2axis") ) {
			if ( ! isNaN(this.plot.axes.y2axis.min) && ! isNaN(this.plot.axes.y2axis.max) ) {
				axis_limits.rightaxis.min = this.plot.axes.y2axis.min;
				axis_limits.rightaxis.max = this.plot.axes.y2axis.max;
			}
		}

		this.primitive.setAttribute("AxisLimits", JSON.stringify(axis_limits));
	}
	setEmptyPlot() {
		$(this.chartDiv).empty();
		let idsToDisplay = this.dialog.getIdsToDisplay();
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
		this.nameGen = [];
		this.colorGen = [];
		this.patternGen = [];
		this.lineWidthGen = [];
		this.resultGen = []; 
		this.plotPers = [];
	}
	append(ids, results, lineOptions) {
		this.resultGen.push(results);
		this.numGenerations++;
		this.numLines += ids.length;
		this.idGen.push(ids);
		this.nameGen.push(ids.map(findID).map(getName));
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
			this.nameGen.pop();
			this.colorGen.pop();
			this.patternGen.pop();
			this.lineWidthGen.pop();
			this.resultGen.pop();
		}
		
		// Add new 
		this.append(ids, results, lineOptions);
	}
	getSeriesArray(wantedIds, hasNumberedLines) {
		let seriesArray = [];
		let lineCount = 0;
		// Loop generations 
		for(let i = 0; i < this.idGen.length; i++) {
			let currentIds = this.idGen[i];
			let plotPer = this.plotPers[i];
			// Loop through one generation (each simulation run)
			for(let j = 0; j < currentIds.length; j++) {
				let id = currentIds[j];
				if(wantedIds.includes(id)) {
					let tmpArr = [];
					lineCount++;
					let plotPerIdx = Math.floor(this.resultGen[i].length/4);
					// loop through simulation run (each value)
					for (let k = 0; k < this.resultGen[i].length; k++) {
						let row = this.resultGen[i][k];
						let time = Number(row[0]);
						let value = Number(row[j+1]);
						let showNumHere = (k%plotPerIdx) === Math.floor((plotPerIdx/2 + (plotPerIdx*lineCount)/8)%plotPerIdx); 
						if (showNumHere && hasNumberedLines) {
							tmpArr.push([time, value, Math.floor(lineCount).toString()]);
						} else {
							tmpArr.push([time, value, null]);
						}
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
		for(let i = 0; i < this.idGen.length; i++) {
			let currentIds = this.idGen[i];
			for(let j = 0; j < currentIds.length; j++) {
				let id = currentIds[j];
				if(wantedIds.includes(id)) {
					countLine++;
					let label = "";
					label += (hasNumberedLines ? `${countLine}. ` : "");
					label += this.nameGen[i][j];
					seriesSettingsArray.push({
						showLabel: true, 
						lineWidth: this.lineWidthGen[i][j], // change according to lineOptions here 
						label: label,
						linePattern: this.patternGen[i][j],
						color: (colorFromPrimitive ? this.colorGen[i][j] : undefined),
						shadow: false,
						showMarker: false,
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
		this.dialog.subscribePool.subscribe(()=>{
			this.render();
		});
	}
	removePlotReference(id) {
		if (this.dialog.displayIdList.includes(id)) {
			this.dialog.removeIdToDisplay(id);
			this.render();
		}
	}
	fetchData() {
		this.fetchedIds = this.dialog.getIdsToDisplay();
		this.fetchedIds.map(id => {
			if (findID(id) === null) {
				this.dialog.removeIdToDisplay(id);
			}
		});
		this.fetchedIds = this.dialog.getIdsToDisplay();
		let plot_per = Number(this.primitive.getAttribute("PlotPer"));
		let results = RunResults.getFilteredSelectiveIdResults(this.fetchedIds, getTimeStart(), getTimeLength(), plot_per);
		let line_options = JSON.parse(this.primitive.getAttribute("LineOptions"));
		if(this.dialog.keep) {
			// add generation 
			this.gens.append(this.dialog.getIdsToDisplay(), results, line_options);
		} else {
			this.gens.setCurrent(this.dialog.getIdsToDisplay(), results, line_options);
		}
	}
	render() {

		let idsToDisplay = this.dialog.getIdsToDisplay();
		this.primitive.setAttribute("Primitives", idsToDisplay.join(","));
		
		if (this.gens.numGenerations == 0) {
			this.setEmptyPlot();
			return;
		}
		
		if (this.dialog.clear) {
			this.gens.reset();
			this.dialog.clear = false;
		}
		
		// Declare series and settings for series
		this.serieSettingsArray = [];
		this.serieArray = [];

		let hasNumberedLines = this.primitive.getAttribute("HasNumberedLines") === "true";

		// Make time series
		this.serieArray = this.gens.getSeriesArray(idsToDisplay, hasNumberedLines);

		do_global_log("serieArray "+JSON.stringify(this.serieArray));

		// Make serie settings
		this.serieSettingsArray = this.gens.getSeriesSettingsArray(
			idsToDisplay, 
			hasNumberedLines, 
			this.primitive.getAttribute("ColorFromPrimitive") === "true"
		);

		do_global_log(JSON.stringify(this.serieSettingsArray));
		
		// We need to ad a delay and respond to events first to make this work in firefox
		setTimeout(() => {
			this.updateChart();
		 },200);
	}
	updateChart() {
		if (this.serieArray == null || this.serieArray.length == 0 || this.serieArray[0].length === 0) {
			// The series are not initialized yet
			this.setEmptyPlot();
			return;
		}
		$(this.chartDiv).empty();
		let axis_limits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		this.plot = $.jqplot(this.chartId, this.serieArray, {  
			title: this.primitive.getAttribute("TitleLabel"),
			series: this.serieSettingsArray,
			grid: {
				background: "white",
				shadow: false
			},
			axes: {
				xaxis: {
					label: "Time",
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					min: axis_limits.timeaxis.auto ? getTimeStart() : axis_limits.timeaxis.min,
					max: axis_limits.timeaxis.auto ? getTimeStart()+getTimeLength() : axis_limits.timeaxis.max 
				},
				yaxis: {
					renderer: (this.primitive.getAttribute("YLogScale") === "true") ? $.jqplot.LogAxisRenderer : $.jqplot.LinearAxisRenderer,
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					label: this.primitive.getAttribute("LeftAxisLabel"),
					min: axis_limits.yaxis.auto ? undefined : axis_limits.yaxis.min,
					max: axis_limits.yaxis.auto ? undefined : axis_limits.yaxis.max
				}
			},
			highlighter: {
				show: true,
				sizeAdjust: 1.5,
				tooltipAxes: "xy",
				formatString: "Time = %.5p<br/>Value = %.5p",
				useAxesFormatters: false
			},
			legend: {
				show: true,
				placement: 'outsideGrid'
			 }
		});
		if ( ! isNaN(this.plot.axes.yaxis.min) && ! isNaN(this.plot.axes.yaxis.max) ) {
			axis_limits.yaxis.min = this.plot.axes.yaxis.min; 
			axis_limits.yaxis.max = this.plot.axes.yaxis.max; 
			this.primitive.setAttribute("AxisLimits", JSON.stringify(axis_limits));
		}
	}
	setEmptyPlot() {
		$(this.chartDiv).empty();
		let idsToDisplay = this.dialog.getIdsToDisplay();
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

class TextAreaVisual extends HtmlOverlayTwoPointer {
	constructor(id, type, pos0, pos1) {		
		super(id, type, pos0, pos1);
		
		this.primitive = findID(id);
		
		this.dialog = new TextAreaDialog(id);
		this.dialog.subscribePool.subscribe(()=>{
			this.render();
		});
		this.render();
	}
	makeGraphics() {
		super.makeGraphics();
		this.targetElement.style.overflowWrap = "break-word";
		this.render();
	}
	render() {
		let newText = getName(this.primitive);
		let hideFrame = this.primitive.getAttribute("HideFrame") === "true";
		if(hideFrame && removeSpacesAtEnd(newText).length !== 0) {
			this.element.setAttribute("visibility", "hidden");
		} else {
			this.element.setAttribute("visibility", "visible");
		}
		// space is replaced with span "&nbsp;" does not work since it does not work with overflow-wrap: break-word
		// Replace 							new line 		and 	space
		let formatedText = newText.replace(/\n/g, "<br/>").replace(/ /g, "<span style='display:inline-block; width:5px;'></span>");
		this.updateHTML(formatedText);
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
			histogram.max += (histogram.max-histogram.min)*0.0001;
			this.primitive.setAttribute("UpperBound", histogram.max);
		} else {
			histogram.max = Number(this.primitive.getAttribute("UpperBound"));
		}
		if (this.primitive.getAttribute("NumberOfBarsAuto" === "true")) {
			histogram.numBars = Number(getDefaultAttributeValue("histoplot", "NumberOfBars"));
			this.primitive.setAttribute("NumberOfBars", histogram.numBars);
		} else {
			histogram.numBars = this.primitive.getAttribute("NumberOfBars");
		}

		histogram.intervalWidth = (histogram.max-histogram.min)/histogram.numBars; 
		histogram.bars = [];
		// Data points below resp. below the lower and upper boundary 
		histogram.below_data = [];
		histogram.above_data = [];

		for(i = 0; i < histogram.numBars; i++) {
			histogram.bars.push({
				lowerLimit: histogram.min+	  i*histogram.intervalWidth,
				upperLimit: histogram.min+(i+1)*histogram.intervalWidth,
				data: []
			});
		}
		for(let dataPoint of histogram.data) {
			let pos = Math.floor((dataPoint-histogram.min)/histogram.intervalWidth);
			if(0 <= pos && pos < histogram.numBars) {
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
		let idsToDisplay = this.dialog.getIdsToDisplay();
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
		let serie = [];
		for(let i = 0; i < this.histogram.bars.length; i++) {
			let bar = this.histogram.bars[i];
			let barValue = bar.data.length;
			let usePDF = (this.primitive.getAttribute("ScaleType") === "PDF");
			if (usePDF) {
				barValue = bar.data.length/this.histogram.data.length;
			} 
			//		1___2___3		  ______
			// _____|		|1___2___3		...

			// (1)
			serie.push([bar.lowerLimit, barValue]);
			this.labels.push("");
			this.ticks.push(bar.lowerLimit.toFixed(2));

			// (2) label here 
			serie.push([(bar.lowerLimit+bar.upperLimit)/2 , barValue]);
			this.labels.push(usePDF ? barValue.toFixed(3): barValue.toString());
			
			// (3)
			serie.push([bar.upperLimit, barValue]);
			this.labels.push("");
		}

		serie.push([this.histogram.max, 0]);
		this.labels.push("");
		this.ticks.push(this.histogram.max.toFixed(2));

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
		 },200);
	}
	updateChart() {
		if (this.serieArray == null) {
			// The series are not initialized yet
			this.setEmptyPlot();
			return;
		}
		if (this.dialog.getIdsToDisplay().length !== 1) {
			this.setEmptyPlot();
			return;
		}
		$(this.chartDiv).empty();

		
		let scaleType = this.primitive.getAttribute("ScaleType");
		let targetPrimName = `${getName(findID(this.dialog.getIdsToDisplay()[0]))}`;

		$.jqplot.config.enablePlugins = true;
		this.plot = $.jqplot(this.chartId, this.serieArray, {  
			series: this.serieSettingsArray,
			title: `${scaleType} of ${targetPrimName}`,
			sortData: false,
			grid: {
				background: "white",
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
					ticks: this.ticks
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
					${this.histogram.below_data.length} values below ${Number(this.primitive.getAttribute("LowerBound")).toFixed(2)}
				</div>
		`);
		$(this.chartDiv).append(`
				<div id="${outsideLimitInfoID[1]}">
					${this.histogram.above_data.length} values above ${Number(this.primitive.getAttribute("UpperBound")).toFixed(2)}
				</div>
		`);
		$(`#${outsideLimitInfoID[0]}`).css("left", "8px");
		$(`#${outsideLimitInfoID[1]}`).css("right", "8px");
		for (let i in outsideLimitInfoID) {
			$(`#${outsideLimitInfoID[i]}`).css("z-index", "9999");
			$(`#${outsideLimitInfoID[i]}`).css("position", "absolute");
			$(`#${outsideLimitInfoID[i]}`).css("padding", "4px 8px");
			$(`#${outsideLimitInfoID[i]}`).css("bottom",   "0px");
			$(`#${outsideLimitInfoID[i]}`).css("background", "#f0f0f0");
			// $(`#${outsideLimitInfoID[i]}`).css("border", "1px solid gray");
			$(`#${outsideLimitInfoID[i]}`).css("font-size", "0.8em");
		}
	}
	setEmptyPlot() {
		$(this.chartDiv).empty();
		let idsToDisplay = this.dialog.getIdsToDisplay();
		let selected_str = "None selected";
		if (idsToDisplay.length !== 0) {
			selected_str = (`<ul style="margin: 4px;">
				${idsToDisplay.map(id => `<li>${getName(findID(id))}</li>`).join("")}
			</ul>`);
		}
		if (idsToDisplay.length > 1) {
			selected_str += `<span style="color:red;">Exactly one primitive must be selected</span>`;
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
		this.dialog.subscribePool.subscribe(()=>{
			this.render();
		});
	}
	removePlotReference(id) {
		if (this.dialog.displayIdList.includes(id)) {
			this.dialog.removeIdToDisplay(id);
			this.render();
		}
	}
	render() {		
		let IdsToDisplay = this.dialog.getIdsToDisplay();
		this.primitive.setAttribute("Primitives",IdsToDisplay.join(","));
		this.namesToDisplay = IdsToDisplay.map(findID).map(getName);
		let plot_per = Number(this.primitive.getAttribute("PlotPer"));
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
			
			for(let row of results) {
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
				serie.push([x,y,t]);
			}
			return serie;
		}
		
		// Declare series and settings for series
		this.serieSettingsArray = [];
		this.serieArray = [];
		
		// Make time series
		let dataSerie = makeXYSerie();
		this.serieArray.push(dataSerie);
		do_global_log("serieArray "+JSON.stringify(this.serieArray));
		
		// Make serie settings
		this.serieSettingsArray.push({
			lineWidth: this.primitive.getAttribute("LineWidth"), 
			color: "black",
			shadow: false,
			showLine: this.primitive.getAttribute("ShowLine") === "true",
			showMarker: this.primitive.getAttribute("ShowMarker") === "true",
			markerOptions: { shadow: false },
			pointLabels: { show: false }
		});
		if (this.primitive.getAttribute("MarkStart") === "true") {
			this.serieArray.push([dataSerie[0]]);
			this.serieSettingsArray.push({
				color: "#ff4444", 
				showLine: false, 
				showMarker: true, 
				markerOptions: {shadow: false}, 
				pointLabels: { show: false }
			});
		} 
		if (this.primitive.getAttribute("MarkEnd") === "true") {
			this.serieArray.push([dataSerie[dataSerie.length-1]]);
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
		 },200);
	}
	
	updateChart() {
		if (this.serieArray == null) {
			// The series are not initialized yet
			this.setEmptyPlot();
			return;
		}
		if (this.dialog.getIdsToDisplay().length != 2) {
			this.setEmptyPlot();
			return;
		}
		$(this.chartDiv).empty();
		let axis_limits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		this.plot = $.jqplot(this.chartId, this.serieArray, {  
			series: this.serieSettingsArray,
			title: this.primitive.getAttribute("TitleLabel"),
			grid: {
				background: "white",
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
					min: axis_limits.xaxis.auto ? undefined : axis_limits.xaxis.min,
					max: axis_limits.xaxis.auto ? undefined : axis_limits.xaxis.max
				},
				yaxis: {
					label: this.serieYName,
					renderer: (this.primitive.getAttribute("YLogScale") === "true") ? $.jqplot.LogAxisRenderer : $.jqplot.LinearAxisRenderer,
					min: axis_limits.yaxis.auto ? undefined : axis_limits.yaxis.min,
					max: axis_limits.yaxis.auto ? undefined : axis_limits.yaxis.max
				}
			},
			highlighter: {
				show: true,
				sizeAdjust: 1.5,
				yvalues: 2,
				formatString: (`
					<table class="jqplot-highlighter" style="color: black;">
        				<tr><td>${this.serieXName} </td><td> = </td><td>%.5p</td></tr>
						<tr><td>${this.serieYName} </td><td> = </td><td>%.5p</td></tr>
						<tr><td>Time </td><td> = </td><td>%.5p</td></tr>
					</table>
				`),
				useAxesFormatters: false
			}
		});
		if (axis_limits.xaxis.auto) {
			axis_limits.xaxis.min = this.plot.axes.xaxis.min;
			axis_limits.xaxis.max = this.plot.axes.xaxis.max;
		}
		if (axis_limits.yaxis.auto) {
			axis_limits.yaxis.min = this.plot.axes.yaxis.min;
			axis_limits.yaxis.max = this.plot.axes.yaxis.max;
		}
		this.primitive.setAttribute("AxisLimits", JSON.stringify(axis_limits));
	}
	setEmptyPlot() {
		$(this.chartDiv).empty();
		let idsToDisplay = this.dialog.getIdsToDisplay();
		let selected_str = "None selected<br/>";
		if (idsToDisplay.length !== 0) {
			selected_str = (`<ul style="margin: 4px;">
				${idsToDisplay.map(id => `<li>${getName(findID(id))}</li>`).join("")}
			</ul>`);
		}
		if (idsToDisplay.length !== 2)  {
			selected_str += `<span style="color:red;">Exactly two primitives must be selected!</span>`;
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
		this.dialog.subscribePool.subscribe(()=>{
			this.updateGraphics();
		});
	}
	makeGraphics() {
		this.line = svg_line(this.startX, this.startY, this.endX, this.endY, defaultStroke, defaultFill, "element");
		this.clickLine = svg_line(this.startX, this.startY, this.endX, this.endY, "transparent", "none", "element", {"stroke-width": "10"});
		this.arrowHeadStart = svg_arrow_head("none", defaultStroke, {"class": "element"});
		this.arrowHeadEnd = svg_arrow_head("none", defaultStroke, {"class": "element"});
		let arrowPathPoints = [[13, -4], [0,0], [13, 4]];
		this.arrowHeadStart.set_template_points(arrowPathPoints);
		this.arrowHeadEnd.set_template_points(arrowPathPoints);
		
		this.group = svg_group([this.line, this.arrowHeadStart, this.arrowHeadEnd, this.clickLine]);
		this.group.setAttribute("node_id",this.id);
		this.element_array = [this.line, this.arrowHeadEnd];
		for(let key in this.element_array) {
			this.element_array[key].setAttribute("node_id",this.id);
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
			let shortenAmount = 12;
			let sine = 		sin([this.endX, this.endY], [this.startX, this.startY]);
			let cosine = 	cos([this.endX, this.endY], [this.startX, this.startY]);
			let endOffset = rotate([shortenAmount, 0], sine, cosine);
			if (arrowHeadStart) {
				lineStartPos = translate(neg(endOffset), [this.startX, this.startY]);
				this.arrowHeadStart.set_pos([this.startX, this.startY], [this.endX-this.startX, this.endY-this.startY]);
				this.arrowHeadStart.update();
			}
			if (arrowHeadEnd) {
				lineEndPos = translate(endOffset, [this.endX, this.endY]);
				this.arrowHeadEnd.set_pos([this.endX, this.endY], [this.startX-this.endX, this.startY-this.endY]);
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
		this.b1_anchor = new AnchorPoint(this.id+".b1_anchor", "dummy_anchor", [0,0], anchorTypeEnum.bezier1);
		this.b2_anchor = new AnchorPoint(this.id+".b2_anchor", "dummy_anchor", [0,0], anchorTypeEnum.bezier2);
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
		let sine 	= sin(origoWorld, oneZeroWorld);
		let cosine 	= cos(origoWorld, oneZeroWorld);
		let S_pWorld = translate(worldPos, neg(origoWorld));
		let RS_pWorld = rotate(S_pWorld, -sine, cosine);
		let posWorld = scale(RS_pWorld, [0,0], 1/scaleFactor);
		return posWorld;
	}
	localToWorld(localPos) {
		// worldPos(localPos) = T*R*S*localPos
		let origoWorld = this.start_anchor.getPos();
		let oneZeroWorld = this.end_anchor.getPos();
		let scaleFactor = distance(origoWorld, oneZeroWorld);
		let sine 	= sin(origoWorld, oneZeroWorld);
		let cosine 	= cos(origoWorld, oneZeroWorld);
		let S_pLocal = scale(localPos, [0,0], scaleFactor);
		let RS_pLocal = rotate(S_pLocal, sine, cosine);
		let posWorld = translate(RS_pLocal, origoWorld);
		return posWorld;
	}
	unselect() {
		this.selected = false;
		if (hasSelectedChildren(this.id)) {
			for(let i in this.highlight_on_select) {
				this.highlight_on_select[i].setAttribute("stroke", "black");
			}	
		} else {
			let children = getChildren(this.id);
			for(let id in children) {
				let object = get_object(id);
				if ('setVisible' in object) {
					object.setVisible(false);
				}
			}
		}
		
		// Hide beizer lines
		for(let element of this.showOnlyOnSelect) {
			element.setAttribute("visibility", "hidden");
		}
	}
	select(selectChildren = true) {		
		let children = getChildren(this.id);
		for(let id in children) {
			let object = get_object(id);
			if ('setVisible' in object) {
				object.setVisible(true);
			}
		}
		for(let i in this.highlight_on_select) {
			this.highlight_on_select[i].setAttribute("stroke", "red");
		}
		
		if (selectChildren) {
			// This for loop is partly redundant and should be integrated in later code
			for(let anchor of this.getAnchors()) {
				anchor.select();
				anchor.setVisible(true);
			}
		}
		
		// Show beizer lines
		for(let element of this.showOnlyOnSelect) {
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
		return okAttachTypes.includes(attachVisual.getType()) && attachVisual.is_ghost !== true;
	}	

	setStartAttach(new_start_attach) {
		super.setStartAttach(new_start_attach)
		if (this._end_attach) {
			this._end_attach.updateValueError();
			this._end_attach.update();
		}
	}
	setEndAttach(new_end_attach) {
		let old_end_attach = this._end_attach;
		super.setEndAttach(new_end_attach);
		if(new_end_attach != null && new_end_attach.getType() == "stock") {
			this.dashLine();
		} else {
			this.undashLine();
		}
		if (old_end_attach) {
			old_end_attach.updateValueError();
			old_end_attach.update();
		}
		if (new_end_attach) {
			new_end_attach.updateValueError();
			new_end_attach.update();
		}
	}

	clean() {
		// remove end_attach to make sure end_attach value error is updated 
		this.setEndAttach(null);
		super.clean();
	}

	setColor(color) {
		this.color = color;
		this.primitive.setAttribute("Color", this.color);
		this.curve.setAttribute("stroke", color);
		this.arrowPath.setAttribute("stroke", color);
		this.arrowPath.setAttribute("fill", color);
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
		
		const headHalfWidth = 2;
		this.arrowPath = svg_from_string(`<path d="M0,0 -${headHalfWidth},7 ${headHalfWidth},7 Z" stroke="black" fill="black"/>`);
		this.arrowHead = svg_group([this.arrowPath]);
		svg_translate(this.arrowHead, x4, y4);

		this.click_area = svg_curve(x1, y1, x2, y2, x3, y3, x4, y4, {"pointer-events":"all", "stroke":"none", "stroke-width":"10"}); 
		this.curve = svg_curve(x1, y1, x2, y2, x3, y3, x4, y4, {"stroke":"black", "stroke-width":"1"});

		this.click_area.draggable = false;
		this.curve.draggable = false;
		
		this.group = svg_group([this.click_area,this.curve,this.arrowHead]);
		this.group.setAttribute("node_id",this.id);

		this.b1_line = svg_line(x1, y1, x2, y2, "black", "black", "", {"stroke-dasharray": "5 5"});
		this.b2_line = svg_line(x4, y4, x3, y3, "black", "black", "", {"stroke-dasharray": "5 5"});

		this.showOnlyOnSelect = [this.b1_line,this.b2_line];
		
		this.element_array = this.element_array.concat([this.b1_line,this.b2_line]);
	}
	dashLine() {
		this.curve.setAttribute("stroke-dasharray", "4 6");
	}
	undashLine() {
		this.curve.setAttribute("stroke-dasharray", "");
	}
	resetBezierPoints() {
		let obj1 = this.getStartAttach();
		let obj2 = this.getEndAttach();
		if ( ! obj1 || ! obj2 ) {
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
		
		switch(anchorType) {
		case anchorTypeEnum.start:
			this.curve.x1 = startpos[0];
			this.curve.y1 = startpos[1];
			this.curve.update();
			
			this.b1_line.setAttribute("x1", startpos[0]);
			this.b1_line.setAttribute("y1", startpos[1]);
		break;
		case anchorTypeEnum.end:
			this.curve.x4 = endpos[0];
			this.curve.y4 = endpos[1];
			this.curve.update();
			
			
			this.b2_line.setAttribute("x1", endpos[0]);
			this.b2_line.setAttribute("y1", endpos[1]);
		break;
		case anchorTypeEnum.bezier1:
		{
			this.curve.x2 = b1pos[0];
			this.curve.y2 = b1pos[1];
			this.curve.update();
			
			this.b1_line.setAttribute("x2",b1pos[0]);
			this.b1_line.setAttribute("y2",b1pos[1]);
			
			this.primitive.setAttribute("b1x",b1pos[0]);
			this.primitive.setAttribute("b1y",b1pos[1]);
		}
		break;
		case anchorTypeEnum.bezier2:
		{
			this.curve.x3 = b2pos[0];
			this.curve.y3 = b2pos[1];
			this.curve.update();
			
			this.b2_line.setAttribute("x2",b2pos[0]);
			this.b2_line.setAttribute("y2",b2pos[1]);
			
			this.primitive.setAttribute("b2x",b2pos[0]);
			this.primitive.setAttribute("b2y",b2pos[1]);
		}
		break;
		}
		this.updateClickArea();
	}
	updateGraphics() {
		// The arrow is pointed from the second bezier point to the end
		let b2pos = this.b2_anchor.getPos();
		
		let xdiff = this.endX-b2pos[0];
		let ydiff = this.endY-b2pos[1];
		let angle = Math.atan2(xdiff,-ydiff)*(180/Math.PI);
		svg_transform(this.arrowHead, this.endX, this.endY, angle, 1);
		
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
		this.getAnchors().map( anchor => anchor.updatePosition() );
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
	static leftMouseDown(x,y) {
		// Is triggered when mouse goes down for this tool
	}
	static mouseMove(x,y, shiftKey) {
		// Is triggered when mouse moves
	}
	static leftMouseUp(x,y, shiftKey) {
		// Is triggered when mouse goes up for this tool
	}
	static rightMouseDown(x,y) {
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

function getAllValueErrorPrimitive() {
	let ValueErrorPrims = primitives().filter(p => p.getAttribute("ValueError")).filter(v => ! isPrimitiveGhost(v));
	return ValueErrorPrims;
}

function findVisualByID(id) {
	let visual = object_array[id];
	if (visual === undefined) {
		visual = connection_array[id];
	}
	return visual;
}

class RunTool extends BaseTool {
	static enterTool() {
		/* Check that all primitives are defined */
		let valueErrorPrims = getAllValueErrorPrimitive();
		if (valueErrorPrims.length !== 0) {
			let prim = valueErrorPrims[0];
			let name = prim.getAttribute("name");
			let color = prim.getAttribute("Color");
			let alert = new XAlertDialog(`
				Definition Error in <b style="color:${color};">${name}</b>: <br/><br/>
				&nbsp &nbsp ${ValueErrorToString(prim.getAttribute("ValueError"))}
			`);
			alert.setTitle("Unable to Simulate");
			alert.show();
			unselect_all();
			let vis = findVisualByID(prim.id);
			if (vis) {
				vis.select();
			}
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
		updateInfoBar();
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
		updateInfoBar();
	}
	static leftMouseUp(x, y) {
		if (! this.rightClickMode) {
			ToolBox.setTool("mouse");
		}
	}
	static rightMouseDown(x, y) {
		unselect_all();
		ToolBox.setTool("mouse");
		updateInfoBar();
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
		
		this.primitive = createPrimitive(name, "Numberbox", [x,y],[0,0]);
		this.primitive.setAttribute("Target",this.targetPrimitive);
	}
	static enterTool() {
		let selected_ids = Object.keys(get_selected_root_objects());
		if (selected_ids.length != 1) {
			xAlert("You must first select exactly one primitive to watch");
			ToolBox.setTool("mouse");
			return;
		}
		
		let selected_object = get_object(selected_ids[0]);
		if (this.numberboxable_primitives.indexOf(selected_object.type) == -1) {
			xAlert("This primitive is not watchable");
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
		let new_stock = createPrimitive(primitive_name, "Stock", [x-size[0]/2, y-size[1]/2], size);
	}
}

class RotateNameTool extends BaseTool {
	static enterTool() {
		let selection = get_selected_objects();
		for(let node_id in selection) {
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
		let ghost = makeGhost(source,[x,y]);
		ghost.setAttribute("RotateName", "0");
		syncVisual(ghost);
		let DIM_ghost = get_object(ghost.getAttribute("id"));
		source.subscribeAttribute(DIM_ghost.changeAttributeHandler);
	}
	static enterTool() {
		let selected_ids = get_selected_ids();
		if (selected_ids.length != 1) {
			xAlert("You must first select exactly one primitive to ghost");
			ToolBox.setTool("mouse");
			return;
		}
		let selected_object = get_object(selected_ids[0]);
		if (selected_object.is_ghost) {
			xAlert("You cannot ghost a ghost");
			ToolBox.setTool("mouse");
			return;
		}
		if (this.ghostable_primitives.indexOf(selected_object.type) == -1) {
			xAlert("This primitive is not ghostable");
			ToolBox.setTool("mouse");
			return;
		}
		this.id_to_ghost = selected_ids[0];
	}
}
GhostTool.init();

class ConverterTool extends OnePointCreateTool {
	static create(x, y) {
		// The right place to  create primitives and elements is in the tools-layers
		let primitive_name = findFreeName(type_basename["converter"]);
		let size = type_size["converter"];
		let new_converter = createPrimitive(primitive_name, "Converter", [x-size[0]/2, y-size[1]/2], size);
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
			[x-size[0]/2, y-size[1]/2], 
			size,
			{"isConstant": false}
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
			[x-size[0]/2, y-size[1]/2], 
			size, 
			{"isConstant": true}
		);
	}
}

function get_only_selected_anchor_id() {
	// returns null if more is selected than one anchor is selected, else returns object {parent_id: ... , child_id: ... }
	let selection = get_selected_objects();
	let keys = [];
	for(let key in selection) { 
		keys.push(key);
	}
	if (keys.length === 1 && selection[keys[0]].getType() === "dummy_anchor") {
		// only one anchor in selection
		return {"parent_id": get_parent_id(keys[0]), "child_id": keys[0] };
	} else if (keys.length === 2) {
		if (get_object(keys[0]).getType() === "dummy_anchor" && get_object(keys[1]).getType() === "dummy_anchor") {
			// both anchors are dummies 
			return null;
		} else if(get_parent_id(keys[0]) === get_parent_id(keys[1])) {
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
	for(let key in selection) { 
		keys.push(key);
	}
	let object_ids = {"children_ids": []};
	if (keys.length > 0) {
		object_ids["parent_id"] = get_parent_id(keys[0]);
		for(let key of keys) {
			if ( get_parent_id(key) !== object_ids["parent_id"] ) {
				return null;
			} else if ( get_parent_id(key) !== key ) {
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
	static leftMouseDown(x,y) {
		mousedown_x = x;
		mousedown_y = y;
		do_global_log("last_click_object_clicked "+last_click_object_clicked);
		if (!last_click_object_clicked) {
			rectselector_start();
		}

		let selected_anchor = get_only_selected_anchor_id();
		// Only one anchor is selected AND that that anchor has attaching capabilities 
		if(selected_anchor && connection_array[selected_anchor.parent_id].getStartAttach) {
			let parent = connection_array[selected_anchor.parent_id];
			// Detach anchor 
			switch(object_array[selected_anchor.child_id].getAnchorType()) {
				case anchorTypeEnum.start:
					parent.setStartAttach(null);
				break;
				case anchorTypeEnum.end:
					parent.setEndAttach(null);
				break;
			}
		}
			
		// Reset it for use next time
		last_click_object_clicked = false;
	}
	static mouseMove(x,y,shiftKey) {
		let diff_x = x-mousedown_x;
		let diff_y = y-mousedown_y;
		mousedown_x = x;
		mousedown_y = y;
		
		if (empty_click_down) {
			rectselector_move();
			return;
		}
		// We only come here if some object is being dragged
		// Otherwise we will trigger empty_click_down
		let only_selected_anchor = get_only_selected_anchor_id();
		let only_selected_link = get_only_link_selected();
		if( only_selected_anchor ) {
			// Use equivalent tool type
			// 	RectangleVisual => RectangleTool
			// 	LinkVisual => LinkTool
			let parent = connection_array[only_selected_anchor["parent_id"]];
			let tool = ToolBox.tools[parent.type];
			tool.mouseMoveSingleAnchor(x,y, shiftKey, only_selected_anchor["child_id"]);
			parent.update();
		} else if ( only_selected_link ) {
			// special exeption for links of links is being draged directly 
			LinkTool.mouseRelativeMoveSingleAnchor(diff_x, diff_y, shiftKey, only_selected_link["parent_id"]+".b1_anchor");
			LinkTool.mouseRelativeMoveSingleAnchor(diff_x, diff_y, shiftKey, only_selected_link["parent_id"]+".b2_anchor");
			let parent = connection_array[only_selected_link["parent_id"]];
			parent.update();
		} else {
			let move_array = get_selected_objects();
			this.defaultRelativeMove(move_array, diff_x, diff_y);
		}
	}
	static defaultRelativeMove(move_objects, diff_x, diff_y) {
		let objectMoved = false;
		for(let key in move_objects) {
			if (move_objects[key].draggable == undefined) {
				continue;
			} 
			if (move_objects[key].draggable == false) {
				do_global_log("skipping because of no draggable");
				continue;
			} 
			if (move_objects[key].type == "dummy_anchor") {
				if (move_objects[key].isAttached()) {
					// We can't drug and drop attached anchors
					continue;
				}
			} 

			objectMoved = true;
			// This code is not very optimised. If we want to optimise it we should just find the objects that needs to be updated recursivly
			rel_move(key,diff_x,diff_y);
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
	static leftMouseUp(x,y) {
		// Check if we selected only 1 anchor element and in that case detach it;
		let selected_anchor = get_only_selected_anchor_id();

		if (selected_anchor && connection_array[selected_anchor.parent_id].getStartAttach) {			
			let parent = connection_array[selected_anchor.parent_id];
			let tool = ToolBox.tools[parent.getType()];
			tool.mouseUpSingleAnchor(x, y, false, selected_anchor.child_id);
		}

		if (empty_click_down) {
			rectselector_stop();
			empty_click_down = false;
		}
	}
	static rightMouseDown(x, y) {
		let only_selected_anchor = get_only_selected_anchor_id();
		if (only_selected_anchor &&
		connection_array[only_selected_anchor["parent_id"]].getType() === "flow" &&
		object_array[only_selected_anchor["child_id"]].getAnchorType() === anchorTypeEnum.end) {
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
	static leftMouseDown(x,y) {
		unselect_all();

		// Looks for element under mouse. 
		let start_element = find_element_under(x,y);

		// Finds free name for primitive. e.g. "stock1", "stock2", "variable1" etc. (Visible to the user)
		let primitive_name = findFreeName(type_basename[this.getType()]);
		this.createTwoPointer(x,y,primitive_name);

		// subscribes to changes in insight makers x and y positions. (these valus are then saved)
		this.primitive.subscribePosition(this.current_connection.positionUpdateHandler);
		if (start_element != null && this.current_connection.getStartAttach) {
			this.current_connection.setStartAttach(get_parent(start_element));
		}
		this.current_connection.setName(primitive_name);
		
		// make sure start anchor is synced with primitive 
		this.current_connection.syncAnchorToPrimitive(anchorTypeEnum.start);
	}
	static mouseMove(x, y, shiftKey) {
		// Function used during creation of twopointer
		if (this.current_connection == null) {
			return;
		}
		this.current_connection.select();
		let move_node_id = `${this.current_connection.id}.end_anchor`;
		this.mouseMoveSingleAnchor(x,y, shiftKey, move_node_id);
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
			moveObject.setPos([oppositeX+signX*shortSideLength, oppositeY+signY*shortSideLength]);
		} else {
			moveObject.setPos([x,y]);
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
	static rightMouseDown(x,y) {
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
	static mouseMoveSingleAnchor(x,y, shiftKey, anchor_id) {
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
		
		this.current_connection = new FlowVisual(this.primitive.id, this.getType(), [x,y], [x+1, y+1]);
		this.current_connection.name_pos = Number(this.primitive.getAttribute("RotateName"));

		unselect_all_other_anchors(this.current_connection.id, this.current_connection.end_anchor.id);
		update_name_pos(this.primitive.id);
	}
	static rightMouseDown(x,y) {
		if (leftmouseisdown) {
			let only_selected_anchor = get_only_selected_anchor_id();
			if (only_selected_anchor) {
				let parent = connection_array[only_selected_anchor["parent_id"]];
				let child = object_array[only_selected_anchor["child_id"]];
				if (parent.getType() === "flow" && child.getAnchorType() === anchorTypeEnum.end) {
					let prevAnchorPos = parent.getPreviousAnchor(child.id).getPos();
					if (distance(prevAnchorPos, [x ,y]) < 10) {
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
			ToolBox.setTool("mouse");
		}
	}
	static leftMouseUp(x, y, shiftKey) {
		if (this.current_connection) {
			this.mouseUpSingleAnchor(x, y, shiftKey, this.current_connection.end_anchor.id);
			this.current_connection = null;
			last_clicked_element = null;
	
			if (this.rightClickMode === false) {
				ToolBox.setTool("mouse");
			}
		}
	}
	static mouseUpSingleAnchor(x ,y, shiftKey, node_id) {
		attach_anchor(object_array[node_id]);
	}
	static getType() {
		return "flow";
	}
}
FlowTool.init();


function cleanUnconnectedLinks() {
	let allLinks = primitives("Link");
	for(let link of allLinks) {
		let ends = getEnds(link);
		if ((ends[0] == null) || (ends[1] == null)) {
			removePrimitive(link);
		}
	}
}


class TextAreaTool extends TwoPointerTool {
	static createTwoPointer(x,y,name) {
		let primitive_name = findFreeName(type_basename["text"]);
		this.primitive = createConnector(primitive_name, "TextArea", null,null);
		this.current_connection = new TextAreaVisual(this.primitive.id, this.getType(), [x,y], [x+1,y+1]);
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
	static createTwoPointer(x,y,name) {
		this.primitive = createConnector(name, "Rectangle", null,null);
		this.current_connection = new RectangleVisual(this.primitive.id, this.getType(), [x,y], [x+1,y+1]);
	}
	static getType() {
		return "rectangle";
	}
}
RectangleTool.init();


class EllipseTool extends TwoPointerTool {
	static createTwoPointer(x,y,name) {
		this.primitive = createConnector(name, "Ellipse", null, null);
		this.current_connection = new EllipseVisual(this.primitive.id, this.getType(), [x,y], [x+1,y+1]);
	}
	static getType() {
		return "ellipse";
	}
}

class LineTool extends TwoPointerTool {
	static createTwoPointer(x,y,name) {
		this.primitive = createConnector(name, "Line", null,null);
		this.current_connection = new LineVisual(this.primitive.id, this.getType(), [x,y], [x+1,y+1]);
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
			if (3*shortSideLength < longSideLength) {
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
				moveObject.setPos([oppositeX+signX*shortSideLength, oppositeY+signY*shortSideLength]);
			}
		} else {
			moveObject.setPos([x,y]);
		}
		parent.update();
		object_array[node_id].updatePosition();
	}
}
LineTool.init();

class TableTool extends TwoPointerTool {
	static createTwoPointer(x,y,name) {
		this.primitive = createConnector(name, "Table", null,null);
		this.current_connection = new TableVisual(this.primitive.id, this.getType(), [x,y], [x+1,y+1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x,y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x,y);
		this.current_connection.dialog.setIdsToDisplay(this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "table";
	}
}
TableTool.init();

class TimePlotTool extends TwoPointerTool {
	static createTwoPointer(x,y,name) {
		this.primitive = createConnector(name, "TimePlot", null, null);
		this.current_connection = new TimePlotVisual(this.primitive.id, this.getType(), [x,y], [x+1, y+1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x, y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x, y);
		this.current_connection.dialog.setIdsToDisplay(this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "timeplot";
	}
}

class ComparePlotTool extends TwoPointerTool {
	static createTwoPointer(x,y,name) {
		this.primitive = createConnector(name, "ComparePlot", null,null);
		this.current_connection = new ComparePlotVisual(this.primitive.id, this.getType(), [x,y], [x+1,y+1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x,y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x,y)
		this.current_connection.dialog.setIdsToDisplay(this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "compareplot";
	}
}
ComparePlotTool.init();

class XyPlotTool extends TwoPointerTool {
	static createTwoPointer(x,y,name) {
		this.primitive = createConnector(name, "XyPlot", null,null);
		this.current_connection = new XyPlotVisual(this.primitive.id, this.getType(), [x,y], [x+1,y+1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x,y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x,y)
		this.current_connection.dialog.setIdsToDisplay(this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "xyplot";
	}
}
XyPlotTool.init();


class HistoPlotTool extends TwoPointerTool {
	static createTwoPointer(x,y,name) {
		this.primitive = createConnector(name, "HistoPlot", null, null);
		this.current_connection = new HistoPlotVisual(this.primitive.id, this.getType(), [x,y], [x+1,y+1]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x,y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x,y);
		this.current_connection.dialog.setIdsToDisplay(this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "histoplot";
	}
}

class LinkTool extends TwoPointerTool {
	static createTwoPointer(x,y,name) {
		this.primitive = createConnector(name, "Link", null,null);
		this.current_connection = new LinkVisual(this.primitive.id, this.getType(), [x,y], [x+1, y+1]);
	}
	static mouseMoveSingleAnchor(x, y, shiftKey, node_id) {
		let anchor_type = node_id.split(".")[1];
		if (anchor_type === "start_anchor" || anchor_type === "end_anchor") {
			let moveObject = get_object(node_id);
			let parent = get_parent(moveObject);
			moveObject.setPos([x,y]);
			parent.update();
		} else if (anchor_type === "b1_anchor") {
			let parent = connection_array[get_parent_id(node_id)];
			parent.setHandle1Pos([x,y]);
			parent.update();
		} else if (anchor_type === "b2_anchor") {
			let parent = connection_array[get_parent_id(node_id)];
			parent.setHandle2Pos([x,y]);
			parent.update();
		}
	}
	static mouseRelativeMoveSingleAnchor(diff_x, diff_y, shiftKey, move_node_id) {
		let start_pos = get_object(move_node_id).getPos();
		this.mouseMoveSingleAnchor(start_pos[0]+diff_x, start_pos[1]+diff_y, shiftKey, move_node_id);
	}
	static mouseUpSingleAnchor(x ,y, shiftKey, node_id) {
		this.mouseMoveSingleAnchor(x, y, shiftKey, node_id);
		let anchor = object_array[node_id];
		let parent = get_parent(anchor);
		if (anchor.getAnchorType() === anchorTypeEnum.start || anchor.getAnchorType() === anchorTypeEnum.end) {
			attach_anchor(anchor);
			parent.update();
			if (parent.getStartAttach() === null || parent.getEndAttach() === null) {
				// delete link is not attached at both ends 
				delete_selected_objects();		
			}
		} else if (anchor.getAnchorType() === anchorTypeEnum.bezier1 || anchor.getAnchorType() === anchorTypeEnum.bezier2) {
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
	[x,y]=anchor.getPos();
	let parentConnection = get_parent(anchor);
	
	let	elements_under = find_elements_under(x,y);
	let anchor_element = null;
	let attach_to = null;
	

	// Find unselected stock element
	for(let i = 0; i < elements_under.length; i++) {
		let element = elements_under[i];
		
		let elemIsNotSelected = ! element.isSelected();
		let elemIsNotParentOfAnchor = element[i] != parentConnection;
		if (elemIsNotSelected && elemIsNotParentOfAnchor) {
			attach_to = element;
			break;
		}
	}
	if (attach_to == null) {
		return false;
	}
	
	switch(anchor.getAnchorType()) {
	case anchorTypeEnum.start:
		parentConnection.setStartAttach(attach_to);
		break;
	case anchorTypeEnum.end:
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
		return Math.abs(this.x2-this.x1);
	}
	height() {
		return Math.abs(this.y2-this.y1);
	}
	update() {
		this.element.setAttribute("x",this.xmin());
		this.element.setAttribute("y",this.ymin());
		
		this.element.setAttribute("width",this.width());
		this.element.setAttribute("height",this.height());
	}
}
var rectselector = new CoordRect();

function rectselector_start() {
	empty_click_down = true;
	unselect_all();
	rectselector.setVisible(true);
	rectselector.x1 = mousedown_x;
	rectselector.y1 = mousedown_y;
	rectselector.x2 = mousedown_x;
	rectselector.y2 = mousedown_y;
	rectselector.update();
}

function rectselector_move() {
	// select with rectseletor
	rectselector.x2 = mousedown_x;
	rectselector.y2 = mousedown_y;
	rectselector.update();
	unselect_all();
	let select_array = get_objects_in_rectselect();
	for(let key in select_array) {
		let parent = get_parent(select_array[key]);
		parent.select(false); // We also select the parent but not all of its anchors
		select_array[key].select();
	}
}

function rectselector_stop() {
	rectselector.setVisible(false);
	let select_array = get_objects_in_rectselect();
	for(let key in select_array) {
		select_array[key].select();
	}
}

function is_in_rectselecor(node_id) {
	return (
		object_array[node_id].pos[0] >= rectselector.xmin() &&
		object_array[node_id].pos[1] >= rectselector.ymin() &&
		object_array[node_id].pos[0] <= rectselector.xmin()+rectselector.width() &&
		object_array[node_id].pos[1] <= rectselector.ymin()+rectselector.height()
	);
}

function get_objects_in_rectselect() {
	let return_array = {};
	for(let key in object_array) {
		if (is_in_rectselecor(key)) {
			return_array[key] = object_array[key];
		}
	}
	return return_array;
}

function tool_deletePrimitive(id) {
	let primitive = findID(id);
	
	removePrimitive(primitive);
	
	// Delete ghosts
	let ghostIDs = findGhostsOfID(id);
	for(let i in ghostIDs) {
		tool_deletePrimitive(ghostIDs[i]);
	}
	cleanUnconnectedLinks();
	detachFlows(id);
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
	for(let key in all_objects) {
		let parent = get_parent(all_objects[key]);
		
		// If any element is selected we add its parent
		if (all_objects[key].isSelected()) {
			result[parent.id]=parent;
		}
	}
	return result;
}

function get_root_objects() {
	let result = {};
	let all_objects = get_all_objects();
	for(let key in all_objects) {
		if (key.indexOf(".") == -1) {
			result[key]=all_objects[key];
		}
	}
	return result;
}

function delete_selected_objects() {
	// Delete all objects that are selected
	let selection = get_selected_root_objects();
	for(let key in selection) {
		// check if object not already deleted
		// e.i. link gets deleted automatically if any of it's attachments gets deleted
		if (get_object(key)) {
			tool_deletePrimitive(key);
		}
	}
}

function get_selected_objects() {
	let return_array = {};
	for(let key in object_array) {
		if (object_array[key].isSelected()) {
			return_array[key] = object_array[key];
		}
	}
	for(let key in connection_array) {
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
	
	for(let i in object_to_delete.selector_array) {
		object_to_delete.selector_array[i].remove();
	}
	for(let key in object_to_delete.element_array) {
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
	for(let key in object_array) {
		// dont update dummy_anchors, the twopointer parent of the dummy anchor has responsibility of the dummy_anchors 
		if (object_array[key].type !== "dummy_anchor") {
			object_array[key].update();
		}
	}
	update_twopointer_objects(ids);
}

// only updates diagrams, tables, and XyPlots if needed 
function update_twopointer_objects(ids) {
	for(let key in connection_array) {
		let onlyIfRelevant = ["timeplot", "xyplot", "compareplot", "histoplot","table"];
		if( onlyIfRelevant.includes(connection_array[key].type) ) {
			if (ids.includes(key)) {
				connection_array[key].update();
			}
		} else {
			connection_array[key].update();
		}
	}
}

function update_all_objects() {
	for(let key in object_array) {
		object_array[key].update();
	}
	for(let key in connection_array) {
		connection_array[key].update();
	}
}

function get_all_objects() {
	let result = {}
	for(let key in object_array) {
		result[key]=object_array[key];
	}
	for(let key in connection_array) {
		result[key]=connection_array[key];
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

function set_name(id,new_name) {
	let tobject = get_object(id);
	if (!tobject)  {
		return;
	}
	tobject.setName(new_name);
	tobject.afterNameChange();
}

function rel_move(node_id,diff_x,diff_y) {
	let primitive = findID(node_id);
	if (primitive != null) {
		// If its a real primitive (stoch, variable etc) update it in the engine
		let oldPos = getCenterPosition(primitive);
		let newPos = [oldPos[0]+diff_x,oldPos[1]+diff_y];
		setCenterPosition(primitive,newPos);
	} else {
		// If its not a real primtiive but rather an anchor point updated the position only graphically
		object_array[node_id].pos[0] += diff_x;
		object_array[node_id].pos[1] += diff_y;
	}
	object_array[node_id].updatePosition();
	object_array[node_id].afterMove(diff_x,diff_y);
}

function positionToModel() {
	
}


function unselect_all_other_anchors(parent_id, child_id_to_select) {
	unselect_all();
	let parent = connection_array[parent_id];
	parent.select();
	for(let anchor of parent.getAnchors()) {
		if (anchor.id !== child_id_to_select) {
			anchor.unselect();
		}
	}
}

function unselect_all() {
	for(let key in object_array) {
		object_array[key].unselect();
	}
	for(let key in connection_array) {
		connection_array[key].unselect();
	}
}

function unselect_all_but(dont_unselect_id) {
	for(let key in object_array) {
		if (key != dont_unselect_id) {
			object_array[key].unselect();
		}
	}
	for(let key in connection_array) {
		if (key != dont_unselect_id) {
			connection_array[key].unselect();
		}
	}
}

function unselect_all_but_family(id) {
	for(let key in object_array) {
		if (!is_family(id,key)) {
			object_array[key].unselect();
		}
	}
	for(let key in connection_array) {
		if (!is_family(id,key)) {
			connection_array[key].unselect();
		}
	}
}

function rotate_name(node_id) {
	let object = get_object(node_id);
	if (object.name_pos<3) {
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
		name_element.setAttribute("x",0); //Set path's data
		name_element.setAttribute("y",0); //Set path's data
		name_element.setAttribute("text-anchor", "middle");
		return;
	}

	let visualObject = get_object(node_id);
	let pos = visualObject.namePosList[visualObject.name_pos];
	name_element.setAttribute("x",pos[0]); //Set path's data
	name_element.setAttribute("y",pos[1]); //Set path's data

	switch(get_object(node_id).name_pos) {
		case 0:
		// Below
				//~ name_element.setAttribute("x",0); //Set path's data
				//~ name_element.setAttribute("y",dist_down); //Set path's data
				name_element.setAttribute("text-anchor", "middle");
		break;
		case 1:
		// To the right
				//~ name_element.setAttribute("x",dist_right); //Set path's data
				//~ name_element.setAttribute("y",0); //Set path's data
				name_element.setAttribute("text-anchor", "start");
		break;
		case 2:
		// Above
				//~ name_element.setAttribute("x",0); //Set path's data
				//~ name_element.setAttribute("y",-dist_up); //Set path's data
				name_element.setAttribute("text-anchor", "middle");
		break;
		case 3:
		// To the left
				//~ name_element.setAttribute("x",-dist_left); //Set path's data
				//~ name_element.setAttribute("y",0); //Set path's data
				name_element.setAttribute("text-anchor", "end");
				//~ name_element.setAttribute("alignment-baseline", "hanging");
		break;
	}
}

function mouseDownHandler(event) {
	do_global_log("mouseDownHandler");
	if (! isTimeUnitOk(getTimeUnits()) && Settings.forceTimeUnit) {
		event.preventDefault();
		timeUnitDialog.show();
		return;
	}
	let offset = $(svgplane).offset();
	let x = event.pageX-offset.left;
	let y = event.pageY-offset.top;
	do_global_log("x:"+x+" y:"+y);
	switch (event.which) {
		case mouse.left:
			// if left mouse button down
			leftmouseisdown = true;
			currentTool.leftMouseDown(x,y);	
			break;
		case mouse.right: 
			// if right mouse button down
			currentTool.rightMouseDown(x,y);
			break;
	}
}
function mouseMoveHandler(event) {
	let offset = $(svgplane).offset();
	let x = event.pageX-offset.left;
	let y = event.pageY-offset.top;

	lastMouseX = x;
	lastMouseY = y;
	
	if (leftmouseisdown) {
		currentTool.mouseMove(x, y, event.shiftKey);
	}
}
function mouseUpHandler(event) {
	if (event.which === mouse.left) {
		if (!leftmouseisdown) {
			return;
		}
		// does not work to store UndoState here, because mouseUpHandler happens even when we are outside the svg (click buttons etc)
		do_global_log("mouseUpHandler");
		let offset = $(svgplane).offset();
		let x = event.pageX-offset.left;
		let y = event.pageY-offset.top;
		
		currentTool.leftMouseUp(x, y, event.shiftKey);
		leftmouseisdown = false;
		updateInfoBar();
		History.storeUndoState();
	}	
}

function find_elements_under(x, y) {	
	let found_array = [];
	let objects = get_all_objects();
	// Having "flow" in this list causes a bug with flows that does not place properly
	//~ let attachable_object_types = ["flow", "stock", "variable"];
	let attachable_object_types = ["flow", "stock", "constant", "variable", "converter"];
	for(key in objects) {
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
	do_global_log("found array("+found_array.length+") "+found_array.map((x)=>x.id).join(","));
	return found_array;
}

function find_element_under(x,y) {
	elements_under = find_elements_under(x,y);
	if (elements_under.length>0) {
		do_global_log("find_element_under choose "+elements_under[0].id);
		return elements_under[0];
	} else {
		return null;
	}
}

function stochsd_clear_sync() {
	let root_object_array = get_root_objects();
	for(let id in root_object_array) {
		if (findID(id) == null) {
			stochsd_delete_primitive(id);
		}
	}
}

class ToolBox {
	static init() {
		this.tools = {
			"mouse":MouseTool,
			"delete":DeleteTool,
			"undo":UndoTool,
			"redo":RedoTool,
			"stock":StockTool,
			"converter":ConverterTool,
			"variable":VariableTool,
			"constant":ConstantTool,
			"flow":FlowTool,
			"link":LinkTool,
			"rotatename":RotateNameTool,
			"movevalve":MoveValveTool,
			"straightenlink": StraightenLinkTool,
			"ghost":GhostTool,
			"text":TextAreaTool,
			"rectangle":RectangleTool,
			"ellipse":EllipseTool,
			"line":LineTool,
			"table":TableTool,
			"timeplot":TimePlotTool,
			"compareplot":ComparePlotTool,
			"xyplot":XyPlotTool,
			"histoplot":HistoPlotTool,
			"numberbox":NumberboxTool,
			"run":RunTool,
			"step":StepTool,
			"reset":ResetTool
		};
	}
	static setTool(toolName, whichMouseButton) {
		if (toolName in this.tools) {
			$(".tool-button").removeClass("pressed");
			$("#btn_"+toolName).addClass("pressed");
			
			currentTool.leaveTool();
			currentTool = this.tools[toolName];
			currentTool.enterTool(whichMouseButton);
		} else {
			errorPopUp("The tool "+toolName+" does not exist");
		}
	}
	static getTool() {
	
	}
}
ToolBox.init();

class ClipboardItem {
	constructor(id) {
		this.id = id;
		this.absolutePosition = [0,0];
		this.relativePosition = [0,0];
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
		setCenterPosition(vertex,[lastMouseX+relativePosition[0],lastMouseY+relativePosition[1]]);
		let oldName = getName(vertex);
		setName(vertex,findFreeName(oldName+"_"));
		syncAllVisuals();
	}
	static copy() {
		this.copiedItems = [];
		let rawSelectedIdArray = get_selected_ids();
		
		// Create parentIdArray as we are only intressted in copying parent nodes
		let parentIdArray = [];
		for(let i in rawSelectedIdArray) {
			let parentId = get_parent_id(rawSelectedIdArray[i]);
			if (parentIdArray.indexOf(parentId) == -1) {
				parentIdArray.push(parentId);
			}
		}
		
		// Create clipboard items
		for(let i in parentIdArray) {
			let clipboardItem = new ClipboardItem(parentIdArray[i]);
			let tmp_object = get_object(parentIdArray[i]);
			
			let absolutePosition = tmp_object.getPos();
			clipboardItem.absolutePosition = absolutePosition;
			
			this.copiedItems.push(clipboardItem);			
		}
		
		// Create position list to calculate relative positions
		let positionList = [];
		for(let i in this.copiedItems) {
			positionList.push(this.copiedItems[i].absolutePosition);
			do_global_log(JSON.stringify(positionList));
		}
		let centerPosition = centerCoordinates(positionList);
		do_global_log("Center positio"+JSON.stringify(centerPosition));
		
		
		// Calculate rel positions for objects
		for(let i in this.copiedItems) {
			do_global_log("hoj "+JSON.stringify(positionDifference(this.copiedItems[i].absolutePosition,centerPosition)));
			this.copiedItems[i].relativePosition = positionDifference(this.copiedItems[i].absolutePosition,centerPosition);
		}
	}
	static paste() {
		for(let i in this.copiedItems) {
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
$(window).load(function() {
	$("a").click((e) => {
		// Important to use "currentTarget" instead of "target", because sometimes
		// the <a> element is outside a <button>
		// .currentTarget will point to the <a> but .target will point to the <button>
		let url=e.currentTarget.href;
		if(environment.openLink(url)) {			
			e.preventDefault();
		}
	});
	rectselector.element = svg_rect(-30,-30,60,60, "black", "none", "element");
	rectselector.element.setAttribute("stroke-dasharray", "4 4");
	rectselector.setVisible(false);
	let svgplane = document.getElementById("svgplane");
	
	$(".tool-button").mousedown(function(event) {
		let toolName = $(this).attr("data-tool");
		ToolBox.setTool(toolName, event.which);
	});
	
	$(window).bind( 'hashchange', hashUpdate);
	hashUpdate();
	
	if (Settings.showDebug) {
		showDebug();
	}
	
	$(document).keydown(function(event) {
		// Only works if no dialog is open
		if (jqDialog.blockingDialogOpen) {
			return;
		}
		if (event.keyCode == keyboard["delete"]) {
			DeleteTool.enterTool();
		}
		let moveSize = 2;
		if (event.shiftKey) {
			moveSize = 16;
		}
		if (event.keyCode == keyboard["right"]) {
			MouseTool.mouseMove(mousedown_x-moveSize, mousedown_y, false);
			event.preventDefault();
		}
		if (event.keyCode == keyboard["up"]) {
			MouseTool.mouseMove(mousedown_x, mousedown_y-moveSize, false);
			event.preventDefault();
		}
		if (event.keyCode == keyboard["left"]) {
			MouseTool.mouseMove(mousedown_x+moveSize, mousedown_y, false);
			event.preventDefault();
		}
		if (event.keyCode == keyboard["down"]) {
			MouseTool.mouseMove(mousedown_x, mousedown_y+moveSize, false);
			event.preventDefault();
		}
		if (event.ctrlKey) {
			if (event.keyCode == keyboard["1"] || event.keyCode === keyboard["R"]) {
				event.preventDefault();
				RunTool.enterTool();
			}
			if (event.keyCode == keyboard["2"]) {
				event.preventDefault();
				StepTool.enterTool();
			}
			if (event.keyCode == keyboard["3"]) {
				event.preventDefault();
				ResetTool.enterTool();
			}
			if (event.keyCode == keyboard["O"]) {
				event.preventDefault();
				$("#btn_load").click();
			}
			if (event.keyCode == keyboard["S"]) {
				event.preventDefault();
				$("#btn_save").click();
			}
			if (event.keyCode == keyboard["P"]) {
				event.preventDefault();
				$("#btn_print_model").click();
			}
			if (event.keyCode == keyboard["A"]) {
				for (let id in object_array) { object_array[id].select(); }
				for (let id in connection_array) { connection_array[id].select(); }
			}
			if (event.keyCode == keyboard["Z"]) {
				History.doUndo();
			}
			if (event.keyCode == keyboard["Y"]) {
				History.doRedo();
			}
			if (event.keyCode == keyboard["C"]) {
				// Clipboard.copy();
			}
			if (event.keyCode == keyboard["V"]) {
				// Clipboard.paste();
				// History.storeUndoState();
			}
		}
		environment.keyDown(event);
	});
	
	$(svgplane).mousedown(mouseDownHandler);
	svgplane.addEventListener('contextmenu', function(event) {
		event.preventDefault();
		return false;
	}, false);
	// the mousemove and mouseup event needs to be attached to the html to allow swipping the mouse outside
	$("html").mousemove(mouseMoveHandler);
	$("html").mouseup(mouseUpHandler);
	ToolBox.setTool("mouse");
	$("#btn_file").click(function() {
		updateRecentsMenu();
	});
	$("#btn_new").click(function() {
		saveChangedAlert(function() {
			fileManager.newModel();
		});
	});	
	$("#btn_load").click(function() {
		saveChangedAlert(function() {
			fileManager.loadModel();
		});
	});
	$("#btn_save").click(function() {
		History.storeUndoState();
		fileManager.saveModel();
	});
	$("#btn_save_as").click(function() {
		History.storeUndoState();
		fileManager.saveModelAs();
	});
	$("#btn_simulation_settings").click(function() {
		simulationSettings.show();
	});
	$("#btn_equation_list").click(function() {
		equationList.show();
	});
	$("#btn_print_model").click(function() {
		printDiagram();
	});
	$("#btn_black").click(function() {
		setColorToSelection("black");
	});
	$("#btn_lightgrey").click(function() {
		setColorToSelection("lightgrey");
	});
	$("#btn_red").click(function() {
		setColorToSelection("red");
	});
	$("#btn_deeppink").click(function() {
		setColorToSelection("deeppink");
	});
	$("#btn_brown").click(function() {
		setColorToSelection("brown");
	});
	$("#btn_orange").click(function() {
		setColorToSelection("orange");
	});
	$("#btn_gold").click(function() {
		setColorToSelection("gold");
	});
	$("#btn_olive").click(function() {
		setColorToSelection("olive");
	});
	$("#btn_green").click(function() {
		setColorToSelection("green");
	});
	$("#btn_teal").click(function() {
		setColorToSelection("teal");
	});
	$("#btn_blue").click(function() {
		setColorToSelection("blue");
	});
	$("#btn_purple").click(function() {
		setColorToSelection("purple");
	});
	$("#btn_magenta").click(function() {
		setColorToSelection("magenta");
	});
	$("#btn_macro").click(function() {
		macroDialog.show();
	});
	$("#btn_debug").click(function() {
		debugDialog.show();
	});
	$("#btn_about").click(function() {
		aboutDialog.show();
	});
	$("#btn_license").click(function() {
		licenseDialog.show();
	});
	$("#btn_thirdparty").click(function() {
		thirdPartyLicensesDialog.show();
	});
	$("#btn_restart").click(function() {
		saveChangedAlert(function() {
			applicationReload();
		});
	});
	$("#btn_preserve_restart").click(function() {
		preserveRestart();
	});
	$(".btn_load_plugin").click((event) => {
		let pluginName = $(event.target).data("plugin-name");
		loadPlugin(pluginName);
	});
	$("#btn_timeunit").click(function() {
		timeUnitDialog.show();
	})
	if (fileManager.hasSaveAs()) {
		$("#btn_save_as").show();
	}
	if (fileManager.hasRecentFiles()) {
		for (let i = 0; i < Settings.MaxRecentFiles; i++) {
			$(`#btn_recent_${i}`).click(function(event) {
				let filePath = event.target.getAttribute("filePath");
				fileManager.loadFromFile(filePath);
				setTimeout(() => {
					updateTimeUnitButton();
					updateInfoBar();
				 },200);
			});
		}
	}
	macroDialog = new MacroDialog();
	equationEditor = new EquationEditor();
	converterDialog = new ConverterDialog();
	simulationSettings = new SimulationSettings();
	timeUnitDialog = new TimeUnitDialog();
	equationList = new EquationListDialog();
	debugDialog = new DebugDialog();
	aboutDialog = new AboutDialog();
	thirdPartyLicensesDialog = new ThirdPartyLicensesDialog();
	licenseDialog = new LicenseDialog();
	
	// When the program is fully loaded we create a new model
	//~ fileManager.newModel();
	
	$(window).resize(updateWindowSize);
	updateWindowSize();
	nwController.ready();
	environment.ready();
	fileManager.ready();
	restoreAfterRestart();

	updateTimeUnitButton();
	
	History.storeUndoState();
});
	
function updateTimeUnitButton() {
	if (isTimeUnitOk(getTimeUnits())) {
		$("#timeUnitParagraph").html(`Time Unit: ${getTimeUnits()}`);
	} else {
		$("#timeUnitParagraph").html("<span style='color: red;'>No Time Unit</span>");
	}
}

function find_connections(visual) {
	return find_start_connections(visual).concat(find_end_connections(visual));
}

function find_start_connections(visual) {
	let connections_array = Array(0);
	for(key in connection_array) {
		if (connection_array[key].getStartAttach && connection_array[key].getStartAttach() == visual) {
			connections_array.push(connection_array[key]);
		}
	}
	return connections_array;
}

function find_end_connections(visual) {
	let connections_array = Array(0);
	for(key in connection_array) {
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
		switch(type) {
			case("timeplot"):
			case("xyplot"):
			case("table"):
			case("compareplot"):
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

function stochsd_delete_primitive (id) {
	let stochsd_object = get_object(id);
	if (stochsd_object) {
		stochsd_object.clean();
	}
	
	if (object_array[id]) {
		delete object_array[id];
	} else if (connection_array[id]) {
		delete connection_array[id];
	} else {
		do_global_log("primitive with id "+id+" does not exist");
	}
}

function isLocal() {
	return true; // Expose additional debugging and error messages
}

function export_txt(fileName, data) {
	// Create Blob and attach it to ObjectURL
	let blob = new Blob([data], {type: "octet/stream"}),
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
	setTimeout(function() {
		window.URL.revokeObjectURL(url);
		a.remove();
	},1);
};

function export_model() {
	export_txt("a.txt",blankGraphTemplate);
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
	let default_primitive = primitiveBank[prim.value.nodeName.toLowerCase()];
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
	switch(nodeType) {
		case "Numberbox":
		{
			let position = getCenterPosition(tprimitive);
			let visualObject = new NumberboxVisual(tprimitive.id, "numberbox",position);
			visualObject.setColor(tprimitive.getAttribute("Color"));
			visualObject.render();
		}
		break;
		case "Table":
		case "XyPlot":
		case "HistoPlot":
		{
			dimClass = null;
			switch(nodeType) {
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
			switch(nodeType) {
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
			switch(nodeType) {
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
			let visualObject = new StockVisual(tprimitive.id, "stock",position);
			set_name(tprimitive.id,tprimitive.getAttribute("name"));
			
			visualObject.setColor(tprimitive.getAttribute("Color"));

			visualObject.name_pos = Number(tprimitive.getAttribute("RotateName"));
			update_name_pos(tprimitive.id);
		}
		break;
		case "Converter":
		{
			let position = getCenterPosition(tprimitive);
			let visualObject = new ConverterVisual(tprimitive.id, "converter",position);
			set_name(tprimitive.id,tprimitive.getAttribute("name"));
			
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
			switch(source_type) {
					case "Converter":
						visualObject = new ConverterVisual(tprimitive.id, "converter",position,{"is_ghost":true});
						break;
					case "Variable":
						if (source_primitive.getAttribute("isConstant") == "true") {
							visualObject = new ConstantVisual(tprimitive.id, "variable", position, {"is_ghost":true});
						} else {
							visualObject = new VariableVisual(tprimitive.id, "variable", position, {"is_ghost":true});
						}
						break;
					case "Stock":
						visualObject = new StockVisual(tprimitive.id, "stock",position,{"is_ghost":true});
						break;
			}
			set_name(tprimitive.id,tprimitive.getAttribute("name"));

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
			set_name(tprimitive.id,tprimitive.getAttribute("name"));
			
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

			set_name(tprimitive.id,getName(tprimitive));
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
				connection.setHandle1Pos([Number(bezierPoints[0]),Number(bezierPoints[1])]);
				connection.setHandle2Pos([Number(bezierPoints[2]),Number(bezierPoints[3])]);
			} else {
				// bezierPoints does not exist. Create them
				connection.resetBezierPoints();
			}
			connection.curve.update();
		}
		break;
	}
}

// This function is important. It takes all the relevant primitives from the engine
// And make visual objects from them
// This is executed after loading a file or loading a whole new state such as after undo
function syncAllVisuals() {
	for(let type of saveblePrimitiveTypes) {
		let primitive_list = primitives(type);
		for(key in primitive_list) {
			try {
				syncVisual(primitive_list[key]);
			} catch(exception) {
				removePrimitive(primitive_list[key]);
				alert("Error while loading corrupted primitive of type "+type+". Removing corrupted primitive to avoid propagated errors.");
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
		testname = basename+counter.toString();
	} while(findName(testname) != null)
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
		for(let i in this.subscribers) {
			this.subscribers[i](message);
		}	
	}
}

class runOverlay {
	static init() {
		$(document).ready(() => {
			$("#svgBlockOverlay").mousedown(() => {
				$("#svgBlockOverlay").css("opacity",0.5);
				yesNoAlert("Do you want to terminate the simulation now to change the model?",function(answer) {
					$("#svgBlockOverlay").css("opacity",0);
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

const runStateEnum = {
	none: "none",
	running: "running",
	stopped: "stopped",
	stepping: "stepping",
	paused: "paused"
}

// Not yet implemented
function setColorToSelection(color) {
	let objects = get_selected_objects();
	for(let id in objects) {
		let obj = get_object(id);
		get_parent(obj).setColor(color);
	}
	History.storeUndoState();
}

function printDiagram() {
	unselect_all();
	updateInfoBar();
	// Write filename and date into editor-footer 
	let fileName = fileManager.fileName;
	
	let d = new Date();
	let month = d.getMonth()+1 < 10 ? `0${d.getMonth()+1}` : d.getMonth()+1;
	let day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
	let hours = d.getHours() < 10 ? `0${d.getHours()}` : d.getHours();
	let minutes = d.getMinutes() < 10 ? `0${d.getMinutes()}` : `${d.getMinutes()}`;
	let fullDate = `${d.getFullYear().toString()}-${month}-${day} ${hours}:${minutes} (yyyy-mm-dd hh:mm)`;

	if (fileName.length > 0) {
		$(".editor-footer-filepath").html(fileName);
	} else {
		$(".editor-footer-filepath").html("Unnamed file");
	}
	
	$(".editor-footer-date").html(fullDate);

	hideAndPrint([$("#topPanel").get(0)]);
}

function removeNewLines(string) {
	let newString = string;
	newString = newString.replace(/\\n/g, " ");
	return newString;
}

function updateRecentsMenu() {
	if (fileManager.hasRecentFiles()) {
		if (localStorage.recentFiles) {
			let recent = JSON.parse(localStorage.recentFiles);
			if (0 < recent.length) {
				$('#recent_title').show();
			}
			for (let i = 0; i < recent.length; i++) {
				$(`#btn_recent_${i}`).show();
				$(`#btn_recent_${i}`).html(recent[i]);
				$(`#btn_recent_${i}`).attr("filePath", recent[i]);
			}
		}
	}
}

function updateInfoBar() {
	let infoDef = $(".info-bar__definition");
	let infoVE = $(".info-bar__value-error");
	let selected_hash = get_selected_root_objects();
	let selected_array = [];
	for (let key in selected_hash) {
		selected_array.push(selected_hash[key]);
	}

	if (selected_array == 0) {
		infoDef.html("Nothing selected");
		infoVE.html("");
	} else if (selected_array.length == 1) {
		let selected = selected_array[0];
		primitive = selected_array[0].primitive;
		if (selected.is_ghost) {
			primitive = findID(primitive.getAttribute("Source"));
		}
		let name = primitive.getAttribute("name");
		let definition = getValue(primitive);
		let VE = primitive.getAttribute("ValueError");
		infoVE.html(VE ? ValueErrorToString(VE) : "" );

		definitionNoLines = removeNewLines(definition);
		if (definitionNoLines != "") {
			infoDef.html(`[${name}] = ${definitionNoLines}`);
		} else {
			let type = selected.type;
			
			// Make first letter uppercase
			// let Type = type.charAt(0).toUpperCase() + type.slice(1); 
			let Type = type_basename[type]; 
			switch(type) {
				case("numberbox"):
					let targetName = `${getName(findID(selected.primitive.getAttribute("Target")))}`
					infoDef.html(`Numberbox: Value of [${targetName}]`);
				break;
				case("timeplot"):
				case("compareplot"):
				case("table"):
				case("xyplot"):
				case("histoplot"):
					let names = selected.dialog.displayIdList.map(findID).filter(exist => exist).map(getName);
					infoDef.html(`${Type}: ${names.map(name => ` [${name}]`)}`);
				break;
				case("link"):
					let source = selected.getStartAttach() ? `[${getName(selected.getStartAttach().primitive)}]` : "NONE";
					let target = selected.getEndAttach()   ? `[${getName(selected.getEndAttach().primitive)}]`: "NONE";
					infoDef.html(`Link: ${source} -> ${target}`);
				break;
				default: 
					infoDef.html(`${Type} selected`);
			}
		}
	} else {
		infoDef.html(`${selected_array.length} objects selected`);
		infoVE.html("");
	}
	updateLinkBar();
}

class RunResults {
	static init() {		
		this.runState = runStateEnum.none;
		// Is always null if simulation is not running
		// Is a data structure returned from runModel if simulation is running it
		this.simulationController = null;
		this.varnameList = [];
		this.varIdList = [];
		this.varnameList = ["Time"];
		this.results = [];
		this.runSubscribers = {};
		this.updateFrequency = 100;
		this.updateCounter = 0; // Updates everytime updateCounter goes down to zero
		this.simulationTime = 0;
	}
	static createHeader() {
		// Get list of primitives that we want to observe from the model
		let primitive_array = getPrimitiveList();

		// Create list of ids
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
		for(let id of this.varIdList) {
			let primitive = findID(id);
			if (primitive) {
					out += ","+getName(primitive);
			}
		}
		out += "\n";
		
		for(let row_index in this.results) {
			//~ for(let column_index in ["Time"].concat(namesToDisplay)) {
			first = true;
			for(let column_index in this.varIdList) {
				if (first) {
					out += stocsd_format(this.results[row_index][column_index],6);
					first = false;
				} else {
					out += ","+stocsd_format(this.results[row_index][column_index],6);
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
		while(index < res.periods) {
			let time = res.times[index];
			this.simulationTime = res.times[index];
			let currentRunResults = [];
			currentRunResults.push(time);
			for(let key in this.varIdList) {
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
	static runPauseSimulation() {
		switch(this.runState) {
			case runStateEnum.running:
				this.pauseSimulation();
			break;
			case runStateEnum.paused:
				this.resumeSimulation();
			break;
			default:
				this.runSimulation();
		}
	}
	static resumeSimulation() {
		$("#imgRunPauseTool").attr("src", "graphics/pause.svg");
		this.runState = runStateEnum.running;
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
		this.stopSimulation();
		$("#imgRunPauseTool").attr("src", "graphics/pause.svg");
		this.createHeader();
		if (getTimeLength()/getTimeStep() < 1000) {
			setPauseInterval(getTimeLength()/10);
		} else {
			// We can only take 1000 iterations between every update to avoid the feeling of program freezing
			setPauseInterval(getTimeStep()*1000);
		}
		this.runState = runStateEnum.running;
		runOverlay.block();
		this.simulationController = runModel({
			rate: -1,
			onPause: (res) => {
				// We always need to do this, even if we paused the simulation, otherwise we cannot unpause
				// Here is the only place we can get a handle to the simulationController
				this.simulationController = res;
				
				// If still running continue with next cycle
				if (this.runState == runStateEnum.running) {
					this.updateProgressBar();
					this.setProgressBarGreen(false);
					do_global_log("length "+this.results.length)
					if (this.simulationController == null) {
						do_global_log("simulation controller is null")
					}
					this.continueRunSimulation()
				}
			},
			onSuccess: (res) => {
				// Run finished
				// In some cases onPause was never executed and in such cases we need to do store Result directly on res
				this.storeResults(res);
				this.updateProgressBar();
				this.setProgressBarGreen(true);
				this.triggerRunFinished();
				this.stopSimulation();
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
		if (this.runState == runStateEnum.running) {
			this.resetSimulation();
			this.simulationController = null;
			this.runState = runStateEnum.stepping;
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
				this.storeResults(res);
				this.updateProgressBar();
				this.setProgressBarGreen(false);
				this.triggerRunFinished();
				this.simulationController = res;
			},
			onSuccess: (res) => {
				runOverlay.unblock();
				this.storeResults(res);
				this.updateProgressBar();
				this.setProgressBarGreen(false);
				this.triggerRunFinished();
			},
			onError: (res) => {
				this.stopSimulation();
			}
		});
	}
	static setProgressBarGreen(isGreen) {
		if (isGreen) {
			// set color to green 
			$("#runStatusBar").css("background", "#aaeeaa");
		} else {
			// set color to orange 
			$("#runStatusBar").css("background", "#eed0aa");
		}
	}
	static updateProgressBar() {
		let progress = clampValue(this.getRunProgressFraction(), 0, 1);
		$("#runStatusBar").width(`${100*progress}%`);
		let currentTime = this.getRunProgress();
		let startTime = this.getRunProgressMin();
		// let endTime = this.getRunProgressMax();
		let timeStep = this.getTimeStep();
		let alg_str = getAlgorithm() === "RK1" ? "Euler" : "RK4";
		$("#runStatusBarText").html(`${startTime} / ${currentTime} </br> ${alg_str}(DT = ${timeStep})`);
	}
	static pauseSimulation() {
		this.runState = runStateEnum.paused;
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
		this.runState = runStateEnum.stopped;
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
		if (this.results && 1 < this.results.length) {
			return this.results[1][0]-this.results[0][0];
		} else if (primitives("Setting")[0]) {
			return primitives("Setting")[0].getAttribute("TimeStep");
		}
		return 0;
	}
	static getRunProgress() {
		let lastRow = this.getLastRow();
		// If we have no last row return null
		if (lastRow == null && primitives("Setting")[0]) {
			return primitives("Setting")[0].getAttribute("TimeStart");
		}
		// else return time
		return lastRow[0];
	}
	static getRunProgressFraction() {
		return this.getRunProgress() / this.getRunProgressMax();
	}
	static getRunProgressMax() {
		return getTimeStart()+getTimeLength()
	}
	static getRunProgressMin() {
		return getTimeStart();
	}
	static getLastRow() {
		//~ alert(this.results.length);
		if (this.results.length != 0) {
			return this.results[this.results.length-1];
		} else {
			return null;
		}
	}
	static getSelectiveIdResults(varIdList) {
		// Make sure the varIdList stored as numbers and not strings
		varIdList = varIdList.map(Number);
		
		// Contains the indexes from this.results that we want to return
		let selectedVarIdIndexes = [0]; // The first index is always 0 for time
		for(let i in varIdList) {
			let varIdIndex = this.varIdList.indexOf(varIdList[i]);
			selectedVarIdIndexes.push(varIdIndex);
		}
		do_global_log("this.varIdList "+JSON.stringify(this.varIdList)+" varIdList "+JSON.stringify(varIdList));
		let returnResults = [];
		for(let row_index in this.results) {
			let tmpRow = [];
			for(let column_index in selectedVarIdIndexes) {
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
	static getFilteredSelectiveIdResults(varIdList,start,length,step) {
		let unfilteredResults = this.getSelectiveIdResults(varIdList);
		let filteredResults = [];
		let printInterval = step/getTimeStep();
		let printCounter = 1;
		
		for(let row_index in unfilteredResults) {
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
			if (printCounter<printInterval) {
				printCounter++;
				continue;
			} else {
				printCounter = 1;
			}
			filteredResults.push(unfilteredResults[row_index]);
		}
		// Make sure last value is added
		if (filteredResults.length !== 0 && unfilteredResults.length !== 0) {
			if (filteredResults[filteredResults.length-1][0] !== unfilteredResults[unfilteredResults.length-1][0]) {
				filteredResults.push(unfilteredResults[unfilteredResults.length-1]);
			}
		}
		return filteredResults;
	}
	static triggerRunFinished() {
		for(let id in this.runSubscribers) {
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
		this.size = [600,400];
		
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
		this.dialogDiv.setAttribute("title",this.title);
		this.dialogDiv.setAttribute("style", "font-size: 13px; display: inline-block");
		this.dialogDiv.style.display = "none";

		this.dialogContent = document.createElement("div");
		this.dialogContent.innerHTML=this.contentHTML;
		
		this.dialogDiv.appendChild(this.dialogContent);	
		document.body.appendChild(this.dialogDiv);

		this.dialogContent.setAttribute("style", "display: inline-block");
		
		
		this.dialogParameters = {
			autoOpen: false,
			modal: this.modal, // Adds overlay on background
			resizable: true,
			resize: (event,ui) => {
				this.resize(event,ui);
			},
			resizeStart: (event,ui) => {
				this.resizeStart(event,ui);
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
			open: ( event, ui ) => {
				if (this.dialogParameters.modal) {
					jqDialog.blockingDialogOpen = true;
				}
				
				let windowWidth = $(window).width();
				let windowHeight = $(window).height();
				$(event.target).css("maxWidth", (windowWidth-50)+"px");
				$(event.target).css("maxHeight", (windowHeight-50)+"px");
			}
		};
		this.dialogParameters.buttons = {
			"Cancel":() => {
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
	applyChanges() {
		this.makeApply();
		$(this.dialog).dialog('close');
		// We add a delay to make sure we closed first
		
		setTimeout(() => {
			History.storeUndoState();
			updateInfoBar();
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
		this.dialog.dialog( "option", "title", this.title);		
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

function getPrimitiveList() {
	let primitiveList = primitives("Stock").concat(primitives("Flow")).concat(primitives("Variable")).concat(primitives("Converter"));
	return primitiveList;
}

class XAlertDialog extends jqDialog {
	constructor(message,closeHandler = null) {
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
			"Ok":() =>
			{
				$(this.dialog).dialog('close');
			}
		};
	}
}
function xAlert(message,closeHandler) {
	let dialog = new XAlertDialog(message,closeHandler);
	dialog.show();
}

class YesNoDialog extends jqDialog {
	constructor(message,closeHandler) {
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
			"Yes":() =>
			{
				this.answer = "yes";
				$(this.dialog).dialog('close');
			},
			"No":() =>
			{
				this.answer = "no";
				$(this.dialog).dialog('close');
			}
		};
	}
}
function yesNoAlert(message,closeHandler) {
	let dialog = new YesNoDialog(message,closeHandler);
	dialog.show();
}

class YesNoCancelDialog extends jqDialog {
	constructor(message,closeHandler) {
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
			"Yes":() =>
			{
				this.answer = "yes";
				$(this.dialog).dialog('close');
			},
			"No":() =>
			{
				this.answer = "no";
				$(this.dialog).dialog('close');
			},
			"Cancel":() =>
			{
				this.answer = "cancel";
				$(this.dialog).dialog('close');
			}
		};
	}
}
function yesNoCancelAlert(message,closeHandler) {
	let dialog = new YesNoCancelDialog(message,closeHandler);
	dialog.show();
}

function saveChangedAlert(continueHandler) {
	// If we have no unsaved changes we just continue directly	
	if (!History.unsavedChanges) {
		continueHandler();
		return;
	}	
	// Else ask if we want to save first
	yesNoCancelAlert("You have unsaved changes. Do you want to save first?",function(answer) {
		switch(answer) {
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

// This is the super class dor ComparePlotDialog and TableDialog
class DisplayDialog extends jqDialog {
	constructor(id) {
		super();
		this.primitive = findID(id);
		this.displayIdList = [];
		this.subscribePool = new SubscribePool();
		this.acceptedPrimitveTypes = ["Stock", "Flow", "Variable", "Converter"];
	}

	getDefaultPlotPeriod() {
		let plot_per = getTimeLength()/100;
		if (plot_per < getTimeStep()) {
			plot_per = getTimeStep();
		}
		return plot_per;
	}
	clearRemovedIds() {
		for(let id of this.displayIdList) {
			if (findID(id) == null) {
				this.setDisplayId(id,false);
			}
		}
	}
	
	getAcceptedPrimitiveList() {
		let results = [];
		let primitiveList = getPrimitiveList();
		for(let primitive of primitiveList) {
			if (this.acceptsId(primitive.id)) {
				results.push(primitive);
			}
		}
		return results;
	}
	
	acceptsId(id) {
		let type = getType(findID(id));
		return (this.acceptedPrimitveTypes.indexOf(type) != -1);
	}

	removeIdToDisplay(id) {
		let idxToRemove = this.displayIdList.indexOf(id);
		if (idxToRemove !== -1) {
			this.displayIdList.splice(idxToRemove, 1);
		}
	}
	
	setDisplayId(id,value) {
		let oldIdIndex = this.displayIdList.indexOf(id);
		switch(value) {
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
				this.displayIdList.splice(oldIdIndex,1);
			break;
		}
	}
	
	getDisplayId(id) {
		id = id.toString();
		if (this.displayIdList.indexOf(id) == -1) {
			return false;
		} else {
			return true;
		}
	}
	
	setIdsToDisplay(idList) {
		this.displayIdList = [];
		for(let i in idList) {
			this.setDisplayId(idList[i],true);
		}
	}
	getIdsToDisplay() {
		this.clearRemovedIds();
		return this.displayIdList;
	}
	afterClose() {
		this.subscribePool.publish("window closed");
	}

	/* RoundToZero html and logic starts here */
	renderRoundToZeroHtml() {
		return (`
			<table class="modern-table">
				<tr>
					<td>
						<input class="round-to-zero-checkbox enter-apply" type="checkbox" /> Show <b>0</b> when <i>abs(value) &lt;</i> <input class="round-to-zero-field enter-apply" type="text" value="no value"/>
					</td>
					<td>
						<button class="default-round-to-zero-button enter-apply">Reset to Default</button>
					</td>
				</tr>
			</table>
			<p class="round-to-zero-warning-div" style="color: red; margin: 5px 0px;">Warning Text Here</p>
		`);
	}
	roundToZeroBeforeShow() {
		let roundToZeroCheckbox = $(this.dialogContent).find(".round-to-zero-checkbox");
		let roundToZeroField = $(this.dialogContent).find(".round-to-zero-field");

		let roundToZero = this.primitive.getAttribute("RoundToZero") === "true";
		let roundToZeroAtValue = this.primitive.getAttribute("RoundToZeroAtValue");
		roundToZeroField.val(roundToZeroAtValue);
		this.setRoundToZero(roundToZero);

		// set default button listener
		$(this.dialogContent).find(".default-round-to-zero-button").click(() => {
			this.setRoundToZero(true);
			roundToZeroField.val(getDefaultAttributeValue("numberbox", "RoundToZeroAtValue"));
			this.checkValidRoundAtZeroAtField();
		});

		roundToZeroCheckbox.click(() => {
			this.setRoundToZero(roundToZeroCheckbox.prop("checked"));
		});

		roundToZeroField.keyup((event) => {
			this.checkValidRoundAtZeroAtField();
		});
		
		$(this.dialogContent).find(".enter-apply").keydown((event) =>{
			if(event.keyCode == keyboard["enter"]) {
				event.preventDefault();
				this.applyChanges();
			}
		});
	}
	setRoundToZero(roundToZero) {
		$(this.dialogContent).find(".round-to-zero-checkbox").prop("checked", roundToZero);
		$(this.dialogContent).find(".round-to-zero-field").prop("disabled", ! roundToZero);
		this.checkValidRoundAtZeroAtField();
	}

	checkValidRoundAtZeroAtField() {
		let roundToZeroFieldValue = $(this.dialogContent).find(".round-to-zero-field").val();
		if ($(this.dialogContent).find(".round-to-zero-checkbox").prop("checked")) {
			if (isNaN(roundToZeroFieldValue)) {
				this.setNumberboxWarning(true, `<b>${roundToZeroFieldValue}</b> is not a number.`);
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
		if (isVisible) {
			$(this.dialogContent).find(".round-to-zero-warning-div").html(htmlMessage);
			$(this.dialogContent).find(".round-to-zero-warning-div").css("visibility", "visible");
		} else {
			$(this.dialogContent).find(".round-to-zero-warning-div").html("");
			$(this.dialogContent).find(".round-to-zero-warning-div").css("visibility", "hidden");
		}
	}

	roundToZeroMakeApply() {
		if (this.primitive) {
			let roundToZero = $(this.dialogContent).find(".round-to-zero-checkbox").prop("checked");
			this.primitive.setAttribute("RoundToZero", roundToZero);
			
			if ( this.checkValidRoundAtZeroAtField() ) {
				let roundToZeroAtValue = $(this.dialogContent).find(".round-to-zero-field").val();
				this.primitive.setAttribute("RoundToZeroAtValue", roundToZeroAtValue);
			}
		}
	}
	/* RoundToZero html and logic ends here */
	renderPlotPerHtml() {
		let auto_plot_per = JSON.parse(this.primitive.getAttribute("AutoPlotPer"));
		let plot_per = Number(this.primitive.getAttribute("PlotPer"));
		return (`
			<table class="modern-table" 
				title="Distance between points in time units. \n (Should not be less then Time Step)"
			>
				<tr>
					<th>
						Plot Period: 
					</th>
					<td style="padding:1px;">
						<input style="" class="plot-per-field limit-input enter-apply" type="text" value="${plot_per}" ${auto_plot_per ? "disabled" : ""}/>
					</td>
					<td>
						Auto
						<input style="" class="plot-per-auto-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(auto_plot_per)}/>
					</td>
				</tr>
			</table>
			<div class="plot-per-warning" style="color: red;"></div>
		`);
	}
	applyPlotPer() {
		if(this.validPlotPer()) {
			let auto_plot_per = $(this.dialogContent).find(".plot-per-auto-checkbox").prop("checked");
			let plot_per = Number($(this.dialogContent).find(".plot-per-field").val());
			this.primitive.setAttribute("AutoPlotPer", auto_plot_per);
			this.primitive.setAttribute("PlotPer", plot_per);
		}
	}
	bindPlotPerEvents() {
		$(this.dialogContent).find(".plot-per-auto-checkbox").change(event => {
			let plot_per_field = $(this.dialogContent).find(".plot-per-field");
			plot_per_field.prop("disabled", event.target.checked);
			
			let plot_per = Number(this.primitive.getAttribute("PlotPer"));
			if (event.target.checked) {
				plot_per = this.getDefaultPlotPeriod();
			}
			plot_per_field.val(plot_per);
		});
		$(this.dialogContent).find(".plot-per-field").keyup(event => {
			this.validPlotPer();
		});
	}
	validPlotPer() {
		let plot_per_str = $(this.dialogContent).find(".plot-per-field").val();
		let warning_div = $(this.dialogContent).find(".plot-per-warning");	
		if (isNaN(plot_per_str) || plot_per_str === "") {
			warning_div.html("Plot Period must be a number");
			return false;
		} else if (Number(plot_per_str) <= 0) {
			warning_div.html("Plot Period must be &gt;0");
			return false;
		} else {
			warning_div.html("");
			return true;
		}
	}
	renderNumberedLinesCheckboxHtml() {
		let hasNumberedLines = (this.primitive.getAttribute("HasNumberedLines") === "true");
		return (`
			<table class="modern-table">
				<tr>
					<td>
						<b>Numbered Lines:</b>
						<input class="numbered-lines-checkbox enter-apply" type="checkbox" ${checkedHtml(hasNumberedLines)}>
					</td>
				</tr>
			</table>
		`);
	}
	renderLineWidthOptionHtml() {
		return (`
			<table class="modern-table">
				<tr>
					<td>
					<b>Line Width:</b>
						<select class="line-width enter-apply">
						<option value=1 ${(this.primitive.getAttribute("LineWidth") == 1) ? "selected" : ""}>Thin</option>
						<option value=2 ${(this.primitive.getAttribute("LineWidth") == 2) ? "selected" : ""}>Thick</option>
						</select>
					</td>
				</tr>
			</table>
		`);
	}
	renderLineOptionsHtml() {
		let options = JSON.parse(this.primitive.getAttribute("LineOptions"));
		return (`
			<table class="modern-table">
				<tr>
					<th>Type</th>
					<th>Pattern</th>
					<th>Width</th>
				</tr>
				${Object.keys(options).map(key => (`<tr>
					<td>${type_basename[key]}</td>
					<td>
						<select data-key="${key}" class="line-pattern-select enter-apply" style="font-family: monospace;">
						<option value="[1]"		${options[key].pattern[0] === 1  ? "selected" : ""}>&#8212;&#8212;&#8212;&#8212;&#8212;&#8212;</option>
						<option value="[10, 5]" ${options[key].pattern[0] === 10 ? "selected" : ""}>------</option>
						</select>
					</td>
					<td>
						<select data-key="${key}" class="line-width-select enter-apply">
						<option value=1 ${options[key].width === 1 ? "selected": ""}>1</option>
						<option value=2 ${options[key].width === 2 ? "selected": ""}>2</option>
						<option value=3 ${options[key].width === 3 ? "selected": ""}>3</option>
						</select>
					</td>
				</tr>`)).join('')}
			</table>
		`);
	}
	applyLineOptions() {
		let options = JSON.parse(this.primitive.getAttribute("LineOptions"));

		let pattern_options = $(this.dialogContent).find(".line-pattern-select");
		let width_options = $(this.dialogContent).find(".line-width-select");
		for (let i = 0; i < width_options.length; i++) {
			let selected_width = JSON.parse($(width_options[i]).find(" :selected").val());
			let selected_pattern = JSON.parse($(pattern_options[i]).find(" :selected").val());

			options[$(width_options[i]).attr("data-key")]["width"] = selected_width;
			options[$(pattern_options[i]).attr("data-key")]["pattern"] = selected_pattern;
		}
		this.primitive.setAttribute("LineOptions", JSON.stringify(options));
	}
	renderColorCheckboxHtml() {
		return (`
			<table class="modern-table">
				<tr>
					<td>
					<b>Colour From Primitive:</b>
					<input class="color-from-primitive-checkbox enter-apply" type="checkbox" ${checkedHtml(this.primitive.getAttribute("ColorFromPrimitive")==="true")}>
					</td>
				</tr>
			</table>
		`);
	}
	renderPrimitiveListHtml() {
		// We store the selected variables inside the dialog
		// The dialog is owned by the table to which it belongs
		let primitives = this.getAcceptedPrimitiveList();
		let prims_object = { "Stock": [], "Flow": [], "Variable": [], "const": [], "Converter": [] };
		for (let p of primitives) {
			let nodeType = p.value.nodeName;
			if ( nodeType === "Variable" && p.getAttribute("isConstant") === "true") {
				prims_object["const"].push(p);
			} else {
				prims_object[nodeType].push(p);
			}
		}

		return (`
			<table class="modern-table" >
				${Object.keys(prims_object).map((type, type_idx) => 
					prims_object[type].map((p, idx) => `
						<tr style="${type_idx !== 0 && idx===0 ? "border-top: 5px solid #ddd": ""}">
							<td>${getName(p)}</td>
							<td style="text-align: center;">
								<input
									class="primitive-checkbox enter-apply"
									type="checkbox"
									${checkedHtml(this.getDisplayId(getID(p)))}
									data-name="${getName(p)}"
									data-id="${getID(p)}"
								>
							</td>
						</tr>
					`).join('')
				).join('')}
			</table>
		`);
	}
	makeApply() {
		if ($(this.dialogContent).find(".line-width :selected")) {
			this.primitive.setAttribute("LineWidth", $(this.dialogContent).find(".line-width :selected").val());
		}
	}
	bindPrimitiveListEvents() {
		$(this.dialogContent).find(".primitive-checkbox").click((event) => {
			let clickedElement = event.target;
			let idClicked = $(clickedElement).attr("data-id");
			let checked = $(clickedElement).prop("checked");
			this.setDisplayId(idClicked,checked);
			this.subscribePool.publish("primitive check changed");
		});
		$(this.dialogContent).find(".enter-apply").keydown((event) =>{
			if(event.keyCode == keyboard["enter"]) {
				event.preventDefault();
				this.applyChanges();
			}
		});
	}
	beforeShow() {
		this.setHtml(this.renderPrimitiveListHtml());
		this.bindPrimitiveListEvents();
	}
}

class TimePlotDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Time Plot Properties");

		// set default plotPer
		let autoPlotPer = JSON.parse(this.primitive.getAttribute("AutoPlotPer"));
		if (autoPlotPer) {
			this.primitive.setAttribute("PlotPer", this.getDefaultPlotPeriod());
		}

		// For keeping track of what y-axis graph should be ploted ("L" or "R")
		this.sides = [];
	}
	
	getDisplayId(id, side) {
		id = id.toString();
		let index = this.displayIdList.indexOf(id)
		return (index != -1 && this.sides[index] === side);
	}
	
	removeIdToDisplay(id) {
		let idxToRemove = this.displayIdList.indexOf(id);
		if (idxToRemove !== -1) {
			this.displayIdList.splice(idxToRemove, 1);
			this.sides.splice(idxToRemove, 1);
		}
	}

	setIdsToDisplay(idList, sides) {
		this.displayIdList = [];
		this.sides = [];
		if (sides === undefined || sides.length !== idList.length) {
			for(let i in idList) {
				if (this.acceptsId(idList[i])) {
					this.displayIdList.push(idList[i]);
					this.sides.push("L");
				}
			}
		} else {
			for(let i in idList) {
				if (this.acceptsId(idList[i])) {
					this.displayIdList.push(idList[i]);
					this.sides.push(sides[i]);
				}
			}
		}
	}
	getIdsToDisplay() {
		return this.displayIdList;
	}
	getSidesToDisplay() {
		return this.sides;
	}
	renderAxisLabelsHtml() {
		let titleLabel = this.primitive.getAttribute("TitleLabel");
		let leftAxisLabel = this.primitive.getAttribute("LeftAxisLabel");
		let rightAxisLabel = this.primitive.getAttribute("RightAxisLabel");
		return (`
			<table class="modern-table">
				<tr>
					<th>Title:</th>
					<td style="padding:1px;">
						<input style="width: 150px; text-align: left;" class="title-label enter-apply" spellcheck="false" type="text" value="${titleLabel}">
					</td>
				</tr>
				<tr>
					<th>Left Label:</th>
					<td style="padding:1px;">
						<input style="width: 150px; text-align: left;" class="left-yaxis-label enter-apply" spellcheck="false" type="text" value="${leftAxisLabel}">
					</td>
				</tr>
				<tr>
					<th>Right Label:</th>
					<td style="padding:1px;">
						<input style="width: 150px; text-align: left;" class="right-yaxis-label enter-apply" spellcheck="false" type="text" value="${rightAxisLabel}">
					</td>
				</tr>
			</table>
		`);
	}
	renderAxisLimitsHTML() {
		let axis_limits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		let start_time = axis_limits.timeaxis.auto ? getTimeStart() : axis_limits.timeaxis.min;
		let end_time = axis_limits.timeaxis.auto ? getTimeStart()+getTimeLength() : axis_limits.timeaxis.max;
		return (`
		<table class="modern-table">
			<tr>
				<th>Axis</th>
				<th>Min</th>
				<th>Max</th>
				<th>Auto</th>
				<th>Log</th>
			</tr>
			<tr>
				<td style="text-align:center; padding:0px 6px">Time</td>
				<td style="padding:1px;">
					<input class="xaxis-min-field limit-input enter-apply" type="text" ${axis_limits.timeaxis.auto ? "disabled" : ""} value="${start_time}">
				</td>
				<td style="padding:1px;">
					<input class="xaxis-max-field limit-input enter-apply" type="text" ${axis_limits.timeaxis.auto ? "disabled" : ""} value="${end_time}">
				</td>
				<td>
					<input class="xaxis-auto-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(axis_limits.timeaxis.auto)}>
				</td>
				<td></td>
			</tr>
			<tr>
				<td style="text-align:center; padding:0px 6px">Left</td>
				<td style="padding:1px;">
					<input class="left-yaxis-min-field limit-input enter-apply" type="text" ${axis_limits.leftaxis.auto ? "disabled" : ""} value="${axis_limits.leftaxis.min}">
				</td>
				<td style="padding:1px;">
					<input class="left-yaxis-max-field limit-input enter-apply" type="text" ${axis_limits.leftaxis.auto ? "disabled" : ""} value="${axis_limits.leftaxis.max}">
				</td>
				<td>
					<input class="left-yaxis-auto-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(axis_limits.leftaxis.auto)}>
				</td>
				<td>
					<input class="left-log-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(this.primitive.getAttribute("LeftLogScale") === "true")}>
				</td>
			</tr>
			<tr>
				<td style="text-align:center; padding:0px 6px;">Right</td>
				<td style="padding:1px;">
					<input class="right-yaxis-min-field limit-input enter-apply" type="text" ${axis_limits.rightaxis.auto ? "disabled" : ""} value="${axis_limits.rightaxis.min}">
				</td>
				<td style="padding:1px;">
					<input class="right-yaxis-max-field limit-input enter-apply" type="text" ${axis_limits.rightaxis.auto ? "disabled" : ""} value="${axis_limits.rightaxis.max}">
				</td>
				<td>
					<input class="right-yaxis-auto-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(axis_limits.rightaxis.auto)}>
				</td>
				<td>
					<input class="right-log-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(this.primitive.getAttribute("RightLogScale") === "true")}>
				</td>
			</tr>
		</table>
		<div class="axis-limits-warning-div" style="color: red;"></div>
		`);
	}
	bindAxisLimitsEvents() {
		let axis_limits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		$(this.dialogContent).find("input[type='checkbox'].limit-input").change(event => {
			let xaxis_auto = $(this.dialogContent).find(".xaxis-auto-checkbox").prop("checked");
			$(this.dialogContent).find(".xaxis-min-field").prop("disabled", xaxis_auto);
			$(this.dialogContent).find(".xaxis-max-field").prop("disabled", xaxis_auto);
			$(this.dialogContent).find(".xaxis-min-field").val(xaxis_auto ? getTimeStart() : axis_limits.timeaxis.min);
			$(this.dialogContent).find(".xaxis-max-field").val(xaxis_auto ? getTimeStart()+getTimeLength() : axis_limits.timeaxis.max);

			let laxis_auto = $(this.dialogContent).find(".left-yaxis-auto-checkbox").prop("checked");
			$(this.dialogContent).find(".left-yaxis-min-field").prop("disabled", laxis_auto);
			$(this.dialogContent).find(".left-yaxis-max-field").prop("disabled", laxis_auto);
			$(this.dialogContent).find(".left-yaxis-min-field").val(axis_limits.leftaxis.min);
			$(this.dialogContent).find(".left-yaxis-max-field").val(axis_limits.leftaxis.max);

			let raxis_auto = $(this.dialogContent).find(".right-yaxis-auto-checkbox").prop("checked");
			$(this.dialogContent).find(".right-yaxis-min-field").prop("disabled", raxis_auto);
			$(this.dialogContent).find(".right-yaxis-max-field").prop("disabled", raxis_auto);
			$(this.dialogContent).find(".right-yaxis-min-field").val(axis_limits.rightaxis.min);
			$(this.dialogContent).find(".right-yaxis-max-field").val(axis_limits.rightaxis.max);
		});
		$(this.dialogContent).find("input[type='text'].limit-input").keyup(event => {
			// check if valid key and give warning 
			this.checkValidAxisLimits();
		});
	}
	checkValidAxisLimits() {
		let warning_div = $(this.dialogContent).find(".axis-limits-warning-div");
		let time_min = $(this.dialogContent).find(".xaxis-min-field").val();
		let time_max = $(this.dialogContent).find(".xaxis-max-field").val();
		let left_min = $(this.dialogContent).find(".left-yaxis-min-field").val();
		let left_max = $(this.dialogContent).find(".left-yaxis-max-field").val();
		let right_min = $(this.dialogContent).find(".right-yaxis-min-field").val();
		let right_max = $(this.dialogContent).find(".right-yaxis-max-field").val();
		if (isNaN(time_min) || isNaN(time_max) || isNaN(left_min) || isNaN(left_max) || isNaN(right_min) || isNaN(right_max) ) {
			warning_div.html("Axis limits must be numbers");
			return false;
		}
		warning_div.html("")
		return true;
	}
	applyAxisLimits() {
		if (this.checkValidAxisLimits()) {
			let axis_limits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
			axis_limits.timeaxis.auto = $(this.dialogContent).find(".xaxis-auto-checkbox").prop("checked");
			axis_limits.leftaxis.auto = $(this.dialogContent).find(".left-yaxis-auto-checkbox").prop("checked");
			axis_limits.rightaxis.auto = $(this.dialogContent).find(".right-yaxis-auto-checkbox").prop("checked");
			axis_limits.timeaxis.min = Number($(this.dialogContent).find(".xaxis-min-field").val());
			axis_limits.timeaxis.max = Number($(this.dialogContent).find(".xaxis-max-field").val());
			axis_limits.leftaxis.min = Number($(this.dialogContent).find(".left-yaxis-min-field").val());
			axis_limits.leftaxis.max = Number($(this.dialogContent).find(".left-yaxis-max-field").val());
			axis_limits.rightaxis.min = Number($(this.dialogContent).find(".right-yaxis-min-field").val());
			axis_limits.rightaxis.max = Number($(this.dialogContent).find(".right-yaxis-max-field").val());
			this.primitive.setAttribute("AxisLimits", JSON.stringify(axis_limits));
		}
	}
	renderPrimitiveListHtml() {
		// We store the selected variables inside the dialog
		// The dialog is owned by the table to which it belongs
		let primitives = this.getAcceptedPrimitiveList();
		let prims_object = { "Stock": [], "Flow": [], "Variable": [], "const": [], "Converter": [] };
		for (let p of primitives) {
			let nodeType = p.value.nodeName;
			if ( nodeType === "Variable" && p.getAttribute("isConstant") === "true") {
				prims_object["const"].push(p);
			} else {
				prims_object[nodeType].push(p);
			}
		}
		return (`
			<table class="modern-table">
			<tr>
				<th style="text-align: center;" >Primitives</th>
				<th>Left</th>
				<th>Right</th>
			</tr>
				${Object.keys(prims_object).map((type, type_idx) => 
					prims_object[type].map((p, idx) => `
						<tr style="${type_idx !== 0 && idx===0 ? "border-top: 5px solid #ddd": ""}">
							<td>${getName(p)}</td>
							<td style="text-align: center;">
								<input 
									class="primitive-checkbox enter-apply" 
									type="checkbox" 
									${checkedHtml(this.getDisplayId(getID(p), "L"))} 
									data-name="${getName(p)}" 
									data-id="${getID(p)}"
									data-side="L"
								>
							</td>
							<td style="text-align: center;">
								<input 
									class="primitive-checkbox enter-apply"
									type="checkbox"
									${checkedHtml(this.getDisplayId(getID(p), "R"))} 
									data-name="${getName(p)}" 
									data-id="${getID(p)}"
									data-side="R"
								>
							</td>
						</tr>
					`).join('')
				).join('')}
			</table>
		`);
	}
	bindPrimitiveListEvents() {
		$(this.dialogContent).find(".primitive-checkbox").click((event) => {
			let clickedElement = event.target;
			let side = $(clickedElement).attr("data-side");
			
			// Remove opposite checkmark
			let commonParent = $($($(clickedElement)[0].parentNode)[0].parentNode);
			if (side === "R") {
				$(commonParent[0].children[1].children[0]).removeAttr("checked");
			} else {
				$(commonParent[0].children[2].children[0]).removeAttr("checked");
			}
			
			this.subscribePool.publish("primitive check changed");
		});
		$(this.dialogContent).find(".enter-apply").keydown((event) =>{
			if(event.keyCode == keyboard["enter"]) {
				event.preventDefault();
				this.applyChanges();
			}
		});
	}
	makeApply() {
		super.makeApply();
		let titleLabel = removeSpacesAtEnd($(this.dialogContent).find(".title-label").val());
		let leftAxisLabel = removeSpacesAtEnd($(this.dialogContent).find(".left-yaxis-label").val());
		let rightAxisLabel = removeSpacesAtEnd($(this.dialogContent).find(".right-yaxis-label").val());
		
		this.primitive.setAttribute("TitleLabel", titleLabel);
		this.primitive.setAttribute("LeftAxisLabel", leftAxisLabel);
		this.primitive.setAttribute("RightAxisLabel", rightAxisLabel);

		this.applyLineOptions();
		this.applyPlotPer();
		this.applyAxisLimits();

		this.primitive.setAttribute("ColorFromPrimitive", $(this.dialogContent).find(".color-from-primitive-checkbox").prop("checked"));
		this.primitive.setAttribute("HasNumberedLines", $(this.dialogContent).find(".numbered-lines-checkbox").prop("checked"));
		this.primitive.setAttribute("LeftLogScale", $(this.dialogContent).find(".left-log-checkbox").prop("checked"));
		this.primitive.setAttribute("RightLogScale", $(this.dialogContent).find(".right-log-checkbox").prop("checked"));

		let primitiveCheckboxes = $(this.dialogContent).find(".primitive-checkbox");
		this.sides = [];
		this.displayIdList = [];
		for(let i = 0; i < primitiveCheckboxes.length; i++) {
			let box = primitiveCheckboxes[i];
			let id = box.getAttribute("data-id");
			let side = box.getAttribute("data-side");
			let name = box.getAttribute("data-name");
			if (box.checked) {
				this.displayIdList.push(id.toString());
				this.sides.push(side);
			}
		}
	}
	beforeShow() {
		// We store the selected variables inside the dialog
		// The dialog is owned by the table to which it belongs

		let contentHTML = `
			<div class="table">
				<div class="table-row">
					<div class="table-cell">
						${this.renderPrimitiveListHtml()}
					</div>
					
					<div class="table-cell">
						${this.renderPlotPerHtml()}
						<div class="vertical-space"></div>
						${this.renderAxisLimitsHTML()}
						<div class="vertical-space"></div>
						${this.renderAxisLabelsHtml()}
						<div class="vertical-space"></div>
						${this.renderLineOptionsHtml()}
						<div class="vertical-space"></div>
						${this.renderNumberedLinesCheckboxHtml()}
						<div class="vertical-space"></div>
						${this.renderColorCheckboxHtml()}
					</div>
				</div>
			</div>
		`;
		this.setHtml(contentHTML);
		
		this.bindPrimitiveListEvents();
		this.bindPlotPerEvents();
		this.bindAxisLimitsEvents();
	}
}

class ComparePlotDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Compare Simulations Plot Properties");
		
		// set default plotPer
		let autoPlotPer = JSON.parse(this.primitive.getAttribute("AutoPlotPer"));
		if (autoPlotPer) {
			this.primitive.setAttribute("PlotPer", this.getDefaultPlotPeriod());
		}

		this.keep = false;
		this.clear = false;
	}

	getDisplayId(id) {
		id = id.toString();
		let index = this.displayIdList.indexOf(id)
		return (index != -1);
	}
	
	setIdsToDisplay(idList) {
		this.displayIdList = [];
		for(let i in idList) {
			if (this.acceptsId(idList[i])) {
				this.displayIdList.push(idList[i]);
			}
		}
	}
	getIdsToDisplay() {
		return this.displayIdList;
	}
	renderKeepHtml() {
		return (`
			<table class="modern-table" style="width:100%; text-align:center;">
				<tr>
					<td style="width:50%">
						Keep Results <input type="checkbox" class="keep_checkbox enter-apply" ${checkedHtml(this.keep)}>
					</td>
					<td>
						<button class="clear-button enter-apply">Clear Results</button>
					</td>
				</tr>
			</table>
		`);
	}
	renderAxisLabelsHtml() {
		let titleLabel = this.primitive.getAttribute("TitleLabel");
		let leftAxisLabel = this.primitive.getAttribute("LeftAxisLabel");
		return (`
			<table class="modern-table">
				<tr>
					<th>Title:</th>
					<td style="padding:1px;">
						<input style="width: 160px; text-align: left;" class="title-label enter-apply" spellcheck="false" type="text" value="${titleLabel}">
					</td>
				</tr>
				<tr>
					<th>Y-axis Label:</th>
					<td style="padding:1px;">
						<input style="width: 160px; text-align: left;" class="left-yaxis-label enter-apply" spellcheck="false" type="text" value="${leftAxisLabel}">
					</td>
				</tr>
			</table>
		`);
	}
	renderAxisLimitsHTML() {
		let axis_limits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		let start_time = axis_limits.timeaxis.auto ? getTimeStart() : axis_limits.timeaxis.min;
		let end_time = axis_limits.timeaxis.auto ? getTimeStart()+getTimeLength() : axis_limits.timeaxis.max;
		return (`
		<table class="modern-table">
			<tr>
				<th>Axis</th>
				<th>Min</th>
				<th>Max</th>
				<th>Auto</th>
				<th>Log</th>
			</tr>
			<tr>
				<td style="text-align:center; padding:0px 6px">Time</td>
				<td style="padding:1px;">
					<input class="xaxis-min-field limit-input enter-apply" type="text" ${axis_limits.timeaxis.auto ? "disabled" : ""} value="${start_time}">
				</td>
				<td style="padding:1px;">
					<input class="xaxis-max-field limit-input enter-apply" type="text" ${axis_limits.timeaxis.auto ? "disabled" : ""} value="${end_time}">
				</td>
				<td>
					<input class="xaxis-auto-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(axis_limits.timeaxis.auto)}>
				</td>
				<td></td>
			</tr>
			<tr>
				<td style="text-align:center; padding:0px 6px">Y-Axis</td>
				<td style="padding:1px;">
					<input class="yaxis-min-field limit-input enter-apply" type="text" ${axis_limits.yaxis.auto ? "disabled" : ""} value="${axis_limits.yaxis.min}">
				</td>
				<td style="padding:1px;">
					<input class="yaxis-max-field limit-input enter-apply" type="text" ${axis_limits.yaxis.auto ? "disabled" : ""} value="${axis_limits.yaxis.max}">
				</td>
				<td>
					<input class="yaxis-auto-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(axis_limits.yaxis.auto)}>
				</td>
				<td>
					<input class="yaxis-log-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(this.primitive.getAttribute("YLogScale") === "true")}>
				</td>
			</tr>
		</table>
		<div class="axis-limits-warning-div" style="color:red;"></div>
		`);
	}
	bindAxisLimitsEvents() {
		let axis_limits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		$(this.dialogContent).find("input[type='checkbox'].limit-input").change(event => {
			let xaxis_auto = $(this.dialogContent).find(".xaxis-auto-checkbox").prop("checked");
			$(this.dialogContent).find(".xaxis-min-field").prop("disabled", xaxis_auto);
			$(this.dialogContent).find(".xaxis-max-field").prop("disabled", xaxis_auto);
			$(this.dialogContent).find(".xaxis-min-field").val(xaxis_auto ? getTimeStart() : axis_limits.timeaxis.min);
			$(this.dialogContent).find(".xaxis-max-field").val(xaxis_auto ? getTimeStart()+getTimeLength() : axis_limits.timeaxis.max);

			let yaxis_auto = $(this.dialogContent).find(".yaxis-auto-checkbox").prop("checked");
			$(this.dialogContent).find(".yaxis-min-field").prop("disabled", yaxis_auto);
			$(this.dialogContent).find(".yaxis-max-field").prop("disabled", yaxis_auto);
			$(this.dialogContent).find(".yaxis-min-field").val(axis_limits.yaxis.min);
			$(this.dialogContent).find(".yaxis-max-field").val(axis_limits.yaxis.max);
		});
		$(this.dialogContent).find("input[type='text'].limit-input").keyup(event => {
			this.checkValidAxisLimits();
		});
	}
	checkValidAxisLimits() {
		let warning_div = $(this.dialogContent).find(".axis-limits-warning-div");
		let time_min = $(this.dialogContent).find(".xaxis-min-field").val();
		let time_max = $(this.dialogContent).find(".xaxis-max-field").val();
		let y_min = $(this.dialogContent).find(".yaxis-min-field").val();
		let y_max = $(this.dialogContent).find(".yaxis-max-field").val();
		if (isNaN(time_min) || isNaN(time_max) || isNaN(y_min) || isNaN(y_max)) {
			warning_div.html("Axis limits must be numbers");
			return false;
		}
		warning_div.html("");
		return true;
	}
	applyAxisLimits() {
		if (this.checkValidAxisLimits()) {
			let axis_limits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
			axis_limits.timeaxis.auto = $(this.dialogContent).find(".xaxis-auto-checkbox").prop("checked");
			axis_limits.timeaxis.min = Number($(this.dialogContent).find(".xaxis-min-field").val());
			axis_limits.timeaxis.max = Number($(this.dialogContent).find(".xaxis-max-field").val());
			axis_limits.yaxis.auto = $(this.dialogContent).find(".yaxis-auto-checkbox").prop("checked");
			axis_limits.yaxis.min = Number($(this.dialogContent).find(".yaxis-min-field").val());
			axis_limits.yaxis.max = Number($(this.dialogContent).find(".yaxis-max-field").val());
			this.primitive.setAttribute("AxisLimits", JSON.stringify(axis_limits));
		}
	}
	bindPrimitiveListEvents() {
		$(this.dialogContent).find(".primitive-checkbox").click((event) => {
			this.subscribePool.publish("primitive check changed");
		});
		$(this.dialogContent).find(".enter-apply").keydown((event) =>{
			if(event.keyCode == keyboard["enter"]) {
				event.preventDefault();
				this.applyChanges();
			}
		});
		$(this.dialogContent).find(".clear-button").click((event) => {
			this.clear = true;
		});
	}
	makeApply() {
		let titleLabel = removeSpacesAtEnd($(this.dialogContent).find(".title-label").val());
		let leftAxisLabel = removeSpacesAtEnd($(this.dialogContent).find(".left-yaxis-label").val());

		this.primitive.setAttribute("TitleLabel", titleLabel);
		this.primitive.setAttribute("LeftAxisLabel", leftAxisLabel);

		this.applyLineOptions();
		this.applyAxisLimits();
		this.applyPlotPer();

		this.primitive.setAttribute("ColorFromPrimitive", $(this.dialogContent).find(".color-from-primitive-checkbox").prop("checked"));
		this.primitive.setAttribute("HasNumberedLines", $(this.dialogContent).find(".numbered-lines-checkbox").prop("checked"));
		this.primitive.setAttribute("YLogScale", $(this.dialogContent).find(".yaxis-log-checkbox").prop("checked"));

		this.keep =  $(this.dialogContent).find(".keep_checkbox")[0].checked;

		let primitiveCheckboxes = $(this.dialogContent).find(".primitive-checkbox");
		this.displayIdList = [];
		for(let i = 0; i < primitiveCheckboxes.length; i++) {
			let box = primitiveCheckboxes[i];
			let id = box.getAttribute("data-id");
			let name = box.getAttribute("data-name");
			if (box.checked) {
				this.displayIdList.push(id.toString());
			}
		}
	}
	beforeShow() {
		// We store the selected variables inside the dialog
		// The dialog is owned by the table to which it belongs
		let contentHTML = `
			<div class="table">
				<div class="table-row">
					<div class="table-cell">
						${this.renderPrimitiveListHtml()}
					</div>
					<div class="table-cell">
						${this.renderKeepHtml()}
						<div class="vertical-space"></div>
						${this.renderPlotPerHtml()}
						<div class="vertical-space"></div>
						${this.renderAxisLimitsHTML()}
						<div class="vertical-space"></div>
						${this.renderAxisLabelsHtml()}
						<div class="vertical-space"></div>
						${this.renderLineOptionsHtml()}
						<div class="vertical-space"></div>
						${this.renderNumberedLinesCheckboxHtml()}
						<div class="vertical-space"></div>
						${this.renderColorCheckboxHtml()}
					</div>
				</div>
			</div>
		`;
		this.setHtml(contentHTML);
		
		this.bindPrimitiveListEvents();
		this.bindAxisLimitsEvents();
		this.bindPlotPerEvents();
	}
}


class HistoPlotDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Histogram Plot Properties");
	}
	renderHistogramOptionsHtml() {
		return(`
			<table class="modern-table">
				<tr>
					<th></th>
					<th>Value</th>
					<th>Auto</th>
				</tr>
				<tr>
					<td>Upper bound</td>
					<td><input class="upper-bound-field enter-apply" type="text"/></td>
					<td><input class="upper-bound-auto-checkbox enter-apply" type="checkbox" ></td>
				</tr>
				<tr>
					<td>Lower bound</td>
					<td><input class="lower-bound-field enter-apply" type="text"/></td>
					<td><input class="lower-bound-auto-checkbox enter-apply" type="checkbox"></td>
				</tr>
				<tr>
					<td>No. Bars</td>
					<td><input class="num-bars-field enter-apply" type="text"/></td>
					<td><input class="num-bars-auto-checkbox enter-apply" type="checkbox"></td>
				</tr>
			</table>
		`);
	}
	histogramOptionsBeforeShow() {

		let bindAndSetValue = (checkboxTag, fieldTag, attributeName) => {
			// set values at start 
			$(this.dialogContent).find(fieldTag).prop("value", this.primitive.getAttribute(attributeName));
			let auto = (this.primitive.getAttribute(`${attributeName}Auto`) === "true");
			$(this.dialogContent).find(checkboxTag).prop("checked", auto);
			$(this.dialogContent).find(fieldTag).prop("disabled", auto);
			
			// bind checkbox click
			$(this.dialogContent).find(checkboxTag).click((event) => {
				$(this.dialogContent).find(fieldTag).prop("disabled", $(event.target).prop("checked"));
			});
		}

		bindAndSetValue(".upper-bound-auto-checkbox", ".upper-bound-field", "UpperBound");
		bindAndSetValue(".lower-bound-auto-checkbox", ".lower-bound-field", "LowerBound");
		bindAndSetValue(".num-bars-auto-checkbox", ".num-bars-field", "NumberOfBars");
	}
	renderHistOrPDFHtml() {
		return (`
			<table class="modern-table">
				<tr>
					<td>
					<b>Type:</b>
						<select class="scale-type enter-apply">
							<option ${this.primitive.getAttribute("ScaleType") === "Histogram" ? "selected": ""} value="Histogram" >Histogram</option>
							<option ${this.primitive.getAttribute("ScaleType") === "PDF" ? "selected": ""} value="PDF" >P.D.F</option>
						</select>
					</td>
				</tr>
			</table>
		`);
	}
	beforeShow() {
		this.setHtml(`
			<div class="table">
				<div class="table-row">
					<div class="table-cell">
						${this.renderPrimitiveListHtml()}
					</div>
					<div class="table-cell">
						${this.renderHistogramOptionsHtml()}
						<div class="vertical-space"></div>
						${this.renderHistOrPDFHtml()}
					</div>
				</div>
			</div>`
		);
		this.bindPrimitiveListEvents();

		this.histogramOptionsBeforeShow();
	}
	makeApply() {
		super.makeApply();
		this.primitive.setAttribute("Primitives", this.getIdsToDisplay().join(","));
		this.primitive.setAttribute("ScaleType", $(this.dialogContent).find(".scale-type :selected").val());
		let upperBoundAuto = $(this.dialogContent).find(".upper-bound-auto-checkbox").prop("checked");
		let lowerBoundAuto = $(this.dialogContent).find(".lower-bound-auto-checkbox").prop("checked");
		let numBarsAuto = $(this.dialogContent).find(".num-bars-auto-checkbox").prop("checked");
		let upperBound = $(this.dialogContent).find(".upper-bound-field").val();
		let lowerBound = $(this.dialogContent).find(".lower-bound-field").val();
		let numBars = $(this.dialogContent).find(".num-bars-field").val();
		
		this.primitive.setAttribute("UpperBoundAuto", upperBoundAuto);
		this.primitive.setAttribute("LowerBoundAuto", lowerBoundAuto);
		this.primitive.setAttribute("NumberOfBarsAuto", numBarsAuto);

		if ( ! upperBoundAuto && ! isNaN(upperBound) && ! isNaN(lowerBound) && Number(lowerBound) < Number(upperBound) ) {
			this.primitive.setAttribute("UpperBound", upperBound);
		}

		if ( ! lowerBoundAuto && ! isNaN(lowerBound) && ! isNaN(upperBound) && Number(lowerBound) < Number(upperBound) ) {
			this.primitive.setAttribute("LowerBound", lowerBound);
		}
		
		if ( ! numBarsAuto && ! isNaN(numBars) && numBars > 0) {
			this.primitive.setAttribute("NumberOfBars", numBars);
		}
	}
}

class XyPlotDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("XY Plot Properties");

		// set default plotPer
		let autoPlotPer = JSON.parse(this.primitive.getAttribute("AutoPlotPer"));
		if (autoPlotPer) {
			this.primitive.setAttribute("PlotPer", this.getDefaultPlotPeriod());
		}

	}
	renderAxisLimitsHTML() {
		let axis_limits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		return (`
		<table class="modern-table">
			<tr>
				<th></th>
				<th>Min</th>
				<th>Max</th>
				<th>Auto</th>
				<th>Log</th>
			</tr>
			<tr>
				<td>X-axis</td>
				<td style="padding:1px;">
					<input class="xaxis-min-field limit-input enter-apply" type="text" ${axis_limits.xaxis.auto ? "disabled" : ""} value="${axis_limits.xaxis.min}">
				</td>
				<td style="padding:1px;">
					<input class="xaxis-max-field limit-input enter-apply" type="text" ${axis_limits.xaxis.auto ? "disabled" : ""} value="${axis_limits.xaxis.max}">
				</td>
				<td>
					<input class="xaxis-auto-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(axis_limits.xaxis.auto)}>
				</td>
				<td>
					<input class="xaxis-log-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(this.primitive.getAttribute("XLogScale") === "true")}>
				</td>
			</tr>
			<tr>
				<td>Y-axis</td>
				<td style="padding:1px;">
					<input class="yaxis-min-field limit-input enter-apply" type="text" ${axis_limits.yaxis.auto ? "disabled" : ""} value="${axis_limits.yaxis.min}">
				</td>
				<td style="padding:1px;">
					<input class="yaxis-max-field limit-input enter-apply" type="text" ${axis_limits.yaxis.auto ? "disabled" : ""} value="${axis_limits.yaxis.max}">
				</td>
				<td>
					<input class="yaxis-auto-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(axis_limits.yaxis.auto)}>
				</td>
				<td>
					<input class="yaxis-log-checkbox limit-input enter-apply" type="checkbox" ${checkedHtml(this.primitive.getAttribute("YLogScale") === "true")}>
				</td>
			</tr>
		</table>
		<div class="axis-limits-warning-div" style="color:red;"></div>
		`);
	}
	bindAxisLimitsEvents() {
		let axis_limits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
		$(this.dialogContent).find("input[type='checkbox'].limit-input").change(event => {
			let xaxis_auto = $(this.dialogContent).find(".xaxis-auto-checkbox").prop("checked");
			$(this.dialogContent).find(".xaxis-min-field").prop("disabled", xaxis_auto);
			$(this.dialogContent).find(".xaxis-max-field").prop("disabled", xaxis_auto);
			$(this.dialogContent).find(".xaxis-min-field").val(axis_limits.xaxis.min);
			$(this.dialogContent).find(".xaxis-max-field").val(axis_limits.xaxis.max);

			let yaxis_auto = $(this.dialogContent).find(".yaxis-auto-checkbox").prop("checked");
			$(this.dialogContent).find(".yaxis-min-field").prop("disabled", yaxis_auto);
			$(this.dialogContent).find(".yaxis-max-field").prop("disabled", yaxis_auto);
			$(this.dialogContent).find(".yaxis-min-field").val(axis_limits.yaxis.min);
			$(this.dialogContent).find(".yaxis-max-field").val(axis_limits.yaxis.max);
		});
		$(this.dialogContent).find("input[type='text'].limit-input").keyup(event => {
			this.checkValidAxisLimits();
		});
	}
	checkValidAxisLimits() { 
		let warning_div = $(this.dialogContent).find(".axis-limits-warning-div");
		let x_min = $(this.dialogContent).find(".xaxis-min-field").val();
		let x_max = $(this.dialogContent).find(".xaxis-max-field").val();
		let y_min = $(this.dialogContent).find(".yaxis-min-field").val();
		let y_max = $(this.dialogContent).find(".yaxis-max-field").val();
		if (isNaN(x_min) || isNaN(x_max) || isNaN(y_min) || isNaN(y_max)) {
			warning_div.html("Axis limits must be numbers");
			return false;
		}
		warning_div.html("");
		return true;
	}
	applyAxisLimits() {
		if (this.checkValidAxisLimits()) {
			let axis_limits = JSON.parse(this.primitive.getAttribute("AxisLimits"));
			axis_limits.xaxis.auto = $(this.dialogContent).find(".xaxis-auto-checkbox").prop("checked");
			axis_limits.xaxis.min = Number($(this.dialogContent).find(".xaxis-min-field").val());
			axis_limits.xaxis.max = Number($(this.dialogContent).find(".xaxis-max-field").val());
			axis_limits.yaxis.auto = $(this.dialogContent).find(".yaxis-auto-checkbox").prop("checked");
			axis_limits.yaxis.min = Number($(this.dialogContent).find(".yaxis-min-field").val());
			axis_limits.yaxis.max = Number($(this.dialogContent).find(".yaxis-max-field").val());
			this.primitive.setAttribute("AxisLimits", JSON.stringify(axis_limits));
		}
	}

	renderMarkerHTML() {
		return (`
			<table class="modern-table" style="text-align: left;">
				<tr>
					<td style="text-align: left">Show Line</td>	
					<td><input class="line enter-apply" type="checkbox" ${checkedHtml(JSON.parse(this.primitive.getAttribute("ShowLine")))}></td>
				</tr>
				<tr>
					<td style="text-align: left">Show Markers</td>
					<td><input class="markers enter-apply" type="checkbox" ${checkedHtml(JSON.parse(this.primitive.getAttribute("ShowMarker")))}></td>
				</tr>
				<tr>
					<td style="text-align: left">Mark Start (🔴)</td>
					<td><input class="mark-start enter-apply" type="checkbox" ${checkedHtml(JSON.parse(this.primitive.getAttribute("MarkStart")))}></td>
				</tr>
				<tr>
					<td style="text-align: left" >Mark End (🟩)</td>
					<td><input class="mark-end enter-apply" type="checkbox" ${checkedHtml(JSON.parse(this.primitive.getAttribute("MarkEnd")))}></td>
				</tr>
			</table>
		`);
	}

	renderTitleHtml() {
		let title = this.primitive.getAttribute("TitleLabel");
		title = (title !== null ? title : "");
		return (
			`<table class="modern-table">
				<tr>
					<th>Title:</th>
					<td style="padding:1px;">
						<input style="width: 150px; text-align: left;" class="title-label enter-apply" spellcheck="false" type="text" value="${title}">
					</td>
				</tr>
			</table>`
		);
	}

	beforeShow() {
		// We store the selected variables inside the dialog
		// The dialog is owned by the table to which it belongs
		let contentHTML = `
			<div class="table">
				<div class="table-row">
					<div class="table-cell">
						${this.renderPrimitiveListHtml()}
					</div>
					<div class="table-cell">
						${this.renderPlotPerHtml()}
						<div class="vertical-space"></div>
						${this.renderAxisLimitsHTML()}
						<div class="vertical-space"></div>
						${this.renderMarkerHTML()} 
						<div class="vertical-space"></div>
						${this.renderTitleHtml()}
						<div class="vertical-space"></div>
						${this.renderLineWidthOptionHtml()}
					</div>
				</div>
			</div>
		`;
		this.setHtml(contentHTML);
		
		this.bindPrimitiveListEvents();
		this.bindAxisLimitsEvents();
		this.bindPlotPerEvents();
		this.bindMarkersHTML();
	}

	bindMarkersHTML() {
		$(this.dialogContent).find(".line").change((event) => {
			this.primitive.setAttribute("ShowLine", event.target.checked);
		});
		$(this.dialogContent).find(".markers").change((event) => {
			this.primitive.setAttribute("ShowMarker", event.target.checked);
		});
		$(this.dialogContent).find(".mark-start").change((event) => {
			this.primitive.setAttribute("MarkStart", event.target.checked);
		});
		$(this.dialogContent).find(".mark-end").change((event) => {
			this.primitive.setAttribute("MarkEnd", event.target.checked);
		});
	}

	makeApply() {
		this.primitive.setAttribute("LineWidth", $(this.dialogContent).find(".line-width :selected").val());
		this.primitive.setAttribute("TitleLabel", $(this.dialogContent).find(".title-label").val());
		this.primitive.setAttribute("XLogScale", $(this.dialogContent).find(".xaxis-log-checkbox").prop("checked"));
		this.primitive.setAttribute("YLogScale", $(this.dialogContent).find(".yaxis-log-checkbox").prop("checked"));
		this.applyAxisLimits();
		this.applyPlotPer();
	}

	getDefaultPlotPeriod() {
		return getTimeStep();
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
		let str = "Time"+seperator;
		for (let i = 0; i < this.namesToDisplay.length; i++) {
			let name = this.namesToDisplay[i]; 
			str += `${name}`;
			if (i != this.namesToDisplay.length-1) {
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
				if (i != row.length-1) {
					str += seperator;
				}
			}
			str += "\n";
		}
		return str;
		
	}
}

class TableDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Table Properties");
		
		let limits = JSON.parse(this.primitive.getAttribute("TableLimits"));
		if (limits.start.auto) {
			limits.start.value = getTimeStart();
		}
		if (limits.end.auto) {
			limits.end.value = getTimeStart() + getTimeLength();
		}
		if (limits.step.auto) {
			limits.end.value = this.getDefaultPlotPeriod();
		}
		this.primitive.setAttribute("TableLimits", JSON.stringify(limits));
		this.data = null;
	}
	renderTableLimitsHTML() {
		let limits = JSON.parse(this.primitive.getAttribute("TableLimits"));
		return (`
		<table class="modern-table">
			<tr>
				<th class="text">From</th>
				<td style="padding:1px;">
					<input class="limit-input start-field enter-apply" ${limits.start.auto ? "disabled" : ""} value="${limits.start.value}" type="text">
				</td>
				<td>Auto <input class="limit-input start-auto-checkbox enter-apply" type="checkbox"  ${checkedHtml(limits.start.auto)}/></td>
			</tr><tr>
				<th class="text">To</th>
				<td style="padding:1px;">
					<input class="limit-input end-field enter-apply" ${limits.end.auto ? "disabled" : ""} value="${limits.end.value}" type="text">
				</td>
				<td>Auto <input class="limit-input end-auto-checkbox enter-apply" type="checkbox" ${checkedHtml(limits.end.auto)}/>
				</td>
			</tr><tr title="Step &#8805; DT should hold">
				<th class="text">Step</th>
				<td style="padding:1px;">
					<input class="limit-input step-field enter-apply" ${limits.step.auto ? "disabled" : ""} value="${limits.step.value}" type="text">
				</td>
				<td>Auto <input class="limit-input step-auto-checkbox enter-apply" type="checkbox" ${checkedHtml(limits.step.auto)}/></td>
			</tr>
		</table>
		<div class="limits-warning-div" style="color:red;"></div>
		`);
	}
	bindTableLimitsEvents() {
		let limits = JSON.parse(this.primitive.getAttribute("TableLimits"));
		$(this.dialogContent).find(".start-auto-checkbox").change(event => {
			let start_auto = $(event.target).prop("checked");
			$(this.dialogContent).find(".start-field").prop("disabled", start_auto);
			$(this.dialogContent).find(".start-field").val(start_auto ? getTimeStart() : limits.start.value);
		});
		$(this.dialogContent).find(".end-auto-checkbox").change(event => {
			let end_auto = $(event.target).prop("checked");
			$(this.dialogContent).find(".end-field").prop("disabled", end_auto);
			$(this.dialogContent).find(".end-field").val(end_auto ? getTimeStart()+getTimeLength() : limits.end.value);
		});
		$(this.dialogContent).find(".step-auto-checkbox").change(event => {
			let step_auto = $(event.target).prop("checked");
			$(this.dialogContent).find(".step-field").prop("disabled", step_auto);
			$(this.dialogContent).find(".step-field").val(step_auto ? getTimeStep() : limits.step.value);
		});
		$(this.dialogContent).find("input[type='text'].limit-input").keyup(event => {
			this.checkValidTableLimits();
		});
	}
	checkValidTableLimits() {
		let warning_div = $(this.dialogContent).find(".limits-warning-div");
		let start_str = $(this.dialogContent).find(".start-field").val();
		let end_str = $(this.dialogContent).find(".end-field").val();
		let step_str = $(this.dialogContent).find(".step-field").val();
		if (isNaN(start_str) || start_str === "") {
			warning_div.html('"From" must be a number');
			return false;
		} else if (isNaN(end_str) || start_str === "") {
			warning_div.html('"To" must be a number');
			return false;
		} else if (isNaN(step_str) || step_str === "") {
			warning_div.html("Step must be a number");
			return false;
		} else if (Number(step_str) <= 0) {
			warning_div.html("Step must be &gt;0");
			return false;
		} 
		warning_div.html("");
		return true;
	}
	applyAxisLimits() {
		if (this.checkValidTableLimits()) {
			let limits = JSON.parse(this.primitive.getAttribute("TableLimits"));

			limits.start.value = Number($(this.dialogContent).find(".start-field").val());
			limits.end.value = Number($(this.dialogContent).find(".end-field").val());
			limits.step.value = Number($(this.dialogContent).find(".step-field").val());

			limits.start.auto = $(this.dialogContent).find(".start-auto-checkbox").prop("checked");
			limits.end.auto = $(this.dialogContent).find(".end-auto-checkbox").prop("checked");
			limits.step.auto = $(this.dialogContent).find(".step-auto-checkbox").prop("checked");
			this.primitive.setAttribute("TableLimits", JSON.stringify(limits));
		}
	}
	renderExportHtml() {
		return (`
			<table class="modern-table">
				<tr>
					<td>
						<button class="exportCSV">
							Export Table (CSV)
						</button>
					</td>
				</tr>
				<tr>
					<td>
						<button class="exportTSV">
							Export Table (TSV)
						</button>
					</td>
				</tr>
			</table>
		`);
		
	}
	beforeShow() {
		// We store the selected variables inside the dialog
		// The dialog is owned by the table to which it belongs
		let primitives = this.getAcceptedPrimitiveList();
		this.setHtml(`
			<div class="table">
				<div class="table-row">
					<div class="table-cell">
						${this.renderPrimitiveListHtml()}
					</div>
					<div class="table-cell">
						${this.renderTableLimitsHTML()}
						<div class="vertical-space"></div>
						${this.renderRoundToZeroHtml()}
						<div class="vertical-space"></div>
						${this.renderExportHtml()}
					</div>
				</div>
			</div>
		`);

		this.roundToZeroBeforeShow();
		this.bindPrimitiveListEvents();
		this.bindTableLimitsEvents();
		
		$(this.dialogContent).find(".exportCSV").click(event => {
			if (this.data) {
				this.data.exportCSV();
			}
		});

		$(this.dialogContent).find(".exportTSV").click(event => {
			if (this.data) {
				this.data.exportTSV();
			}
		});
	}
	makeApply() {
		this.applyAxisLimits();
		this.roundToZeroMakeApply();
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
		<table class="modern-table">
		<tr>
			<td>Time units</td>
			<td style="padding:1px;">
				<input class="input-timeunits enter-apply text-input" name="length" style="width:100px;" value="" type="text">
				<!--
				<button class="input-timeunits-default-value" data-default-value="Years">Years</button>
				<button class="input-timeunits-default-value" data-default-value="Minutes">Minutes</button>
				-->
			</td>
		</tr>
		</table>
	`);
		$(this.dialogContent).find(".enter-apply").keydown((event) =>{
			if(event.keyCode == keyboard["enter"]) {
				event.preventDefault();
				this.applyChanges();
			}
		});
		$(this.dialogContent).find(".input-timeunits-default-value").click((event) => {
			let selectedUnit = $(event.target).data("default-value");
			$(this.dialogContent).find(".input-timeunits").val(selectedUnit);
			this.makeApply();
		});
	}
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			"Create":() =>
			{
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
		let timeUnits =$(this.dialogContent).find(".input-timeunits").val();
		if(!isTimeUnitOk(timeUnits.trim())) {
			xAlert("You have to enter a time unit for the model, e.g. Years or Minutes");
			return;
		}
		setTimeUnits(timeUnits);
		updateTimeUnitButton();

		$(this.dialog).dialog('close');
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
		<table class="modern-table">
		<tr>
			<td>Start Time</td>
			<td style="padding:1px;">
				<input class="input-start enter-apply" name="start" style="width:100px;" value="${start}" type="text">
				&nbsp ${timeUnit} &nbsp
			</td>
		</tr><tr>
			<td>Length</td>
			<td style="padding:1px;">
				<input class="input-length enter-apply" name="length" style="width:100px;" value="${length}" type="text">
				&nbsp ${timeUnit} &nbsp
			</td>
		</tr><tr>
			<td>Time Step</td>
			<td style="padding:1px;">
				<input class="input-step enter-apply" name="step" style="width:100px;" value="${step}" type="text">
				&nbsp ${timeUnit} &nbsp
			</td>
		</tr><tr>
			<td>Method</td>
			<td style="padding:1px;"><select class="input-method enter-apply" style="width:104px">
			<option value="RK1" ${(getAlgorithm() == "RK1") ? "selected": ""}>Euler</option>
			<option value="RK4" ${(getAlgorithm() == "RK4") ? "selected": ""}>RK4</option>
			</select></td>
		</tr>
		</table>
		<div class="simulation-settings-warning"></div>
		`);
		$(this.dialogContent).find(".enter-apply").keydown((event) =>{
			if(event.keyCode == keyboard["enter"]) {
				event.preventDefault();
				this.applyChanges();
			}
		});

		this.start_field = $(this.dialogContent).find(".input-start");
		this.length_field = $(this.dialogContent).find(".input-length");
		this.step_field = $(this.dialogContent).find(".input-step");
		this.warning_div = $(this.dialogContent).find(".simulation-settings-warning");

		this.start_field.keyup((event) => this.checkValidTimeSettings());
		this.length_field.keyup((event) => this.checkValidTimeSettings());
		this.step_field.keyup((event) => this.checkValidTimeSettings());
	}

	checkValidTimeSettings() {
		if (isNaN(this.start_field.val()) || this.start_field.val() === "") {
			this.warning_div.html(`Start <b>${this.start_field.val()}</b> is not a number.`);
			return false;
		} else if (isNaN(this.length_field.val()) || this.length_field.val() === "") {
			this.warning_div.html(`Length <b>${this.length_field.val()}</b> is not a number.`);
			return false;
		} else if (isNaN(this.step_field.val()) || this.step_field.val() === "") {
			this.warning_div.html(`Step <b>${this.step_field.val()}</b> is not a number.`);
			return false;
		} else if (Number(this.length_field.val()) <= 0) {
			this.warning_div.html(`Length must be &gt;0`);
			return false;
		} else if (Number(this.step_field.val()) <= 0) {
			this.warning_div.html(`Step must be &gt;0`);
			return false;
		} else if(Number(this.length_field.val())/Number(this.step_field.val()) > 1e7) {
			let iterations = Math.ceil(Number(this.length_field.val())/Number(this.step_field.val()));
			let iters_str = format_number(iterations, {use_e_format_upper_limit: 1e7, precision: 3});
			this.warning_div.html(`
				This requires ${iters_str} time steps. <br/>
				Limit of 10<sup>7</sup> time steps per simulation.`);
			return false;
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
				Time Unit: 
				<input class="timeunit-field enter-apply" style="text-align: left; width:200px;" type="text"/>
				<div style="margin-top: 4px;" class="complain-div"></div>
			</div>
		`);	

		$(this.dialogContent).find(".timeunit-field").keyup((event) => {
			this.showComplain(this.checkValid());
		});
		$(this.dialogContent).find(".enter-apply").keydown((event) => {
			if (! event.shiftKey) {
				if (event.keyCode == keyboard["enter"]) {
					event.preventDefault();
					this.dialogParameters.buttons["Apply"]();
				}
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
			complainDiv.html(`<span style="color:red;">Time Unit must contain character A-Z or a-z.</span>`);
		}
	}
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			"Apply":(event) =>
			{	
				if (this.checkValid()) {
					let timeUnit = $(this.dialogContent).find(".timeunit-field").val(); 
					setTimeUnits(timeUnit);
					$(this.dialog).dialog('close');
					$("#timeUnitParagraph").html(`Time Unit: ${timeUnit}`);
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
			<table class="modern-table">
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
			<table class="modern-table">
				<tr>
					<td>Arrow head at start point:</td>
					<td><input class="arrow-start-checkbox" type="checkbox" ${checkedHtml(arrowStart)} /></td>
				</tr>
				<tr>
					<td>Arrow head at end point:</td>
					<td><input class="arrow-end-checkbox" type="checkbox" ${checkedHtml(arrowEnd)} /></td>
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
	}
	makeApply() {
		this.primitive.setAttribute("ArrowHeadStart", $(this.dialogContent).find(".arrow-start-checkbox").prop("checked"));
		this.primitive.setAttribute("ArrowHeadEnd", $(this.dialogContent).find(".arrow-end-checkbox").prop("checked"));
		super.makeApply();
	}
}

class NumberboxDialog extends DisplayDialog {

	beforeShow() {
		this.setTitle("Number Box Properties");
		this.targetPrimitive = findID(this.primitive.getAttribute("Target"));
		if (this.targetPrimitive) {
			let primitiveName = makePrimitiveName(getName(this.targetPrimitive));
			this.setHtml(`
				<div>
					<p>Value of ${primitiveName}</p>
					${this.renderRoundToZeroHtml()}
				</div>
			`);
			this.roundToZeroBeforeShow();
		} else {
			this.setHtml(`
				Target primitive not found
			`);	
		}
	}

	makeApply() {
		this.roundToZeroMakeApply();
	}
}

class ConverterDialog extends jqDialog {
	constructor() {
		super();
		this.setHtml(`
			<div class="primitive-settings" style="padding: 10px 0px">
				Name:<br/>
				<input class="name-field text-input" style="width: 100%;" type="text" value=""><br/><br/>
				Definition:<br/>
				<textarea class="value-field" style="font-family:monospace; width: 300px; height: 80px;"></textarea>
				<p class="in-link" style="font-weight:bold; margin:5px 0px">Ingoing Link </p>
				<div style="background-color: grey; width:100%; height: 1px; margin: 10px 0px;"></div>
				<p style="color:grey; margin:5px 0px">
					<b>Definition:</b></br>
					&nbsp &nbsp x1,y1; x2,y2; ...; xn,yn</br>
					</br>
					<b>Example:</b></br>
					&nbsp &nbsp 0,0; 1,1; 2,4; 3,9 
				</p>
			</div>
		`);
		this.inLinkParagraph = $(this.dialogContent).find(".inLink").get(0);
		this.valueField = $(this.dialogContent).find(".value-field").get(0);
		$(this.valueField).keydown((event) => {
			if (! event.shiftKey) {
				if (event.keyCode == keyboard["enter"]) {
					this.applyChanges();
				}
			}
		});
		this.nameField = $(this.dialogContent).find(".name-field").get(0);
		$(this.nameField).keydown((event) => {
			if (event.keyCode == keyboard["enter"]) {
				this.applyChanges();
			}
		});
	}
	open(id,defaultFocusSelector = null) {
		if (jqDialog.blockingDialogOpen) {
			// We can't open a new dialog while one is already open
			return;
		}
		this.primitive = findID(id);
		if (this.primitive == null) {
			alert("Primitive with id "+id+" does not exist");
			return;
		}
		this.show();
		let linkedIn = findLinkedInPrimitives(id);
		if (linkedIn.length === 1) {
			this.inLinkParagraph.innerHTML = `Ingoing Link: ${getName(linkedIn[0])}`;
		} else if(linkedIn.length === 0) {
			this.inLinkParagraph.innerHTML = `<span style="color:red;">No Ingoing Link<span>`;
		} else {
			this.inLinkParagraph.innerHTML = `<span style="color:red;">More Then One Ingoing Link<span>`;
		}
		
		this.defaultFocusSelector = defaultFocusSelector;
		
		let oldValue = getValue(this.primitive);
		oldValue = oldValue.replace(/\\n/g, "\n");
		
		let oldName = getName(this.primitive);
		let oldNameBrackets = makePrimitiveName(oldName);
		
		this.setTitle(`${oldNameBrackets} properties`);

		$(this.nameField).val(oldNameBrackets);
		$(this.valueField).val(oldValue);
		
		if (this.defaultFocusSelector) {
			let valueFieldDom = $(this.dialogContent).find(this.defaultFocusSelector).get(0);
			valueFieldDom.focus();
		}
	}
	afterShow() {
		let field = $(this.dialogContent).find(".text-input").get(0);
		let inputLength = field.value.length;  
		field.setSelectionRange(0, inputLength);
	}
	makeApply() {
		if (this.primitive) {
			// Handle value
			let value = $(this.valueField).val();
			setValue2(this.primitive,value);
			
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
	log += global_log+"<br/>";
	$(".log").html(log);
}

function do_global_log(line) {
	global_log = line+"; "+(new Date()).getMilliseconds()+"<br/>"+global_log;
	global_log_update();
}

class DebugDialog extends jqDialog {
	constructor() {
		super();
		this.valueField = null;
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
			"Close":() =>
			{
				$(this.dialog).dialog('close');
			}
		};
	}
}

class AboutDialog extends CloseDialog {
	constructor() {
		super();
		this.setTitle("About");
		this.setHtml(`
			<img src="graphics/stochsd_high.png" style="width: 128px; height: 128px"/><br/>
			<b>StochSD version ${stochsd.version} (YYYY.MM.DD)</b><br/>
			<br/>
			<b>StochSD</b> (<u>Stoch</u>astic <u>S</u>ystem <u>D</u>ynamics) is an extension of System Dynamics into the field of 	<b>stochastic modelling</b>. In particular, you can make statistical analyses from multiple simulation runs.<br/>
			<br/>
			StochSD is an open source program based on the <a target="_blank" href="http://insightmaker.com">Insight Maker engine</a> (insightmaker.com) developed by Scott Fortmann-Roe. However, the graphic package of Insight Maker is replaced to make StochSD open for use as well as modifications and extensions. The file handling system is also rewritten. Finally, tools for optimisation, sensitivity analysis and statistical analysis are supplemented.<br/>
			<br/>
			StochSD was developed by Leif Gustafsson, Erik Gustafsson and Magnus Gustafsson, Uppsala University, Uppsala, Sweden.<br/>
			Mail: leif.gunnar.gustafsson@gmail.com 
		`);
	}
}

class LicenseDialog extends CloseDialog {
	constructor() {
		super();
		this.setTitle("License");
		
		this.setHtml(`
		<p style="display: inline-block">
		Copyright 2010-2019 StochSD-Team and Scott Fortmann-Roe. All rights reserved.<br/>

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
		this.setTitle("Third-party licenses");
		
		this.setHtml(`
		<iframe style="width: 700px; height: 500px;" src="third-party-licenses.html"/>
		</div>
		`);
	}
}

class EquationEditor extends jqDialog {
	constructor() {
		super();
		this.accordionBuilt = false;
		this.setTitle("Equation Editor");
		this.primitive = null;
		
		// read more about display: table, http://www.mattboldt.com/kicking-ass-with-display-table/
		this.setHtml(`
			<div class="table">
  				<div class="table-row">
					<div class="table-cell" style="width: 300px; height: 300px;">
						<div class="primitive-settings" style="padding: 10px 20px 20px 0px">
							<b>Name:</b><br/>
							<input class="name-field text-input enter-apply" style="width: 100%;" type="text" value=""><br/>
							<div class="name-warning-div" style="color: red;"></div><br/>
							<b>Definition:</b><br/>
							<textarea class="value-field enter-apply" style="font-family: monospace; width: 100%; height: 70px;"></textarea>
							<br/>
							<div class="primitive-references-div" style="width: 100%; overflow-x: auto" ><!-- References goes here-->
							</div>
							<div class="restrict-to-non-negative-div">
								<br/>
								<label><input class="restrict-to-non-negative-checkbox enter-apply" type="checkbox"/> Restrict to non-negative values</label>
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

		$(this.dialogContent).find(".name-field").keyup((event) => {
			let newName = stripBrackets($(event.target).val());
			let nameFree = isNameFree(newName, this.primitive.id);
			let validName = validPrimitiveName(newName, this.primitive);
			if (nameFree && validName) {
				$(event.target).css("background-color", "white");
				$(this.dialogContent).find(".name-warning-div").html("");
			} else {
				$(event.target).css("background-color", "pink");
				if (! nameFree) {
					$(this.dialogContent).find(".name-warning-div").html(`Name <b>${newName}</b> is taken.`);
				} else if (newName === "") {
					$(this.dialogContent).find(".name-warning-div").html(`Name cannot be empty.`);
				} else if (! validName) {
					$(this.dialogContent).find(".name-warning-div").html(`Name cannot contain brackets, parentheses, or quotes`);
				}
			} 
		});

		$(this.dialogContent).find(".enter-apply").keydown((event) => {
			if (! event.shiftKey) {
				if (event.keyCode == keyboard["enter"]) {
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
		
		let helpData = getFunctionHelpData();
	
		let functionListToHtml = function(functionList) {
			let filterFunctionTemplate = (functionTemplate)=> {
				return functionTemplate.replace(/\$\$/g, "").replace(/##/g, "").replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/ /g, " ");
			};
			let result = "<ul>";
			let codeSnippetName = "";
			let codeTemplate = "";
			let codeHelp = "";
			for (let j = 0; j < functionList.length; j++) {
				let example = "";
				if (functionList[j].length == 4) {
					if ((functionList[j][3]).constructor === Array) {
						let codeSample = functionList[j][3][0];
						let returnValue = functionList[j][3][1];
						example = `<br/><br/><b>Example</b><br/>${codeSample}<br/><br/><b>Returns:</b><br/> ${returnValue}`;
					} else {
						let codeSample = functionList[j][3];
						example = `<br/><br/><b>Example</b><br/>${codeSample}`;
					}
				}
				codeSnippetName = functionList[j][0];
				codeTemplate = `${filterFunctionTemplate(functionList[j][1])}`;
				codeHelp = `${functionList[j][2]} ${example}`;
				codeHelp = codeHelp.replace(/\'/g, "&#39;");
				codeHelp = codeHelp.replace(/\"/g, "&#34;");
				result += `<li class = "function-help click-function" data-template="${codeTemplate}" title="${codeHelp}">${codeSnippetName}</li>`;
			}
			result += "</ul>";
			return result;
		};
	
		for (let i = 0; i < helpData.length; i++) {
			$(".accordion-cluster").append(`<div>
			<h3 class="function-category">${helpData[i][0]}</h3>
			  <div>
				${
					functionListToHtml(helpData[i][1])
				}
			  </div>
			</div>`);
		}
		
		$(this.dialogContent).find(".click-function").click((event) => this.templateClick(event));
		
		$(this.valueField).focusout((event)=>{
			this.storeValueSelectionRange();
		});
		$(".accordion-cluster").click((event) => {
			this.restoreValueSelectionRange();
		});
		$(this.dialogContent).find(".primitive-references-div").click((event) => {
			this.restoreValueSelectionRange();
		});
		
		
		
		/* Positioning 
			This is done to avoid blocking the button with the tooltip
			https://api.jqueryui.com/position/
		*/
		$(".accordion-cluster").tooltip({
		  position: { my: "left+5 center", at: "right center" },
		  classes: {"ui-tooltip": "tooltip"},
		  content: function () {
              return $(this).prop('title');
          }
		});
		
		
		if (this.defaultFocusSelector) {
			let valueFieldDom = $(this.dialogContent).find(this.defaultFocusSelector).get(0);
			valueFieldDom.focus();
			let inputLength = valueFieldDom.value.length;
			valueFieldDom.setSelectionRange(0, inputLength);
			this.storeValueSelectionRange();
		}
	
	}
	open(id,defaultFocusSelector = null) {
		$(this.dialogContent).find(".name-field").css("background-color", "white");
		$(this.dialogContent).find(".name-warning-div").html("");
		if (jqDialog.blockingDialogOpen) {
			// We can't open a new dialog while one is already open
			return;
		}
		this.primitive = findID(id);
		if (this.primitive == null) {
			alert("Primitive with id "+id+" does not exist");
			return;
		}
		this.show();
		this.defaultFocusSelector = defaultFocusSelector;

		
		let oldValue = getValue(this.primitive);
		oldValue = oldValue.replace(/\\n/g, "\n");
		
		let oldName = getName(this.primitive);
		let oldNameBrackets = makePrimitiveName(oldName);
		
		this.setTitle(oldNameBrackets+" properties");

		$(this.nameField).val(oldNameBrackets);
		$(this.valueField).val(oldValue);
		
		
		// Handle restrict to non-negative
		if (["Flow", "Stock"].indexOf(getType(this.primitive)) != -1) {
			// If element has restrict to non-negative
			$(this.restrictNonNegativeDiv).show();
			let restrictNonNegative = getNonNegative(this.primitive);
			$(this.restrictNonNegativeCheckbox).prop("checked",restrictNonNegative);
		} else {
			// Otherwise hide that option
			$(this.restrictNonNegativeDiv).hide();
		}
		
		// Create reference list
		let referenceList = getLinkedPrimitives(this.primitive);
	
		// Sort reference list by name
		referenceList.sort(function(a, b) {
			let nameA = getName(a);
			let nameB = getName(b);
			if (nameA < nameB) return -1;
			if (nameA > nameB) return 1;
			return 0;
		})
		
		let referenceListToHtml = (referenceList) => {
			let result = "";
			for(let linked of referenceList) {
				let name ="["+getName(linked)+"]";
				result += `<span class = "linked-reference click-function" data-template="${name}">${name}</span>&nbsp;</br>`;
			}
			return result;
		}
		
		let referenceHTML = "";
		if (! (this.primitive.value.nodeName === "Variable" && this.primitive.getAttribute("isConstant") === "true")) {
			if (referenceList.length > 0) {
				referenceHTML = "<b>Linked primitives:</b><br/>"+referenceListToHtml(referenceList);
			} else {
				referenceHTML = "No linked primitives";
			}
		}
		$(this.referenceDiv).html(referenceHTML);
		
		$(this.referenceDiv).find(".click-function").click((event) => this.templateClick(event));
		
		if (this.defaultFocusSelector) {
			let valueFieldDom = $(this.dialogContent).find(this.defaultFocusSelector).get(0);
			valueFieldDom.focus();
			let inputLength = valueFieldDom.value.length;
			valueFieldDom.setSelectionRange(0, inputLength);
			this.storeValueSelectionRange();
		}
	}
	templateClick(event) {
		let templateData = $(event.target).data("template");
		let start = this.valueField.selectionStart;
		if (typeof templateData == "object") {
			templateData = "["+templateData.toString()+"]";
		}
		let oldValue = $(this.valueField).val();
		let newValue = oldValue.slice(0, this.valueSelectionStart) + templateData + oldValue.slice(this.valueSelectionEnd);
		$(this.valueField).val(newValue);
		let newPosition = this.valueSelectionStart+templateData.length;
		this.valueField.setSelectionRange(newPosition,newPosition);
	}
	beforeClose() {
		this.closeAccordion();
	}
	buildAccordion() {
		// Uses the trick of creating multiple accordions
		// So that they can be independetly opened and closed
		// http://stackoverflow.com/questions/3479447/jquery-ui-accordion-that-keeps-multiple-sections-open
		$(".accordion-cluster > div").accordion({active: false, header: "h3", collapsible: true });
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
	storeValueSelectionRange() {
		this.valueSelectionStart = this.valueField.selectionStart;
		this.valueSelectionEnd = this.valueField.selectionEnd;
	}
	restoreValueSelectionRange() {
		$(this.valueField).focus();
		this.valueField.setSelectionRange(this.valueField.selectionStart,this.valueField.selectionEnd);
	}
	makeApply() {
		if (this.primitive) {
			// Handle value
			let value = $(this.dialogContent).find(".value-field").val();
			setValue2(this.primitive, value);
			// handle name
			let oldName = getName(this.primitive);
			let newName = stripBrackets($(this.dialogContent).find(".name-field").val());
			if (oldName != newName) {
				if (isNameFree(newName) && validPrimitiveName(newName, this.primitive)) {
					setName(this.primitive, newName);
					changeReferencesToName(this.primitive.id, oldName, newName);
				}
			}
			
			// Handle restrict to non-negative
			let restrictNonNegative = $(this.restrictNonNegativeCheckbox).prop("checked");
			setNonNegative(this.primitive,restrictNonNegative);
			
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

function printContentInNewWindow(htmlContent) {
	let printWindow = window.open('', '', 'height=1000,width=1000,screenX=50,screenY=50');
	printWindow.document.write('<html><head><title>Equation List</title>');
	printWindow.document.write('<link rel="stylesheet" type="text/css" href="editor.css">');
	printWindow.document.write('</head><body >');  
	printWindow.document.write(htmlContent);
	printWindow.document.write('</body></html>');  
	
	setTimeout(() => {
		printWindow.print();
		printWindow.close();
	},400);
}

function hideAndPrint(elementsToHide) {
	for(let element of elementsToHide) {
		$(element).hide();
	}
	console.trace();
	window.print();
	for(let element of elementsToHide) {
		$(element).show();
	}	
}
class MacroDialog extends jqDialog {
	constructor() {
		super();
		this.setTitle("Macro");
		this.seed = "";
		this.setHtml(`
		<table class="invisible-table" style="vertical-align: top;">
			<tr>
				<td>
					<textarea class="macro-text"></textarea>
				</td>
				<td style="padding:0;">
					<table class="modern-table" title="SetRandSeed makes stochstics simulations reproducable.">
						<tr>	
							<td style="padding:1px;">
								Seed = <input class="seed-field enter-apply" type="text" />
							</td>
						</tr>
						<tr>
							<td>
								<button class="set-seed-button" disabled>SetRandSeed</button>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
		`);		
		this.macroTextArea = $(this.dialogContent).find(".macro-text");
		this.setSeedButton = $(this.dialogContent).find(".set-seed-button");
		$(this.dialogContent).find(".seed-field").keyup((event) => { 
			this.seed = $(event.target).val();
			this.setSeedButton.attr("disabled", this.seed.length === 0 );
		});
		this.setSeedButton.click((event) => {
			let macro = this.macroTextArea.val();
			this.macroTextArea.val(`${macro}\nSetRandSeed(${this.seed})\n`);
		});
	}
	beforeShow() {
		let oldMacro = getMacros();
		this.macroTextArea.val(oldMacro);
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
		this.macroTextArea.width(width-150);
		this.macroTextArea.height(height-20);
	}
	beforeCreateDialog() {
		// this.dialogParameters.width = "500";
		// this.dialogParameters.height = "400";
	}
	makeApply() {
		let newMacro = $(this.dialogContent).find(".macro-text").val();
		setMacros(newMacro);
	}
}

class TextAreaDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Text");
		this.setHtml(`
		<div style="height: 100%;">
			<textarea class="text" style="resize: none;"></textarea>
			<div class="vertical-space"></div>
			<table class="modern-table"><tr title="Only hides when there is any text.">
				<td>Hide frame when there is text:</td>
				<td><input type="checkbox" class="hide-frame-checkbox" /></td>
			</tr></table>
		</div>
		`);		
		this.textArea = $(this.dialogContent).find(".text");
		this.hideFrameCheckbox = $(this.dialogContent).find(".hide-frame-checkbox");
	}
	beforeShow() {
		let oldText = getName(this.primitive);
		this.textArea.val(oldText);
		this.hideFrameCheckbox.prop("checked", this.primitive.getAttribute("HideFrame") === "true");
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
		this.textArea.width(width-10);
		this.textArea.height(height-40);
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
			"Print Equations": () =>
			{
				let contentHTML = $(this.dialogContent).html();
				printContentInNewWindow(contentHTML);
			},
			"Leave":() =>
			{
				$(this.dialog).dialog('close');
			}
		};
	}
	renderSpecsInfoHtml() {
		/** Set filename */
		let fileName = fileManager.fileName;
		if (fileName) {
			let winSplit = fileName.split("\\");
			fileName = winSplit[winSplit.length-1];
			let unixSplit = fileName.split("/");
			fileName = unixSplit[unixSplit.length-1];
		} else {
			fileName = "Unnamed file";
		}
		
		/** Get Date */
		let d = new Date();
		let month = d.getMonth()+1 < 10 ? `0${d.getMonth()+1}` : d.getMonth()+1;
		let day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
		let fullDate = `${d.getFullYear().toString().substring(2,4)}-${month}-${day} (yy-mm-dd)`;

		/** Find seed */
		let isSeedSet = false;
		let seed = "";
		let macro = getMacros();
		let index = macro.lastIndexOf("SetRandSeed");
		if (index !== -1) {
			isSeedSet = true;
			let c = macro.substring(index, macro.length);
			let regExp = /\(([^)]+)\)/;
			let matches = regExp.exec(c);
			seed = matches[1];
		} 

		let specs = [
			["Time Unit", getTimeUnits()],
			["Start", getTimeStart()],
			["Length", getTimeLength()],
			["DT", getTimeStep()],
			["Method", getAlgorithm() === "RK1" ? "Euler" : "RK4"]
		];
		if (isSeedSet) {
			specs.push(["Seed", seed]);
		}

		return(`
			<h3 class="equation-list-header">${fileName}</h3>${fullDate}</br>
			<h3 class="equation-list-header	">Specifications</h3>
			<table class="modern-table">
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
		<table class="modern-table">
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
		let Stocks = primitives("Stock");
		let stockHtml = "";
		if (Stocks.length > 0) {
			stockHtml = this.renderPrimitiveListHtml({
				title: "Stocks", 
				primitives: Stocks,
				tableColumns: [
					{ header: "Name", 			cellFunc: (prim) => { return makePrimitiveName(getName(prim)); } },
					{ header: "Initial Value", 	cellFunc: getValue, style: "font-family: monospace;" },
					{ header: "Restricted", 	cellFunc: (prim) => { return prim.getAttribute("NonNegative") === "true" ?  "≥0" : "";} },
				]
			});
		}
		
		let Flows = primitives("Flow");
		let flowHtml = "";
		if (Flows.length > 0) {
			flowHtml = this.renderPrimitiveListHtml({
				title: "Flows", 
				primitives: Flows,
				tableColumns: [
					{ header: "Name", 			cellFunc: (prim) => { return makePrimitiveName(getName(prim)); } },
					{ header: "Rate", 			cellFunc: getValue, style: "font-family: monospace;" },
					{ header: "Restricted", 	cellFunc: (prim) => { return prim.getAttribute("OnlyPositive") === "true" ?  "≥0" : "";} },
				]
			});
		}
		
		let Variables = primitives("Variable");
		let variableHtml = "";
		if (Variables.length > 0) {
			variableHtml = this.renderPrimitiveListHtml({
				title: "Auxiliaries & Parameters", 
				primitives: Variables,
				tableColumns: [
					{ header: "Name", 	cellFunc: (prim) => { return makePrimitiveName(getName(prim)); } },
					{ header: "Value", 	cellFunc: getValue, style: "font-family: monospace;" }
				]
			});
		}

		let Converters = primitives("Converter");
		let converterHtml = "";
		if (Converters.length > 0) {
			converterHtml = this.renderPrimitiveListHtml({
				title: "Converter",
				primitives: Converters,
				tableColumns: [
					{ header: "Name", 			cellFunc: (prim) => { return makePrimitiveName(getName(prim)); } },
					{ header: "Data", 			cellFunc: getValue, style: "font-family: monospace; max-width: 400px; word-break: break-word;" },
					{ header: "Ingoing Link", 	cellFunc: (prim) => { return findLinkedInPrimitives(prim.id).length !== 0 ? getName(findLinkedInPrimitives(prim.id)[0]) : "None"; } }
				]
			});
		}
		let numberOfPrimitives = Stocks.length+Flows.length+Variables.length+Converters.length;
		
		if (numberOfPrimitives == 0) {
			this.setHtml("This model is empty. Build a model to show equation list");	
			return;		
		}

		let htmlOut = `
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
	window.mxUtils.alert = function(message,closeHandler) {
		xAlert("Message from engine:  "+message,closeHandler);
	}
}
