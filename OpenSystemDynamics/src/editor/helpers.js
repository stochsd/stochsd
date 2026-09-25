function getVisibleNeighborhoodIds(id) {
	let neighbors = neighborhood(findID(id));
	let visibleNeighbors = neighbors.filter((neighbor) => { return (!neighbor.linkHidden) });
	return visibleNeighbors.map((neighbor) => { return neighbor.item.getAttribute("id"); });
}

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

function formatFunction(functionName) {
	return functionName + "()";
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

class EditorControll {
	static showEditor(primitive, annotations) {
		let primitiveId = getID(primitive);
		get_object(primitiveId).doubleClick();
	}
}

// But where the lines can be as long as required to print the variable
function stocsd_format(number, tdecimals, roundToZeroAt) {
	// tdecimals is optional and sets the number of decimals. It is rarly used (only in some tables)
	// Since the numbers automaticly goes to e-format when low enought

	// Used when e.g. the actuall error is reseted to null
	if (number == null) {
		return "";
	}

	// since its not written as E-format by default even as its <1E-7
	// Zero is a special case also or Round to zero when close 
	if (number == 0 || (roundToZeroAt && Math.abs(number) < roundToZeroAt)) {
		return "0";
	}

	// Check if number is to small to be viewed in field
	// If so, force e-format

	if (Math.abs(number) < Math.pow(10, (-tdecimals))) {
		return number.toExponential(2);
	}
	//Check if the number is to big to be view ed in the field
	if (Math.abs(number) > Math.pow(10, tdecimals)) {
		return number.toExponential(2);
	}

	// Else format it as a regular number, and remove ending zeros
	let stringified = number.toFixed(tdecimals);

	// Find the length of stringified, where the ending zeros have been removed
	let i = stringified.length;
	while (stringified.charAt(i - 1) == '0') {
		i = i - 1;
		// If we find a dot. Stop removing decimals
		if (stringified.charAt(i - 1) == '.') {
			i = i - 1;
			break;
		}
	}
	// Creates a stripped string without ending zeros
	let stripped = stringified.substring(0, i);
	return stripped;
}

function get_parent_id(id) {
	let parent_id = id.toString().split(".")[0];
	//~ do_global_log("x flowa "+parent_id);
	return parent_id;
}

function get_parent(child) {
	return get_object(get_parent_id(child.id));
}

// Get a list of all children for a parent
function getChildren(parentId) {
	let result = {}
	for (let key in object_array) {
		if (get_parent_id(key) == parentId && key != parentId) {
			result[key] = object_array[key];
		}
	}
	for (let key in connection_array) {
		if (get_parent_id(key) == parentId && key != parentId) {
			result[key] = connection_array[key];
		}
	}
	return result;
}

// Return true if parent has any selected children
function hasSelectedChildren(parentId) {
	// Make sure we actually work on parent element
	parentId = get_parent_id(parentId);

	// Find the children
	let children = getChildren(parentId);
	for (let id in children) {
		if (children[id].isSelected()) {
			return true;
		}
	}
	return false;
}
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

