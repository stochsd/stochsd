/*

This file may distributed and/or modified under the
terms of the Affero General Public License (http://www.gnu.org/licenses/agpl-3.0.html).

*/

// Call e.g centerCoordinates([[10,10],[100,100]]);
function centerCoordinates(coordinateList) {
	if(coordinateList.length<1) {
		return null;
	}
	var minX = coordinateList[0][0];
	var minY = coordinateList[0][1];
	var maxX = coordinateList[0][0];
	var maxY = coordinateList[0][1];
	for(var i in coordinateList) {
		if(minX < coordinateList[i][0]) {
			minX = coordinateList[i][0];
		}
		if(minY < coordinateList[i][1]) {
			minY = coordinateList[i][1];
		}
		if(maxX > coordinateList[i][0]) {
			minY = coordinateList[i][0];
		}
		if(maxY > coordinateList[i][1]) {
			maxY = coordinateList[i][1];
		}
	}
	var centerX = (maxX+minX)/2;
	var centerY = (maxY+minY)/2;
	return [centerX,centerY];
}

function positionDifference(pos1, pos2) {
	return [pos1[0]-pos2[0],pos1[1]-pos2[1]];
} 
function positionSum(pos1, pos2) {
	return [pos1[0]+pos2[0],pos1[1]+pos2[1]];
}

function nameIsFree(name) {
	var result=findName(name);
	if(result==null) {
		return true;
	} else {
		return false;
	}
}

var makeGhost = function(item, pos=null) {
	if(!item) {
		alert("Item must be provided");
		return;
	}
	dpopup("Makeing ghost");
	//~ var provided = item.value;
	//~ item = provided ? item : graph.getSelectionCell();
	
	if(graph instanceof SimpleNode){
		var parent = graph.children[0].children[0];
		var t = "ghost"; // type.toLowerCase();
		var vertex = simpleCloneNode(primitiveBank[t], parent);
		last_vertex=vertex;
		//~ vertex.value.children.push({"children":[{"attributes"}]
		//vertex.value.children[0].children[0].attributes
		
		// This poisition will be overriden later, but we need a position to place it
		
		var sourceType=getType(findID(item.id)).toLowerCase();
		var size=type_size[sourceType];
		var position;
		if(pos!=null) {
			position=[pos[0]-size[0]/2,pos[1]-size[1]/2];
		} else {
			position=[0,0];
		}
		parent.children.push(vertex);
		setSize(vertex,size);
		setPosition(vertex,position);
		vertex.setAttribute("Source", item.id);
		vertex.setAttribute("name", item.getAttribute("name"));
		
		vertex.value.setAttribute("Source", item.id);
		vertex.value.setAttribute("name", item.getAttribute("name"));
		
		clearPrimitiveCache();
		//~ var new_primitive = new primitive_class(vertex.id,"stock",position[0],position[1]);
		
		return vertex;
	} else {
	 // This code is not tested out. Rellay on the old makeGhost in InsightEditor.js
	dpopup("This code is not tested out. Rellay on the old makeGhost in InsightEditor.js");
	var parent = graph.getDefaultParent();

	var location = getPosition(item);

	var vertex;
	var style = item.getStyle();
	style = mxUtils.setStyle(style, "opacity", 30);
	graph.getModel().beginUpdate();

	vertex = graph.insertVertex(parent, null, primitiveBank.ghost.cloneNode(true), location[0] + 10, location[1] + 10, item.getGeometry().width, item.getGeometry().height, style);
	vertex.value.setAttribute("Source", item.id);
	vertex.value.setAttribute("name", item.getAttribute("name"));
	if (!provided) {
		graph.setSelectionCell(vertex);
	}
		graph.getModel().endUpdate();

		return vertex;
	}
};

