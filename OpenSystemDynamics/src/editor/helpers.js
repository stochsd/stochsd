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
