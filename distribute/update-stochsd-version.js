#!/usr/bin/env node
var fs = require("fs");
const { version } = require("punycode");

process.chdir(__dirname);

let d = new Date();
let month = d.getMonth()+1 < 10 ? `0${d.getMonth()+1}` : d.getMonth()+1;
let day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
let date_str = `${d.getFullYear().toString()}.${month}.${day}`;

let text = `var stochsd = {
\tversion: "${date_str}"
};\n`;

fs.writeFile('../OpenSystemDynamics/src/version.js', text, 'utf8', (error) => {
    if (error) throw error;
    console.log(`Version updated to ${date_str}`);
});