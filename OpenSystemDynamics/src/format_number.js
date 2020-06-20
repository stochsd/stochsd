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


let default_options = {
    decimals: undefined,
    precision: undefined, // also called sigificant digits 
    round_to_zero_limit: undefined,
    use_e_format_upper_limit: 1e8, 
    use_e_format_lower_limit: 1e-6, 
    show_plus_sign: false
}

function format_number(value, options = {}) {
    for (let key of Object.keys(default_options)) {
        if(options[key] === undefined) {
            options[key] = default_options[key];
        }
    }

    if(value === 0) {
        return "0";
    }
    let log = Math.log10(Math.abs(value));
    let exponent = Math.floor(log);
    let isPositive = value >= 0;

    // exponent rounded of to nerest 3 divisible number: ...-6, -3, 0, 3, 6,...
    let exp3 = round_exponent(exponent);

    selected_exp = 0;
    if ((Math.abs(value) >= options.use_e_format_upper_limit) ||
        (Math.abs(value) <= options.use_e_format_lower_limit)) {
        selected_exp = exp3;
    }
    

    let digits_above = "";
    let digits_below = "";
    let rest = Math.abs(value);
    for (let i = selected_exp; i > selected_exp-10; i--) {
        tmpNum = Math.floor(rest/(10**i));
        if (i === selected_exp) {
            // NOTE: for numbers above 1e21 this will turn into e-format by the tostring method
            digits_above += `${tmpNum}`;
        } else {
            digits_below += `${tmpNum}`;
        }
        rest -= tmpNum*10**i;
    }
    
    let sign_str = options.show_plus_sign ? "+" : "";
    if (! isPositive) {
        sign_str = "-";
    }

    // determine decimals/precision
    if (! isNaN(options.decimals)) {
        digits_below = digits_below.substr(0, options.decimals);
        // -- round last digit here ---
    } else if (! isNaN(options.precision)) {
        digits_below = digits_below.substr(0, options.precision-digits_above.length);
        // -- round last digit here ---
    } else {
        // default: clean up zeros
        while(digits_below[digits_below.length-1] === "0") {
            digits_below = digits_below.substr(0, digits_below.length-1);
        }
    }
    let result = `${sign_str}${digits_above}`;
    if (digits_below.length !== 0) {
        result += `.${digits_below}`;
    }
    
    if (selected_exp !== 0) {
        result = `${result}e${Math.sign(selected_exp) === 1 ? "+": "-" }${Math.abs(selected_exp)}`;
    }
    return result;
}