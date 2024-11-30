/*

This file may distributed and/or modified under the
terms of the Affero General Public License (http://www.gnu.org/licenses/agpl-3.0.html).

*/
function storted_export_txt() {
    export_txt("sorted_export.txt",dataset_tostring(sortdataset(vars_to_dataset(),single_selectedvar())));
}
