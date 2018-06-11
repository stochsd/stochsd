/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
function storted_export_txt() {
    export_txt("sorted_export.txt",dataset_tostring(sortdataset(vars_to_dataset(),single_selectedvar())));
}
