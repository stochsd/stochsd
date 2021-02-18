#!/usr/bin/env node
// This script prints the date of the last commit
var exec = require('child_process').exec;

exec('git log -1 --format=%ct', function(error, stdout, stderr) {
   got_timestamp(stdout);
});

function got_timestamp(timestamp) {
   var d = new Date(timestamp * 1000);
   let month = d.getMonth()+1 < 10 ? `0${d.getMonth()+1}` : d.getMonth()+1;
   let day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
   let date_str = `${d.getFullYear().toString()}.${month}.${day}`;

   console.log('Got version from git ', date_str);
   exec('node ./write-stochsd-version.js '+date_str, function(error, stdout, stderr) {
      console.log(stdout);
	}); 
}
