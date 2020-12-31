
class DefinitionError {
    static init() {
        this.isDefErr = (defErr) => {
            return (typeof defErr === "object") && ("id" in defErr);
        }

        this.messageTable = {
            "1": (defErr) => "Empty Definition",
            "2": (defErr) => `Unknown reference ${defErr["unknownRef"]}`,
            "3": (defErr) => `Unused link from ${getName(findID(defErr["unusedId"]))}`,
            "4": (defErr) => `No ingoing link`, // only for converter
            "5": (defErr) => `More than one ingoing link`, // only for converter 
            "6": (defErr) => `Opening bracket "${defErr["openBracket"]}" is unmatched`,
            "7": (defErr) => `Closing bracket "${defErr["closeBracket"]}" is unmatched`,
            "8": (defErr) => `Unmatched brackets "${defErr["openBracket"]}...${defErr["closeBracket"]}"`
        }

        this.checkFunctions = [
            (prim, defString) => {
                // check empty string 
                if (defString === "") return { "id": 1 };
            },
            (prim, defString) => {
                // check brackets 
                const lines = defString.split("\n");
                let posCounter = 0;
                for(let i in lines) {
                    let line = lines[i];
                    let defErr = checkBracketErrors(line);
                    if (this.isDefErr(defErr)) {
                        if ("openPos"  in defErr) defErr["openPos"]["line"]  = Number(i)+1;
                        if ("closePos" in defErr) defErr["closePos"]["line"] = Number(i)+1;
                        return defErr;
                    }
                    posCounter += line.length+1;
                }
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
            return this.isDefErr(defErr);
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

function LineColToString(pos) {
    return `Line: ${pos["line"]}, Col: ${pos["col"]}`;
}

/**
 * checks for bracket errors and returns value error
 * Input should only be one row
 */
function checkBracketErrors(string) {
    //       index:       0    1    2 
	let openBrackets = 	["(", "{", "["];
	let closeBrackets = [")", "}", "]"];
    let bracketStack = []; // {pos: pos in string, bracket: openbracket, index: 0..2} only contains open brackets
    let stringSansComment = string.split("#")[0];
	for (pos in stringSansComment) { 
        let char = stringSansComment[pos];
		if (openBrackets.includes(char)) {
			let index = openBrackets.indexOf(char);
			bracketStack.push({"pos": parseInt(pos), "bracket": openBrackets[index], "index": parseInt(index)});
		} else if (closeBrackets.includes(char)) {
			let index = closeBrackets.indexOf(char);
			if (bracketStack.length === 0) {
                // unmatched close bracket, e.g. Rand(()
                let openChar = openBrackets[index];
                let closePos = parseInt(pos);
                let closeChar = char;
				return {"id": "7", "openBracket": openChar, "closePos": {"col": closePos}, "closeBracket": closeChar };
			}
			if (openBrackets[index] === bracketStack[bracketStack.length-1].bracket) {
				bracketStack.pop();
			} else {
				// unmatching open and close brackets, e.g. Rand(()]
                let openPos = parseInt(bracketStack[bracketStack.length-1].pos);
                let openChar = bracketStack[bracketStack.length-1].bracket;
                let closePos = parseInt(pos);
				let closeChar = char;
				return {"id": "8", "openPos": {"col": openPos}, "openBracket": openChar, "closePos": {"col": closePos}, "closeBracket": closeChar };
			}
		}
	}
	if ( bracketStack.length === 0 ) {
		return "";
	} else {
		// unmatched open brackets, e.g. Rand(()
        const topStack = bracketStack[bracketStack.length-1];
        const openPos = parseInt(topStack.pos);
        const openChar = topStack.bracket;
        const closeChar = closeBrackets[topStack.index];
		return { "id": "6", "openPos": {"col": openPos}, "openBracket": openChar, "closeBracket": closeChar };
	}
}