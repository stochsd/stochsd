#!/usr/bin/env node
// This script prints the date of the last commit
var exec = require('child_process').exec;

exec('git log -1 --format=%ct', function(error, stdout, stderr) {
   got_timestamp(stdout);
});

function got_timestamp(timestamp) {
   var date = new Date(timestamp * 1000);
   var year = date.getFullYear();
   var month = date.getMonth()+1;
   var day = date.getDate();
   console.log(year+"."+month+"."+day);
}
