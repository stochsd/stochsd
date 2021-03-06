/**
 * make number into string with and show exponent divisible by 3
 * e.g.
 *      0.000012345 -> 1234.5e-6
 *      0.00012345  -> 123.45e-6
 *      0.0012345   -> 1.2345e-3
 *      0.012345789 -> 0.012345789
 *      123.456789  -> 123.456789
 *      1234.56789  -> 1.23456789e+3
 *      123456.789  -> 123.456789e+3
 *      1234567.89  -> 1.23456789e+6
 *      12345678.9  -> 12.3456789e+6
 *      123456789   -> 123.456789e+6
 *      1234567890  -> 1.23456789e+9
 *      12345678900 -> 12.3456789e+9
 */

function round_exponent(exponent) {
    return Math.floor(exponent/3)*3;
}

String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}


function object_format(digits_above, digits_below) {
    let digits = {};
    for (let i = digits_above.length-1; i >= 0; i--) {
        let currentPos = `${digits_above.length-i-1}`;
        digits[currentPos] = Number(digits_above.charAt(i));
    }
    for (let i = 0; i < digits_below.length; i++) {
        let currentPos = `-${i+1}`;
        digits[currentPos] = Number(digits_below.charAt(i));
    }

    digits.topPos = digits_above.length-1;
    digits.bottomPos = -digits_below.length;

    digits.get = (pos) => { return digits[`${pos}`] }
    digits.set = (pos, newDigit) => { digits[`${pos}`] = newDigit }
    digits.increment = (pos) => { 
        let currentDigit = digits.get(pos);
        if (currentDigit === undefined) {
            digits.set(pos, 1);
            digits.topPos++;
        } else {
            if (currentDigit === 9) {
                digits.set(pos, 0);
                digits.increment(pos+1);
            } else {
                digits.set(pos, currentDigit+1);
            }
        }
        return digits;
    }
    digits.iterate = (from, to, func) => {
        for (let pos = from; pos >= to; pos--) {
            func(pos);
        }
    }
    digits.round = (desiredRoundingPos) => {
        if (desiredRoundingPos < digits.bottomPos) return digits;
        
        // Never round integers 
        let roundingPos = desiredRoundingPos < 0 ? desiredRoundingPos : 0;

        // round up if above previod number is 5 or above 
        if (digits.get(roundingPos-1) >= 5) {
            digits.increment(roundingPos);
        }

        // clear digits below the rounding position 
        digits.iterate(roundingPos-1, digits.bottomPos, (pos) => {
            delete digits[`${pos}`];
        });
        digits.bottomPos = roundingPos;

        return digits;
    }
    digits.toString = () => {
        let result = "";
        digits.iterate(digits.topPos, digits.bottomPos, (pos) => {
            if(pos == -1) {
                result += ".";
            }
            result += `${digits.get(pos)}`;
        })
        return result;
    }
    return digits;
}


/*
    positions:  4 3 2 1 0  -1-2-3-4-5-6
    digits:     8 3 4 2 5 . 4 1 0 9 8 4
                above       below
 */

function round_digits(digits_above, digits_below, position) {
    let pos = position < 1 ? position : 0;
    let digits = digits_above+digits_below;
    let index = digits_above.length-1-pos;

    if (Number(digits[index+1]) >= 5) {
        // round up
        for (let i = index; i >= 0; i--) {
            if (digits[i] === "9" && i < digits_above.length-1) {
                digits = digits.replaceAt(i, "0");
                if (i === 0) {
                    // last digit is 9
                    // e.g. 999 -> 1000
                    digits = "1"+digits;
                    // change length of digits above be be equal
                    digits_above = "1"+digits_above;
                }
            } else {
                digits = digits.replaceAt(i, `${Number(digits[i])+1}`);
                break;
            }
        }
        digits_above = digits.substr(0, digits_above.length);
        digits_below = digits.substr(digits_above.length);
    }
    return {
        "digits_above": digits_above, 
        "digits_below": digits_below.substr(0, -pos)
    };
}


let default_options = {
    decimals: undefined,
    precision: undefined, // also called sigificant digits 
    round_to_zero_limit: undefined, // Rounds to zero if abs(value) < round_to_zero_limit and round_to_zero_limit is defined
    use_e_format_upper_limit: 1e8, 
    use_e_format_lower_limit: 1e-6, 
    show_plus_sign: false,
    not_defined: "" // return if value is not defined 
}

function format_number(value, options = {}) {
    for (let key of Object.keys(default_options)) {
        if(options[key] === undefined) {
            options[key] = default_options[key];
        }
    }

    if (value === null || value === undefined) {
        return options.not_defined;
    }

    // set as zero if 0 or below rounding limit 
    if(value === 0 || (! isNaN(options.round_to_zero_limit) && Math.abs(value) <= options.round_to_zero_limit)) {
        return "0";
    }
    let log = Math.log10(Math.abs(value));
    let exponent = Math.floor(log);

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
    
    // set sign character 
    let sign_str = options.show_plus_sign ? "+" : "";
    sign_str = value < 0 ? "-": sign_str;

    // determine decimals/precision
    if (! isNaN(options.decimals)) {
        let ans = round_digits(digits_above, digits_below, -options.decimals);
        digits_above = ans.digits_above;
        digits_below = ans.digits_below;
    } else if (! isNaN(options.precision)) {
        let leading_zeros = 0;
        for (let d of digits_above.concat(digits_below)) { 
            if (d === "0") { 
                leading_zeros++; 
            } else {
                break;
            }
        }
        let ans = round_digits(digits_above, digits_below, digits_above.length-options.precision-leading_zeros);
        digits_above = ans.digits_above;
        digits_below = ans.digits_below;
    } else {
        // default: clean up zeros at end
        while(digits_below[digits_below.length-1] === "0") {
            digits_below = digits_below.substr(0, digits_below.length-1);
        }
    }
    let result = `${sign_str}${digits_above}`;
    if (digits_below.length !== 0) {
        result += `.${digits_below}`;
    }
    
    if (selected_exp !== 0) {
        // show as e-format 
        result = `${result}e${Math.sign(selected_exp) === 1 ? "+": "-" }${Math.abs(selected_exp)}`;
    }
    return result;
}



function decimals_in_value_string(value_str) {
    if (isNaN(value_str)) {
        return null;
    }

    // e-format numbers 
    // NOTE: not accurate number of decimals for e-format numbers 
    let decimals = 0;
    if (value_str.includes("e")) {
        for (let i = 0; value_str[i] !== "e"; i++) {
            if (! isNaN(value_str[i])) {
                decimals++;
            }
        }
        return decimals;
    }

    // normal numbers
    let splt = value_str.split('.');

    if (splt.length < 2) {
        return 0;
    } 
    let decimals_str = splt[1];
    decimals = decimals_str.length;

    let trailing_zeros = 0;
    for(let i = decimals-1; i >= 0; i--) {
        if (decimals_str[i] === "0") {
            trailing_zeros++;
        } else {
            break;
        }
    }

    return decimals-trailing_zeros;
}

// Uncomment for testing since it causes error for commonJS (only runs for node.js)
module.exports = format_number;