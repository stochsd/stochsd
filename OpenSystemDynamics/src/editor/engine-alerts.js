// Override the message function used by the insight maker engine so that we can catch error popups
if (typeof mxUtils == "undefined") {
	window.mxUtils = {};
	window.mxUtils.alert = function (message, closeHandler) {
		xAlert("Message from engine:  " + colorizeMessage(message), closeHandler);
	}
}
/** @param {string} message  */
function colorizeMessage(message) {
	return message.replace(/\[([^\]]+)\]/g, (match, primitiveName) => {
  		const primitives = findName(primitiveName)
    	const primitive = Array.isArray(primitives) ? primitives.find(p => !isPrimitiveGhost(p)) : primitives
    	const color = primitive?.getAttribute("Color")
  		return `<span style="${color ? `color: ${color};` : ""} font-weight: bold; font-style: normal;">[${primitiveName}]</span>`;
	});
}
