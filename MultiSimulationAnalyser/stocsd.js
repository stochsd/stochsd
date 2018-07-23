/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
var model_name=false;
var model_data="";
var debug_mode=false
// This is an associative array of events that must be tested before saving
var save_hook_array={};
var log="";
const introMessage = `When runnning MultiSimulationAnalyser(MSA) it is subordinate to OpenSystemDynamics
This means OpenSystemDynamics(OSD) runs in an iframe with id 'SimulationIFrame' inside of MSA
If you want to debug OSD you must first select the 'SimulationIFrame' frame in the Javascript-debugger.
To do so click on where it says "top" in the Chrome/NodeJS debugger and choose "SimulationIFrame".
Alternativly you could also run OpenSystemDynamics separately which might be easier`;



function debug_out(message) {
	if(debug_mode) {
		console.log(message);
	}
}




function update_debug_mode() {
    if(location.hash=="#debug") {
        debug_mode=true;
        $(".debug_visible").addClass("debug_active");
    } else {
        debug_mode=false;
        $(".debug_visible").removeClass("debug_active");
    }
}

window.onhashchange = update_debug_mode;

var color_none="white";
var color_halted="#ffb554";
var color_running="yellow";
var color_done="lightgreen";
var stocsd_eformat=false;
var status_color={}
status_color["halted"]="#ADE7EA";
status_color["running"]="yellow";
status_color["done"]="lightgreen";
status_color["none"]="white";


status_display={};
status_display["halted"]="HALTED";
status_display["running"]="RUNNING";
status_display["done"]="DONE";
status_display["none"]="";

$(document).ready(function() {
    $(filemanager_container).html(filemanager_view);
    $(optim_container).html(optim_view);
    $(parmest_container).html(parmest_view);
    $(stocres_container).html(stocres_view);
    $(sensi_container).html(sensi_view);
    init_stocsd();
    location.hash="";
    update_debug_mode();
	
	$("#SimulationIFrame")[0].onload=function() {
		// Show tool menu in StochSim/InsightMaker
		im_show_tool();
		
		// Make the iframe focused when application start so that StochSim/InsightMaker can use keyboard shortcuts
		var iframe = $("#SimulationIFrame")[0];
		iframe.contentWindow.focus();
		
		// Hide side bar
		imc_hideSideBar();
	};
	console.log(introMessage);
});

