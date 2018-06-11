/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
var histogram_class=function() {
var vartable;
var histogram_data=[];
var histogram_var = undefined;
var histogram_visible = false;
var histogram_lastupdate = 0;
var histogram_form;
var histogram_numbars;
var histogram_min=0;
var histogram_max=10;
var histogram_varname='';
var histogram_pdf_mode = false;





function frm_histogram_load() {
	histogram_numbars = $(".txt_histogram_numbars").val();
    cmd_histogram_print.click(function() {
        cmd_histogram_print_click();
    });
    cmd_histogram_auto.click(function() {
        cmd_histogram_auto_click()
    });
    if(vartable[histogram_varname].data < 2) {
        alert("You need at least two data to view a histogram");
        return;
    }
    
    histogram_visible = true;
    //alert("load histogram visible "+histogram_visible);
    
    var form_width = $(document).width()*0.8;
    var form_height = $(document).height()*0.8;
    // http://stackoverflow.com/questions/171928/hook-into-dialog-close-event
    histogram_form=$( "#frm_histogram" ).dialog({ 
        resizable: true,
        position: 'center',
                                                close: function() { histogram_visible=false; },
                                                resizeStop: frm_histogram_resize,
                                                width: form_width,
                                                height: form_height
    });
    
    auto_min_max();
    frm_histogram_resize();
    
    
    $(".txt_histogram_min").keyup(function() {
        histogram_min = $(".txt_histogram_min").val();
        console.log("updateed histogram min to "+histogram_min);
        histogram_update();
    });
    
    $(".txt_histogram_max").keyup(function() {
        histogram_max = $(".txt_histogram_max").val();
        console.log("updateed histogram max to "+histogram_max);
        histogram_update();
    });
    
    $(".txt_histogram_numbars").keyup(function() {
        histogram_numbars = $(".txt_histogram_numbars").val();
        console.log("updateed histogram_numbars max to "+histogram_numbars);
        histogram_update();
    });
    
    
    //histogram_update();
    $(".histogram_data_input").keyup(function() {
        histogram_data=string2numarray($(".histogram_data_input").val());
        console.log(histogram_data);
        histogram_update();
    });
    
    cmd_histogram_close.click(function() {
        histogram_form.dialog("close");
    });
    
    $('input[name=opt_histogram_mode]').change(function() {
        if($(this).val()=='pdf') {
            histogram_pdf_mode=true;
            histogram_update();
        } else {
            histogram_pdf_mode=false;
            histogram_update();            
        }
    });
}

function frm_histogram_resize() {
    var width = histogram_form.width();
    var height = histogram_form.height();
    console.log(width+","+height);
    $(".histogram .minbox").css("top",(height-250)-0);


    $(".histogram .chart").css("width",width-210);
    $(".histogram .chart").css("height",height-200);
    
    $(".histogram .maxbox").css("left",width-100);
    $(".histogram .maxbox").css("top",(height-250)-0);

    
    $("#cmd_histogram_auto").css("left",width-120);
    $("#cmd_histogram_auto").css("top",height-115);
    
    $("#cmd_histogram_print").css("left",width-120);
    $("#cmd_histogram_print").css("top",height-80);

    $("#cmd_histogram_close").css("left",width-120);
    $("#cmd_histogram_close").css("top",height-45);
    
    $(".optbox_histogram_mode").css("top",height-115);
    $(".optbox_histogram_mode").css("left",width-270);
    
    $("#lbl_histogram_stats").css("left",20);
    $("#lbl_histogram_stats").css("top",height-110);

    $("#lbl_histogram_min").css("left",20);
    $("#lbl_histogram_numbars").css("left",width/2-100);
    $("#lbl_histogram_max").css("left",width-200);

    
    $(".datafields").css("left",0);
    $(".datafields").css("width",width-30);
    $(".datafields").css("top",height-175);
    $(".datafields").css("height",150);
    histogram_update();
}

function cmd_histogram_print_click() {
    frm_stockres_im.hide();
    window.print();
    frm_stockres_im.show();
}

function auto_min_max() {
    histogram_min = Number(vartable[histogram_varname].min);
    histogram_max = Number(vartable[histogram_varname].max)+0.0000001;
    $(".txt_histogram_min").val(histogram_min.toFixed(2));
    $(".txt_histogram_max").val(histogram_max.toFixed(2));
}

function string2numarray(datastring) {
    // Remove , at the end of string
    if(datastring[datastring.length-1]==',') {
        datastring=datastring.substring(0,datastring.length-1);
    }
    
    var returndata= datastring.split(",");
    
    // Convert all to numeric
    for(var i = 0;i<returndata.length;i++) {
            returndata[i]=Number(returndata[i]);
    }
    return returndata;
}

function numarray2string(data) {
    var result="";
    var first=true;
    for(var i in data) {
        if(first) {
            result+=data[i].toString();
            first=false;
        } else {
            result+=","+data[i].toString();
        }
    }
    return result;
}

function randliststring() {
    var newlist = numarray2string(randlist($(".numdata").val(),$(".min").val(),$(".max").val()));
    return newlist;
}


function randlist(size,min,max) {
    size=Number(size);
    min=Number(min);
    max=Number(max);
    var result=[];
    var range=max-min;
    for(var i=0;i<size;i++) {
        result.push(Math.round(min+Math.random()*range));
    }
    return result;
}

function histogram_draw(id,bars,barnames) {
    // We dont want labels for scatterplot
    // http://www.jqplot.com/docs/files/plugins/jqplot-pointLabels-js.html#$.jqplot.PointLabels.labelsFromSeries
    $.jqplot.config.enablePlugins = true;
    $('#'+id).empty();
    plot1 = $.jqplot(id, [bars], {
        
        seriesDefaults:{
            renderer:$.jqplot.BarRenderer
        },
                     axes: {
                         xaxis: {
                             renderer: $.jqplot.CategoryAxisRenderer,
                     ticks: barnames
                         }
                     }
    });
}

function histogram_update_stats() {
    var numdata = histogram_data.length;
    var date = new Date();
    var datestr = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
    var stats=histogram_varname+"<br/>No. data: "+numdata+"<br/><br/>"+datestr;
    $("#lbl_histogram_stats").html(stats);
}

function histogram_update() {
    histogram_data=vartable[histogram_varname].data;
    histogram_var = vartable[histogram_varname];
    histogram_update_stats();
    
    var histogram = calcbars(histogram_data);
    var barnames = getbarnames(histogram);
    
    if(histogram_pdf_mode) {
        var bars = getpdfbars(histogram);
        $("#txt_histogram_before_lowest").val(histogram.before_bar.length/histogram_data.length);
        $("#txt_histogram_after_highest").val(histogram.after_bar.length/histogram_data.length);
    } else {
        var bars = getbars(histogram);        
        $("#txt_histogram_before_lowest").val(histogram.before_bar.length);
        $("#txt_histogram_after_highest").val(histogram.after_bar.length);
    }


    
    //$('#chart1').css("width",barnames.length*120);
    
    histogram_draw("chart1",bars,barnames);
    var timestamp = new Date().getTime();
    histogram_lastupdate=timestamp;
};

function getbarnames(histogram) {
    var result=[];
    for(var i in histogram.bars) {
        var tbar=histogram.bars[i];
        result.push(".."+tbar.bar_limit.toFixed(2));
    }
    return result;
}
function getbars(histogram) {
    var result=[];
    for(var i in histogram.bars) {
        var tbar=histogram.bars[i];
        result.push(tbar.data.length);
    }
    return result;
}

function getpdfbars(histogram) {
    var result=[];
    
    for(var i in histogram.bars) {
        var tbar=histogram.bars[i];
        result.push((tbar.data.length/histogram_data.length));
    }
    return result;
}
    
function mystacktrace() {
    var i, j, k;
    // ...
    // j acquires some interesting value
    // Who called foo when j took this interesting value?
    //
    
    var e = new Error('dummy');
    var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
    .replace(/^\s+at\s+/gm, '')
    .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
    .split('\n');
    console.log(stack);
    
    // ...
    // rest of the code
}
    function calcbars(data) {
        var histogram = {};
        histogram.bars=[];
        histogram.before_bar=[];
        histogram.after_bar=[];
        histogram.min_data=undefined;
        histogram.max_data=undefined;
        var min;
        var max;
        //data=data.sort(sortNumber);
        var numbars=histogram_numbars;

        var min=Number($(".min").val());
        var max=Number($(".max").val());
        
        // Caulcate min and max
        for(var i in data) {
            if(histogram.min_data == undefined) {
                histogram.min_data=data[i];
            }            
            if(data[i] < histogram.min_data) {
                histogram.min_data = data[i];
            }
            
            if(histogram.max_data == undefined) {
                histogram.max_data=data[i];
            }
            if(data[i] > histogram.max_data) {
                histogram.max_data = data[i];
            }
        }
        
        min = histogram.min_data;
        max = histogram.max_data+0.000001;
        
        // We just added this temporary to see how we can autoscale
        min = histogram_min;
        max = histogram_max;
        
        min = Number(min);
        max = Number(max);
        console.log("min "+min);
        console.log("max "+max);
        histogram.bar_width=(max-min)/numbars;
        console.log("bar width: "+histogram.bar_width);
        console.log(data);
        console.log("bars "+numbars);
        for(var i = 0;i <numbars;i++) {
            var tbar={};
            tbar.bar_min=min+i*histogram.bar_width;
            tbar.bar_limit=min+(i+1)*histogram.bar_width;
            tbar.bar_limit=Number(tbar.bar_limit);
            console.log(tbar.bar_min+"-"+tbar.bar_limit);
            tbar.data=[];
            histogram.bars.push(tbar);
        }
        console.log("1");
        console.log(histogram);
        for(var i in data) {
            var pos=Math.floor((data[i]-min)/histogram.bar_width);
            if(pos > numbars-1) {
                histogram.after_bar.push(data[i]);
                console.log("outside interval data"+data[i]+" pos "+pos);
                continue;
            }
            if(pos < 0) {
                histogram.before_bar.push(data[i]);
                console.log("outside interval data"+data[i]+" pos "+pos);
                continue;
            }
            console.log("data "+data[i]+" pos "+pos);
            histogram.bars[pos].data.push(data[i]);
        }
        console.log(histogram);
        return histogram;
    }
    
    function sortNumber(a,b)
    {
        return a - b;
    }
    
    function cmd_histogram_auto_click(){
        auto_min_max();
        histogram_update();
    }
    var public={};
    public.set_varname = function (new_histogram_varname) {
        histogram_varname = new_histogram_varname;
    };
    public.frm_histogram_load=function() {
        frm_histogram_load();
    };
    public.try_update=function() {
        //alert("show histogram visible "+histogram_visible);
        //alert("try update");
        if(!histogram_visible) {
            //alert("close becomse invisible");
            return;
        }
        timestamp = new Date().getTime();
        //alert("timecheck");
        if(timestamp - histogram_lastupdate > 1000) {
            //alert("doing histogram update");
            histogram_update();
        }
    }
    public.set_vartable=function(new_vartable) {
        vartable=new_vartable;
    };
    return public;
}
var stocres_histogram=histogram_class();
var parmest_histogram=histogram_class();
