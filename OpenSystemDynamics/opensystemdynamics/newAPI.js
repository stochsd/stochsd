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
