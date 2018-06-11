/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
function keyvalidate_apply() {
    $(".req_int" ).each(initvalidate);
    $(".req_float" ).each(initvalidate);
    
    $(".req_int").keypress(intvalidate);
    $(".req_float").keypress(floatvalidate);
    
    $(".req_int").change(rangevalidate);
    $(".req_float").change(rangevalidate);
}
function initvalidate() {
    var last_valid_val=0;
    if($(this).val()!="") {
        last_valid_val=$(this).val();
    }
    $(this)[0].last_valid_val=last_valid_val;
}
function valid_number(input) {
    if(IsNumeric(input) ||  input=="") {
        return true;
    } else {
        return false;
    }
}
function rangevalidate(event) {
    /*
     * Set empty field to "0"
    if($(this).val()=="") {
            $(this).val("0");
    }
    */
    var min=$(this).attr("data-min");
    var max=$(this).attr("data-max");
    if(!valid_number($(this).val())) {
        $(this).val(""+$(this)[0].last_valid_val);
        return;
    }
    var val=Number($(this).val());
    if(max!=undefined) {
        if(val>max) {
            $(this).val(max);
        }
    }
    if(min!=undefined) {
        if(val<min) {
            $(this).val(min);
        }
    }
    $(this)[0].last_valid_val=$(this).val();
}
function floatvalidate(event) {
    keyvalidate(event,"0123456789,.Ee+-");
}
function intvalidate(event) {
    keyvalidate(event,"0123456789");
}
function keyvalidate(event,allowed_chars) {
    var allowed_keycodes=[13,8,0];
    for(i=0;i<allowed_chars.length;i++) {
        allowed_keycodes.push(allowed_chars.charCodeAt(i));
    };
    var key=event.which;
    if(allowed_keycodes.indexOf(key)==-1) {
        event.preventDefault();
    }
}
