
class DefinitionError {
    static init() {
        this.messageTable = {
            "1": (defErr) => "Empty Definition",
            "2": (defErr) => `Unknown reference ${defErr["unknownRef"]}`,
            "3": (defErr) => `Unused link from ${getName(findID(defErr["unusedId"]))}`,
            "4": (defErr) => `No ingoing link`, // only for converter
            "5": (defErr) => `More than one ingoing link`, // only for converter 
            "6": (defErr) => `Opening bracket "${defErr["openBracket"]}" at position ${defErr["openPos"]} is unmatched`,
            "7": (defErr) => `Closing bracket "${defErr["closeBracket"]}" at position ${defErr["closePos"]} is unmatched`,
            "8": (defErr) => `Unmatched brackets "${defErr["closeBracket"]}...${defErr["closeBracket"]}" at position ${defErr["openPos"]} and ${defErr["closePos"]}`
        }

        this.checkFunctions = [
            (prim, defString) => {
                if (defString === "") return { "id": 1 };
            },
            (prim, defString) => {
                // check brackets 
            },
            (prim, defString) => {
                // check links  
                let primType = prim.value.nodeName;
	            let linkedIds = findLinkedInPrimitives(prim.id).map(getID);
	            if (primType === "Stock" || primType === "Variable" || primType === "Flow") {
                    // 2. Unknown reference
                    let definitionRefs = defString.match(/[^[]+(?=\])/g);
                    definitionRefs = definitionRefs === null ? [] : definitionRefs;
                    let linkedRefs = linkedIds.map(id => getName(findID(id)));
                    for (let ref of definitionRefs) {
                        if (linkedRefs.includes(ref) === false) {
                            return { "id": "2", "unknownRef": ref };
                        }
                    }

                    // 3. Unused link 
                    for(let i = 0; i < linkedIds.length; i++) {
                        let ref = linkedRefs[i];
                        if (definitionRefs.includes(ref) === false) {
                            return { "id": "3", "unusedId": linkedIds[i] };
                        }
                    }
	            } else if (primType === "Converter") {
	    	        if (linkedIds.length === 0) {
			            // 4. No ingoing link 
			            return { "id": "4"};
		            } else if (linkedIds.length > 1) {
			            // 5. More then one ingoing link 
			            return {"id": "5", "linkedIds": linkedIds};
		            }
	            }
            },
        ]
    }

    static check(prim) {
        if (! isPrimitiveGhost(prim)) {
            for (let fn of this.checkFunctions) {
                let defErr = fn(prim, getValue(prim));
                if (defErr) {
                    prim.setAttribute("DefinitionError", JSON.stringify(defErr));
                    return true;
                }
            }
        }
        prim.setAttribute("DefinitionError", JSON.stringify({}));
        return false;
    }

    static has(prim) {
        try {
            const defErr = JSON.parse(prim.getAttribute("DefinitionError"));
            return (typeof defErr) && ("id" in defErr);
        } catch(err) {
            return false;
        }
    }

    static getMessage(prim) {
        if (this.has(prim)) {
            const defErr = JSON.parse(prim.getAttribute("DefinitionError"));
            return this.messageTable[defErr["id"]](defErr);
        }
        return "";
    }

    static getAllPrims() {
        let defErrPrims = primitives().filter(p => this.has(p)).filter(v => ! isPrimitiveGhost(v));
        return defErrPrims;
    }
}

DefinitionError.init();

/*
const VALUE_ERROR = {
	"VE1": "Empty Definition",
	"VE2": "Unknown Reference",
	"VE3": "Unused Link from",
	"VE4": "No Ingoing Link", // only for converter
	"VE5": "More Then One Ingoing Link", // only for converter
	// VE6 is depricated since it is now impossible
	"VE6": "A Parameter must <u>not</u> have an ingoing link. Please, remove it!", // Only for Parameter (Constant)
	"VE7": "Missing open bracket", // e.g. "Rand())"
	"VE8": "Unmatching bracket types", // Expected other type of bracket, e.g. "Rand(()]"
	"VE9": "Missing closing bracket" // e.g. "Rand((10+7)"
}

function ValueErrorToString(valueError) {
	if (valueError) {
		let errArr = valueError.split(":");
		let errType = errArr[0];
		let errArgs = errArr[1].split(",");
		let str = VALUE_ERROR[errType];
		switch(errType) {
			case("VE1"):
			case("VE4"):
			case("VE5"): 
			case("VE6"): 
				return str;
			case("VE2"):
				return `${str} [${errArgs[0]}]`;
			case("VE3"):
				return `${str} ${getName(findID(errArgs[0]))}`;
			case("VE8"):
				return `${str} "${errArgs[1]}...${errArgs[2]}"`
			case("VE7"): 
			case("VE9"):
				return `${str} "${errArgs[1]}"`;
			default: 
				return "Unknown error";
		}
	}
}


function checkValueError(primitive, value) {
	// 1. Empty string
	if (value === "") {
		return "VE1:";
	}
	
	let brackErr = checkBracketErrors(value);
	if (brackErr) return brackErr;

	let primType = primitive.value.nodeName;
	let linkedIds = findLinkedInPrimitives(primitive.id).map(getID);
	if (primType === "Variable" && primitive.value.getAttribute("isConstant") === "true") {
		if (linkedIds.length > 0) {
			return "VE6:";
		}
	}
	if (primType === "Stock" || primType === "Variable" || primType === "Flow") {
		// 2. Unknown reference
		let valueRefs = value.match(/[^[]+(?=\])/g);
		let linkedRefs = linkedIds.map(id => getName(findID(id)));
		if (valueRefs) {
			for (let ref of valueRefs) {
				if (linkedRefs.includes(ref) === false) {
					return `VE2:${ref}`;
				}
			}
		}

		// 3. Unused link 
		for(let i = 0; i < linkedIds.length; i++) {
			let ref = linkedRefs[i];
			if (valueRefs) {
				if (valueRefs.includes(ref) === false) {
					return `VE3:${linkedIds[i]}`;
				}
			} else {
				return `VE3:${linkedIds[i]}`;
			}
		}
	} else if (primType === "Converter") {
		if (linkedIds.length === 0) {
			// 4. No ingoing link 
			return "VE4:";
		} else if (linkedIds.length > 1) {
			// 5. More then one ingoing link 
			return `VE5:${linkedIds}`;
		}
	}
	// No error 
	return null;
}*/


/**
 * checks for bracket errors and returns value error
 */
function checkBracketErrors(string) {
	let openBrackets = 	["(", "{", "["];
	let closeBrackets = [")", "}", "]"];
	let bracketStack = []; // {pos, bracket, index} only contains open brackets
	for (i in string) {
		let char = string[i];
		if (openBrackets.includes(char)) {
			let index = openBrackets.indexOf(char);
			bracketStack.push({"pos": i, "bracket": openBrackets[index], "index": index});
		} else if (closeBrackets.includes(char)) {
			let index = closeBrackets.indexOf(char);
			if (bracketStack.length === 0) {
				// missing open bracket
				return `VE7:${i},${openBrackets[index]}`;
			}
			if (openBrackets[index] === bracketStack[bracketStack.length-1].bracket) {
				bracketStack.pop();
			} else {
				// unmatching closing brackets
				let open = bracketStack[bracketStack.length-1].bracket;
				let close = char;
				return `VE8:${i},${open},${close}`;
			}
		}
	}
	if ( bracketStack.length === 0 ) {
		return "";
	} else {
		// missing close bracket 
		let last = bracketStack[bracketStack.length-1];
		return `VE9:${last.pos},${closeBrackets[last.index]}`;
	}
}