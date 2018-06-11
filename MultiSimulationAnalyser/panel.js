/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
var panelside="right";
var panelwidth=settings.panel_width;

function panel_hide() {
	panelwidth=0;
	
	panel_resize(window.innerWidth-panelwidth);
	
	panel.hide();
	dragborder.hide();
}

function panel_shrink() {
	debug_out("minimizing panel");
	innerpanel.css("display","none");
	//panel_header_hidepart.css("display","none");
    stockres_panel.css("display","none");    
	//cmd_unminimize.css("display","inline");
	
	//panelwidth=settings.panel_min_width;
	panelwidth=stocsd_title_panel.width()+10;
	
	panel_resize(window.innerWidth-panelwidth);
    iconpanel.css("display","inline");
    stocsd_title_panel.css("display","inline");
}

function panel_minimize() {
	const minimize_mode = 1;
	switch(minimize_mode) {
		case 1:
			panel_hide();
		break;
		case 2:
			panel_shrink();
		break;
	}
}

function panel_unminimize() {
	panel.show();
	dragborder.show();
	
	debug_out("unminimizing panel");
	innerpanel.css("display","inline");
	//panel_header_hidepart.css("display","inline");
    stockres_panel.css("display","inline");    
	//cmd_unminimize.css("display","none");
	panelwidth=settings.panel_width;
	panel_resize(window.innerWidth-panelwidth);
    iconpanel.css("display","none");
    stocsd_title_panel.css("display","none");
}

function panel_init() {
    dragborder.draggable({ 
        axis: "x",
        start: function(event, ui) {
            $("iframe").hide();
        },
        stop: function(event, ui) {
            $("iframe").show();
        },
        drag: function( event, ui ) {
            debug_out(event);
            panel_resize(event.clientX);
        }
        
    }); 
	
	$( window ).resize(function() {
		// Update the panel
        panel_resize(window.innerWidth-panelwidth);
	});
	
    panel_toside(panelside);
    // This does not work for zoomed in, fix it
    //alert(window.innerWidth);
    
    panel_unminimize();
    
    //panel_resize(window.innerWidth-panelwidth);
}

function panel_resize(dragborder_x) {
    panel.height(window.innerHeight-5);
    if(panelside=="left") {
        panelwidth=dragborder_x;
        iframediv.css("left",panelwidth+"px");
    }
    if(panelside=="right") {
        iframediv.css("width",dragborder_x+"px");
        panel.css("left",(dragborder_x+10)+"px");
        //panel.css("left",(dragborder_x+20)+"px");
        // The dragborder needs to be corrected becaouse it jumps when a scrollbar appears
		dragborder.css("left",iframediv.css("width"));
    }
	debug_out("border drag");
}

function panelswitchside() {
    // Change the value of panelside
    if(panelside=="left") {
        panelside="right";
    } else {
        panelside="left";
    }
    
    // Adapt the panel
    if(panelside=="right") {
        paneltoright();
    } else {
        paneltoleft();
    }
    
}
function panel_toside(side) {
    if(side=="right") {
        paneltoright();
    } else if (side == "left") {
        paneltoleft();
    } else {
        alert("Invalid side "+side);
    }
}

function paneltoleft() {
    cmd_panelside.text("To right");
    debug_out("panel left");
    iframediv.css("left",panelwidth+"px");
    iframediv.css("right","0px");
    dragborder.css("left",panelwidth);
    panel.css("left","0");
    panel.css("right","auto");
    
}
function paneltoright() {
    cmd_panelside.text("To left");
    debug_out("panel right");
    iframediv.css("left","0px");
    iframediv.css("right",panelwidth+"px");
    iframediv.css("width","auto");
    dragborder.css("left","auto");
    dragborder.css("right",panelwidth);
    //panel.css("left","auto");
//	panel.css("margin-right","15px");
    
    panel.css("right","0px");
}

function cmd_unminimize_click() {
	panel_unminimize();
}

function cmd_minimize_click() {
	panel_minimize();
}
