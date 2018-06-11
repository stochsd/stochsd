/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
/*
 * IMC stands for Insight Maker connect
 */
var returnhandler = function() {
	alert("Error: default handler was triggered, but there is no default handler");
}

var imc_return_handlers={};
imc_return_handlers['default']=returnhandler;

imc_return_handlers["debug"]=function(obj) {
  alert(JSON.stringify(obj));  
};

imc_return_handlers["load_app"]=function(obj) {
	let app_name = obj.returnobj.app_name;
	if(app_name=="none") {
		panel_minimize();
	} else {
		load_app(app_name);
	}
};

imc_return_handlers["update_title"]=function(obj) {
	let new_title = obj.returnobj.title;
	document.title = new_title;
};

// Add eventhandler to receive messages from iframe
window.addEventListener("message", receiveMessage, false);

/* when stocsd_send_seed is null we dont send a seed, otherwise we send
 * the value of stocsd_send_seed as seed*/
var stocsd_send_seed=null;




function insertscript(insertcode)  {
    // replace ' by variabel q, containg ' to avoid formating errors
    insertcode = insertcode.replace(new RegExp("'", "g"), "'+q+'")

    // create code for making script node
    var createjsnode = "var s = document.createElement('script');  s.setAttribute('type','text/javascript'); s.setAttribute('class','insertcode'); q=String.fromCharCode(39); var t=document.createTextNode('"+insertcode+"');  s.appendChild(t); document.body.appendChild(s);";            
    
    // send the code to the iframe
    document.getElementById('SimulationIFrame').contentWindow.postMessage(createjsnode, "*");
}
        
function runline(code) {
    document.getElementById('SimulationIFrame').contentWindow.postMessage(code, "*");
}









function imc_run_model(set_var_array,get_var_array, showgui,target) {
    if(get_var_array.indexOf("SkipOnCondition")==-1) {
        get_var_array.push("SkipOnCondition");
    }
    //var var_array=["I","S","R"];
    // Generate script that starts model and then return the result
    code='';
    if(stocsd_send_seed!=null) {
        code += 'setstartseed('+stocsd_send_seed+');';
    }
    for(var key in set_var_array) {
        value = set_var_array[key];
        code+='setValue(findName("'+key+'"), '+value+');';
    }
	// $(".x-tool-close").click(); removes old simulation windows
    if(showgui) {
		code+='$(".x-tool-close").click();';
	}
    code += 'runModel({ \
    silent:'+(!showgui)+',\
    rate: -1, \
onSuccess: function(results){ '
code+='results.variable={};'
code+='results.command="imc_runandreturn";';
for(var i in get_var_array) {
    varname = get_var_array[i];
    code+='if(findName("'+varname+'")) {';
    code+='results.variable.'+varname+' = results.value(findName("'+varname+'"))[results.times.length-1];';
    code+='}';
}
//code+='alert(JSON.stringify(results));';
code +='returnresult(results,"'+target+'"); \
    } \
})';
    runline(code);
    //alert(code);
    //debug_out(code);
    //insertscript(code);
}

//http://stackoverflow.com/questions/770523/escaping-strings-in-javascript
function addslashes( str ) {
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}


        
        function im_insert_stockres_init() {
            var code ='';
            code+='function returnresult(returnobj,target) {';
                code+='results={};';
                code+='results.target=target;';
                code+='results.returnobj=returnobj;';
                code+='parent.postMessage(JSON.stringify(results), "*");';
            code+='}';
            code+='function var_exists(varname,target) {';
                code+='returnobj={};';
                code+='returnobj.varname=varname;';
                code+='returnobj.exists=(findName(varname)!=null)?true:false;';
                code+='returnresult(returnobj,target);';
            code+='}';
			code+='function var_array_exists(varname_array,target) {';
				code+="alert('in function');";
                code+='returnobj={};';
                code+='returnobj.varname=varname_array;';
                code+='returnobj.exists=(findName(varname_array)!=null)?true:false;';
                code+='returnresult(returnobj,target);';
            code+='}';
			code+='function setstartseed(seedvalue) {';
                code+='Math.seedrandom(seedvalue);';
            code+='}';
            code+='function export_model() {';
                code+='returnobj={};';
                code+='var enc = new mxCodec();';
                code+='var graph_dom=enc.encode(graph.getModel());';
                code+='returnobj.xml_data="<InsightMakerModel>"+graph_dom.innerHTML+"</InsightMakerModel>";';
                code+='returnresult(returnobj,"export_model_return")';
            code+='}';
            code+='function imc_test() {';
                code+='alert("The IMC API is active");';
            code+='}';
            debug_out(code);
            insertscript(code);
        }
        
        function imc_hideSideBar() {
            runline('if(sideBarShown()){ toggleSideBar(); }');
        }
        
        function im_set_var(varname,value) {
            runline('setValue(findName("'+varname+'"), '+value+');');
        }
        
		function im_show_tool() {
            runline('showPluginMenu();');
        }
     
        function im_myseed() {
            runline('Math.seedrandom("hej")');
            
        }
        
        function imc_simulation_close() {
			runline('$(".x-tool-close").click();');
		}
        
        
        function imc_gettimestep(target) {
            runline('imc_gettimestep("'+target+'")');
        }
        
        
        function imc_var_exists(varname,target) {
            runline('var_exists("'+varname+'","'+target+'");');
        }
        
		function imc_var_array_exists(varname_array,target) {
            runline('var_array_exists('+JSON.stringify(varname_array)+',"'+target+'");');
        }
        

        // Event handler when receving result from iframe
        function receiveMessage(e) {
            debug_out("in parent");
            debug_out(e);
            //alert(e.data);
            
            
            // Discard all messages that does not contain data
            
            debug_out("message");
            debug_out(e);
            if ( typeof(e.data) == 'undefined' ) {
                return;
            }
            
            var obj = JSON.parse(e.data);
            
            // Target specifies the return handler to use
            // Return handlers are registered in the
            // imc_return_handlers array
            // "default" is the default return target
            //alert("recive message");
            if(obj.hasOwnProperty('target')){
                //alert("target "+obj.target);
                imc_return_handlers[obj.target](obj);
            } else {
                imc_return_handlers['default'](obj);
            }
            
            // Put the result in the output box
            //$(".output").html(obj.times.length/10);
            //returnhandler(obj);
        }
        
		function imc_vars_save(varname_array) {
			runline("vars_store.save("+JSON.stringify(varname_array)+");");
		};
		
		function imc_vars_load() {
			runline("vars_store.load();");
		};
		
		function imc_vars_debug() {
			runline("vars_store.debug();");
		};

		function imc_state_save() {
			runline("state_store.save();");
		};
		
		function imc_state_load() {
			runline("state_store.load();");
		};
		
		function imc_state_debug() {
			runline("state_store.debug();");
		};
