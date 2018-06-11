/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/

function append_file_extension(filename,extension) {
    var extension_position=filename.length-extension.length;
    debug_out(extension_position);
    var current_extension=filename.substring(extension_position,filename.length);
    if(current_extension!=extension) {
        filename+=extension;
    }
    return filename;
}

function striplast(input,char) {
    return input.substring(0,input.lastIndexOf(char));
}

function get_parent_folder() {
    var filepath=String(window.location.href);
    filepath=striplast(striplast(filepath,"/"),"/");
    return filepath;
}

function firstLetterBig(input) {
    return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

function html_to_txt(instring) {
    var outstring=instring.replace(/<br>/g,"\r\n");
    outstring=outstring.trim();
    return outstring;
}

function export_txt(filename, content) {
    a = document.body.appendChild(document.createElement("a"));
    //a.innerHTML = "download example text";
    a.download = filename;
    
    a.href = "data:text/plain;base64," + btoa(content);
    a.click();
    a.parentElement.removeChild(a);
}

function getdatestr() {
    var date = new Date();
    return date.getFullYear()+"-"+fillzeros(date.getMonth()+1,2)+"-"+fillzeros(date.getDate(),2)+"&nbsp;"+date.getHours()+":"+fillzeros(date.getMinutes(),2);
}

function fillzeros(instring, zeros) {
	instring=instring+""; // Convert to string
	debug_out("fill zeros");
	if(instring.length < zeros) {
		outstring="";
		zeros_to_add = zeros-instring.length;
		debug_out(zeros_to_add);
		for(i=0;i<zeros_to_add;i++) {
			outstring+="0";
		}
		outstring+=instring;
		return outstring;
	} else {
		// No zeros was added
		return instring;
	}
}

function get_timestamp() {
    return (new Date().getTime()/1000);
    //return Math.floor(new Date().getTime()/1000);
}

function copy_array(array) {
    return array.slice(0);
}

function sortNumber(a,b)
{
    return a - b;
}

function format_elapsed_time(seconds_total) {
	seconds_total = Math.floor(seconds_total);
	var hours = Math.floor(seconds_total / 3600);
	var minutes = Math.floor((seconds_total - (hours * 3600))/ 60);
	var seconds = seconds_total - (hours * 3600) - (minutes * 60);
	
	var output = "";
	if(hours > 0) {
		return hours+" h "+minutes+" min "+seconds+" sec";
	}
	else if(minutes > 0) {
		return minutes+" min "+seconds+" sec";
	}
	else {
		return seconds+" sec";
	}
}


// Improved Alert message
// Inpsired by http://jsfiddle.net/KurtWM/pf455/
//Look more on how to position the window
//http://stackoverflow.com/questions/19151560/javascript-alert-position-not-in-center-in-chrome

var xalert_active = false;

function xalert(message,close_function) {
	if(xalert_active) {
		debug_out("Could not show xalert, because one does already exist");
		return;
	}
	var messagebox = $(document.createElement('div'));
	messagebox.attr("title","Alert");
	messagebox.attr("class", "alert");
	//messagebox.css("background-color","red");
	messagebox.html("<img src='im_img/error.png'>&nbsp;&nbsp;"+message);
	messagebox.dialog({
		position: 'center',
		buttons: {
			OK: function()
			{
				$(this).dialog('close');
			}
		},
		close: function(){
			xalert_active = false;
			$(this).remove();
			if(close_function != undefined) {
				close_function();
			}
		},
		open : function() {
			xalert_active = true;
			var this_window = $(this).parent()
			this_window.offset({
				top: ($(document).height() / 2) - (this_window.height() / 2),
				left: ($(document).width() / 2) - (this_window.width() / 2)
			});
		},
		draggable: true,
		modal: true,
		resizable: false,
		width: 'auto'
	});
}


// Does alert and highlight in one step
function xalert_highlight(message,highlight_element, close_function) {
	highlight(highlight_element);
	xalert(message, function() {
		unhighlight(highlight_element);
		if(close_function!=undefined) {
			close_function();
		}
	});
}


var xoptions_active = false;
var xoptins_reference = undefined;
function xoptions(message,buttonsObj) {
		// Example of optionsObj
	/*
	 * "{
			"OK": function()
			{
				$(this).dialog('close');
			},
			"NO": function() { 
				$(this).dialog('close');
			}
		},
	 */
	
	if(buttonsObj==undefined) {
		alert("xoptoins cannot be called without options given");
		return;
	}
	if(xoptions_active) {
		debug_out("Could not show xoptions, because one does already exist");
		return;
	}
	var messagebox = $(document.createElement('div'));
	xoptins_reference = messagebox;
	messagebox.attr("title","Options");
	messagebox.attr("class", "alert");
	//messagebox.css("background-color","red");
	messagebox.html("<img src='im_img/error.png'>&nbsp;&nbsp;"+message);
	
	
	
	
	
	messagebox.dialog({
		position: 'center',
		buttons: buttonsObj,
		close: function(){
			xoptions_active = false;
			xoptins_reference = undefined;
			$(this).remove();
		},
		open : function() {
			xoptions_active = true;
			var this_window = $(this).parent()
			this_window.offset({
				top: ($(document).height() / 2) - (this_window.height() / 2),
				left: ($(document).width() / 2) - (this_window.width() / 2)
			});
		},
		draggable: true,
		modal: true,
		resizable: false,
		width: 'auto'
	});
}
