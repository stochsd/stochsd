/*

This file may distributed and/or modified under the
terms of the Affero General Public License (http://www.gnu.org/licenses/agpl-3.0.html).

*/


// This file controls the things that are depending on which environment the software is running in
// There are two supported environments
// 1. Web
// 2. NodeWebkit (http://nwjs.io)
// 
// The things that depend on the environment are things such as file handeling and window closing
// The decision of which environment to use is in the bottom of this file

var nwjsGui = null;
var nwjsWindow = null;
var nwjsApp = null;



const appName = "StochSD";

class nwController {
	static init() {
		if (isRunningNwjs()) {
			this.nwActive = true
			this.maximize = this.unsafeNwMaximize
			this.getWindow = this.unsafeGetWindow
			this.getParams = this.unsafeGetParams
			this.ready = this.unsafeReady
			this.openFile = this.unsafeOpenFile
		}
	}
	static ready() {
		// This is replaced in init if NW is running		
	}
	static unsafeReady() {
		//~ NwZoomController.zoomReset();
		NwZoomController.zoomLoadFromStorage();
		let params = this.getParams();
		if (params.length >= 1) {
			let parameterFilename = params[0];
			fileManager.loadFromFile(parameterFilename);
		}

		var ngui = this.unsafeGetGui();
		var nwin = this.unsafeGetWindow();
		var app = this.unsafeGetApp();
		nwjsGui = ngui;
		nwjsWindow = nwin;
		nwjsApp = app;

		// This save before closing handler only works when we run without plugin tools.
		// Otherwise it makes it impossible to quit
		nwin.on("close", function (event) {
			quitQuestion();
		});
	}
	static getWindow() {
		// This is replaced in init if NW is running
	}
	static unsafeGetGui() {
		var ngui = require("nw.gui");
		return ngui;
	}
	static unsafeGetWindow() {
		var ngui = require("nw.gui");
		var nwin = ngui.Window.get();
		return nwin;
	}
	static unsafeGetApp() {
		var nwgui = require("nw.gui");
		var App = nwgui.App;
		return App;
	}
	static maximize() {
		// This is replaced in init if NW is running
	}
	static unsafeNwMaximize() {
		// This function is unsafe unless NW is active
		var nwin = nwController.getWindow();
		nwin.show();
		nwin.maximize();
	}
	static getParams() {

	}
	static unsafeGetParams() {
		var nwgui = require("nw.gui");
		return nwgui.App.argv;
	}
	static openFile() {

	}
	static unsafeOpenFile(fileName) {
		nwjsGui.Shell.openItem(fileName);
	}
}

class NwZoomController {
	static init() {
		this.nwWindow = nwController.getWindow();
	}
	static zoomIn() {
		do_global_log("Zooming in");
		this.nwWindow.zoomLevel += 0.1;
		localStorage.setItem("zoomLevel", this.nwWindow.zoomLevel);
	}
	static zoomOut() {
		do_global_log("Zooming out");
		this.nwWindow.zoomLevel -= 0.1;
		localStorage.setItem("zoomLevel", this.nwWindow.zoomLevel);
	}
	static zoomReset() {
		do_global_log("Reseting zoom");
		this.nwWindow.zoomLevel = Settings.nwInitZoom;
		localStorage.setItem("zoomLevel", this.nwWindow.zoomLevel);
	}

	static zoomLoadFromStorage() {
		do_global_log("loading from storage zoom");
		let loadedZoomLevel = localStorage.getItem("zoomLevel");
		if (loadedZoomLevel == null) {
			return;
		}
		loadedZoomLevel = Number(loadedZoomLevel);
		this.nwWindow.zoomLevel = loadedZoomLevel;
	}
}

