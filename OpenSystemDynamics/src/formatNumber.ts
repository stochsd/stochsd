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

function roundExponent(exponent: number) {
    return Math.floor(exponent / 3) * 3;
}


class Digits {
    digits: Record<`${number}`, number> = {}
    topPosition: number
    bottomPosition: number
    constructor(integerDigits: string, decimalDigits: string) {
        for (let i = integerDigits.length - 1; i >= 0; i--) {
            this.digits[`${integerDigits.length - i - 1}`] = Number(integerDigits.charAt(i));
        }
        for (let i = 0; i < decimalDigits.length; i++) {
            this.digits[`${-(i + 1)}`] = Number(decimalDigits.charAt(i));
        }

        this.topPosition = integerDigits.length - 1;
        this.bottomPosition = -decimalDigits.length;
    }

    get(position: number) {
        return this.digits[`${position}`]
    }
    set(position: number, digit: number) {
        this.digits[`${position}`] = digit
    }
    increment(position: number) {
        let currentDigit = this.get(position);
        if (currentDigit === undefined) {
            this.set(position, 1);
            this.topPosition++;
        } else {
            if (currentDigit === 9) {
                this.set(position, 0);
                this.increment(position + 1);
            } else {
                this.set(position, currentDigit + 1);
            }
        }
        return this;
    }
    iterate(from: number, to: number, fn: (pos: number) => void) {
        for (let pos = from; pos >= to; pos--) {
            fn(pos);
        }
    }
    round(desiredRoundingPos: number) {
        if (desiredRoundingPos < this.bottomPosition) return this;

        // Never round integers 
        let roundingPosition = desiredRoundingPos < 0 ? desiredRoundingPos : 0;

        // round up if above previous number is 5 or above 
        if (this.get(roundingPosition - 1) >= 5) {
            this.increment(roundingPosition);
        }

        // clear digits below the rounding position 
        this.iterate(roundingPosition - 1, this.bottomPosition, (pos) => {
            delete this.digits[`${pos}`];
        });
        this.bottomPosition = roundingPosition;

        return this;
    }
    toString() {
        let result = "";
        this.iterate(this.topPosition, this.bottomPosition, (position: number) => {
            if (position == -1) {
                result += ".";
            }
            result += `${this.get(position)}`;
        })
        return result;
    }

    toAboveBelowFormat() {
        let integerDigits = "";
        let decimalDigits = "";
        this.iterate(this.topPosition, this.bottomPosition, (position: number) => {
            if (position >= 0) {
                integerDigits += `${this.get(position)}`;
            } else {
                decimalDigits += `${this.get(position)}`;
            }
        });
        return {
            integerDigits: integerDigits !== "" ? integerDigits : "0",
            decimalDigits
        };
    }
}

/*
    positions:  4 3 2 1 0  -1-2-3-4-5-6
    digits:     8 3 4 2 5 . 4 1 0 9 8 4
                            above       below
*/
function roundDigits(integerDigits: string, decimalDigits: string, position: number) {
    return new Digits(integerDigits, decimalDigits).round(position).toAboveBelowFormat();
}

var default_options: FormatNumberOptions = {
    decimals: undefined,
    precision: undefined, // also called significant digits 
    round_to_zero_limit: undefined, // Rounds to zero if abs(value) < round_to_zero_limit and round_to_zero_limit is defined
    use_e_format_upper_limit: 1e8,
    use_e_format_lower_limit: 1e-6,
    show_plus_sign: false,
    not_defined: "" // return if value is not defined 
}
type FormatNumberOptions = {
    decimals?: number,
    precision?: number, // also called significant digits 
    round_to_zero_limit?: number, // Rounds to zero if abs(value) < round_to_zero_limit and round_to_zero_limit is defined
    use_e_format_upper_limit?: number,
    use_e_format_lower_limit?: number,
    show_plus_sign?: false,
    not_defined?: "" // return if value is not defined 
}

