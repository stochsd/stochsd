function updateTimeUnitButton() {
	if (isTimeUnitOk(getTimeUnits())) {
		$("#timeunit-value").html(getTimeUnits());
	} else {
		$("#timeunit-value").html(warningHtml("None", false));
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

// The visual that a flow or link is attached to.
// A missing visual means the file is corrupt. Throwing lets syncAllVisuals remove the primitive and tell the user.
function getAttachedVisual(primitive) {
	let visual = Visuals.get(getID(primitive));
	if (!visual) {
		throw new Error(`Attached to ${getType(primitive)} ${getID(primitive)}, which has no visual`);
	}
	return visual;
}

// Take a primitive from the engine(tprimitve) and makes a visual object from it
function syncVisual(tprimitive) {
	if (Visuals.get(tprimitive.id)) {
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
				visualObject.setName(tprimitive.getAttribute("name"));

				visualObject.setColor(tprimitive.getAttribute("Color"));

				visualObject.name_pos = Number(tprimitive.getAttribute("RotateName"));
				visualObject.updateNamePosition();
			}
			break;
		case "Converter":
			{
				let position = getCenterPosition(tprimitive);
				let visualObject = new ConverterVisual(tprimitive.id, "converter", position);
				visualObject.setName(tprimitive.getAttribute("name"));

				visualObject.setColor(tprimitive.getAttribute("Color"));

				visualObject.name_pos = Number(tprimitive.getAttribute("RotateName"));
				visualObject.updateNamePosition();
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
				visualObject.setName(tprimitive.getAttribute("name"));

				visualObject.setColor(tprimitive.getAttribute("Color"));

				visualObject.name_pos = Number(tprimitive.getAttribute("RotateName"));
				visualObject.updateNamePosition();
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
				visualObject.setName(tprimitive.getAttribute("name"));

				visualObject.setColor(tprimitive.getAttribute("Color"));

				visualObject.name_pos = Number(tprimitive.getAttribute("RotateName"));
				visualObject.updateNamePosition();
			}
			break;
		case "Flow":

			let source_pos = getSourcePosition(tprimitive);
			let target_pos = getTargetPosition(tprimitive);

			let connection = new FlowVisual(tprimitive.id, "flow", source_pos, target_pos);

			connection.name_pos = Number(tprimitive.getAttribute("RotateName"));
			connection.updateNamePosition();

			connection.loadMiddlePoints();

			connection.setColor(tprimitive.getAttribute("Color"));
			connection.valveIndex = parseInt(tprimitive.getAttribute("ValveIndex"));
			connection.variableSide = (tprimitive.getAttribute("VariableSide") === "true");

			if (tprimitive.source != null) {
				// Attach to object
				connection.setStartAttach(getAttachedVisual(tprimitive.source));
			}
			if (tprimitive.target != null) {
				// Attach to object
				connection.setEndAttach(getAttachedVisual(tprimitive.target));
			}
			connection.update();

			connection.setName(getName(tprimitive));
			break;
		case "Link":
			{
				let source_pos = getSourcePosition(tprimitive);
				let target_pos = getTargetPosition(tprimitive);

				let connection = new LinkVisual(tprimitive.id, "link", source_pos, target_pos);

				connection.setColor(tprimitive.getAttribute("Color"));

				if (tprimitive.source != null) {
					// Attach to object
					connection.setStartAttach(getAttachedVisual(tprimitive.source));
				}
				if (tprimitive.target != null) {
					// Attach to object
					connection.setEndAttach(getAttachedVisual(tprimitive.target));
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
	Visuals.updateAll();
	Visuals.unselectAll();
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