class BaseFileManager {
	constructor() {
		this._fileName = "";
		this.lastSaved = null;
		this.softwareName = appName;
	}
	// This is executed when the document is ready
	ready() {
		// Override this
		this.updateTitle();
	}
	newModel() {
		localStorage.removeItem("reloadPending");
		this._fileName = "";
		this.updateTitle();
		applicationReload();
	}
	newModelOld() {
		History.clearUndoHistory();
		newModel();
		// Store an empty state as first state
		History.storeUndoState();
		// There is no last state is it could not be unsaved
		History.unsavedChanges = false;
		this.fileName = null;
		this.lastSaved = null;
		this.updateTitle();
		// Optional handler for when saving is finished
		this.finishedSaveHandler = null;
		RunResults.resetSimulation();
	}
	saveModelAs() {
		let fileData = createModelFileData();
		// Only exportFile is implementation specific (different on nwjs and electron)
		this.exportFile(fileData, Settings.fileExtension, (filePath) => {
			this.fileName = filePath;
			this.addToRecent(this.fileName);

			this.updateSaveTime();
			this.updateTitle();
			if (this.finishedSaveHandler) {
				// must have delay otherwise finishedSaveHandler can run before file is done saving
				// e.g. if finishedSaveHandler is used for closing program, it may save empty file.
				setTimeout(this.finishedSaveHandler, 400);
			}
		});
	}
	hasSaveAs() {
		return false;
	}
	hasRecentFiles() {
		return false;
	}
	saveModel() {
		// Override this
	}
	loadModel() {
		// Override this
	}
	setTitle(newTitleRaw) {
		// None breaking space
		const nbsp = String.fromCharCode(160);
		// string.replace does not work with char(160) for some reason, so we had to make our own
		let newTitle = "";
		for (var i = 0; i < newTitleRaw.length; i++) {
			let tchar = newTitleRaw.charAt(i);
			if(tchar == " ") {
				newTitle = newTitle + nbsp;
			} else {
				newTitle = newTitle + tchar;
			}
		}
		if (window !== window.top) {
			// In iFrame
			setParentTitle(newTitle);
		}
		else {
			// Not in iFrame
			document.title = newTitle;
		}
	}
	loadModelData(modelData) {
		History.clearUndoHistory();
		loadModelFromXml(modelData);
		// Store an empty state as first state
		History.storeUndoState();
		RunResults.resetSimulation();
	}
	updateSaveTime() {
		this.lastSaved = new Date().toLocaleTimeString();

	}
    updateTitle() {
		let title = this.softwareName;
		const nbsp = String.fromCharCode(160);
        if (this.fileName != "") {
            title += "   |   " + this.fileName;
            if (this.lastSaved) {
                title += "   (last saved: " + this.lastSaved + ")";
            }
		}
        this.setTitle(title);
    }
	set fileName(newFileName) {
		if (newFileName == null) {
			newFileName = "";
		}
		this._fileName = newFileName;
	}
	get fileName() {
		return this._fileName;
	}
	appendFileExtension(filename, extension) {
		var extension_position = filename.length - extension.length;
		var current_extension = filename.substring(extension_position, filename.length);
		if (current_extension.toLowerCase() != extension.toLowerCase()) {
			filename += extension;
		}
		return filename;
	}
}

class WebFileManager extends BaseFileManager {
	constructor() {
		super();
		this.softwareName = appName + " Web";
	}
	download(fileName, data) {
		// Create Blob and attach it to ObjectURL
		var blob = new Blob([data], { type: "octet/stream" }),
			url = window.URL.createObjectURL(blob);

		// Create download link and click it
		var a = document.createElement("a");
		a.style.display = "none";
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();

		// The setTimeout is a fix to make it work in Firefox
		// Without it, the objectURL is removed before the click-event is triggered
		// And the download does not work
		setTimeout(function () {
			window.URL.revokeObjectURL(url);
			a.remove();
		}, 1);
	}
	saveModel() {
		let fileData = createModelFileData();
		
		this.exportFile(fileData,Settings.fileExtension, () => {
			this.updateSaveTime();
			this.updateTitle();
			History.unsavedChanges = false;
			if (this.finishedSaveHandler) {
				this.finishedSaveHandler();
			}
		});
	}
	exportFile(dataToSave, fileExtension, onSuccess) {
		if(onSuccess == undefined) {
			// On success is optoinal, so if it was not set we set it to an empty function
			onSuccess = () => {};
		}

		var fileName = prompt("Filename:", fileExtension);
		if (fileName == null) {
			return;
		}
		const exportFileName = this.appendFileExtension(fileName, fileExtension);
		// Wrapper so that also web application can save files (csv and other)
		this.download(exportFileName, dataToSave);
		if(onSuccess) {
			onSuccess(exportFileName);
		}
	}
	loadModel() {
		openFile({
			read: "text",
			multiple: false,
			accept: Settings.fileExtension,
			onCompleted: (model) => {
				this.fileName = model.name;
				//~ this.loadModelData(model.contents);
				//~ this.updateTitle();

				do_global_log("web load file call  back");
				var fileData = model.contents;
				History.forceCustomUndoState(fileData);
				this.updateTitle();
				preserveRestart();
			}
		});
	}
}

class ElectronFileManager extends BaseFileManager {
	constructor() {
		super();
		this.softwareName = appName + " Desktop";
	}