function init_stocsd() {
    //alert("optim init finished");
    // When loaded all the html we convert id to var


    id_to_var();
    keyvalidate_apply();
    panel_init();
    stocres.init();
    optim.init();
    parmest.init();
    sensi.init();
    clear_all_apps();
    $(cmd_new_file).click(function() {
        model_name=undefined;
        model_data=undefined;
        txt_model_file.val("");
        localStorage.removeItem("im_stocsd_last_model_data","");
        load_local_insightmaker();
        //frm_openmodel_open_model(settings.start_url);
        runline("clearModel()");
        clear_all_apps();
		$(".txt_freetext").val("");
    });
    
    $(".icon").click(function() {
        app_name=$(this).attr("data-app");
        load_app(app_name);
    });
	$(".chk_showgui").change(function() {
		if($(this).prop("checked")==false) {
			imc_simulation_close();
		}
	});
    
    $( "#tabs" ).tabs();
    /*
    $("#cmd_import_file").click(function() {
        var model_data='<InsightMakerModel><root><mxCell id="0"></mxCell><mxCell id="1" parent="0"></mxCell><Display name="Stoc. SIR model" Note="" Type="Time Series" xAxis="Time (%u)" yAxis="" yAxis2="" showMarkers="false" showLines="true" showArea="false" ThreeDimensional="false" Primitives="24" Primitives2="" AutoAddPrimitives="false" ScatterplotOrder="X Primitive, Y Primitive" Image="Display" FlipHorizontal="false" FlipVertical="false" LabelPosition="Bottom" legendPosition="Automatic" id="43"><mxCell style="display" parent="1" vertex="1" visible="0"><mxGeometry x="10" y="10" width="64" height="64" as="geometry"></mxGeometry></mxCell></Display><Display name="Default Display" Note="" Type="Tabular" xAxis="Time (%u)" yAxis="" ThreeDimensional="false" Primitives="23,25,24,44,45" AutoAddPrimitives="true" ScatterplotOrder="X Primitive, Y Primitive" Image="Display" yAxis2="" Primitives2="24" showMarkers="false" showLines="true" showArea="false" legendPosition="Automatic" id="3"><mxCell style="roundImage;image=/builder/images/DisplayFull.png;" parent="1" vertex="1" visible="0"><mxGeometry x="50" y="20" width="64" height="64" as="geometry"></mxGeometry></mxCell></Display><Setting Note="" Version="36" TimeLength="200" TimeStart="0" TimeStep="0.1" TimeUnits="Years" StrictUnits="true" Units="" HiddenUIGroups="Validation,User Interface" SolutionAlgorithm="RK1" BackgroundColor="white" Throttle="-1" Macros="" SensitivityPrimitives="" SensitivityRuns="50" SensitivityBounds="50, 80, 95, 100" SensitivityShowRuns="false" article="{&quot;comments&quot;:true, &quot;facebookUID&quot;: &quot;&quot;}" StyleSheet="{}" id="2"><mxCell parent="1" vertex="1" visible="0"><mxGeometry x="20" y="20" width="80" height="40" as="geometry"></mxGeometry></mxCell></Setting><Stock name="S" Note="" InitialValue="1000" StockMode="Store" Delay="10" Volume="100" NonNegative="false" Units="Unitless" MaxConstraintUsed="false" MinConstraintUsed="false" MaxConstraint="100" MinConstraint="0" ShowSlider="false" SliderMax="100" SliderMin="0" SliderStep="" Image="None" FlipHorizontal="false" FlipVertical="false" LabelPosition="Middle" id="23"><mxCell style="stock" parent="1" vertex="1"><mxGeometry x="60" y="20" width="60" height="40" as="geometry"></mxGeometry></mxCell></Stock><Stock name="I" Note="" InitialValue="10" StockMode="Store" Delay="10" Volume="100" NonNegative="false" Units="Unitless" MaxConstraintUsed="false" MinConstraintUsed="false" MaxConstraint="100" MinConstraint="0" ShowSlider="false" SliderMax="100" SliderMin="0" SliderStep="" Image="None" FlipHorizontal="false" FlipVertical="false" LabelPosition="Middle" id="24"><mxCell style="stock" parent="1" vertex="1"><mxGeometry x="210" y="20" width="70" height="40" as="geometry"></mxGeometry></mxCell></Stock><Stock name="R" Note="" InitialValue="0" StockMode="Store" Delay="10" Volume="100" NonNegative="false" Units="Unitless" MaxConstraintUsed="false" MinConstraintUsed="false" MaxConstraint="100" MinConstraint="0" ShowSlider="false" SliderMax="100" SliderMin="0" SliderStep="" Image="None" FlipHorizontal="false" FlipVertical="false" LabelPosition="Middle" id="25"><mxCell style="stock" parent="1" vertex="1"><mxGeometry x="375" y="20" width="70" height="40" as="geometry"></mxGeometry></mxCell></Stock><Flow name="F1" Note="" FlowRate="RandPoisson(0.1*[S]*[I]*[c])/Timestep()" OnlyPositive="true" TimeIndependent="false" Units="Unitless" MaxConstraintUsed="false" MinConstraintUsed="false" MaxConstraint="100" MinConstraint="0" ShowSlider="true" SliderMax="100" SliderMin="0" SliderStep="" id="26"><mxCell style="flow;startFill=0" parent="1" source="23" target="24" edge="1"><mxGeometry width="100" height="100" as="geometry"><mxPoint x="-160" y="10" as="sourcePoint"></mxPoint><mxPoint x="-60" y="-90" as="targetPoint"></mxPoint><mxPoint x="5" y="-20.5" as="offset"></mxPoint></mxGeometry></mxCell></Flow><Variable name="c" Note="" Equation="0.0003" Units="Unitless" MaxConstraintUsed="false" MinConstraintUsed="false" MaxConstraint="100" MinConstraint="0" ShowSlider="false" SliderMax="100" SliderMin="0" SliderStep="" Image="None" FlipHorizontal="false" FlipVertical="false" LabelPosition="Middle" id="28"><mxCell style="variable" parent="1" vertex="1"><mxGeometry x="135" y="125" width="50" height="50" as="geometry"></mxGeometry></mxCell></Variable><Variable name="T" Note="Time constant for I-stage" Equation="4" Units="Unitless" MaxConstraintUsed="false" MinConstraintUsed="false" MaxConstraint="100" MinConstraint="0" ShowSlider="false" SliderMax="100" SliderMin="0" SliderStep="" Image="None" FlipHorizontal="false" FlipVertical="false" LabelPosition="Middle" id="29"><mxCell style="variable" parent="1" vertex="1"><mxGeometry x="300" y="125" width="50" height="50" as="geometry"></mxGeometry></mxCell></Variable><Link name="Link" Note="" BiDirectional="false" id="33"><mxCell style="link" parent="1" source="28" target="26" edge="1"><mxGeometry x="-160" y="-90" width="100" height="100" as="geometry"><mxPoint x="-160" y="10" as="sourcePoint"></mxPoint><mxPoint x="-60" y="-90" as="targetPoint"></mxPoint></mxGeometry></mxCell></Link><Flow name="F2" Note="" FlowRate="RandPoisson(0.1*[I]/[T])/Timestep()" OnlyPositive="true" TimeIndependent="false" Units="Unitless" MaxConstraintUsed="false" MinConstraintUsed="false" MaxConstraint="100" MinConstraint="0" ShowSlider="false" SliderMax="100" SliderMin="0" SliderStep="" id="37"><mxCell style="flow" parent="1" source="24" target="25" edge="1"><mxGeometry width="100" height="100" as="geometry"><mxPoint x="300" y="40" as="sourcePoint"></mxPoint><mxPoint x="-60" y="-100" as="targetPoint"></mxPoint><mxPoint x="2.5" y="-20.5" as="offset"></mxPoint></mxGeometry></mxCell></Flow><Variable name="StopIf" Note="" Equation="If [I]&lt;=0.00001 Then\n  #Alert(&quot;elapsed time &quot;+Years())\n  Stop()\nEnd If" Units="Unitless" MaxConstraintUsed="false" MinConstraintUsed="false" MaxConstraint="100" MinConstraint="0" ShowSlider="true" SliderMax="100" SliderMin="0" SliderStep="" Image="None" FlipHorizontal="false" FlipVertical="false" LabelPosition="Middle" id="40"><mxCell style="variable;fillColor=#FF6600;fontStyle=1;fontSize=18" parent="1" vertex="1"><mxGeometry x="185" y="210" width="115" height="50" as="geometry"></mxGeometry></mxCell></Variable><Link name="Link" Note="" BiDirectional="false" id="41"><mxCell style="link" parent="1" source="24" target="40" edge="1"><mxGeometry width="100" height="100" as="geometry"><mxPoint y="100" as="sourcePoint"></mxPoint><mxPoint x="100" as="targetPoint"></mxPoint></mxGeometry></mxCell></Link><Link name="Link" Note="" BiDirectional="false" id="42"><mxCell style="link" parent="1" source="29" target="37" edge="1"><mxGeometry width="100" height="100" as="geometry"><mxPoint y="100" as="sourcePoint"></mxPoint><mxPoint x="100" as="targetPoint"></mxPoint></mxGeometry></mxCell></Link><Variable name="Tid" Note="" Equation="Years()" Units="Unitless" MaxConstraintUsed="false" MinConstraintUsed="false" MaxConstraint="100" MinConstraint="0" ShowSlider="false" SliderMax="100" SliderMin="0" SliderStep="" Image="None" FlipHorizontal="false" FlipVertical="false" LabelPosition="Middle" id="44"><mxCell style="variable" parent="1" vertex="1"><mxGeometry x="500" y="175" width="120" height="50" as="geometry"></mxGeometry></mxCell></Variable><Variable name="asd" Note="" Equation="0" Units="Unitless" MaxConstraintUsed="false" MinConstraintUsed="false" MaxConstraint="100" MinConstraint="0" ShowSlider="false" SliderMax="100" SliderMin="0" SliderStep="" Image="None" FlipHorizontal="false" FlipVertical="false" LabelPosition="Middle" id="45"><mxCell style="variable" parent="1" vertex="1"><mxGeometry x="490" y="310" width="120" height="50" as="geometry"></mxGeometry></mxCell></Variable></root></InsightMakerModel>';
        var graph_source_data = "<mxGraphModel>\n  <root>\n    <mxCell id=\"0\"\/>\n    <mxCell id=\"1\" parent=\"0\"\/>\n    <Display name=\"Stoc. SIR model\" Note=\"\" Type=\"Time Series\" xAxis=\"Time (%u)\" yAxis=\"\" yAxis2=\"\" showMarkers=\"false\" showLines=\"true\" showArea=\"false\" ThreeDimensional=\"false\" Primitives=\"24\" Primitives2=\"\" AutoAddPrimitives=\"false\" ScatterplotOrder=\"X Primitive, Y Primitive\" Image=\"Display\" FlipHorizontal=\"false\" FlipVertical=\"false\" LabelPosition=\"Bottom\" legendPosition=\"Automatic\" id=\"43\">\n      <mxCell style=\"display\" parent=\"1\" vertex=\"1\" visible=\"0\">\n        <mxGeometry x=\"10\" y=\"10\" width=\"64\" height=\"64\" as=\"geometry\"\/>\n      <\/mxCell>\n    <\/Display>\n    <Display name=\"Default Display\" Note=\"\" Type=\"Tabular\" xAxis=\"Time (%u)\" yAxis=\"\" ThreeDimensional=\"false\" Primitives=\"23,25,24,44,45\" AutoAddPrimitives=\"true\" ScatterplotOrder=\"X Primitive, Y Primitive\" Image=\"Display\" yAxis2=\"\" Primitives2=\"24\" showMarkers=\"false\" showLines=\"true\" showArea=\"false\" legendPosition=\"Automatic\" id=\"3\">\n      <mxCell style=\"roundImage;image=\/builder\/images\/DisplayFull.png;\" parent=\"1\" vertex=\"1\" visible=\"0\">\n        <mxGeometry x=\"50\" y=\"20\" width=\"64\" height=\"64\" as=\"geometry\"\/>\n      <\/mxCell>\n    <\/Display>\n    <Setting Note=\"\" Version=\"36\" TimeLength=\"200\" TimeStart=\"0\" TimeStep=\"0.1\" TimeUnits=\"Years\" StrictUnits=\"true\" Units=\"\" HiddenUIGroups=\"Validation,User Interface\" SolutionAlgorithm=\"RK1\" BackgroundColor=\"white\" Throttle=\"-1\" Macros=\"\" SensitivityPrimitives=\"\" SensitivityRuns=\"50\" SensitivityBounds=\"50, 80, 95, 100\" SensitivityShowRuns=\"false\" article=\"{&quot;comments&quot;:true, &quot;facebookUID&quot;: &quot;&quot;}\" StyleSheet=\"{}\" id=\"2\">\n      <mxCell parent=\"1\" vertex=\"1\" visible=\"0\">\n        <mxGeometry x=\"20\" y=\"20\" width=\"80\" height=\"40\" as=\"geometry\"\/>\n      <\/mxCell>\n    <\/Setting>\n    <Stock name=\"S\" Note=\"\" InitialValue=\"1000\" StockMode=\"Store\" Delay=\"10\" Volume=\"100\" NonNegative=\"false\" Units=\"Unitless\" MaxConstraintUsed=\"false\" MinConstraintUsed=\"false\" MaxConstraint=\"100\" MinConstraint=\"0\" ShowSlider=\"false\" SliderMax=\"100\" SliderMin=\"0\" SliderStep=\"\" Image=\"None\" FlipHorizontal=\"false\" FlipVertical=\"false\" LabelPosition=\"Middle\" id=\"23\">\n      <mxCell style=\"stock\" parent=\"1\" vertex=\"1\">\n        <mxGeometry x=\"60\" y=\"20\" width=\"60\" height=\"40\" as=\"geometry\"\/>\n      <\/mxCell>\n    <\/Stock>\n    <Stock name=\"I\" Note=\"\" InitialValue=\"10\" StockMode=\"Store\" Delay=\"10\" Volume=\"100\" NonNegative=\"false\" Units=\"Unitless\" MaxConstraintUsed=\"false\" MinConstraintUsed=\"false\" MaxConstraint=\"100\" MinConstraint=\"0\" ShowSlider=\"false\" SliderMax=\"100\" SliderMin=\"0\" SliderStep=\"\" Image=\"None\" FlipHorizontal=\"false\" FlipVertical=\"false\" LabelPosition=\"Middle\" id=\"24\">\n      <mxCell style=\"stock\" parent=\"1\" vertex=\"1\">\n        <mxGeometry x=\"210\" y=\"20\" width=\"70\" height=\"40\" as=\"geometry\"\/>\n      <\/mxCell>\n    <\/Stock>\n    <Stock name=\"R\" Note=\"\" InitialValue=\"0\" StockMode=\"Store\" Delay=\"10\" Volume=\"100\" NonNegative=\"false\" Units=\"Unitless\" MaxConstraintUsed=\"false\" MinConstraintUsed=\"false\" MaxConstraint=\"100\" MinConstraint=\"0\" ShowSlider=\"false\" SliderMax=\"100\" SliderMin=\"0\" SliderStep=\"\" Image=\"None\" FlipHorizontal=\"false\" FlipVertical=\"false\" LabelPosition=\"Middle\" id=\"25\">\n      <mxCell style=\"stock\" parent=\"1\" vertex=\"1\">\n        <mxGeometry x=\"375\" y=\"20\" width=\"70\" height=\"40\" as=\"geometry\"\/>\n      <\/mxCell>\n    <\/Stock>\n    <Flow name=\"F1\" Note=\"\" FlowRate=\"RandPoisson(0.1*[S]*[I]*[c])\/Timestep()\" OnlyPositive=\"true\" TimeIndependent=\"false\" Units=\"Unitless\" MaxConstraintUsed=\"false\" MinConstraintUsed=\"false\" MaxConstraint=\"100\" MinConstraint=\"0\" ShowSlider=\"true\" SliderMax=\"100\" SliderMin=\"0\" SliderStep=\"\" id=\"26\">\n      <mxCell style=\"flow;startFill=0\" parent=\"1\" source=\"23\" target=\"24\" edge=\"1\">\n        <mxGeometry width=\"100\" height=\"100\" as=\"geometry\">\n          <mxPoint x=\"-160\" y=\"10\" as=\"sourcePoint\"\/>\n          <mxPoint x=\"-60\" y=\"-90\" as=\"targetPoint\"\/>\n          <mxPoint x=\"5\" y=\"-20.5\" as=\"offset\"\/>\n        <\/mxGeometry>\n      <\/mxCell>\n    <\/Flow>\n    <Variable name=\"c\" Note=\"\" Equation=\"0.0003\" Units=\"Unitless\" MaxConstraintUsed=\"false\" MinConstraintUsed=\"false\" MaxConstraint=\"100\" MinConstraint=\"0\" ShowSlider=\"false\" SliderMax=\"100\" SliderMin=\"0\" SliderStep=\"\" Image=\"None\" FlipHorizontal=\"false\" FlipVertical=\"false\" LabelPosition=\"Middle\" id=\"28\">\n      <mxCell style=\"variable\" parent=\"1\" vertex=\"1\">\n        <mxGeometry x=\"135\" y=\"125\" width=\"50\" height=\"50\" as=\"geometry\"\/>\n      <\/mxCell>\n    <\/Variable>\n    <Variable name=\"T\" Note=\"Time constant for I-stage\" Equation=\"4\" Units=\"Unitless\" MaxConstraintUsed=\"false\" MinConstraintUsed=\"false\" MaxConstraint=\"100\" MinConstraint=\"0\" ShowSlider=\"false\" SliderMax=\"100\" SliderMin=\"0\" SliderStep=\"\" Image=\"None\" FlipHorizontal=\"false\" FlipVertical=\"false\" LabelPosition=\"Middle\" id=\"29\">\n      <mxCell style=\"variable\" parent=\"1\" vertex=\"1\">\n        <mxGeometry x=\"300\" y=\"125\" width=\"50\" height=\"50\" as=\"geometry\"\/>\n      <\/mxCell>\n    <\/Variable>\n    <Link name=\"Link\" Note=\"\" BiDirectional=\"false\" id=\"33\">\n      <mxCell style=\"link\" parent=\"1\" source=\"28\" target=\"26\" edge=\"1\">\n        <mxGeometry x=\"-160\" y=\"-90\" width=\"100\" height=\"100\" as=\"geometry\">\n          <mxPoint x=\"-160\" y=\"10\" as=\"sourcePoint\"\/>\n          <mxPoint x=\"-60\" y=\"-90\" as=\"targetPoint\"\/>\n        <\/mxGeometry>\n      <\/mxCell>\n    <\/Link>\n    <Flow name=\"F2\" Note=\"\" FlowRate=\"RandPoisson(0.1*[I]\/[T])\/Timestep()\" OnlyPositive=\"true\" TimeIndependent=\"false\" Units=\"Unitless\" MaxConstraintUsed=\"false\" MinConstraintUsed=\"false\" MaxConstraint=\"100\" MinConstraint=\"0\" ShowSlider=\"false\" SliderMax=\"100\" SliderMin=\"0\" SliderStep=\"\" id=\"37\">\n      <mxCell style=\"flow\" parent=\"1\" source=\"24\" target=\"25\" edge=\"1\">\n        <mxGeometry width=\"100\" height=\"100\" as=\"geometry\">\n          <mxPoint x=\"300\" y=\"40\" as=\"sourcePoint\"\/>\n          <mxPoint x=\"-60\" y=\"-100\" as=\"targetPoint\"\/>\n          <mxPoint x=\"2.5\" y=\"-20.5\" as=\"offset\"\/>\n        <\/mxGeometry>\n      <\/mxCell>\n    <\/Flow>\n    <Variable name=\"StopIf\" Note=\"\" Equation=\"If [I]&lt;=0.00001 Then\\n  #Alert(&quot;elapsed time &quot;+Years())\\n  Stop()\\nEnd If\" Units=\"Unitless\" MaxConstraintUsed=\"false\" MinConstraintUsed=\"false\" MaxConstraint=\"100\" MinConstraint=\"0\" ShowSlider=\"true\" SliderMax=\"100\" SliderMin=\"0\" SliderStep=\"\" Image=\"None\" FlipHorizontal=\"false\" FlipVertical=\"false\" LabelPosition=\"Middle\" id=\"40\">\n      <mxCell style=\"variable;fillColor=#FF6600;fontStyle=1;fontSize=18\" parent=\"1\" vertex=\"1\">\n        <mxGeometry x=\"185\" y=\"210\" width=\"115\" height=\"50\" as=\"geometry\"\/>\n      <\/mxCell>\n    <\/Variable>\n    <Link name=\"Link\" Note=\"\" BiDirectional=\"false\" id=\"41\">\n      <mxCell style=\"link\" parent=\"1\" source=\"24\" target=\"40\" edge=\"1\">\n        <mxGeometry width=\"100\" height=\"100\" as=\"geometry\">\n          <mxPoint y=\"100\" as=\"sourcePoint\"\/>\n          <mxPoint x=\"100\" as=\"targetPoint\"\/>\n        <\/mxGeometry>\n      <\/mxCell>\n    <\/Link>\n    <Link name=\"Link\" Note=\"\" BiDirectional=\"false\" id=\"42\">\n      <mxCell style=\"link\" parent=\"1\" source=\"29\" target=\"37\" edge=\"1\">\n        <mxGeometry width=\"100\" height=\"100\" as=\"geometry\">\n          <mxPoint y=\"100\" as=\"sourcePoint\"\/>\n          <mxPoint x=\"100\" as=\"targetPoint\"\/>\n        <\/mxGeometry>\n      <\/mxCell>\n    <\/Link>\n    <Variable name=\"Tid\" Note=\"\" Equation=\"Years()\" Units=\"Unitless\" MaxConstraintUsed=\"false\" MinConstraintUsed=\"false\" MaxConstraint=\"100\" MinConstraint=\"0\" ShowSlider=\"false\" SliderMax=\"100\" SliderMin=\"0\" SliderStep=\"\" Image=\"None\" FlipHorizontal=\"false\" FlipVertical=\"false\" LabelPosition=\"Middle\" id=\"44\">\n      <mxCell style=\"variable\" parent=\"1\" vertex=\"1\">\n        <mxGeometry x=\"500\" y=\"175\" width=\"120\" height=\"50\" as=\"geometry\"\/>\n      <\/mxCell>\n    <\/Variable>\n    <Variable name=\"asd\" Note=\"\" Equation=\"0\" Units=\"Unitless\" MaxConstraintUsed=\"false\" MinConstraintUsed=\"false\" MaxConstraint=\"100\" MinConstraint=\"0\" ShowSlider=\"false\" SliderMax=\"100\" SliderMin=\"0\" SliderStep=\"\" Image=\"None\" FlipHorizontal=\"false\" FlipVertical=\"false\" LabelPosition=\"Middle\" id=\"45\">\n      <mxCell style=\"variable\" vertex=\"1\" parent=\"1\">\n        <mxGeometry x=\"490\" y=\"310\" width=\"120\" height=\"50\" as=\"geometry\"\/>\n      <\/mxCell>\n    <\/Variable>\n  <\/root>\n<\/mxGraphModel>\n";
        debug_out(graph_source_data);
        load_model_data(graph_source_data);
    });
    */
    
    
    
    $(cmd_export_file).click(function() {
		for(var key in save_hook_array) {
			if (save_hook_array[key]()==false) {
				return;
			}
		}
        runline('export_model();'); 
    });
    
    $(cmd_import_file).click(function() {
        $(fil_upload_file).click();
    });
    $(".cmd_print").click(cmd_print_click);
    $(".e_format_checkbox").click(function() {
        stocsd_eformat=$(this).prop("checked");
        // Make all e_format_checkbox do the same
        $(".e_format_checkbox").prop("checked",stocsd_eformat);
        
        
        
        
        
        stocsd_format_update();
    });
    
    if(settings.filemanager_enable) {
		filemanager_icon.removeClass("hidden");
		stocsd_div_filemanager.removeClass("hidden");
	}
    
    $(".stocsd_version").html(settings.stocsd_version);
    $(".im_version").html(settings.im_version);
    $(".e_format_checkbox").prop("checked",stocsd_eformat);
    $(".cmd_help").click(help_handler);


      function readSingleFile(evt) {
        //Retrieve the first (and only!) File from the FileList object
        var f = evt.target.files[0]; 

        if (f) {
          var r = new FileReader();
          r.onload = function(e) { 
              var contents = e.target.result;
              load_model_data(contents);
            txt_model_file.val(f.name);
            clear_all_apps();
            setTimeout(current_app.show, 1);
            load_local_insightmaker();
          }
          r.readAsText(f);
        } else { 
        //alert("Failed to load file");
        }
      }

  document.getElementById('fil_upload_file').addEventListener('change', readSingleFile, false);
    
    var last_app=localStorage.getItem("stocsd_last_app");
    if(last_app==null) {
        load_app(settings.start_app);
    } else {
        load_app(last_app);
    }
    panel.show();
    cmd_minimize_click();
    
    nwjsInit();
}