/* replaces format_number */
export function formatNumber(value: number, options: FormatNumberOptions = {}) {
    for (let key of Object.keys(default_options) as (keyof FormatNumberOptions)[]) {
        if (typeof (options)[key] == "undefined") {
            (options as any)[key] = default_options[key] as any;
        }
    }

    if (value === null || value === undefined) {
        return options.not_defined as string
    }

    // set as zero if 0 or below rounding limit 
    if (value === 0 || (!isNaN(Number(options.round_to_zero_limit)) && Math.abs(value) <= options.round_to_zero_limit!)) {
        return "0";
    }
    let log = Math.log10(Math.abs(value));
    let exponent = Math.floor(log);

    // exponent rounded of to nerest 3 divisible number: ...-6, -3, 0, 3, 6,...
    let exp3 = roundExponent(exponent);

    let selectedExp = 0;
    if ((Math.abs(value) >= options.use_e_format_upper_limit!) ||
        (Math.abs(value) <= options.use_e_format_lower_limit!)) {
        selectedExp = exp3;
    }

    let integerDigits = "";
    let decimalDigits = "";
    let rest = Math.abs(value);
    for (let i = selectedExp; i > selectedExp - 10; i--) {
        let tmpNum = Math.floor(rest / (10 ** i));
        if (i === selectedExp) {
            // NOTE: for numbers above 1e21 this will turn into e-format by the tostring method
            integerDigits += `${tmpNum}`;
        } else {
            decimalDigits += `${tmpNum}`;
        }
        rest -= tmpNum * 10 ** i;
        rest = rest < 0 ? 0 : rest;
    }

    // set sign character 
    let sign_str = options.show_plus_sign ? "+" : "";
    sign_str = value < 0 ? "-" : sign_str;

    // determine decimals/precision
    if (!isNaN(Number(options.decimals))) {
        let ans = roundDigits(integerDigits, decimalDigits, -options.decimals!);
        integerDigits = ans.integerDigits;
        decimalDigits = ans.decimalDigits;
    } else if (!isNaN(Number(options.precision))) {
        let leading_zeros = 0;
        for (let d of integerDigits.concat(decimalDigits)) {
            if (d === "0") {
                leading_zeros++;
            } else {
                break;
            }
        }
        let ans = roundDigits(integerDigits, decimalDigits, integerDigits.length - options.precision! - leading_zeros);
        integerDigits = ans.integerDigits;
        decimalDigits = ans.decimalDigits;
    } else {
        // default: clean up zeros at end
        while (decimalDigits[decimalDigits.length - 1] === "0") {
            decimalDigits = decimalDigits.substr(0, decimalDigits.length - 1);
        }
    }
    let result = `${sign_str}${integerDigits}`;
    if (decimalDigits.length !== 0) {
        result += `.${decimalDigits}`;
    }

    if (selectedExp !== 0) {
        // show as e-format 
        result = `${result}e${Math.sign(selectedExp) === 1 ? "+" : "-"}${Math.abs(selectedExp)}`;
    }
    return result;
}


/* replaces decimals_in_value_string */
export function decimalsInValueString(value: string) {
    if (isNaN(Number(value))) {
        return null;
    }

    // e-format numbers 
    // NOTE: not accurate number of decimals for e-format numbers 
    let decimals = 0;
    if (value.includes("e")) {
        for (let i = 0; value[i] !== "e"; i++) {
            if (!isNaN(Number(value[i]))) {
                decimals++;
            }
        }
        return decimals;
    }

    // normal numbers
    let split = value.split('.');

    if (split.length < 2) {
        return 0;
    }
    let decimals_str = split[1];
    decimals = decimals_str.length;

    let trailing_zeros = 0;
    for (let i = decimals - 1; i >= 0; i--) {
        if (decimals_str[i] === "0") {
            trailing_zeros++;
        } else {
            break;
        }
    }

    return decimals - trailing_zeros;
}


(window as any).formatNumber = formatNumber;
(window as any).decimalsInValueString = decimalsInValueString;