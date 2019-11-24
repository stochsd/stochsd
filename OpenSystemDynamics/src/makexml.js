/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/

var xmlDoc;
var root;

function xmlNode(type,nodeAttributes,cellAttributes,geometryAttributes,geometryChildren=null) {	
	var node=xmlDoc.createElement(type);
	var cell=xmlDoc.createElement("mxCell");
	var geometry = xmlDoc.createElement("mxGeometry");
	
	for(var key in nodeAttributes) {
		node.setAttribute(key,nodeAttributes[key]);
	}
	
	cell.setAttribute("parent","1");
	
	for(var key in cellAttributes) {
		cell.setAttribute(key,cellAttributes[key]);
	}
	
	
	// <mxGeometry x="240" y="90" width="100" height="40" as="geometry"/>
	geometry.setAttribute("x",100);
	geometry.setAttribute("y",100);
	geometry.setAttribute("width",100);
	geometry.setAttribute("height",100);
	geometry.setAttribute("as","geometry");

	for(var key in geometryAttributes) {
		geometry.setAttribute(key,geometryAttributes[key]);
	}

	for(var i in geometryChildren) {
			geometry.appendChild(geometryChildren[i]);	
	}
	cell.appendChild(geometry);
	node.appendChild(cell);
	return node;
}

function xmlStock(name,x,y) {
	return xmlNode("Stock",{"name":name},{},{"x":x,"y":y});
}

function xmlSetting() {
	return xmlNode("Setting",{},{"visible":"0"},{});
}


function XmlAttributesHashMap(xmlAttributes) {
	var result={};
	for(var i in xmlAttributes) {
		var name = xmlAttributes[i].name;
		var value = xmlAttributes[i].value;
		if(name==undefined || value==undefined) {
			continue;
		}
		result[name]=value;
	}
	return result;
}

function xmlPrimitive(primitive) {
	var type = getType(primitive);
	var superClass = get_object(getID(primitive)).superClass;
	// Settings and other non visible primtives does not have any superClass
	if(superClass == undefined) {
		superClass = "";
	}
	//~ alert(type+" "+superClass);
	
	var nodeAttributes = {};
	for(let attribute of primitive.value.attributes) {
		let name = attribute.name;
		let value = attribute.value;
		nodeAttributes[name]=value;
	}
	
	var style=type.toLowerCase();
	
	var cellAttributes={};
	var geometryAttributes={};
	var geometryChildren=null;
	
	const graphEnum={
		VERTEX:1,
		EDGE:2
	};
	var graphType=graphEnum.VERTEX;
	
	// Extracting visiblity from primitive
	//primitives("Display")[0].value.children[0].attributes["visible"];
	
	// If we have cell values add them
	if(primitive.value.children.length>0) {
		cellAttributes=XmlAttributesHashMap(primitive.value.children[0].attributes);
		geometryAttributes=XmlAttributesHashMap(primitive.value.children[0].children[0].attributes);
	}
	
	if(type=="Ghost") {
		var sourceID=primitive.getAttribute("Source");
		var sourceType=getType(findID(sourceID));
		style=sourceType.toLowerCase()+";opacity=30;";
	}
	
	if(superClass == "TwoPointer") {
		graphType = graphEnum.EDGE;
		
		var ends=getEnds(primitive);
		var source=ends[0];
		var target=ends[1];
		
		if(source!=null) {
			cellAttributes["source"]=source.getAttribute("id");
		}
		if(target!=null) {
			cellAttributes["target"]=target.getAttribute("id");
		}
		
		if(!(type=="Link" || type=="Flow")) {
			cellAttributes["visible"]="0";
		}
		
		var point1=xmlDoc.createElement("mxPoint");
		var point2=xmlDoc.createElement("mxPoint");
		
		let sourcePosition = getSourcePosition(primitive);
		let targetPosition = getTargetPosition(primitive);
		
		point1.setAttribute("as","sourcePoint");
		point1.setAttribute("x",sourcePosition[0].toString());
		point1.setAttribute("y",sourcePosition[1].toString());
				
		point2.setAttribute("as","targetPoint");
		point2.setAttribute("x",targetPosition[0].toString());
		point2.setAttribute("y",targetPosition[1].toString());
		
		geometryChildren=[];
		
		geometryChildren.push(point1);
		geometryChildren.push(point2);
	}
	
	switch(graphType) {
	case graphEnum.VERTEX:
		cellAttributes["vertex"]="1";
		break;
	case graphEnum.EDGE:
		cellAttributes["edge"]="1";
		break;
	}
	cellAttributes["style"]=style;
	
	var pos=getPosition(primitive);
	geometryAttributes["x"]=pos[0];
	geometryAttributes["y"]=pos[1];
	
	//~ for(var key in primitive["@attributes"]) {
		//~ alert(key+" "+primitive["@attributes"][key]);
	//~ }

	return xmlNode(type,nodeAttributes,cellAttributes,geometryAttributes,geometryChildren);
}

class InsightMakerDocument {
	constructor() {
		// http://stackoverflow.com/questions/14340894/create-xml-in-javascript
		xmlDoc = document.implementation.createDocument(null, "InsightMakerModel");
		root = xmlDoc.createElement("root");
		
		//~ <mxCell id="0"/>
		//~ <mxCell id="1" parent="0"/>
		var introCell1 = xmlDoc.createElement("mxCell");
		var introCell2 = xmlDoc.createElement("mxCell");
		introCell1.setAttribute("id","0");
		introCell2.setAttribute("id","1");
		introCell2.setAttribute("parent","0");
		root.appendChild(introCell1);
		root.appendChild(introCell2);
		
		//~ root.appendChild(xmlSetting());
		//~ root.appendChild(xmlStock("Stock1",80,50));
		
		xmlDoc.documentElement.appendChild(root);
	}
	appendPrimitives() {
		for(let type of saveblePrimitiveTypes) {
			var primitiveArray = primitives(type);
			for(var i in primitiveArray) {
				root.appendChild(xmlPrimitive(primitiveArray[i]));
			}
		}
	}
	getXmlString() {
		var xmlText = new XMLSerializer().serializeToString(xmlDoc);
		var formatedXmlText = xmlText.replace(/\>/g,">\n");
		return formatedXmlText;
	}
}

function createModelFileData() {
	InsightMakerDocumentWriter = new InsightMakerDocument();
	InsightMakerDocumentWriter.appendPrimitives();
	return InsightMakerDocumentWriter.getXmlString();
}
