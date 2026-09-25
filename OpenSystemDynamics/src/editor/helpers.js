function makePrimitiveName(primitiveName) {
	return "[" + primitiveName + "]";
}

function stripBrackets(primitiveName) {
	let cutFrom = primitiveName.lastIndexOf("[") + 1;
	let cutTo = primitiveName.indexOf("]");
	if (cutFrom == -1) {
		cutFrom = 0;
	}
	if (cutTo == -1) {
		cutTo = primitiveName.length;
	}
	return primitiveName.slice(cutFrom, cutTo);
}

function warningHtml(message, specNotOk = false) {
	let noChanges = "";
	if (specNotOk) noChanges = "<br/><b>Your specification is not accepted!</b>";
	return (`<span class="warning">${message} ${noChanges}</span>`);
}

function noteHtml(message) {
	return (`<span class="note">Note:<br/>${message}</span>`);
}

// Param keys is array of string or a string 
function keyHtml(keys) {
	return Array.isArray(keys)
		? keys.map(key => `<kbd>${key}</kbd>`).join("+")
		: `<kbd>${keys}</kbd>`
}

function checkedHtml(value) {
	if (value) {
		return ' checked ';
	} else {
		return ' ';
	}
};

/**
 * 
 * @param {*} id
 * @param {"value" | "field"} field 
 */
function openPrimitiveDialog(id, field = "value") {
	let primitive = findID(id)
	if (getType(primitive) == "Ghost") {
		// If we click on a ghost change id to point to source
		id = findID(id).getAttribute("Source");
		primitive = findID(id)
	}
	primitiveType = getType(primitive)
	if (primitiveType == "Converter") {
		converterDialog.open(id, `.${field}-field`);
	} else {
		definitionEditor.open(id, `.${field}-field`);
	}
}

