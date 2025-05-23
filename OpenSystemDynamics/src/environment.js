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
    if (params.length >= 1) {
      let parameterFilename = params[0];
      fileManager.loadFromFilePath(parameterFilename);
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
  static getParams() { }
  static unsafeGetParams() {
    var nwgui = require("nw.gui");
    return nwgui.App.argv;
  }
  static openFile() { }
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
      History.unsavedChanges = false;
      this.updateSaveTime();
      this.updateTitle();
      if (this.finishedSaveHandler) {
        this.finishedSaveHandler();
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
  async loadModel() {
    // Override this
  }
  async init() {
    // Override this
  }
  async clean() {
    // Override this
  }
  setTitle(newTitleRaw) {
    // None breaking space
    const nbsp = String.fromCharCode(160);
    // string.replace does not work with char(160) for some reason, so we had to make our own
    let newTitle = "";
    for (var i = 0; i < newTitleRaw.length; i++) {
      let tchar = newTitleRaw.charAt(i);
      if (tchar == " ") {
        newTitle = newTitle + nbsp;
      } else {
        newTitle = newTitle + tchar;
      }
    }
    if (window !== window.top) {
      // In iFrame
      setParentTitle(newTitle);
    } else {
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
    var current_extension = filename.substring(
      extension_position,
      filename.length
    );
    if (current_extension.toLowerCase() != extension.toLowerCase()) {
      filename += extension;
    }
    return filename;
  }
  /** @param {File} file */
  async loadFromFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target.result;
      this.fileName = file.name;
      console.log("load event.target", event.target);

      do_global_log("web load file call  back");
      var fileData = contents;
      History.forceCustomUndoState(fileData);
      this.updateTitle();
      preserveRestart();
    }
    reader.onerror = (error) => {
      console.error(`Error reading file ${file.name}`, error);
    }
    reader.readAsText(file);
  }
}

class WebFileManagerBasic extends BaseFileManager {
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

    this.exportFile(fileData, Settings.fileExtension, () => {
      this.updateSaveTime();
      this.updateTitle();
      History.unsavedChanges = false;
      if (this.finishedSaveHandler) {
        this.finishedSaveHandler();
      }
    });
  }
  exportFile(dataToSave, fileExtension, onSuccess) {
    if (onSuccess == undefined) {
      // On success is optoinal, so if it was not set we set it to an empty function
      onSuccess = () => { };
    }

    var fileName = prompt("Filename:", fileExtension);
    if (fileName == null) {
      return;
    }
    const exportFileName = this.appendFileExtension(fileName, fileExtension);
    // Wrapper so that also web application can save files (csv and other)
    this.download(exportFileName, dataToSave);
    if (onSuccess) {
      onSuccess(exportFileName);
    }
  }
  async loadModel() {
    openFile({
      read: "text",
      multiple: false,
      accept: Settings.fileExtension,
      onCompleted: (model) => {
        this.fileName = model.name;
        //~ this.loadModelData(model.contents);

        do_global_log("web load file call  back");
        var fileData = model.contents;
        History.forceCustomUndoState(fileData);
        this.updateTitle();
        preserveRestart();
      },
    });
  }
}

class WebFileManagerModern extends BaseFileManager {
  constructor() {
    super();
    this.softwareName = appName + " Web";
    this.fileHandle = undefined;
  }

  async init() {
    this.fileHandle = await idbKeyval.get('fileHandle');
  }

  async clean() {
    await idbKeyval.del('fileHandle');
  }

  hasSaveAs() {
    return true;
  }

  hasRecentFiles() {
    return true;
  }
  async getRecentDisplayList() {
    let recentFiles = await this.getRecentFiles();
    return recentFiles.map((fileHandle) => {
      return fileHandle.name;
    })
  }
  async getRecentFiles() {
    let recentFiles;
    try {
      recentFiles = await idbKeyval.get("recentFiles") ?? []
    } catch {
      recentFiles = [];
    }
    return recentFiles;
  }
  async setRecentFiles(recentFiles) {
    idbKeyval.set("recentFiles", recentFiles);
  }
  async clearRecent() {
    idbKeyval.set("recentFiles", []);
  }

  async removeDuplicatesFromRecent(fileHandle, recentFiles) {
    let newRecentFiles = []
    for (let i in recentFiles) {
      if (!await recentFiles[i].isSameEntry(fileHandle)) {
        newRecentFiles.push(recentFiles[i]);
      }
    }
    return newRecentFiles;
  }

