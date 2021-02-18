#!/usr/bin/env node
var fs = require("fs");

if(process.argv.length<3) {
    console.log('Syntax '+process.argv[1]+' [VERSION_NUMBER]');
    process.exit(1);
}
version_number = process.argv[2];
console.log(process.argv)

process.chdir(__dirname);

let text = `var stochsd = {
\tversion: "${version_number}"
};\n`;

fs.writeFile('../OpenSystemDynamics/src/version.js', text, 'utf8', (error) => {
    if (error) throw error;
    console.log(`Version updated to ${version_number}`);
});