function nwjsInit() {
	if (typeof require === "undefined") {
		this.nwActive = false;
	} else {
		unsafeNwjsInit();
	}
}

// This can only executed safely if we know that NWJS is running
// If one try to execut it without NWJS it will generate errors
function unsafeNwjsInit() {
	var ngui = require("nw.gui");
	var nwin = ngui.Window.get();
	var app = ngui.App;
	
	nwin.on("close",function(event) {
		runline("quitQuestion();");
	});
}

function clear_all_apps() {
    stocres.clear_all();
    optim.clear_all();
    parmest.clear_all();
    sensi.clear_all();
}

function load_app(app_name) {
    $(".app_container").hide();
    switch(app_name) {
        case "filemanager":
            $(filemanager_container).show();
            current_app = filemanager;
            break;     
        case "parmest":
            $(parmest_container).show();
            current_app = parmest;
            break;        
        case "stocres":
            $(stocres_container).show();
            current_app = stocres;
            break;
        case "optim":
            $(optim_container).show();
            current_app = optim;
            break;
        case "sensi":
            $(sensi_container).show();
            current_app = sensi;
            break;
    }
    init_app(current_app);
    localStorage.setItem("stocsd_last_app",app_name);
    panel_unminimize();
}

function init_app(app) {
    if(app.show!=undefined) {
        app.show();
    }
    //$(app_title).html(app.title+" for Insight Maker");
	$(app_title).html(app.title);
    $(app_icon).attr("src","icons/"+app.codename+".png");
}

