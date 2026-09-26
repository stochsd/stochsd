// @ts-check
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
// Primitive type: [visual class, visual type]
const displayVisuals = {
	Table: [TableVisual, "table"],
	XyPlot: [XyPlotVisual, "xyplot"],
	HistoPlot: [HistoPlotVisual, "histoplot"],
	TimePlot: [TimePlotVisual, "timeplot"],
	ComparePlot: [ComparePlotVisual, "compareplot"],
	Diagram: [TimePlotVisual, "diagram"], // Old name for TimePlot
};
const shapeVisuals = {
	TextArea: [TextAreaVisual, "text"],
	Rectangle: [RectangleVisual, "rectangle"],
	Ellipse: [EllipseVisual, "ellipse"],
	Line: [LineVisual, "line"],
};

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

// The visual that a flow or link is attached to.
// A missing visual means the file is corrupt. Throwing lets syncAllVisuals remove the primitive and tell the user.
function getAttachedVisual(primitive) {
	let visual = Visuals.get(getID(primitive));
	if (!visual) {
		throw new Error(`Attached to ${getType(primitive)} ${getID(primitive)}, which has no visual`);
	}
	return visual;
}

// Take a primitive from the engine and make a visual object from it
function syncVisual(primitive) {
	if (Visuals.get(primitive.id)) {
		return;
	}

	addMissingPrimitiveAttributes(primitive);

	let primitiveType = primitive.value.nodeName;
	if (primitiveType == "Ghost") {
		let [VisualClass, type] = namedVisualFor(findID(primitive.getAttribute("Source")));
		syncNamedVisual(primitive, VisualClass, type, { is_ghost: true });
	} else if (namedVisualFor(primitive)) {
		syncNamedVisual(primitive, ...namedVisualFor(primitive));
	} else if (primitiveType in displayVisuals) {
		syncDisplay(primitive, ...displayVisuals[primitiveType]);
	} else if (primitiveType in shapeVisuals) {
		syncShape(primitive, ...shapeVisuals[primitiveType]);
	} else if (primitiveType == "Numberbox") {
		let visual = new NumberboxVisual(primitive.id, "numberbox", getCenterPosition(primitive));
		visual.setColor(primitive.getAttribute("Color"));
		visual.render();
	} else if (primitiveType == "Flow") {
		syncFlow(primitive);
	} else if (primitiveType == "Link") {
		syncLink(primitive);
	}
}

// The visual class and visual type for a stock, variable, constant or converter primitive
/** @returns {[typeof BaseVisual, VisualType]} */
function namedVisualFor(primitive) {
	switch (primitive.value.nodeName) {
		case "Stock":
			return [StockVisual, "stock"];
		case "Converter":
			return [ConverterVisual, "converter"];
		case "Variable":
			if (primitive.getAttribute("isConstant") == "true") {
				return [ConstantVisual, "constant"];
			}
			return [VariableVisual, "variable"];
	}
}

// Stocks, variables, constants and converters, and ghosts of them
function syncNamedVisual(primitive, VisualClass, type, extras) {
	let visual = new VisualClass(primitive.id, type, getCenterPosition(primitive), extras);
	visual.setName(primitive.getAttribute("name"));
	visual.setColor(primitive.getAttribute("Color"));
	visual.name_pos = Number(primitive.getAttribute("RotateName"));
	visual.updateNamePosition();
}

// Plots and tables
function syncDisplay(primitive, VisualClass, type) {
	let visual = new VisualClass(primitive.id, type, getSourcePosition(primitive), getTargetPosition(primitive));
	visual.setColor(primitive.getAttribute("Color"));
	let primitivesString = primitive.getAttribute("Primitives");
	let idsToDisplay = primitivesString.split(",");
	if (primitivesString !== "") {
		visual.dialog.setIdsToDisplay(idsToDisplay);
	}
	visual.update();
	visual.render();
}

// Text, rectangles, ellipses and lines
function syncShape(primitive, VisualClass, type) {
	let visual = new VisualClass(primitive.id, type, getSourcePosition(primitive), getTargetPosition(primitive));
	visual.setColor(primitive.getAttribute("Color"));
	visual.update();
}

function syncFlow(primitive) {
	let source_pos = getSourcePosition(primitive);
	let target_pos = getTargetPosition(primitive);

	let connection = new FlowVisual(primitive.id, "flow", source_pos, target_pos);

	connection.name_pos = Number(primitive.getAttribute("RotateName"));
	connection.updateNamePosition();

	connection.loadMiddlePoints();

	connection.setColor(primitive.getAttribute("Color"));
	connection.valveIndex = parseInt(primitive.getAttribute("ValveIndex"));
	connection.variableSide = (primitive.getAttribute("VariableSide") === "true");

	if (primitive.source != null) {
		// Attach to object
		connection.setStartAttach(getAttachedVisual(primitive.source));
	}
	if (primitive.target != null) {
		// Attach to object
		connection.setEndAttach(getAttachedVisual(primitive.target));
	}
	connection.update();

	connection.setName(getName(primitive));
}

function syncLink(primitive) {
	let source_pos = getSourcePosition(primitive);
	let target_pos = getTargetPosition(primitive);

	let connection = new LinkVisual(primitive.id, "link", source_pos, target_pos);

	connection.setColor(primitive.getAttribute("Color"));

	if (primitive.source != null) {
		// Attach to object
		connection.setStartAttach(getAttachedVisual(primitive.source));
	}
	if (primitive.target != null) {
		// Attach to object
		connection.setEndAttach(getAttachedVisual(primitive.target));
	}
	let bezierPoints = [
		primitive.getAttribute("b1x"),
		primitive.getAttribute("b1y"),
		primitive.getAttribute("b2x"),
		primitive.getAttribute("b2y")
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

function loadModelFromXml(XmlString) {
	clearModel();
	stochsd_clear_sync();
	loadXML(XmlString);
	replaceDiagamsWithTimePlots();
	syncAllVisuals();
}

// This function is important. It takes all the relevant primitives from the engine
// And make visual objects from them
// This is executed after loading a file or loading a whole new state such as after undo
function syncAllVisuals() {
	for (let type of saveblePrimitiveTypes) {
		let primitive_list = primitives(type);
		for (let key in primitive_list) {
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
	Visuals.updateAll();
	Visuals.unselectAll();
}

syncAllVisuals();

