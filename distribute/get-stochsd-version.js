#!/usr/bin/env node
var fs = require("fs");

process.chdir(__dirname)
var content = fs.readFileSync('../OpenSystemDynamics/src/version.js', 'utf8');
eval(content);
console.log(stochsd.version);
