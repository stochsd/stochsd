/**
 * Opens the dialog for editing a primitive: the converter dialog for converters, otherwise the definition editor.
 * A ghost opens the dialog of the primitive it is a ghost of.
 * @param {string} id
 * @param {"value" | "name"} field The field to focus in the dialog
 */
function openPrimitiveDialog(id, field = "value") {
	let primitive = findID(id)
	if (getType(primitive) == "Ghost") {
		// If we click on a ghost change id to point to source
		id = findID(id).getAttribute("Source");
		primitive = findID(id)
	}
	let primitiveType = getType(primitive)
	if (primitiveType == "Converter") {
		converterDialog.open(id, `.${field}-field`);
	} else {
		definitionEditor.open(id, `.${field}-field`);
	}
}