	// This is executed when the document is ready
	ready() {
		super.ready();
	}
	hasSaveAs() {
		return true;
	}
	hasRecentFiles() {
		return true;
	}
	addToRecent(filePath) {
		let limit = Settings.MaxRecentFiles;
		let recentFiles = [];
		if (localStorage.recentFiles) {
			recentFiles = JSON.parse(localStorage.recentFiles);
		}
		if (recentFiles.includes(filePath)) {
			let index = recentFiles.indexOf(filePath);
			recentFiles.splice(index, 1);
		}
		if (recentFiles.length <= limit) {
			recentFiles.splice(limit - 1);
		}
		recentFiles.unshift(filePath);
		localStorage.setItem("recentFiles", JSON.stringify(recentFiles));
	}
	writeFile(fileName, FileData) {
		do_global_log("NW: In write file");
		//~ if(self.fileName == null) {
		//~ self.saveModelAs();
		//~ return;
		//~ }
		let fs = require('fs');
		fs.writeFile(fileName, FileData, function (err) {
			do_global_log("NW: in write file callback");
			if (err) {
				do_global_log("NW: Error in write file callback");
				console.error(err);
				alert("Error in file saving " + getStackTrace());
			}
			do_global_log("NW: Success in write file callback");
		});
	}
	saveModel() {
		do_global_log("Electron: save model triggered");
		if (this.fileName == "") {
			this.saveModelAs();
			return;
		}
		this.doSaveModel(this.fileName)
	}

	/** A general file export function that can export any kind of file
	*/
	exportFile(fileData, fileExtension, onSuccess) {
		if(onSuccess == undefined) {
			// On success is optoinal, so if it was not set we set it to an empty function
			onSuccess = () => {};
		}
		const { dialog } = require('electron').remote
		let fileName = dialog.showSaveDialog()
		if (fileName) {
			fileName = this.appendFileExtension(fileName, fileExtension)
			console.log("save filename", fileName);
			this.writeFile(fileName, fileData);
			onSuccess(fileName);
		}
	}
	doSaveModel(fileName) {
		let fileData = createModelFileData();
		this.writeFile(this.fileName, fileData);
		History.unsavedChanges = false;
		this.updateSaveTime();
		this.updateTitle();
		this.addToRecent(this.fileName);
	}

	loadModel() {
		do_global_log("Electron: load model");
		const { dialog } = require('electron').remote
		console.log("dialog ", dialog)
		let filenameArray = dialog.showOpenDialog({ properties: ['openFile'] })
		console.log("filenameArray", filenameArray)
		if (filenameArray.length > 0) {
			this.loadFromFile(filenameArray[0])
		}
	}
	loadFromFile(fileName) {
		var fs = require('fs')
		var resolve = require('path').resolve;
		var absoluteFileName = resolve(fileName);


		fs.readFile(fileName, 'utf8', (err, data) => {
			if (err) {
				return console.error(err);
			}
			console.error(fs);
			this.fileName = absoluteFileName;
			this.loadModelData(data);
			this.updateTitle();
			this.addToRecent(this.fileName);
		});
	}
}

class NwFileManager extends BaseFileManager {
	constructor() {
		super();
		this.softwareName = appName + " Desktop";
	}

