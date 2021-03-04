let format_number = require('../src/format_number.js');


let resultTable = [];
let numSuccess = 0;
let numFail = 0;

function test_format_number(number, options, expected) {
    let output = format_number(number, options);
    
    let success = output === expected ? "SUCCESS!" : "FAIL";
    output === expected ? numSuccess++ : numFail++;

    resultTable.push({ "Number": number, "Output": output, "Expected": expected, "Success": success, ...options });
}




test_format_number(666666.666, { "precision": 2 }, "666666");
test_format_number(666666.666, { "precision": 3 }, "666666");
test_format_number(666666.666, { "precision": 4 }, "666666");
test_format_number(666666.666, { "precision": 5 }, "666666");
test_format_number(666666.666, { "precision": 6 }, "666667");
test_format_number(666666.666, { "precision": 7 }, "666666.7");
test_format_number(666666.666, { "precision": 8 }, "666666.67");
test_format_number(666666.666, { "precision": 9 }, "666666.666");

test_format_number(666666, { "precision": 9 }, "666666.000");
test_format_number(10375, { "precision": 4 }, "10375");
test_format_number(100000001, { "precision": 9 }, "100.000001e+6");
test_format_number(100000001, { "precision": 8 }, "100.00000e+6");

console.table(resultTable);
console.log(`Num Success: ${numSuccess}`);
console.log(`Num Fail: ${numFail}`);