function load_local_insightmaker() {
    if($('#SimulationIFrame').attr('src')!=settings.start_url) {
        frm_openmodel_open_model(settings.start_url);
    }
}

current_app=optim;

function print_mode(mode) {
    if(mode) {
        $(".has_print_mode").addClass("print_mode");
    } else {
        $(".has_print_mode").removeClass("print_mode");
    }
}

var help_active = false;
function help_handler(){
	if(help_active) {
		debug_out("Could not show help, because one does already exist");
		return;
	}
    
    
    var help_text_id=$(this).attr("data-help-text-id");
    
    // Special case
    if(help_text_id=="[[app_help]]") {
        help_text_id=current_app.codename+"_help";
        //~ alert("a  ctive");
    }
    if($("#"+help_text_id).length==0) {
		alert("info box with id "+help_text_id+" does not exist");
		return;
	}
	
	//Close old dialog of the same kind(if exists)
    $("div[data-help-text-id="+help_text_id+"]").dialog("close");
    
    var help_text=$("#"+help_text_id).html();
    var help_title=$("#"+help_text_id).find(".help_title").html();
    
    //alert(help_text);
    // Defaults if not overriden
    if(help_title == undefined) {
		help_title = current_app.title+" Help";
		//~ alert("title undefined");
	}
	

    

    
    var form_width = 600;
	var help_form_div = $(document.createElement('div'));
	help_form_div.addClass("help_form_div");
	help_form_div.attr("data-help-text-id",help_text_id);	
	help_form_div.html(form_help_template.html());
	help_form_div.children(".help_content_container").html(help_text);
	help_form_div.children(".help_close_button").click(function() {
		help_form_div.dialog("close");
	});
	// Support for help in another help
	help_form_div.find(".cmd_help").click(help_handler);
    // http://stackoverflow.com/questions/171928/hook-into-dialog-close-event
    help_form_div.dialog({
		title: help_title,
		resizable: false,
		position: 'center',
		width: form_width
    });
}

