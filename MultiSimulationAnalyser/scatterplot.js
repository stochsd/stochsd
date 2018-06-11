/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
var scatterplot_class=function() {
    var scatterplot_visible = false;
    var scatterplot_form;
    var scatterplot_varname1;
    var scatterplot_varname2;
    var scatterplot_lastupdate = 0;

    /*
    var scatterplot_lastupdate = 0;

    var scatterplot_numbars = 5;
    var scatterplot_min=0;
    var scatterplot_max=10;
    var scatterplot_varname='';
    var scatterplot_pdf_mode = false;
    */
    function getdata() {
        var returnarray = [];
        var data1 = vartable[scatterplot_varname1].data;
        var data2 = vartable[scatterplot_varname2].data;
        var length = data_length();
        for(i=0;i<length;i++) {
            // The data is rounded to 3 digits for printing, becouse otherwise the labels might be very long
            returnarray.push([Number(data1[i].toFixed(3)),Number(data2[i].toFixed(3))]);
        }
        return returnarray;
    }

    function data_length() {
        var length1 = vartable[scatterplot_varname1].data.length;
        var length2 = vartable[scatterplot_varname2].data.length;
        if(length1!=length2) {
            alert("The variables have different length! This should not happend");
            console.log(length);
            console.log(length2);
            return;
        }
        return length1;
    }



    function frm_scatterplot_load() {
        cmd_scatterplot_print.click(function() {
            cmd_scatterplot_print_click();
        });
        
        $.jqplot.config.enablePlugins = true;
        scatterplot_visible = true;
        
        
        var form_height = $(document).height()*0.95;
        var form_width = form_height*1.2;
        // http://stackoverflow.com/questions/171928/hook-into-dialog-close-event
        scatterplot_form=$( "#frm_scatterplot" ).dialog({ 
            resizable: true,
            position: 'center',
                                                    close: function() { scatterplot_visible=false; },
                                                    resizeStop: frm_scatterplot_resize,
                                                    width: form_width,
                                                    height: form_height
        });
        
        scatterplot_update();
        //scatterplot_auto_min_max();
        frm_scatterplot_resize();

        
        
        
        cmd_scatterplot_close.click(function() {
            scatterplot_form.dialog("close");
        });
    }

    

    function scatterplot_update() {
        scatterplot_update_stats();
        scatterplot_draw('scatterplot_chart',0,0);
        
        var timestamp = new Date().getTime();
        scatterplot_lastupdate=timestamp;
    }


    function scatterplot_draw(id,bars,barnames) {
        $.jqplot.config.enablePlugins = false;
        $('#'+id).empty();
        var data = []; 
        for (var i=0; i<10; i+=0.4) { 
            data.push([i,i]); 
        }
        
        data = getdata();
        
        if(data.length > 0) {
            var plot3 = $.jqplot(id, [data], 
            { 
                // Series options are specified as an array of objects, one object
                // for each series.
                series:[ 
                {
                    labelsFromSeries: false,
                    // Don't show a line, just show markers.
                    // Make the markers 7 pixels with an 'x' style
                    showLine:false, 
                    markerOptions: { size: 7, style:"x" }
                }
                ]
            });
        }
    }

    function frm_scatterplot_resize() {
        var width = scatterplot_form.width();
        var height = scatterplot_form.height();
        console.log(width+","+height);


        console.log(scatterplot_chart);
        
        $("#cmd_scatterplot_print").css("left",width-120);
        $("#cmd_scatterplot_print").css("top",height-80);

        $("#cmd_scatterplot_close").css("left",width-120);
        $("#cmd_scatterplot_close").css("top",height-45);    
        
        $("#lbl_scatterplot_stats").css("left",20);
        $("#lbl_scatterplot_stats").css("top",height-95);


        $(".scatterplot .datafields").css("left",15);
        $(".scatterplot .datafields").css("width",width-30);
        $(".scatterplot .datafields").css("top",height-100);
        $(".scatterplot .datafields").css("height",75);
        
        lbl_scatterplot_varname1.css("left",width/2-lbl_scatterplot_varname1.width()/2);
       
        
        scatterplot_chart.height(height-150);
        lbl_scatterplot_varname2.css("top",scatterplot_chart.height()/2);
        
        scatterplot_chart.css("left",lbl_scatterplot_varname2.width());
        scatterplot_chart.width(width-(lbl_scatterplot_varname2.width()*2)-30);
        
        scatterplot_update();
    }

    function scatterplot_update_stats() {
        lbl_scatterplot_varname1.html(scatterplot_varname1);
        lbl_scatterplot_varname2.html(scatterplot_varname2);
        var corr_coefficient=correlation_coefficient(vartable[scatterplot_varname1].data,vartable[scatterplot_varname2].data);
        var date = new Date();
        var datestr = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
        var stats="No. data: "+data_length()+"<br/>Corr.coeff: "+corr_coefficient.toFixed(3)+"<br/><br/>"+datestr;
        $("#lbl_scatterplot_stats").html(stats);
    }


    function cmd_scatterplot_print_click() {
        frm_stockres_im.hide();
        window.print();
        frm_stockres_im.show();
    }
    var public={};
    public.set_varnames = function (new_scatterplot_varname1,new_scatterplot_varname2) {
        scatterplot_varname1=new_scatterplot_varname1;
        scatterplot_varname2=new_scatterplot_varname2;
    };
    public.frm_scatterplot_load=function() {
        frm_scatterplot_load();
    };
    public.try_update=function() {
        if(!scatterplot_visible) {
            return;
        }
        timestamp = new Date().getTime();
        if(timestamp - scatterplot_lastupdate > 1000) {
            scatterplot_update();
        }
    }
    public.set_vartable=function(new_vartable) {
        vartable=new_vartable;
    };
    return public;
};






var parmest_scatterplot=scatterplot_class();
var stocres_scatterplot=scatterplot_class();