  async addToRecent() {
    let limit = Settings.MaxRecentFiles;

    let recentFiles = await this.getRecentFiles();

    recentFiles = await this.removeDuplicatesFromRecent(this.fileHandle, recentFiles);

    if (recentFiles.length <= limit) {
      recentFiles.splice(limit - 1);
    }
    recentFiles.unshift(this.fileHandle);
    await this.setRecentFiles(recentFiles);
  }
  async loadRecentByIndex(recentFileIndex) {
    const recentFiles = await this.getRecentFiles();
    const fileHandle = recentFiles[recentFileIndex];
    await this.loadFromFileHandle(fileHandle);
  }

  getFilePickerOptions() {
    return {
      suggestedName: "model.ssd",
      types: [
        {
          description: "StochSD Models",
          accept: {
            "text/stochsd": [".ssd"],
          },
        },
      ],
    };
  }

  async chooseFilename() {
    // Based on Chromes new file management API
    // https://web.dev/file-system-access/
    // So far only supported by Chromium based browsers, such as Chrome, Chromium and Edge

    const options = this.getFilePickerOptions();
    this.fileHandle = await window.showSaveFilePicker(options);
    this.fileName = this.fileHandle.name;
  }
  async writeToFile(contents) {
    const writable = await this.fileHandle.createWritable();
    await writable.write(contents);
    await writable.close();
  }

  async updateUIAfterSave() {
    this.updateSaveTime();
    this.updateTitle();
    History.unsavedChanges = false;
    if (this.finishedSaveHandler) {
      this.finishedSaveHandler();
    }
  }

  async saveModelAs() {
    let contents = createModelFileData();
    try {
      await this.chooseFilename();
      await this.writeToFile(contents);
      await this.addToRecent();
      await this.updateUIAfterSave();
    } catch (e) {
      // Canceld
    }
  }

  async saveModel() {
    let contents = createModelFileData();
    if (this.fileHandle == undefined) {
      await this.saveModelAs();
      return;
    }
    await this.writeToFile(contents);
    await this.addToRecent();
    await this.updateUIAfterSave();
  }
  async loadModel() {
    const options = this.getFilePickerOptions();
    const [tmpFileHandle] = await window.showOpenFilePicker(options);
    await this.loadFromFileHandle(tmpFileHandle);
  }

  async verifyPermission(fileHandle, withWrite) {
    // Re-asking for permissons needed after page reload.
    // See:
    // https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle/requestPermission
    // https://stackoverflow.com/questions/66500836/domexception-the-request-is-not-allowed-by-the-user-agent-or-the-platform-in-th
    const opts = {};
    if (withWrite) {
      opts.mode = 'readwrite';
    }

    // Check if we already have permission, if so, return true.
    if (await fileHandle.queryPermission(opts) === 'granted') {
      return true;
    }

    // Request permission to the file, if the user grants permission, return true.
    if (await fileHandle.requestPermission(opts) === 'granted') {
      return true;
    }

    // The user did not grant permission, return false.
    return false;
  }

