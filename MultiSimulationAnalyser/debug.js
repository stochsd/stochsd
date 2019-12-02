/*

Copyright 2010-2019 StochSD-Team and Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Affero General Public License (http://www.gnu.org/licenses/agpl-3.0.html).

The Insight Maker Engine was contributed to StochSD project from Insight Maker project by Scott Fortmann-Roe, http://insightmaker.com

*/
function storted_export_txt() {
    export_txt("sorted_export.txt",dataset_tostring(sortdataset(vars_to_dataset(),single_selectedvar())));
}
