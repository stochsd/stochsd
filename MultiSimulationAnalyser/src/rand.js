/*

This file may distributed and/or modified under the
terms of the Affero General Public License (http://www.gnu.org/licenses/agpl-3.0.html).

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