function findGhostsOfID(id) {
	var results=[];
	var ghosts = primitives("Ghost");
	for (var i = 0; i < ghosts.length; i++) {
		if (ghosts[i].getAttribute("Source") == id) {
			results.push(ghosts[i].getAttribute("id"));
		}
	}
	return results;
}

function propogateGhosts(cell) {
	var ghosts = primitives("Ghost");
	for (var i = 0; i < ghosts.length; i++) {
		if (ghosts[i].getAttribute("Source") == cell.id) {
			if(graph instanceof SimpleNode){
				// We don't need to do anything specific SimpleNode
				// Only set Attribute undoable is enought
			} else {
				var style = cell.getStyle();
				style = mxUtils.setStyle(style, "opacity", 30);
				ghosts[i].setStyle(style);
				//console.log(cell.getAttribute("name"));
			}
			var edit = setAttributeUndoable(ghosts[i], "name", cell.getAttribute("name"));

		}
	}
}
/*
	Method isNameFree
	
	Checks all other primitives if a name is taken. 
	Returns false if taken, and true if free 

*/
function isNameFree(newName, exepctionId) {
	let prims = primitives();
	for(let prim of prims) {
		let name = getName(prim);
		let id = prim.id;
		if (newName === name && exepctionId !== id) {
			return false;
		}
	}
	return true;
}

/*
	Method: setValue2
	sets value of primitive aswell as sets Definiton Error 
*/
function setValue2(primitive, value) {
	let valueStr = value; 
	while(valueStr[valueStr.length-1] === " " || valueStr[valueStr.length-1] === ";" || valueStr[valueStr.length-1] === "\n"){
		valueStr = valueStr.substring(0, valueStr.length-1);
	}
	setValue(primitive, valueStr);
	let error = DefinitionError.check(primitive);
}


/* 
	Method: findLinkedOutPrimitives

	Finds and returns all primitives that primitive with param:id is liked to

	Return:

	An array of primitives.

*/
function findLinkedOutPrimitives(id) {
	let links = primitives("Link");
	let outgoingLinks = links.filter((p) => (p.source) ? p.source.id == id : false);
	return outgoingLinks.map(s => s.target).filter(exists => Boolean(exists));
}
/* 
	Method: findLinkedInPrimitives

	Finds and returns all primitives that has ingoing links to param:id 

	Return:

	An array of primitives.

*/
function findLinkedInPrimitives(id) {
	let links = primitives("Link");
	let outgoingLinks = links.filter((p) => (p.target) ? p.target.id == id : false);
	return outgoingLinks.map(s => s.source).filter(exists => Boolean(exists));
}

/*
	Method: replaceName
	replaces all instences of a variable name in a definition (FlowRate, InitialValue, Equation)

	Example:
	$ let definition = "0.5*[foo]*[somevariable]/(foo * [foo])"
	$ let newDefinition = replaceName(definition, "foo", "bar")
	$ newDefiition
	> "0.5*[bar]*[somevariable]/(foo * [bar])"

*/
function replaceName(definition, oldName, newName) {
	let newDefinition = definition;
	let rex = new RegExp("\\[" + oldName + "]", "g");
	newDefinition = definition.replace(rex, "[" + newName + "]");
	return newDefinition;
}

/**
 * Changes names of all references of names in their definitions.
 * 
 * @param {string or number} 	id 
 * @param {string} 				oldName 
 * @param {string} 				newName 
 */
function changeReferencesToName(id, oldName, newName) {
	let objWLinkedPrims = findLinkedOutPrimitives(id);
	objWLinkedPrims.map((p) => {
		switch (p.value.nodeName) {
			case "Flow":
				let newFlowRate = replaceName(p.getAttribute("FlowRate"), oldName, newName);
				p.setAttribute("FlowRate", newFlowRate);
				break;
			case "Variable":
				let newEquation = replaceName(p.getAttribute("Equation"), oldName, newName);
				p.setAttribute("Equation", newEquation);
				break;
			case "Stock": 
				let newInitialValue = replaceName(p.getAttribute("InitialValue"), oldName, newName);
				p.setAttribute("InitialValue", newInitialValue);
				break;
			default:
				break;
		}
	});
	if (findID(id).value.nodeName !== "Ghost") {
		let ghosts = findGhostsOfID(id).map(findID);
		ghosts.map(g => {
			ghost_id = g.getAttribute("id");
			changeReferencesToName(ghost_id, oldName, newName);
		});
	}
}

