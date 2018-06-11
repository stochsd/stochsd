/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/

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
		}
	}
	static ready() {
		// This is replaced in init if NW is running		
	}
	static unsafeReady() {
		let params = this.getParams();
		if(params.length >= 1) {
			let parameterFilename = params[0];
			fileManager.loadFromCommandLine(parameterFilename);
		}
	}
	static isNwActive() {
		return this.nwActive;
	}
	static getWindow() {
		// This is replaced in init if NW is running
	}
	static unsafeGetWindow() {
		var ngui = require("nw.gui");
		var nwin = ngui.Window.get();
		return nwin;		
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
	}
	static zoomOut() {
		do_global_log("Zooming out");
		this.nwWindow.zoomLevel -= 0.1;
	}
	static zoomReset() {
		do_global_log("Reseting zoom");
		this.nwWindow.zoomLevel = 0;
	}
}
NwZoomController.init();

class BaseFileManager {
	constructor() {
		this._fileName = null;
		this.lastSaved = null;
		this.softwareName = "StochSD";
	}
	// This is executed when the document is ready
	ready() {
		// Override this
	}
	newModel() {
		History.clearUndoHistory();
		newModel();
		// Store an empty state as first state
		History.storeUndoState();
		// There is no last state is it could not be unsaved
		History.unsavedChanges = false;
		this.fileName = null;	
		this.lastSaved = null;
		this.updateTitle();
		RunResults.resetSimulation();
	}
	hasSaveAs() {
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
		if(this._fileName != null) {
			title += " | "+this.fileName;
			if(this.lastSaved) {
				title+=" (last saved: "+this.lastSaved+")";
			}
		}
		this.setTitle(title);
	}
	set fileName(newFileName) {
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
		this.softwareName = "StochSD Web";
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
	}
	loadModel() {
		openFile({
			read: "text",
			multiple: false,
			accept: InsightMakerFileExtension,
			onCompleted: (model) => {
				this.fileName = model.name;
				this.loadModelData(model.contents);
				this.updateTitle();
			}
		});
	}
}
class NwFileManager extends BaseFileManager {
	constructor() {
		super();
		this.softwareName = "StochSD Desktop";
	}
	
	// This is executed when the document is ready
	ready() {
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
					this.loadModelData(fileData);	
					this.updateTitle();
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
				this.updateSaveTime();
				this.updateTitle();
			}
		}, false);
		this.modelSaverInput.type="file";
		this.modelSaverInput.nwsaveas="";
		this.modelSaverInput.accept=InsightMakerFileExtension;
	}
	hasSaveAs() {
		return true;
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
				alert("Error in file saving");
			}
			do_global_log("NW: Success in write file callback");
			History.unsavedChanges = false;
		}); 
	}
	saveModel() {
		do_global_log("NW: save model triggered");
		if(this.fileName == null) {
			this.saveModelAs();
			return;
		}
		let fileData = createModelFileData();
		this.writeFile(this.fileName,fileData);
		this.updateSaveTime();
		this.updateTitle();
	}
	saveModelAs() {
		do_global_log("NW: save model as ... triggered");
		this.modelSaverInput.click();
		
		// The following line seems to cause a flicky bug
		//~ uploader.parentElement.removeChild(uploader);
	}
	loadModel() {	
		do_global_log("NW: load model");	
		this.modelLoaderInput.click();
		
		// The following line seems to cause a flicky bug
		//~ uploader.parentElement.removeChild(uploader);
	}
	loadFromCommandLine(fileName) {
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
		});
	}
}

class Environment {
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

class WebEnvironment extends Environment {
	ready() {
		window.onbeforeunload = function(e) {
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

class NwEnvironment extends Environment {
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
	if(nwController.isNwActive()) {
		return new NwEnvironment();
	} else {
		return new WebEnvironment();
	}
}

var environment = detectEnvironment();
var fileManager = environment.getFileManager();
