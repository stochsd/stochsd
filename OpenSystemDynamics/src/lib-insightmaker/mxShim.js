"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/

/*

Lightweight shim for mxGraph when not using visualization components. Supports loading saved models and carrying out basic edit operations.

*/

// Override this in UI
var defaultAttributeChangeHandler=function(primitive,attributeName,value) {};
var defaultPositionChangeHandler=function(primitive) {};
var defaultPrimitiveCreatedHandler = function(primitive) {};
var defaultPrimitiveBeforeDestroyHandler = function(primitive) {};

class SimpleNode {
	constructor() {
		this.attributeSubscribers=[];
		this.positionSubscribers=[];
	}
	getAttribute(x) {
		return this.value.getAttribute(x);
	}
	setAttribute(x, value) {
		this.value.setAttribute(x,value);
		defaultAttributeChangeHandler(this,x,value);
		for(var i in this.attributeSubscribers) {
			this.attributeSubscribers[i](x,value);
		}
	}
	positionUpdate() {
		defaultPositionChangeHandler(this);
		for(var i in this.positionSubscribers) {
			this.positionSubscribers[i]();
		}
	}
	subscribeAttribute(handler) {
		this.attributeSubscribers.push(handler);
	}
	subscribePosition(handler) {
		this.positionSubscribers.push(handler);
	}
}



function loadXML(modelString) {
	var xmldocument;
	var oParser = new DOMParser();
	xmldocument = oParser.parseFromString(modelString, "text/xml");
	graph = mxGraphToJson(xmldocument);
	var string = (new XMLSerializer()).serializeToString(xmldocument);
	graph.children[0].value = {nodeName: 'root', id: 1};
	graph.children[0].id = 1;
	
	
	clearPrimitiveCache();
	var connectors = findType(["Flow", "Link", "Transition"]);
	var items = primitives();
	connectors.forEach(function(x){
		x.source = null;
		x.target = null;
		items.forEach(function(i){
			if(x.children[0].getAttribute("source") && x.children[0].getAttribute("source") == i.id){
				x.source = i;
			}
			if(x.children[0].getAttribute("target") && x.children[0].getAttribute("target") == i.id){
				x.target = i;
			}
		})
	});
	
	clearPrimitiveCache();
	
	function cleanCell(x){
		if(x.children){
			var cells = x.children.filter(function(c){
				return c.value.nodeName == "mxCell";
			});
		
			if(cells.length > 0){
				if(cells[0].getAttribute("parent")){
					setParent(x, findID(cells[0].getAttribute("parent")));
				}
			}
		
			x.children = x.children.filter(function(c){
				return c.value.nodeName != "mxCell";
			});
		
			for(var i = x.children.length - 1; i >= 0; i--){
				cleanCell(x.children[i]);
			};
		}
		
	}
	cleanCell(graph);
	
	clearPrimitiveCache();
	
	return graph;
}

function simpleCloneNode2(node, parent){
	var obj = new SimpleNode();
	//http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript
	obj.value = node.value.cloneNode(true);
	obj.parent = parent;
	obj.parentNode= parent;

	// Generate new id for object. This must be done after attributes are set to not override it
	var currId = [1].concat(primitives().map(function(x){return x.id}).filter(function(x){return x}));
	var newId = Math.max.apply(null, currId) + 1;
	obj.id=newId;
	obj.setAttribute("id",newId);
	
	
	var parent = graph.children[0].children[0];
	parent.children.push(obj);	
	
	return obj;
}

function simpleCloneNode(node, parent){
	var obj = new SimpleNode();
	obj.value = node.cloneNode(true);
	obj.parent = parent;
	obj.parentNode= parent;
	

	var currId = [1].concat(primitives().map(function(x){return x.id}).filter(function(x){return x}));
	
	obj.setAttribute("id", Math.max.apply(null, currId) + 1);
	
	if (node.attributes.length > 0) {
		
		for (var j = 0; j < node.attributes.length; j++) {
			var attribute = node.attributes.item(j);
			obj.setAttribute(attribute.nodeName,attribute.nodeValue);
		}
		
	}
	obj.id = obj.getAttribute("id");
	
	
	return obj;
}

function mxGraphToJson(xml, parent) {
	// Create the return object
	var obj = new SimpleNode();
	obj.value = xml;
	obj["@nodeName"]=xml.nodeName;
	obj.parent = parent;
	obj.parentNode = parent;

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
			
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				
				obj.setAttribute(attribute.nodeName,attribute.nodeValue);
			}
			obj.id = obj.getAttribute("id");
			
		}
	} else if (xml.nodeType == 3) { // text
		return null;
	}

	if (xml.hasChildNodes()) {
		obj.children = [];
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			var x = mxGraphToJson(item, obj);
			if(x){
				obj.children.push(x);
			}
		}
	}
	return obj;
};

function setAttributeUndoable(primitive, name, value){
	if(primitive instanceof SimpleNode){
		primitive.setAttribute(name, value);
		clearPrimitiveCache();
	}else{
		var edit = new mxCellAttributeChange(primitive, name, value);
		graph.getModel().execute(edit);
	}
}
