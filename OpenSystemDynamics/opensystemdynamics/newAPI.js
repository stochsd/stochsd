/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

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
	sets value of primitive aswell as sets ValueError
*/
function setValue2(primitive, value) {
	let valueStr = value; 
	while(valueStr[valueStr.length-1] === " " || valueStr[valueStr.length-1] === ";" || valueStr[valueStr.length-1] === "\n"){
		valueStr = valueStr.substring(0, value.length-1);
	}
	valueStr = valueStr.replace(/\n/g, "\\n");
	setValue(primitive, valueStr);
	let error = checkValueError(primitive, valueStr);
	primitive.setAttribute("ValueError", error ? error : "");
	return error;
}

const VALUE_ERROR = {
	"VE1": "Empty Definition",
	"VE2": "Unknown Reference",
	"VE3": "Unused Link from",
	"VE4": "No Ingoing Link", // only for converter
	"VE5": "More Then One Ingoing Link" // only for converter
}

function ValueErrorToString(valueError) {
	if (valueError) {
		let errArr = valueError.split(":");
		let errType = errArr[0];
		let errArg = errArr[1];
		let str = VALUE_ERROR[errType];
		switch(errType) {
			case("VE1"):
				return str;
			case("VE2"):
				return `${str} [${errArg}]`;
			case("VE3"):
				return `${str} ${getName(findID(errArg))}`;
			case("VE4"):
				return str; 
			case("VE5"): 
				return str;
			default: 
				return "Unknown error";
		}
	}
}

function checkValueError(primitive, value) {
	// 1. Empty string
	if (value === "") {
		return "VE1:";
	}

	let primType = primitive.value.nodeName;
	let linkedIds = findLinkedInPrimitives(primitive.id).map(getID);
	if (primType === "Stock" || primType === "Variable" || primType === "Flow") {
		// 2. Unknown reference
		let valueRefs = value.match(/[^[]+(?=\])/g);
		let linkedRefs = linkedIds.map(id => getName(findID(id)));
		if (valueRefs) {
			for (let ref of valueRefs) {
				if (linkedRefs.includes(ref) === false) {
					return `VE2:${ref}`;
				}
			}
		}

		// 3. Unused link 
		for(let i = 0; i < linkedIds.length; i++) {
			let ref = linkedRefs[i];
			if (valueRefs) {
				if (valueRefs.includes(ref) === false) {
					return `VE3:${linkedIds[i]}`;
				}
			} else {
				return `VE3:${linkedIds[i]}`;
			}
		}
	} else if (primType === "Converter") {
		if (linkedIds.length === 0) {
			// 4. No ingoing link 
			return "VE4:";
		} else if (linkedIds.length > 1) {
			// 5. More then one ingoing link 
			return `VE5:${linkedIds}`;
		}
	}
	// No error 
	return null;
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