function removeSpacesAtEnd(str) {
	value = str;
	while(value[value.length-1] === " ") {
		value = value.substring(0, value.length-1);
	}
	return value;
}

function isPrimitiveGhost(primitive) {
	return primitive.value.nodeName === "Ghost";
}

/**
 * must contain charachter between A-Z or a-z 
 */
function isTimeUnitOk(timeUnit) {
	let lowercase = timeUnit.toLowerCase();
	for (let i = 0; i < timeUnit.length; i++) {
		if (("a").charCodeAt(0) <= lowercase.charCodeAt(i) && lowercase.charCodeAt(i) <= ("z").charCodeAt(0)) {
			return true;
		}
	}
	return false;
}

/**
 * Get the default value from primitiveBank 
 * 
 * @param {string} lowercaseNodeName 
 * @param {string} attribute 
 */


function getDefaultAttributeValue(lowercaseNodeName, attribute) {
	return primitiveBank[lowercaseNodeName].getAttribute(attribute);
}

/**
 * Get the type of the primitive
 * This includes constant which is a type of variable
 * 
 */

function getTypeNew(prim) {
	let type = prim.value.nodeName;
	if (type === "Variable" && prim.getAttribute("isConstant") === "true") {
		type = "Constant";
	}
	return type;
}

/**
 	Method: replaceName
	replaces all depricated Diagrams objects with new TimePlots primitives 
	should be done before syncing primitives 
 */

function replaceDiagamsWithTimePlots() {
	let primitive_list = primitives("Diagram");
	for (key in primitive_list) {
		let name = findFreeName(type_basename["TimePlot"]);
		let replacePrim = createConnector(name, "TimePlot", null, null);
		setSourcePosition(replacePrim, getSourcePosition(primitive_list[key]));
		setTargetPosition(replacePrim, getTargetPosition(primitive_list[key]));
		replacePrim.setAttribute("Primitives", primitive_list[key].getAttribute("Primitives"));
		removePrimitive(primitive_list[key]);
	}
} 


/**
 	Method: isValidToolname
	Checks if name is valid for tools StatRes, ParmVar etc.
 */
function isValidToolName(newName) {
	return /^[A-Za-z_]+[A-Za-z_0-9]*$/.test(newName);
}


/**
 * 	Method: setIdsToDisplay
 * 	@param {string} plotId ID of plot to set 
 * 	@param {[string]} idList lists of IDs To add
 */
 function setDisplayIds(plotPrimitive, idList, sideList) {
	if (isTimePlot(plotPrimitive)) {
		setDisplayIdsForTimePlot(plotPrimitive, idList, sideList);
	} else {
		plotPrimitive.setAttribute("Primitives", idList.join(","));
	}
}

/**
 	Method: getIdsToDisplay
	Gets all ids to display for a given plot
	@param {string} plotPrimitive ID of plot to get 
	@returns {[string]} primitive's id to display for Plots/Table
 */
function getDisplayIds(plotPrimitive) {
	if (isTimePlot(plotPrimitive)) {
		return getDisplayIdsForTimePlot(plotPrimitive);
	} else {
		idsString = plotPrimitive.getAttribute("Primitives");
		let ids = idsString === "" ? [] : idsString.split(",");
		// Clear ids that have no primitive 
		ids.filter(id => findID(id) !== null);
		setDisplayIds(plotPrimitive, ids);
		return ids;
	}
	
}

