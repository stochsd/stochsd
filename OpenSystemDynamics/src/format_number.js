/**
 * make number into string with and show exponent divisible by 3
 * e.g.
 *      0.000012345 -> 1234.5E-6
 *      0.00012345  -> 123.45E-6
 *      0.0012345   -> 1.2345E-3
 *      0.012345789 -> 0.012345789
 *      123.456789  -> 123.456789
 *      1234.56789  -> 1.23456789E+3
 *      123456.789  -> 123.456789E+3
 *      1234567.89  -> 1.23456789E+6
 *      12345678.9  -> 12.3456789E+6
 *      123456789   -> 123.456789E+6
 *      1234567890  -> 1.23456789E+9
 *      12345678900 -> 12.3456789E+9
 */

function round_exponent(exponent) {
    return Math.floor(exponent/3)*3;
}

/*
    {
        decimals: int,
        precision: int, // also called sigificant digits 
        round_to_zero_limit, float,
        use_e_format_upper_limit: float,
        use_e_format_lower_limit: float,
        show_plus_sign: bool 
    }
*/

function format_number(value, options) {
    if(value === 0) {
        return "0";
    }
    let log = Math.log10(Math.abs(value));
    let exponent = Math.floor(log);
    let isPositive = value >= 0;
    let roundedExponent = round_exponent(exponent);

    let coeffStr = "";
    let rest = Math.abs(value);
    let dotIsSet = false;
    for (let i = roundedExponent; i > roundedExponent-10; i--) {
        tmpNum = Math.floor(rest/(10**i));
        coeffStr += `${tmpNum}`;
        rest -= tmpNum*10**i;
        if (dotIsSet === false) {
            coeffStr += ".";
            dotIsSet = true;
        }
    }
    if (! isPositive) {
        coeffStr = `-${coeffStr}`;
    }
    // clean up zeros
    while(coeffStr[coeffStr.length-1] === "0") {
        coeffStr = coeffStr.substr(0, coeffStr.length-1);
    }
    let result = coeffStr;
    if (roundedExponent !== 0) {
        result = `${coeffStr}e${Math.sign(roundedExponent) === 1 ? "+": "-" }${Math.abs(roundedExponent)}`;
    }
    return result;
}