function load_model_data(model_data) {
    localStorage.setItem("im_stocsd_last_model_data",model_data);
    var model_data_enc=encodeURI(model_data);
    var command="import_model('"+model_data_enc+"');";
    runline(command);
    $(".txt_freetext").val("");
}

function load_last_model_data() {
    model_name=localStorage.getItem("im_stocsd_last_model_name");
    if(model_name==null) {
        model_name="";
    }
    txt_model_file.val(model_name);
    model_data=localStorage.getItem("im_stocsd_last_model_data");
    if(model_data==null) {
        model_data="";
    }
    load_model_data(model_data);
}

function stocsd_format_old(number, tdecimals) {
	// Used when e.g. the actuall error is reseted to null
	if(number == null) {
		return "";
	}
    if(tdecimals===undefined) {
        tdecimals=decimals;
    }
    if(stocsd_eformat) {
        return number.toExponential(2).toUpperCase();
    } else {
        if(tdecimals==null) {
            return number;
        } else {
            return number.toFixed(tdecimals);
        }
    }
}







// Special version of stocsd_format
// But where the lines can be as long as required to print the variable
function stocsd_format(number, tdecimals) {
	// tdecimals is optional and sets the number of decimals. It is rarly used (only in some tables)
	// Since the numbers automaticly goes to e-format when low enought
	
	// Used when e.g. the actuall error is reseted to null
	if(number == null) {
		return "";
	}
    
    // If we force e-format we just convert here and return
    if(stocsd_eformat) {
        return number.toExponential(2).toUpperCase();
    }
	
	// Zero is a special case,
	// since its not written as E-format by default even as its <1E-7
    if(number == 0) {
		return "0";
	}
	
	// Check if number is to small to be viewed in field
	// If so, force e-format
	if(Math.abs(number)<1E-7) {
        return number.toExponential(2).toUpperCase();
	}
	//Check if the number is to big to be view ed in the field
	if(Math.abs(number)>1E+7) {
        return number.toExponential(2).toUpperCase();
	}
	
	
	// Else format it as a regular number, and remove ending zeros
	var stringified;
	if(tdecimals === undefined) {
		stringified = number.toFixed(7).toUpperCase();
	} else {
		stringified = number.toFixed(tdecimals).toUpperCase();
	}
	
	


	// Find the length of stringified, where the ending zeros have been removed
	var i = stringified.length;
	while(stringified.charAt(i-1)=='0') {
		i=i-1;
		// If we find a dot. Stop removing decimals
		if(stringified.charAt(i-1)=='.') {
			i=i-1;
			break;
		}
	}
	// Creates a stripped string without ending zeros
	var stripped = stringified.substring(0,i);
	return stripped;
}