	// This is executed when the document is ready
	ready() {
		super.ready();
		// Prepare model loader

		this.modelLoaderInput = document.body.appendChild(document.createElement("input"));
		this.modelLoaderInput.className = "modelLoaderInput";
		this.modelLoaderInput.addEventListener('change', (event) => {
			do_global_log("NW: In read file callback");
			var file = event.target.files[0];
			if (file) {
				do_global_log("NW: In read file callback has file");
				this.fileName = file.path;
				var reader = new FileReader();
				reader.onload = (reader_event) => {
					do_global_log("NW: reader.onload callback");
					var fileData = reader_event.target.result;
					History.forceCustomUndoState(fileData);

					// Add to localStorage.recentFiles
					this.addToRecent(this.fileName);

					this.updateTitle();
					preserveRestart();
				}
				reader.readAsText(file);
			}
		}, false);
		this.modelLoaderInput.type = "file";
		this.modelLoaderInput.accept = Settings.fileExtension;

		// Prepare model saver
		//<input type="file" nwsaveas>
		this.modelSaverInput = document.body.appendChild(document.createElement("input"));
		this.modelSaverInput.className = "modelSaverInput";
		this.modelSaverInput.addEventListener('change', (event) => {
			var file = event.target.files[0];
			if (file) {
				this.fileName = this.appendFileExtension(file.path, Settings.fileExtension);
				let fileData = createModelFileData();
				this.writeFile(this.fileName, fileData);

				// adds to file localStorage.recentFiles list
				this.addToRecent(this.fileName);

				this.updateSaveTime();
				this.updateTitle();
				if (this.finishedSaveHandler) {
					this.finishedSaveHandler();
				}
			}
		}, false);
		this.modelSaverInput.type = "file";
		this.modelSaverInput.nwsaveas = "";
		this.modelSaverInput.accept = Settings.fileExtension;


				// Prepare model saver
		//<input type="file" nwsaveas>
		this.fileExportInput = document.body.appendChild(document.createElement("input"));
		this.fileExportInput.className = "fileExportInput";
		this.fileExportInput.onSuccess = function() {
			alert("On success");
		};
		this.fileExportInput.onFailure = function() {
			alert("On failure");
		}
		this.fileExportInput.addEventListener('change', (event) => {
			var file = event.target.files[0];
			if (file) {
				const exportFilePath = this.appendFileExtension(file.path, this.exportFileExtension);
				console.log("exportFilePath", exportFilePath);
				this.writeFile(exportFilePath, this.dataToExport);
				this.fileExportInput.onSuccess(exportFilePath);
			}
		}, false);
		this.fileExportInput.type = "file";
		this.fileExportInput.nwsaveas = "";
		this.fileExportInput.accept = ".csv";
	}
	exportFile(dataToSave, fileExtension, onSuccess) {
		if(onSuccess == undefined) {
			// On success is optoinal, so if it was not set we set it to an empty function
			onSuccess = () => {};
		}
		this.fileExportInput.onSuccess = onSuccess;
		do_global_log("NW: export file");
		this.fileExportInput.value = "";
		this.exportFileExtension = fileExtension;
		this.fileExportInput.accept = fileExtension;
		this.dataToExport = dataToSave;
		this.fileExportInput.click();
	}
	hasSaveAs() {
		return true;
	}
	hasRecentFiles() {
		return true;
	}
	addToRecent(filePath) {
		let limit = Settings.MaxRecentFiles;
		let recentFiles = [];
		if (localStorage.recentFiles) {
			recentFiles = JSON.parse(localStorage.recentFiles);
		}
		if (recentFiles.includes(filePath)) {
			let index = recentFiles.indexOf(filePath);
			recentFiles.splice(index, 1);
		}
		if (recentFiles.length <= limit) {
			recentFiles.splice(limit - 1);
		}
		recentFiles.unshift(filePath);
		localStorage.setItem("recentFiles", JSON.stringify(recentFiles));
	}
	removeFromRecent(filePath) {
		let recentFiles = [];
		if (localStorage.recentFiles) {
			recentFiles = JSON.parse(localStorage.recentFiles);
			let index = recentFiles.indexOf(filePath);
			if (index !== -1) {
				recentFiles.splice(index, 1);-
				localStorage.setItem("recentFiles", JSON.stringify(recentFiles));
			}
		}
	}
	clearRecent() {
		localStorage.setItem("recentFiles", JSON.stringify([]));
	}
	writeFile(fileName, FileData) {
		do_global_log("NW: In write file");
		//~ if(self.fileName == null) {
		//~ self.saveModelAs();
		//~ return;
		//~ }
		let fs = require('fs');
		fs.writeFile(fileName, FileData, function (err) {
			do_global_log("NW: in write file callback");
			if (err) {
				do_global_log("NW: Error in write file callback");
				console.error(err);
				alert("Error in file saving " + getStackTrace());
			}
			do_global_log("NW: Success in write file callback");
		});
	}
	saveModel() {
		do_global_log("NW: save model triggered");
		if (this.fileName == "") {
			this.saveModelAs();
			return;
		}
		let fileData = createModelFileData();

		let fs = require('fs');
		fs.writeFile(this.fileName, fileData, (err) => {
			if (err) {
				console.log(err);
				console.log(trace);
				alert("Error in file saving "+ getStackTrace());
			} else {
				History.unsavedChanges = false;
				this.updateSaveTime();
				this.updateTitle();
				this.addToRecent(this.fileName);
				if (this.finishedSaveHandler) {
					this.finishedSaveHandler();
				}
			}
		});
	}
	loadModel() {
		do_global_log("NW: load model");
		this.modelLoaderInput.value = "";
		this.modelLoaderInput.click();

		// The following line seems to cause a flicky bug
		//~ uploader.parentElement.removeChild(uploader);
	}
	loadFromFile(fileName) {
		var fs = require('fs')
		var resolve = require('path').resolve;
		var absoluteFileName = resolve(fileName);


		fs.readFile(fileName, 'utf8', (err, data) => {
			if (err) {
				alert(`Error: File ${fileName} not found. \nThis file reference is now removed from Recent List.`);
				this.removeFromRecent(fileName);
				return console.error(err);
			}
			this.fileName = absoluteFileName;
			History.forceCustomUndoState(data);
			this.updateTitle();
			this.addToRecent(this.fileName);
			preserveRestart();
		});
	}
}

