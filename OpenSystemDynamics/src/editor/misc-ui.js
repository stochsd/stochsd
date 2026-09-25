function setColorToSelection(color) {
	for (let visual of Visuals.selected()) {
		get_parent(visual).setColor(color);
	}
	History.storeUndoState();
}

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

function removeNewLines(string) {
	let newString = string;
	newString = newString.replace(/\\n/g, " ");
	return newString;
}

function seperateFolderAndFilename(file_path) {
	let seperator = "\\";
	if (file_path.includes("/")) {
		seperator = "/";
	}
	let segments = file_path.split(seperator);
	let path = "";
	for (let i = 0; i < segments.length - 1; i++) {
		path += segments[i] + seperator;
	}
	return { "path": path, "name": segments[segments.length - 1] };
}

async function updateRecentsMenu() {
	if (!fileManager.hasRecentFiles()) {
		return;
	}
	let recent = await fileManager.getRecentDisplayList();
	if (recent.length > 0) {
		$('#recent_title').show();
		$('#btn_recent_clear').show();
	} else {
		$('#recent_title').hide();
		$('#btn_recent_clear').hide();
	}
	for (let i = 0; i < Settings.MaxRecentFiles; i++) {
		if (i < recent.length) {
			$(`#btn_recent_${i}`).show();
			let file = seperateFolderAndFilename(recent[i]);
			$(`#btn_recent_${i}`).html(`<span class="recent-path">${file.path}</span><span class="recent-name">${file.name}</span>`);
			$(`#btn_recent_${i}`).attr("data-recent-index", i.toString());
		} else {
			$(`#btn_recent_${i}`).hide();
		}
	}
}

