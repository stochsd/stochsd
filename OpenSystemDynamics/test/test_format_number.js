try {
    var format_number = require('../src/format_number.js');
    run_tests();
} catch (e) {
    console.log('\n ===> Uncomment "module.exports = format_number;" in format_number.js <===\n');
}


function run_tests() {
    
    let resultTable = [];
    let numSuccess = 0;
    let numFail = 0;

    function test_format_number(number, options, expected) {
        let output = format_number(number, options);
        
        let success = output === expected ? "SUCCESS" : "FAIL";
        output === expected ? numSuccess++ : numFail++;
    
        resultTable.push({ "Number": number, "Output": output, "Expected": expected, "Success": success, ...options });
    }

    test_format_number(666666.666, { "precision": 2 }, "666667");
    test_format_number(666666.666, { "precision": 3 }, "666667");
    test_format_number(666666.666, { "precision": 4 }, "666667");
    test_format_number(666666.666, { "precision": 5 }, "666667");
    test_format_number(666666.666, { "precision": 6 }, "666667");
    test_format_number(666666.666, { "precision": 7 }, "666666.7");
    test_format_number(666666.666, { "precision": 8 }, "666666.67");
    test_format_number(666666.666, { "precision": 9 }, "666666.666");
    
    test_format_number(666666, { "precision": 9 }, "666666.000");
    test_format_number(10375, { "precision": 4 }, "10375");
    test_format_number(100000001, { "precision": 9 }, "100.000001e+6");
    test_format_number(100000001, { "precision": 8 }, "100.00000e+6");

    test_format_number(6661.6666, {precision: 1}, "6662");
    test_format_number(6661.6666, {precision: 2}, "6662");
    test_format_number(6661.6666, {precision: 3}, "6662");
    test_format_number(6661.6666, {precision: 4}, "6662");
    test_format_number(6661.6666, {precision: 5}, "6661.7");
    test_format_number(6661.6666, {precision: 6}, "6661.67");
    test_format_number(6661.6666, {precision: 7}, "6661.667");
    test_format_number(6661.6666, {precision: 8}, "6661.6666");

    test_format_number(9999.5, {precision: 1}, "10000");
    test_format_number(9999.5, {precision: 2}, "10000");
    test_format_number(9999.5, {precision: 3}, "10000");
    test_format_number(9999.5, {precision: 4}, "10000");
    test_format_number(9999.5, {precision: 5}, "9999.5");


    test_format_number(0.001956, {precision: 1}, "0.002");
    test_format_number(0.001956, {precision: 2}, "0.0020");
    test_format_number(0.001956, {precision: 3}, "0.00196");
    test_format_number(0.001956, {precision: 4}, "0.001956");

    test_format_number(0.1872, {precision: 1}, "0.2");
    test_format_number(0.1872, {precision: 2}, "0.19");
    test_format_number(0.1872, {precision: 3}, "0.187");
    test_format_number(0.1872, {precision: 4}, "0.1872");

    test_format_number(0.1872, {decimals: 0}, "0");
    test_format_number(0.1872, {decimals: 1}, "0.2");
    test_format_number(0.1872, {decimals: 2}, "0.19");
    test_format_number(0.1872, {decimals: 4}, "0.1872");

    
    console.table(resultTable);
    console.log(`Num Success: ${numSuccess}`);
    console.log(`Num Fail: ${numFail}`);
}