function stocsd_format_update() {
    // Handles most updates for optim
    optim_optimiser.update();
    // Handles a few updates that are not controlled from the optimiser (e.g. req.error)
	optim.format_update();
    
    parmest_optimiser.update();
    parmest_varstats.update();
    stocres.update();
    sensi_table.update();
}

/*
function model_io_storage=function() {
    var public={};
    public.load_model=function(model_
    public.save_model=function(model_data,model_name) {
        
    }
    return public;
}
*/
var doing_save=false;
imc_return_handlers["export_model_return"]=function(obj) {
    var suggest_name;
    if(model_name!=false) {
        suggest_name=model_name;
    } else {
        suggest_name="";
    }
    
    
    
    var new_model_name=prompt("Enter name of model",suggest_name);
    if(new_model_name==null) {
        return;
    }
    doing_save=true;
    model_name=append_file_extension(new_model_name,".imm");
    model_data=obj.returnobj.xml_data;
    export_txt(model_name,model_data);
    localStorage.setItem("im_stocsd_last_model_name",model_name);
    localStorage.setItem("im_stocsd_last_model_data",model_data);
}

$(window).focus(function() {
    if(doing_save) {
        txt_model_file.val(model_name);
    }
    doing_save=false;
});


function stocsd_update_time_step() {   
    imc_gettimestep("gettimestep_return");
}

imc_return_handlers["gettimestep_return"]=function(obj) {
     $(".lbl_timestep").html(stocsd_format(obj.returnobj.timestep));
};

function stocsd_update_current_time() {
    $(".current_time").html(getdatestr());
}

function highlight(field) {
	field.addClass("highlighted_parameter");
}

function unhighlight(field, focus) {
	field.removeClass("highlighted_parameter");
	
	// The default behaviur is focus
	if(focus==true || focus===undefined) {
		field.focus();
	}
}

function unhighlight_all() {
	$(".highlighted_parameter").removeClass("highlighted_parameter");	
}




function cmd_print_click() {
    print_mode(true);
    //var old_panelside = panelside;
    //panel_toside("left");
    paneltoleft();
    iframediv.hide();
    dragborder.hide();
    panel.css("overflow-y","visible");    
    window.print();
    panel.css("overflow-y","auto");
    dragborder.show();
    iframediv.show();
    paneltoright();
    panel_unminimize();
    //panel_toside(old_panelside);
    print_mode(false);
}
