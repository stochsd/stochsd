/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/

var varstats_class=function(init_target_tbody) {
    var percentile_level=50;
    var target_tbody=init_target_tbody;
    var sides="2";
    var vartable = {};
    var var_row={};
    
    // Percentile calculated with linear interpolation
    function var_percentile(varname,percentile_level) {
        var data=copy_array(vartable[varname].data).sort(sortNumber);
        debug_out(varname);
        
        if(data.length==1) {
            return data[0];
        }
        
        // Special cases
        // 0 or less
        if(percentile_level<=0) {
            return data[0];
        }
        
        // 100 or more
        if(percentile_level>=100) {
            return data[data.length-1];
        }
        
        // A floating point where the value should have been
        var findex = percentile_level*(data.length-1)/100;
        
        debug_out("findex "+findex);
        
        // The closesed integer index to the left
        var left_of_findex=Math.floor(findex);
        
        debug_out("left of findex "+left_of_findex);
        debug_out("data[left] "+data[left_of_findex]);
        
        // The next index to the right (after the one to the right)
        var right_of_findex=left_of_findex+1;
        debug_out("data length "+data.length)
        
        // handle special case when left_of_findex is outside bounds
        if(right_of_findex > data.length-1) {
            // Error handling could be inserted here
            return 0;
        }
        
        
        debug_out("right of findex "+right_of_findex);
        debug_out("data[right] "+data[right_of_findex]);
        
        // Calculate the slope between left and right
        var slope = data[right_of_findex]-data[left_of_findex];
        // Actually sorted_data[right_of_index]-sorted_data[left_of_index]/1, but we dont have to divide by one
        
        debug_out("slope "+slope);
        
        // Calculate the distance between the index and the left index
        var left_distance_to_findex = findex - left_of_findex;
        
        
        
        debug_out("left_distance_to_findex "+left_distance_to_findex);
        
        
        
        
        
        
        debug_out("sorted data");
        debug_out(data);
        
        var weighted_percentile = data[left_of_findex]+slope*left_distance_to_findex;
        debug_out(data[left_of_findex].toFixed(2)+"+"+(slope*left_distance_to_findex).toFixed(2)+"="+weighted_percentile.toFixed(2));
        
        //alert(findex+","+left_of_findex);
        return weighted_percentile;
    }
    
    function var_confints(varname) {
        var num_data = vartable[varname].data.length-1;
        if(vartable[varname].data.length<20) {
            return "To be calc"
        }
        var interval=calc_confints(confint_lambda,vartable[varname]);
        if(sides=="2") {
            return stocsd_format(interval.start,2)+"-"+stocsd_format(interval.end,2);
        } else {
            return "> "+stocsd_format(interval.start,2)+" OR <"+stocsd_format(interval.end,2);
        }
    }
    
    function update_var_row(varname) {
        //alert("before");
        if(vartable[varname].last!=undefined) {
            var_row[varname].find('.last').html(stocsd_format(vartable[varname].last,2));
            var_row[varname].find('.avg').html(stocsd_format(vartable[varname].avrage,2));
            var_row[varname].find('.min').html(stocsd_format(vartable[varname].min,2));
            var_row[varname].find('.max').html(stocsd_format(vartable[varname].max,2));
            var_row[varname].find('.stddev').html(stocsd_format(vartable[varname].stddev,2));
            var_row[varname].find('.confint').html(var_confints(varname));
            var_row[varname].find('.percentile').html(stocsd_format(var_percentile(varname,percentile_level),2));
        } else {
            var_row[varname].find('.last').html("");
            var_row[varname].find('.avg').html("");
            var_row[varname].find('.min').html("");
            var_row[varname].find('.max').html("");
            var_row[varname].find('.stddev').html("");
            var_row[varname].find('.confint').html("");
            var_row[varname].find('.percentile').html("");
            /*
            var_row[varname].find('.last').html("");
            var_row[varname].find('.avg').html("");
            var_row[varname].find('.min').html("");
            var_row[varname].find('.max').html("");
            var_row[varname].find('.stddev').html("");
            var_row[varname].find('.confint').html(var_confints(varname));*/
        }
        
        
        
        
        
        
        
        
        //alert("after");
    }
    
    var public = {};
    public.set_percentile_level=function(new_percentile_level) {
        percentile_level=new_percentile_level;
        public.update();
    };
    public.get_confint_lambda=function() {
        return confint_lambda;
    }
    public.update_lambda=function(conf_level,opt_sides) {
        sides=opt_sides;
        confint_lambda=calc_confint_lambda(conf_level,opt_sides);
        public.calc_confints();
    }
    public.get_vartable=function() {
        return vartable;
    }
    public.new_values=function(variable_array) {
        for(var varname in vartable) {
            var newvalue = variable_array[varname];
            debug_out("new value");
            debug_out(newvalue);
            
            vartable[varname].data.push(Number(newvalue));
            
            
            vartable[varname]=addnewvalue(vartable[varname],newvalue);
            
            
            if(vartable[varname].max==undefined) {
                vartable[varname].max=newvalue;
            }
            if(newvalue > vartable[varname].max) {
                vartable[varname].max=newvalue;
            }
            
            if(vartable[varname].min==undefined) {
                vartable[varname].min=newvalue;
            }
            if(newvalue < vartable[varname].min) {
                vartable[varname].min=newvalue;
            }
            vartable[varname].last=newvalue;
            
            public.update();
        }
    }
    public.get_sides=function() {
        return sides;
    }
    public.set_sides=function(new_sides) {
        sides=new_sides;
    }
    /* If only one variable is selected, return its variable name
    * Otherwise return null */
    public.single_selectedvar=function() {
        var selected=false;
        var select_count=0;
        var lastfound = undefined;
        for(varname in var_row) {
            selected=var_row[varname].find('.varcheckbox').is(':checked');
            if(selected) {
                lastfound=varname;
                select_count++;
            }
        }
        // If exactly one variable was selected
        if(select_count==1) {
            return lastfound;
        } else {
            return null;
        }
    }

    /* Returns array of selected vars */
    public.multi_selectedvar=function() {
        var is_selected;
        var selected_array=[];
        for(varname in var_row) {
            is_selected=var_row[varname].find('.varcheckbox').is(':checked');
            if(is_selected) {
                selected_array.push(varname);
            }
        }
        return selected_array;
    }
    
    public.update=function() {
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

    public.reset_all_vars=function() {
        for(var varname in vartable) {
            vartable[varname]=initvar(varname);
            update_var_row(varname);
        }
        //update_lambda();
    }

    public.calc_confints=function() {
        for(var varname in vartable) {
            var_row[varname].find('.confint').html(var_confints(varname));
        }   
    }

    public.delvar=function(varname) {
        $(var_row[varname]).remove();
        delete var_row[varname];
        delete vartable[varname];
    }
    
	public.clear_all_vars=function() {
        for(var varname in vartable) {
            public.delvar(varname);
        }
    }

    public.addvar=function(varname) {        
        if(!(vartable[varname]===undefined)) {
            return;
        }
        vartable[varname]=initvar(varname);
        $(target_tbody).append("<tr class='varname_"+varname+"'>\
        <td><input data-varname='"+varname+"' class='varcheckbox' type='checkbox'/></td>\
        <td class='varname_data'>"+varname+"</td> \
        <td class='avg'></td>\
        <td class='stddev'></td>\
        <td class='confint'></td>\
        <td class='min'></td>\
        <td class='max'></td>\
        <td class='last'></td>\
        <td class='percentile'></td>\
        </tr>");
        var_row[varname] = $(target_tbody).find(".varname_"+varname);
        var_row[varname].find(".varcheckbox").click(function() {
            // Checkbox selections goes here
            // This is currently not in use
        });
        update_var_row(varname);
    }
    return public;
};
var stocres_varstats=varstats_class("#tbl_vars tbody");
var parmest_varstats=varstats_class("#parmest_tbl_vars2 tbody");

