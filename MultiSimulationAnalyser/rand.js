/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
var randclass=function() {
    var rand_seed = 1;
    function rand_setseed(seedvalue) {
        rand_seed = Number(seedvalue);
    }
    function rand_next() {
        im = 134456;
        ia = 8121;
        ic = 28411;
        rand_seed = (rand_seed*ia+ic) % im;
        return rand_seed/im;
    }

    var interface={};
    interface.setseed=rand_setseed;
    interface.next=rand_next;
    
    
    
    
    return interface;
};
var rand=randclass();
