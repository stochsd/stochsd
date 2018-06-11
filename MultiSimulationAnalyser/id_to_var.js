/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
function id_to_var() {
    //alert("id to var");
    // Create variables of all DOM objects with ID
    // http://stackoverflow.com/questions/5786851/define-global-variable-in-a-javascript-function
    debug_out("all ids");
    var id_obj_arr=$("[id]");
    debug_out("all id is");
    debug_out(id_obj_arr);
    
    // Create array of ids to check
    // This is used to avoid duplicates
    debug_out("id_obj_arr");
    //return;
    var ids_to_check=[];
    // Loop through the results from jquery, and build ids_to_check
    for(i in id_obj_arr) {
        // Current id
        id=id_obj_arr[i].id;
        //var id=$(id_obj_arr[i]).attr("id");
        //alert(id);
        // If the id jquery found has a value
        if(id!=undefined) {
            // Add the id to ids_to_check if not already in
            //if(ids_to_check.indexOf(id)==-1) {
            ids_to_check.push(id);
            //}
        }
    }
    
    // Go through array of ids and instanciate if variable does not already exist
    for(i in ids_to_check) {
        var id=ids_to_check[i];
        window[id]=$("#"+id);
    }
    debug_out("ids to check");
    debug_out(ids_to_check);
}
