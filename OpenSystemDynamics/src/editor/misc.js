function showPluginMenu() {
	$(".pluginMenu").show();
}

function sendToParentFrame(returnobj, target) {
	results = {};
	results.target = target;
	results.returnobj = returnobj;
	parent.postMessage(JSON.stringify(results), "*");
}

function loadPlugin(pluginName) {
	sendToParentFrame({ "app_name": pluginName }, "load_app");
}

function setParentTitle(newTitle) {
	sendToParentFrame({ "title": newTitle }, "update_title");
}