/**
 	Method: removeIdToDisplay
	Removes id to Diaplay for Plots/Table
	@param {string} plotPrimitive ID of plot to change
	@param {string} removeId plot to edit
	@returns {boolean} if ID was successfuly removed 
 */
function removeDisplayId(plotPrimitive, removeId) {
	if (isTimePlot(plotPrimitive)) {
		return removeDisplayIdForTimePlot(plotPrimitive, removeId);
	} else {
		let ids = getDisplayIds(plotPrimitive);
		let removeIndex = ids.indexOf(removeId);
		if (removeIndex !== -1) {
			ids.splice(removeIndex, 1);
		}
		setDisplayIds(plotPrimitive, ids);
		return removeIndex !== -1;
	}
	
}

/**
 	Method: addIdToDisplay
	Removes id to Diaplay for Plots/Table
	@param {string} plotPrimitive ID of plot to change
 */
function addDisplayId(plotPrimitive, newId) {
	let ids = getIdsToDisplay(plotPrimitive);
	if (! ids.includes(newId)) {
		ids.push(newId);
		setDisplayIds(plotPrimitive, ids);
	}
}

function isTimePlot(plotPrimitive) {
	return getType(plotPrimitive) === "TimePlot";
}


function setDisplayIdsForTimePlot(plotPrimitive, idList, sideList) {
	
	if (sideList === undefined) {
		throw Error(`sideList is undefined for TimePlot`);
	} else if (idList.length !== sideList.length) {
		throw Error(`idList.length ${idList.length} !== sideList.length ${sideList.length}`);
	}

	plotPrimitive.setAttribute("Primitives", idList.join(","));
	plotPrimitive.setAttribute("Sides", sideList.join(","));
}

function getDisplayIdsForTimePlot(plotPrimitive) {
	idsString = plotPrimitive.getAttribute("Primitives");
	let ids = idsString === "" ? [] : idsString.split(",");
	
	let sidesString = plotPrimitive.getAttribute("Sides");
	let sides = sidesString === "" ? [] : idsString.split(",");

	// if sides and ids different sizes make sides have same size
	if (ids.length !== sides.length) {
		sides = ids.map(() => "L");
	}

	// Clear ids that have no primitive 
	for(let i = ids.length-1; i >= 0; i--) {
		currentId = ids[i];
		if (findID(currentId) === null) {
			removeDisplayIdForTimePlot(plotPrimitive, currentId);
		}
	}

	idsString = plotPrimitive.getAttribute("Primitives");
	ids = idsString === "" ? [] : idsString.split(",");

	return ids;
}

function getDisplaySides(plotPrimitive) {
	idsString = plotPrimitive.getAttribute("Primitives");
	let ids = idsString === "" ? [] : idsString.split(",");
	
	let sidesString = plotPrimitive.getAttribute("Sides");
	let sides = sidesString === "" ? [] : sidesString.split(",");

	if (ids.length !== sides.length) {
		// if sides and ids different sizes make sides have same size
		sides = ids.map(() => "L");
	}
	return sides;
}

function removeDisplayIdForTimePlot(plotPrimitive, removeId) {

	idsString = plotPrimitive.getAttribute("Primitives");
	let ids = idsString === "" ? [] : idsString.split(",");
	
	let sidesString = plotPrimitive.getAttribute("Sides");
	let sides = sidesString === "" ? [] : idsString.split(",");

	if (ids.length !== sides.length) {
		// if sides and ids different sizes make sides have same size
		sides = ids.map(() => "L");
	}

	let removeIndex = ids.indexOf(removeId);
	if (removeIndex !== -1) {
		ids.splice(removeIndex, 1);
		sides.splice(removeIndex, 1);
	}

	plotPrimitive.setAttribute("Primitives", ids.join(","));
	plotPrimitive.setAttribute("Sides", sides.join(","));
	return removeIndex !== -1;
}

function addDisplayIdForTimePlot(plotPrimitive, addId, side) {

}