class BaseEnvironment {
	getName() {
		return "base";
	}
	constructor() {
		this.reloadingStarted = false;
	}
	ready() {
		// Override this
	}
	keyDown(event) {
		// Override this
	}
	getFileManager() {
		// Override this
	}
	openLink(url) {
		// Returns true or false
		// if returning true, the caller will do e.preventDefault()
		// to not trying to open the link the the browsers default way
		// Default: false
		return false;
	}
}

class WebEnvironment extends BaseEnvironment {
	getName() {
		return "web";
	}
	ready() {
		return null;
		/*
		window.onbeforeunload = (e) => {
			if (this.reloadingStarted) {
				// We never want to complain if we have initialized a reload
				// We only want to complain when the user is closing the page
				return null;
			}
			if (History.unsavedChanges) {
				return 'You have unsaved changes. Are you sure you want to quit?';
			} else {
				return null;
			}
		};
		*/
	}
	getFileManager() {
		return new WebFileManager();
	}
}

class ElectronEnvironment extends BaseEnvironment {
	getName() {
		return "electron";
	}
	ready() {
		const { ipcRenderer } = require('electron')
		ipcRenderer.on('try-to-close-message', (event, arg) => {
			quitQuestion()
		})
	}
	getFileManager() {
		return new ElectronFileManager();
	}
	closeWindow() {
		const { ipcRenderer } = require('electron')
		ipcRenderer.send('destroy-message', 'ping')
	}
}


class NwEnvironment extends BaseEnvironment {
	getName() {
		return "nwjs";
	}
	constructor() {
		super()
		nwController.init();
		nwController.maximize();
		NwZoomController.init();
	}
	ready() {
		$("#btn_zoom_in").click(function () {
			NwZoomController.zoomIn();
		});
		$("#btn_zoom_out").click(function () {
			NwZoomController.zoomOut();
		});
		$("#btn_zoom_reset").click(function () {
			NwZoomController.zoomReset();
		});
		$(".hideUnlessNwjs").removeClass("hideUnlessNwjs");
	}
	keyDown(event) {
		if (event.ctrlKey) {
			// Does not work in web browsers-since ctrl+N is reserved
			if (event.keyCode == keyboard["N"]) {
				event.preventDefault();
				$("#btn_new").click();
			}

			if (event.keyCode == keyboard["+"] || event.keyCode == keyboard["numpad+"]) {
				NwZoomController.zoomIn();
			}
			if (event.keyCode == keyboard["-"] || event.keyCode == keyboard["numpad-"]) {
				NwZoomController.zoomOut();
			}
			if (event.keyCode == keyboard["0"]) {
				NwZoomController.zoomReset();
			}
			updateWindowSize();
		}
	}
	getFileManager() {
		return new NwFileManager();
	}
	closeWindow() {
		nwjsWindow.close(true);
	}
	openLink(url) {
		// Returns true or false
		// if returning true, the caller will do e.preventDefault()
		// to not trying to open the link the the browsers default way
		// Default: false
		nwjsGui.Shell.openExternal(url);
		// Return true, because we dont want it to Also open it the default way
		return true;
	}
}

function isRunningElectron() {
	// https://github.com/electron/electron/issues/2288
	if (typeof process !== "undefined") {
		if (typeof process.versions['electron'] !== "undefined") {
			return true;
		}
	}
	return false;
}

function isRunningNwjs() {
	// https://stackoverflow.com/questions/31968355/detect-if-web-app-is-running-in-nwjs
	try {
		return (typeof require('nw.gui') !== "undefined");
	} catch (e) {
		return false;
	}
}

function detectEnvironment() {
	if (isRunningElectron()) {
		return new ElectronEnvironment()
	}
	else if (isRunningNwjs()) {
		return new NwEnvironment()
	} else {
		return new WebEnvironment()
	}
}

// Set global variable for environment and fileManager 
var environment = detectEnvironment();
var fileManager = environment.getFileManager();

// Uncomment for debugging
// alert("Running in environment " + environment.getName())
