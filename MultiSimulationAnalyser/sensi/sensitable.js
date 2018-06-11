/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
var sensi_table_class=function(new_target) {
    var self=this;
    var mode="abs";
    var vartable={}
    var objectives = [];
    var target=new_target;
    var first_run={};
    
  
	
    self.set_mode=function(new_mode) {
        if(new_mode=="abs" || new_mode=="rel") {
            mode=new_mode;
        } else {
            alert("invalid mode. choose abs och rel");
        }
        self.update();
    };
    self.get_mode=function() {
        return mode;
    };
    self.set_first_run=function(new_first_run) {
        first_run=new_first_run;
    };
    self.update_variable=function(varname,objective_array) {        
        for(var i=0;i<objectives.length;i++) {
            var objname=objectives[i];
            var delta_f_abs=objective_array[objname]-first_run[objname];
            var delta_x_abs=vartable[varname]["increment"];
            vartable[varname]["objectives"][objname]={};
            vartable[varname]["objectives"][objname]["abs"]=delta_f_abs/delta_x_abs;
            
            var delta_f_rel=(objective_array[objname]-first_run[objname])/first_run[objname];
            var delta_x_rel=vartable[varname]["increment"]/vartable[varname]["value"];
            vartable[varname]["objectives"][objname]["rel"]=delta_f_rel/delta_x_rel;
        }
        self.update();
    };
    self.get_first_run=function() {
        return first_run;
    }
    self.get_vartable=function() {
        //~ return $.extend({},vartable);
        return vartable;
    };
	self.get_vars=function() {
		return Object.keys(self.get_vartable());
	};
    self.get_base_values=function() {
        var result={};
        for(var key in vartable) {
            result[key]=vartable[key]["value"];
        }
        return result;
    };
    self.delete_selected=function() {
        $(".sensi_chk_obj").each(function() {
            if($(this).prop("checked")) {
                self.delobj($(this).attr("data-objname"));
            }
        });
        $(".sensi_chk_var").each(function() {
            if($(this).prop("checked")) {
                self.delvar($(this).attr("data-varname"));
            }
        });
        self.update();
    };
    self.update=function() {
        var output="";
        output+="<table class='datatable'>";
        output+="<thead>\
        <tr class='head'>\
        <th></th>\
        <th>Name</th>\
        <th>Base value</th>\
        <th>Increment</th>";        
        for(var i=0;i<objectives.length;i++) {
                output+="<th class='objetive_title'><input data-objname='"+objectives[i]+"' class='varname_data sensi_chk_obj' type='checkbox'>"+objectives[i]+"</th>";
        }
        output+="</tr> \
        </thead>\
        <tbody>";
        for(var key in vartable) {
            output+="<tr>";
            output+="<td><input data-varname='"+key+"' class='sensi_chk_var' type='checkbox'></td>";
            output+="<td class='varname_data'>"+key+"</td>";
            output+="<td>"+stocsd_format(vartable[key]["value"])+"</td>";
            output+="<td>"+stocsd_format(vartable[key]["increment"])+"</td>";
            for(var i=0;i<objectives.length;i++) {
                output+="<td class='objective_value'>";
                var objvalue=vartable[key]["objectives"][objectives[i]];
                if(objvalue!=undefined) {
                    output+=stocsd_format(objvalue[mode]);
                }
                output+="</td>";
            }
            output+="</tr>";
        }
        output+="</tbody>\
        </table>";
        $(target).html(output);
    }
    self.get_objectives=function() {
        return copy_array(objectives);
    };
    self.addvar=function(varname,value,increment) {
        vartable[varname]={};
        vartable[varname]["value"]=value;
        vartable[varname]["increment"]=increment;
        vartable[varname]["objectives"]={}; 
    };
	self.clear_all = function() {
		mode="abs";
		vartable={};
		objectives=[];
		first_run={};
		self.update();
	};
    
    self.delvar=function(varname) {
        delete vartable[varname];
    };
    self.addobj=function(objname) {
        var objindex=objectives.indexOf(objname);
        if(objindex==-1) {
            //var objvalues={"abs":undefined,"rel":undefined}
            objectives.push(objname);
        }
    };
    self.delobj=function(objname) {
        var objindex=objectives.indexOf(objname);
        if(objindex!=-1) {
            objectives.splice(objindex,1);
        }
        for(var key in vartable) {
			delete(vartable[key].objectives[objname]);
		}
    };
    self.reset = function() {
		for(var key in vartable) {
			vartable[key].objectives={};
		}
		self.update();
	};
}
var sensi_table=new sensi_table_class("#sensi_table_target");
