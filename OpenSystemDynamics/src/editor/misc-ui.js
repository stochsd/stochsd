function printDiagram() {
	Visuals.unselectAll();
	InfoBar.update();
	ToolBox.updateButtons();
	// Write filename and date into editor-footer 
	let fileName = fileManager.fileName;

	let d = new Date();
	let month = d.getMonth() + 1 < 10 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
	let day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
	let hours = d.getHours() < 10 ? `0${d.getHours()}` : d.getHours();
	let minutes = d.getMinutes() < 10 ? `0${d.getMinutes()}` : `${d.getMinutes()}`;
	let fullDate = `${d.getFullYear().toString()}-${month}-${day} ${hours}:${minutes} (yyyy-mm-dd hh:mm)`;

	$(".editor-footer").css("display", "block");
	if (fileName.length > 0) {
		$(".editor-footer-filepath").html(fileName);
	} else {
		$(".editor-footer-filepath").html("Unnamed file");
	}

	$(".editor-footer-date").html(fullDate);

	hideAndPrint([$("#topPanel").get(0)]);
	$(".editor-footer").css("display", "none");
}