  async loadFromFileHandle(fileHandle) {
    const allowedPermission = await this.verifyPermission(fileHandle, false);
    if (!allowedPermission) {
      return;
    }
    await idbKeyval.del('fileHandle');
    this.fileHandle = fileHandle
    await idbKeyval.set('fileHandle', this.fileHandle);
    const file = await fileHandle.getFile();
    const fileData = await file.text();
    this.fileName = file.name;
    await this.addToRecent();
    History.forceCustomUndoState(fileData);
    this.updateTitle();
    preserveRestart();
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
  writeFile(fileName, FileData) {
    do_global_log("NW: In write file");
    //~ if(self.fileName == null) {
    //~ self.saveModelAs();
    //~ return;
    //~ }
    let fs = require("fs");
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
    this.doSaveModel(this.fileName);
  }

  /** A general file export function that can export any kind of file
   */
  exportFile(fileData, fileExtension, onSuccess) {
    if (onSuccess == undefined) {
      // On success is optoinal, so if it was not set we set it to an empty function
      onSuccess = () => { };
    }
    const { dialog } = require("electron").remote;
    let fileName = dialog.showSaveDialog();
    if (fileName) {
      fileName = this.appendFileExtension(fileName, fileExtension);
      console.log("save filename", fileName);
      this.writeFile(fileName, fileData);
      onSuccess(fileName);
    }
  }
  async doSaveModel(fileName) {
    let fileData = createModelFileData();
    this.writeFile(this.fileName, fileData);
    History.unsavedChanges = false;
    this.updateSaveTime();
    this.updateTitle();
  }

  async loadModel() {
    do_global_log("Electron: load model");
    const { dialog } = require("electron").remote;
    console.log("dialog ", dialog);
    let filenameArray = dialog.showOpenDialog({ properties: ["openFile"] });
    console.log("filenameArray", filenameArray);
    if (filenameArray.length > 0) {
      this.loadFromFilePath(filenameArray[0]);
    }
  }
  /** @param {string} filePath */
  loadFromFilePath(filePath) {
    var fs = require("fs");
    var resolve = require("path").resolve;
    var absoluteFileName = resolve(filePath);

    fs.readFile(filePath, "utf8", (err, data) => {
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

class NwFileManager extends BaseFileManager {
  constructor() {
    super();
    this.softwareName = appName + " Desktop";
  }

  // This is executed when the document is ready
  ready() {
    super.ready();
    // Prepare model loader

    this.modelLoaderInput = document.body.appendChild(
      document.createElement("input")
    );
    this.modelLoaderInput.className = "modelLoaderInput";
    this.modelLoaderInput.addEventListener(
      "change",
      (event) => {
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

            this.addToRecent(this.fileName);

            this.updateTitle();
            preserveRestart();
          };
          reader.readAsText(file);
        }
      },
      false
    );
    this.modelLoaderInput.type = "file";
    this.modelLoaderInput.accept = Settings.fileExtension;

    // Prepare model saver
    //<input type="file" nwsaveas>
    this.modelSaverInput = document.body.appendChild(
      document.createElement("input")
    );
    this.modelSaverInput.className = "modelSaverInput";
    this.modelSaverInput.addEventListener(
      "change",
      (event) => {
        var file = event.target.files[0];
        if (file) {
          this.fileName = this.appendFileExtension(
            file.path,
            Settings.fileExtension
          );
          let fileData = createModelFileData();
          this.writeFile(this.fileName, fileData);

          this.addToRecent(this.fileName);

          this.updateSaveTime();
          this.updateTitle();
          if (this.finishedSaveHandler) {
            this.finishedSaveHandler();
          }
        }
      },
      false
    );
    this.modelSaverInput.type = "file";
    this.modelSaverInput.nwsaveas = "";
    this.modelSaverInput.accept = Settings.fileExtension;

    // Prepare model saver
    //<input type="file" nwsaveas>
    this.fileExportInput = document.body.appendChild(
      document.createElement("input")
    );
    this.fileExportInput.className = "fileExportInput";
    this.fileExportInput.onSuccess = function () {
      alert("On success");
    };
    this.fileExportInput.onFailure = function () {
      alert("On failure");
    };
    this.fileExportInput.addEventListener(
      "change",
      (event) => {
        var file = event.target.files[0];
        if (file) {
          const exportFilePath = this.appendFileExtension(
            file.path,
            this.exportFileExtension
          );
          console.log("exportFilePath", exportFilePath);
          this.writeFilePromise(exportFilePath, this.dataToExport)
            .then((filePath) => {
              this.fileExportInput.onSuccess(filePath);
            })
            .catch((err) => {
              console.log(err);
              this.fileExportInput.onFailure();
            });
        }
      },
      false
    );
    this.fileExportInput.type = "file";
    this.fileExportInput.nwsaveas = "";
    this.fileExportInput.accept = ".csv";
  }
  exportFile(dataToSave, fileExtension, onSuccess) {
    if (onSuccess == undefined) {
      // On success is optoinal, so if it was not set we set it to an empty function
      onSuccess = () => { };
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
  async getRecentDisplayList() {
    // this just returns getRecentFiles, but this is not the case for
    // other implementations of getRecentDisplayList
    return await this.getRecentFiles();
  }
  async getRecentFiles() {
    let recentTemp = await idbKeyval.get("recentFiles")
    let recentFiles = typeof recentTemp == "string"
      ? JSON.parse(recentTemp)
      : Array.isArray(recentTemp)
        ? recentTemp
        : []
    return recentFiles;
  }
  async setRecentFiles(recentFiles) {
    idbKeyval.set("recentFiles", recentFiles);
  }
  async addToRecent(filePath) {
    let limit = Settings.MaxRecentFiles;
    let recentFiles = await this.getRecentFiles();
    if (recentFiles.includes(filePath)) {
      let index = recentFiles.indexOf(filePath);
      recentFiles.splice(index, 1);
    }
    if (recentFiles.length <= limit) {
      recentFiles.splice(limit - 1);
    }
    recentFiles.unshift(filePath);
    await this.setRecentFiles(recentFiles);
  }
  async removeFromRecent(filePath) {
    let recentFiles = this.getRecentFiles();
    let index = recentFiles.indexOf(filePath);
    if (index !== -1) {
      recentFiles.splice(index, 1);
      this.setRecentFiles(recentFiles);
    }
  }
  async loadRecentByIndex(recentFileIndex) {
    const recentFiles = await this.getRecentFiles();
    const filePath = recentFiles[recentFileIndex];
    this.loadFromFilePath(filePath);
  }
  async clearRecent() {
    await idbKeyval.set("recentFiles", JSON.stringify([]));
  }
  writeFile(fileName, FileData) {
    do_global_log("NW: In write file");
    //~ if(self.fileName == null) {
    //~ self.saveModelAs();
    //~ return;
    //~ }
    let fs = require("fs");
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
  writeFilePromise(filePath, fileData) {
    return new Promise((resolve, reject) => {
      let fs = require("fs");
      fs.writeFile(filePath, fileData, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(filePath);
        }
      });
    });
  }
  saveModel() {
    do_global_log("NW: save model triggered");
    if (this.fileName == "") {
      this.saveModelAs();
      return;
    }
    let fileData = createModelFileData();
    this.writeFilePromise(this.fileName, fileData)
      .then((filePath) => {
        History.unsavedChanges = false;
        this.updateSaveTime();
        this.updateTitle();
        this.addToRecent(filePath);
        if (this.finishedSaveHandler) {
          this.finishedSaveHandler();
        }
      })
      .catch((err) => {
        console.log(err);
        console.log(trace);
        alert("Error in file saving " + getStackTrace());
      });
  }
  saveModelAs() {
    let fileData = createModelFileData();
    // Only exportFile is implementation specific (different on nwjs and electron)
    this.exportFile(fileData, Settings.fileExtension, (filePath) => {
      this.fileName = filePath;
      History.unsavedChanges = false;
      this.addToRecent(this.fileName);
      this.updateSaveTime();
      this.updateTitle();
      if (this.finishedSaveHandler) {
        this.finishedSaveHandler();
      }
    });
  }
  async loadModel() {
    do_global_log("NW: load model");
    this.modelLoaderInput.value = "";
    this.modelLoaderInput.click();

    // The following line seems to cause a flicky bug
    //~ uploader.parentElement.removeChild(uploader);
  }
  /** @param {string} fileName */
  loadFromFilePath(fileName) {
    var fs = require("fs");
    var resolve = require("path").resolve;
    var absoluteFileName = resolve(fileName);

    fs.readFile(fileName, "utf8", (err, data) => {
      if (err) {
        alert(
          `Error: File ${fileName} not found. \nThis file reference is now removed from Recent List.`
        );
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
  /** @param {File} file */
  loadFromFile(file) {
    this.loadFromFilePath(file.path)
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
    // To use modern file api we need showSaveFilePicker
    // and unfortunatly it does not work from file://, so we need a server e.g. npm install -g http-server
    if (window.showSaveFilePicker && location.protocol !== "file:") {
      // Uses modern APIs for file mangement
      return new WebFileManagerModern();
    } else {
      // Uses only file upload and download
      return new WebFileManagerBasic();
    }
  }
}

class ElectronEnvironment extends BaseEnvironment {
  getName() {
    return "electron";
  }
  ready() {
    const { ipcRenderer } = require("electron");
    ipcRenderer.on("try-to-close-message", (event, arg) => {
      quitQuestion();
    });
  }
  getFileManager() {
    return new ElectronFileManager();
  }
  closeWindow() {
    const { ipcRenderer } = require("electron");
    ipcRenderer.send("destroy-message", "ping");
  }
}

class NwEnvironment extends BaseEnvironment {
  getName() {
    return "nwjs";
  }
  constructor() {
    super();
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
      if (event.key.toLowerCase() == "n") {
        event.preventDefault();
        $("#btn_new").click();
      }
      if (event.key == "+")
        NwZoomController.zoomIn();
      if (event.key == "-")
        NwZoomController.zoomOut();
      if (event.key == "0")
        NwZoomController.zoomReset();
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
    if (typeof process.versions["electron"] !== "undefined") {
      return true;
    }
  }
  return false;
}

function isRunningNwjs() {
  // https://stackoverflow.com/questions/31968355/detect-if-web-app-is-running-in-nwjs
  try {
    return typeof require("nw.gui") !== "undefined";
  } catch (e) {
    return false;
  }
}

function detectEnvironment() {
  if (isRunningElectron()) {
    return new ElectronEnvironment();
  } else if (isRunningNwjs()) {
    return new NwEnvironment();
  } else {
    return new WebEnvironment();
  }
}

// Set global variable for environment and fileManager
var environment = detectEnvironment();
var fileManager = environment.getFileManager();

// Uncomment for debugging
// alert("Running in environment " + environment.getName())
