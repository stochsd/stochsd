/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/

var analysis_table_class=function(init_target_tbody) {
    var visible=false;
    var target_tbody=init_target_tbody;
    var vartable;
    var var_row={};
    function color_from_p_value(p_value) {
        var pv_color_90="lightgreen"
        var pv_color_95="yellow";
        var pv_color_99="orange";
        var pv_color_bad="#FA6B6B";        
        if(p_value==null) {
            return pv_color_bad;
        }
        if(p_value<=90) {
            return pv_color_90;
        }
        if(p_value <= 95) {
            return pv_color_95;
        }
        if(p_value <= 99) {
            return pv_color_99;
        }
        return pv_color_bad;
    }
    
    function test_p_value(varname,input) {
        //var test_list=[90,95,99];
        // Find p-value
        var test_list=[90,91,92,93,94,95,96,97,98,99];
        var interval;
        for(var i=0;i<99;i+=0.5) {
            interval=confint_interval_from_level(vartable[varname],i);
            //alert(test_list[i]+" "+interval.start+" "+interval.end);
            if(input >= interval.start && input <= interval.end) {
                //alert(input+" is inside. break");
                return i;
            }
        }
        return ">99";
        //alert(JSON.stringify(confint_interval_from_level(parmest_varstats.get_vartable()["X1"],99)));
    }


    
    function update_var_row(varname) {
        if(vartable[varname].last!=undefined) {
            var system=var_row[varname].find('.system').val();
            var_row[varname].find('.model').html(stocsd_format(vartable[varname].avrage,2));
            var_row[varname].find('.diff').html(stocsd_format(vartable[varname].avrage-system,2));
            var p_value=test_p_value(varname,Number(system));
            if(system!="") {
                var_row[varname].find('.conf').css("background-color",color_from_p_value(p_value));
                var_row[varname].find('.conf').html(p_value);
            } else {
                var_row[varname].find('.conf').css("background-color","white");
                var_row[varname].find('.conf').html("");
            }
        } else {
            var_row[varname].find('.model').html("");
            /*
            var_row[varname].find('.last').html("");
            var_row[varname].find('.avg').html("");
            var_row[varname].find('.min').html("");
            var_row[varname].find('.max').html("");
            var_row[varname].find('.stddev').html("");
            var_row[varname].find('.confint').html(var_confints(varname));*/



        }
    }    
    var public = {};
    public.set_visible=function(new_visible) {
        visible=new_visible;
        if(visible) {
            public.update();
        }
    }
    public.get_visible=function() {
        return visible;
    }
    public.set_vartable=function(new_vartable) {
        vartable=new_vartable;
    }
    public.get_vartable=function() {
        return vartable;
    }
    public.update=function() {
        if(!visible) {
            return;
        }
        for(var varname in vartable) {
            update_var_row(varname);
        }
    }

    public.getvarlist=function() {
        var varlist=[];
        for(var varname in vartable) {
            varlist.push(varname);
        }
        return varlist;
    }

    public.delvar=function(varname) {
        $(var_row[varname]).remove();
        delete var_row[varname];
    }

    public.addvar=function(varname) {        
        if(!(var_row[varname]===undefined)) {
            return;
        }
        
        $(target_tbody).append('<tr class="varname_'+varname+'">\
        <td class="nowrap">'+varname+'</td>\
        <td class="model"></td>\
        <td><input class="expand system" type="text"></td>\
        <td class="diff"></td>\
        <td class="conf"></td>\
        </tr>');
        var_row[varname] = $(target_tbody).find(".varname_"+varname);
        var_row[varname].find(".system").keyup(function() {
            public.update();
        });
        var_row[varname].find(".varcheckbox").click(function() {
            // Checkbox selections goes here
            // This is currently not in use
        });
        //update_var_row(varname);
    }
    return public;
};
var parmest_analysis_table=analysis_table_class("#parmest_tbl_vars3 tbody");

