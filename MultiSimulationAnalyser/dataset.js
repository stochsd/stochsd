/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/

        function dataset_tostring(ds) {
            console.log("in dstostring");
            console.log(ds);
            var output="";
            
            // Header
            for(i in ds.header) {
                output+=ds.header[i]+"\t";
            }
            output+="\r\n";
            
            // Data
            for(j in ds.data) {
                row=ds.data[j];
                for(i in row) {
                    // First row has special treatment, becasoue this is the run number
                    if(i==0) {
                        output+=row[i]+"\t";
                    } else {
                        output+=row[i].toFixed(2)+"\t";
                    }
                }
                output+="\r\n";
            }
            return output;
        }
        
        //http://www.javascriptkit.com/javatutors/arraysort.shtml
        //http://stackoverflow.com/questions/8837454/sort-array-of-objects-by-single-key
        function sortByKey(a, key) {
            console.log("in sort by key");
            var a = a.sort(function (a, b) {
                console.log("in comparison function");
                var x = a[key]; 
                var y = b[key];
                console.log("comparing "+x+" and "+y);
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
            console.log("finished sorting");
            return a;
        }
        
        function ds_varindex(ds,varname) {
            for(i in ds.header) {
                if(ds.header[i]==varname) {
                    return i;
                }
            }
            alert(varname+" does not exist in dataset");
            return null;
        }
        
        function sortdataset(a,sortvar) {
            a.data=sortByKey(a.data,ds_varindex(a,sortvar));
            console.log("with sort");
            console.log(a);
            console.log("dataset:");
            return a;
        }
        
        function makedataset() {
            var a = [];
            a.header=["r.num","S","R","I"];
            a.data=[];
            a.data.push([1,3,7,1]);
            a.data.push([2,5,2,1]);
            a.data.push([3,4,2,1]);
            a.data.push([4,3,6,1]);
            a.data.push([5,3,6,1]);
            console.log("without sort");
            console.log(a);
            return a;
        }
        function vars_to_dataset(varstats) {
            var vartable = varstats.get_vartable();
            var a=[];
            a.header=["r.num"];
            a.data=[];
            // Insert header
            for(varname in vartable) {
                console.log("adding h");
                console.log(varname);
                a.header.push(varname);
            }
            console.log("header is ");
            console.log(a.header);
            var firstkey=undefined;
            for (firstkey in vartable) {
                break
            }
            if(firstkey==undefined) {
                alert("You must enter some variables");
                return;
            }
            
            // Loop through all data
            for(i=0;i < vartable[firstkey].data.length;i++) {
                // Loop through all variables
                row=[];
                row.push(i+1); // Push the run number of the row
                for(varname in vartable) {
                    row.push(vartable[varname].data[i]);
                }
                a.data.push(row);
            }
            console.log("before return");
            console.log(        a);
            return a;
        }
