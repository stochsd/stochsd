/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
var openmodel_visible = false;
var openmodel_form = false;
var openurl_form = false;

/*
var openmodel_lastupdate = 0;

var openmodel_numbars = 5;
var openmodel_min=0;
var openmodel_max=10;
var openmodel_varname='';
var openmodel_pdf_mode = false;
*/




function frm_openmodel_load() {
    $.jqplot.config.enablePlugins = true;
    openmodel_visible = true;
    
    var form_width = 400;
    var form_height = 300;
    // http://stackoverflow.com/questions/171928/hook-into-dialog-close-event
    openmodel_form=$( "#frm_openmodel" ).dialog({ 
        resizable: false,
        position: 'center',
                                                close: function() { openmodel_visible=false; },
                                                width: form_width,
                                                height: form_height
    });  
    cmd_openmodel_close.click(frm_openmodel_close_click);
    
    $(".model_shortcut").click(function() {
        var url=$(this).attr("title");
        frm_openmodel_open_model(url);
        frm_openmodel_close_click();
    });
}

function frm_openmodel_open_last_model() {
    var url=localStorage.getItem("im_stockres_lastfile");
    if(url==null || settings.force_start_url) {        
        url=settings.start_url;
    }
    frm_openmodel_open_model(url);
}

function view_url(url) {
    $('#SimulationIFrame').attr('src', url);    
    if(openurl_form) {
        openurl_form.dialog("close");
    }
    if(openmodel_form) {
        openmodel_form.dialog("close");
    }
    /*
    set_run_state("none");
    clear_all_vars();
    */
}

function frm_openmodel_open_model(url) {
    localStorage.setItem("im_stockres_lastfile",url);
    lbl_model_state.html("Loading model...");
    $('#SimulationIFrame').attr('src', url);
    stocres_varstats.clear_all_vars();
    if(openurl_form) {
        openurl_form.dialog("close");
    }
    if(openmodel_form) {
        openmodel_form.dialog("close");
    }
}

function cmd_open_im_fileview_click() {
    view_url("http://insightmaker.com");
}

function cmd_open_url_click() {
    var url=txt_open_url.val();
    frm_openmodel_open_model(url);
}

function cmd_open_url_form_click() {
    form_width=500;
    form_height=200;
    txt_open_url.val("");
    openurl_form=$( "#frm_openurl" ).dialog({ 
        resizable: false,
                                                position: 'center',
                                                width: form_width,
                                                height: form_height
    });
}

function frm_openmodel_close_click() {
    openmodel_form.dialog("close");
}



function cmd_openmodel_print_click() {
    frm_stockres_im.hide();
    window.print();
    frm_stockres_im.show();
}
