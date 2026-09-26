// Overrides isLocal() in the engine's formula.js, which only returns true when running on Insight Maker's development hosts.
// Returning true makes the engine expose additional debugging and error messages.
function isLocal() {
	return true;
}

defaultAttributeChangeHandler = function (primitive, attributeName, value) {
	let id = getID(primitive);
	let type = getType(primitive);
	let visualObject = Visuals.get(id);
	if (visualObject) {
		visualObject.attributeChangeHandler(attributeName, value);
	}

	switch (attributeName) {
		case "name":
			visualObject?.setName(value);
			break;
	}
	//~ do_global_log("tjohej "+type+" "+attributeName);
	if (type == "Numberbox" && attributeName == "Target") {
		let visualObject = Visuals.get(id);
		// render() can only be done when the numberbox is fully loaded
		// Therefor we have to check that visualObject is not null
		if (visualObject) {
			visualObject.render();
		}
	}
}

defaultPositionChangeHandler = function (primitive) {
	let newPosition = getCenterPosition(primitive)
	let visualObject = Visuals.getOnePointer(getID(primitive));
	if (visualObject) {
		visualObject.setPos(newPosition);
	}
}

defaultPrimitiveCreatedHandler = function (primitive) {
	syncVisual(primitive);
}

defaultPrimitiveBeforeDestroyHandler = function (primitive) {
	let id = getID(primitive);
	let numberboxes = primitives("Numberbox").filter(numberbox => numberbox.getAttribute("Target") == id);
	// Histograms don't implement removePlotReference, so they keep showing deleted primitives
	Visuals.displays().forEach(display => display.removePlotReference?.(id));
	Visuals.get(id)?.remove();
	numberboxes.forEach(removePrimitive);
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

// The engine's showEditor() in API.js calls EditorControll.showEditor() if it exists, e.g. to show where a simulation error is.
// The engine looks for this exact name, so it can't be renamed.
class EditorControll {
	static showEditor(primitive, annotations) {
		let primitiveId = getID(primitive);
		Visuals.get(primitiveId).doubleClick();
	}
}
