/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/

/*
 * This is for saving and restoring the model
 */
var state_store = new function() {
	self=this;
	self.state="";
	self.debug = function() {
		alert(self.state);
	};
	self.save = function() {
		self.state=getGraphXml(graph);
	};
	self.load = function() {
		importMXGraph(self.state);
	};
};


var imc_attribute_name={
	"STOCK":"InitialValue",
	"VARIABLE":"Equation",
	"FLOW":"FlowRate"
};

function imc_set_value(primitive, value) {
	var valueObj = findName(primitive).getValue();
	var attribute_name=imc_attribute_name[valueObj.tagName.toUpperCase()];
	if(attribute_name===undefined) {
		console.log("imc_set_value not implemented for "+valueObj.tagName);
		console.log(valueObj);
		return;
	}
	
	valueObj.setAttribute(attribute_name,value);
}

function imc_get_value(primitive) {
	// http://www.w3schools.com/xml/dom_nodes_get.asp
	var valueObj = findName(primitive).getValue();
	var attribute_name=imc_attribute_name[valueObj.tagName.toUpperCase()];

	if(attribute_name===undefined) {
		console.log("imc_get_value not implemented for "+valueObj.tagName);
		console.log(valueObj);
		return;
	}
	return valueObj.getAttribute(attribute_name);
}

/*
 * This is for saving and restoring variables
 */
var vars_store = new function() {
	self=this;
	self.state={};
	self.debug = function() {
		alert(JSON.stringify(self.state));
	};
	self.save = function(varname_array) {
		self.state={};
		for (i=0;i<varname_array.length; i++) {
			var varname = varname_array[i];
			var value=imc_get_value(varname_array[i]);
			console.log(varname+":"+value);
			self.state[varname]=value;
		}
	};
	self.load = function() {
		for (var key in self.state) {
			imc_set_value(key  , self.state[key]);
		}
	};
};

/*
 * This is used for saving the state before optimisation
 * And restoring afterwards  */
var state_store = new function() {
	self=this;
	self.state="";
	self.debug = function() {
		alert(self.state);
	};
	self.save = function() {
		self.state=getGraphXml(graph);
	};
	self.load = function() {
		importMXGraph(self.state);
	};
};

function import_model(model_xml_enc) {
    model_xml=decodeURI(model_xml_enc)
    importMXGraph(model_xml);
}
function returnresult(returnobj,target) {
    results={};
    results.target=target;
    results.returnobj=returnobj;
    parent.postMessage(JSON.stringify(results), "*");
}
function imc_gettimestep(target) {
    returnobj={};
    returnobj.timestep=getTimeStep();
    returnresult(returnobj,target);
}
function var_exists(varname,target) {
    returnobj={};
    returnobj.varname=varname;
    returnobj.exists=(findName(varname)!=null)?true:false;
    returnresult(returnobj,target);
}
function var_array_exists(varname_array,target) {
	returnobj={};
	returnobj.varname_array=varname_array;
	var result = {}
	for (i=0;i<varname_array.length; i++) {
		var exists=(findName(varname_array[i])!=null)?true:false;
		result[varname_array[i]] = exists;
	}
	returnobj.result=result;
	returnresult(returnobj,target);
}
function setstartseed(seedvalue) {
    // The {"value":seedvalue) instead of just seedvalue
    // is to replicate the behavoiur of insightmaker SetRandSeed
    Math.seedrandom(seedvalue);
}
function export_model() {
    returnobj={};
    var enc = new mxCodec();
    // IM uses getGraphXml(graph)
    // see Utilities.js
    var graph_dom=enc.encode(graph.getModel());
    //returnobj.xml_data="<InsightMakerModel>"+graph_dom.innerHTML+"</InsightMakerModel>";
    returnobj.xml_data=getGraphXml(graph);
    returnresult(returnobj,"export_model_return");
}
function imc_test() {
    alert("The IMC API is active");
}
//toggleSideBar();
//getmodelname();
