/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

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

class nwController{
	static init() {
		this.nwActive = null;
		if (typeof require === "undefined") {
			this.nwActive = false;
		} else {
			this.nwActive = true;
			this.maximize = this.unsafeNwMaximize;
			this.getWindow = this.unsafeGetWindow;
			this.getParams = this.unsafeGetParams;
			this.ready = this.unsafeReady;	
			this.openFile = this.unsafeOpenFile;	
		}
	}
	static ready() {
		// This is replaced in init if NW is running		
	}
	static unsafeReady() {
		//~ NwZoomController.zoomReset();
		NwZoomController.zoomLoadFromStorage();
		let params = this.getParams();
		if(params.length >= 1) {
			let parameterFilename = params[0];
			fileManager.loadFromFile(parameterFilename);
		}
		
		var ngui = this.unsafeGetGui();
		var nwin = this.unsafeGetWindow();
		var app = this.unsafeGetApp();
		nwjsGui = ngui;
		nwjsWindow = nwin;
		nwjsApp = app;

		// This save before closing handler only works when we run without StochSim tools.
		// Otherwise it makes it impossible to quit
		nwin.on("close",function(event) {
			quitQuestion();
		});
	}
	static isNwActive() {
		return this.nwActive;
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
nwController.init();
nwController.maximize();

class NwZoomController {
	static init() {
		this.nwWindow=nwController.getWindow();
	}
	static zoomIn() {
		do_global_log("Zooming in");
		this.nwWindow.zoomLevel += 0.1;
		localStorage.setItem("zoomLevel",this.nwWindow.zoomLevel);
	}
	static zoomOut() {
		do_global_log("Zooming out");
		this.nwWindow.zoomLevel -= 0.1;
		localStorage.setItem("zoomLevel",this.nwWindow.zoomLevel);
	}
	static zoomReset() {
		do_global_log("Reseting zoom");
		this.nwWindow.zoomLevel = Settings.nwInitZoom;
		localStorage.setItem("zoomLevel",this.nwWindow.zoomLevel);
	}
	
	static zoomLoadFromStorage() {
		do_global_log("loading from storage zoom");
		let loadedZoomLevel = localStorage.getItem("zoomLevel");
		if(loadedZoomLevel==null) {
			return;
		}
		loadedZoomLevel = Number(loadedZoomLevel);
		this.nwWindow.zoomLevel = loadedZoomLevel;
	}
}
NwZoomController.init();

class BaseFileManager {
	constructor() {
		this._fileName = "";
		this.lastSaved = null;
		this.softwareName = "StochSim";
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
	hasSaveAs() {
		return false;
	}
	hasRecentFiles() {
		return false;
	}
	saveModelAs() {
		// Override this where hasSaveAs is true
	}
	saveModel() {
		// Override this
	}
	loadModel() {
		// Override this
	}
	setTitle(newTitle) {;
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
		if(this._fileName != "") {
			title += " | "+this.fileName;
			if(this.lastSaved) {
				title+=" (last saved: "+this.lastSaved+")";
			}
		}
		this.setTitle(title);
	}
	set fileName(newFileName) {
		if(newFileName == null) {
			newFileName = "";
		}
		this._fileName = newFileName;	
	}
	get fileName() {
		return this._fileName;
	}
	appendFileExtension(filename,extension) {
		var extension_position=filename.length-extension.length;
		var current_extension=filename.substring(extension_position,filename.length);
		if(current_extension.toLowerCase()!=extension.toLowerCase()) {
			filename+=extension;
		}
		return filename;
	}
}

class WebFileManager extends BaseFileManager {
	constructor() {
		super();
		this.softwareName = "StochSim Web";
	}
	download(fileName, data) {
		// Create Blob and attach it to ObjectURL
		var blob = new Blob([data], {type: "octet/stream"}),
		url = window.URL.createObjectURL(blob);
		
		// Create download link and click it
		var a = document.createElement("a");
		a.style.display="none";
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		
		History.unsavedChanges = false;
		
		// The setTimeout is a fix to make it work in Firefox
		// Without it, the objectURL is removed before the click-event is triggered
		// And the download does not work
		setTimeout(function() {
			window.URL.revokeObjectURL(url);
			a.remove();
		},1);
	}
	saveModel() {
		let fileData = createModelFileData();
		
		let suggesName = (this.fileName) ? this.fileName : "model";
		
		var fileName=prompt("Filename:",suggesName);
		if(fileName==null) {
			return;
		}
		this.fileName = this.appendFileExtension(fileName,".InsightMaker");
		this.download(this.fileName,fileData);
		this.updateSaveTime();
		this.updateTitle();
		if(this.finishedSaveHandler) {
			this.finishedSaveHandler();
		}
	}
	loadModel() {
		openFile({
			read: "text",
			multiple: false,
			accept: InsightMakerFileExtension,
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
class NwFileManager extends BaseFileManager {
	constructor() {
		super();
		this.softwareName = "StochSim Desktop";
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
		this.modelLoaderInput.type="file";
		this.modelLoaderInput.accept=InsightMakerFileExtension;
		
		// Prepare model saver
		//<input type="file" nwsaveas>
		this.modelSaverInput = document.body.appendChild(document.createElement("input"));
		this.modelSaverInput.className = "modelSaverInput";
		this.modelSaverInput.addEventListener('change', (event) => {
			var file = event.target.files[0]; 
			if (file) {
				this.fileName = this.appendFileExtension(file.path,InsightMakerFileExtension);
				let fileData = createModelFileData();
				this.writeFile(this.fileName,fileData);
				
				// adds to file localStorage.recentFiles list
				this.addToRecent(this.fileName);
				
				this.updateSaveTime();
				this.updateTitle();
				if(this.finishedSaveHandler) {
					this.finishedSaveHandler();
				}
			}
		}, false);
		this.modelSaverInput.type="file";
		this.modelSaverInput.nwsaveas="";
		this.modelSaverInput.accept=InsightMakerFileExtension;
	}
	hasSaveAs() {
		return true;
	}
	hasRecentFiles() {
		return true;
	}
	addToRecent(filePath) {
		let limit = 5;
		let recentFiles = [];
		if (localStorage.recentFiles) {
			recentFiles = JSON.parse(localStorage.recentFiles);
		}
		if (recentFiles.includes(filePath)) {
			let index = recentFiles.indexOf(filePath);
			recentFiles.splice(index, 1);
		}
		if (recentFiles.length <= limit) {
			recentFiles.splice(limit-1);
		}
		recentFiles.unshift(filePath);
		localStorage.setItem("recentFiles", JSON.stringify(recentFiles));
	}
	writeFile(fileName,FileData) {
		do_global_log("NW: In write file");
		//~ if(self.fileName == null) {
			//~ self.saveModelAs();
			//~ return;
		//~ }
		let fs = require('fs');
		fs.writeFile(fileName,FileData, function(err) {
			do_global_log("NW: in write file callback");
			if(err) {
				do_global_log("NW: Error in write file callback");
				console.error(err);
				alert("Error in file saving "+getStackTrace());
			}
			do_global_log("NW: Success in write file callback");
			History.unsavedChanges = false;
		}); 
	}
	saveModel() {
		do_global_log("NW: save model triggered");
		if(this.fileName == "") {
			this.saveModelAs();
			return;
		}
		let fileData = createModelFileData();
		this.writeFile(this.fileName,fileData);
		this.updateSaveTime();
		this.updateTitle();
		this.addToRecent(this.fileName);
	}
	saveModelAs() {
		do_global_log("NW: save model as ... triggered");
		this.modelSaverInput.value = "";
		this.modelSaverInput.click();
		
		// The following line seems to cause a flicky bug
		//~ uploader.parentElement.removeChild(uploader);
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
		
		
		fs.readFile(fileName, 'utf8', (err,data) => {
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

class BaseEnvironment {
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
}

class WebEnvironment extends BaseEnvironment {
	ready() {
		window.onbeforeunload=(e)=>{
			if(this.reloadingStarted) {
				// We never want to complain if we have initialized a reload
				// We only want to complain when the user is closing the page
				return null;
			}
			if(History.unsavedChanges) {
				return 'You have unsaved changes. Are you sure you want to quit?';
			} else {
				return null;
			}
		};
	}
	getFileManager() {
		return new WebFileManager();
	}
}

class NwEnvironment extends BaseEnvironment {
	ready() {
		$("#btn_zoom_in").click(function() {
			NwZoomController.zoomIn();
		});
		$("#btn_zoom_out").click(function() {
			NwZoomController.zoomOut();
		});
		$("#btn_zoom_reset").click(function() {
			NwZoomController.zoomReset();
		});
		$(".hideUnlessNwjs").removeClass("hideUnlessNwjs");
	}
	keyDown(event) {
		if(event.ctrlKey) {
			// Does not work in web browsers-since ctrl+N is reserved
			if(event.keyCode == keyboard["N"]){
				event.preventDefault();
				$("#btn_new").click();
			}
			
			if(event.keyCode == keyboard["+"]) {
				NwZoomController.zoomIn();
			}
			if(event.keyCode == keyboard["-"]) {
				NwZoomController.zoomOut();
			}
			if(event.keyCode == keyboard["0"]) {
				NwZoomController.zoomReset();
			}
			updateWindowSize();
		}
	}
	getFileManager() {
		return new NwFileManager();
	}
}

function detectEnvironment() {
	// Check if we run in node-webkit or in a browser 
	if(nwController.isNwActive()) {
		return new NwEnvironment();
	} else {
		return new WebEnvironment();
	}
}

// Set global variable for environment and fileManager 
var environment = detectEnvironment();
var fileManager = environment.getFileManager();
