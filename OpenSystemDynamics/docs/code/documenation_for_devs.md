# Todo list for uploading new version

- Download nw.js (normal not sdk) versions for windows 64bit, windows 32bit and ...
- Change folder names to: `StochSim-WindowsXXbit-yyyy-mm-dd` 
- Build Desktop and Web version in repo directory with:

 `node node_modules\gulp\bin\gulp.js` or `node node_modules/gulp/bin/gulp.js`

learn more at https://www.udemy.com/starting-with-gulp/learn/v4/content

for windows or unix. This creates folder `./build` that contains `./build/package.nw`  and  `./build/stochsim-web`

- Move a copy of `package.nw` into the 64bit and 32bit folders respectively.

- Change name of nw.exe in folder to stochism.exe

- Change icon of stochsim.exe using ResourceHacker (http://www.angusj.com/resourcehacker/)

- Zip folders for uploading

- Upload these files (StochSim Desktop) to SourceForge via the website.

- To upload StochSim Web with FileZilla

  - Host: [web.sourceforge.net](http://web.sourceforge.net)  
  - User: mrmagnus  
  - Default remote (root) folder: `/home/project-web/s/st/stochsd/htdocs`

- Upload `build/stochsim-web` and replace folder `/home/project-web/s/st/stochsd/htdocs/software` with same name.

  

  #To update website 

- Open repo `website_stochsim` 

- Run `npm run build` .

  This creates a `./build` folder

- upload `./build` to Filezilla replace `homepage`

- 

# Local App data

Settings for applications in folder:

C:\Users\magnu\AppData\Local



 

#Currently working on

```javascript
		this.recentFiles = [];
		if (localStorage.recentFiles) {
			this.recentFiles = JSON.parse(localStorage.recentFiles);
		}
		this.recentsLimit = 5;
```



```javascript
	addToRecentFiles(filePath) {
		if (this.recentFiles.includes(filePath)) {
			// Remove file name if already exist
			let index = this.recentFiles.indexOf(filePath);
			this.recentFiles.splice(index, i);
		} 
		if (this.recentFiles.length <= this.recentsLimit) {
			// remove oldest recent file if above limit
			this.recentFiles.splice(this.recentsLimit-1);
		}

		// Add new recent file 
		this.recentFiles.unshift(filePath);
		localStorage.setItem("recentFiles", JSON.stringify(this.recentFiles));
		console.log("Stored recentFiles to localStorage");
	}
```



## Simulation Time 

```
RunResults.results // Show the value of the last run for all primitives.
RunResults.varnameList // The names of the primitives that the result shows
RunResults.varIdList // Id of primitives  
```

```javascript
		  this.plot = $.jqplot(this.chartId, this.serieArray, {  
			  series: this.serieSettingsArray,
			  sortData: false,
			  axesDefaults: {
		            labelRenderer: $.jqplot.CanvasAxisLabelRenderer
				},
			  axes: {
				xaxis: {
					label: this.serieXName,
					min: this.dialog.getXMin(),
					max: this.dialog.getXMax()
				},
				yaxis: {
					label: this.serieYName,
					min: this.dialog.getYMin(),
					max: this.dialog.getYMax()
				}
			}
```

```javascript 
primitive_mousedown(node_id, event, new_primitive)

find_elements_under
```

```javascript
primitives(type)
e.g.
primitives("Stock") -> an array with all Stocks
```

Sets attribttes on primitives:
```javascript 
this.primitive.value.setAttribute("b1x",b1pos[0]);
this.primitive.value.setAttribute("b1y",b1pos[1]);
```
```javascript
History.clearUndoHistory();
loadModelFromXml(modelData);
// Store an empty state as first state
History.storeUndoState();
RunResults.resetSimulation();
```


#Long term documetation

**stochsd\OpenSystemDynamics\js\API\API.js**

*The insightmaker engine API.*
Documentation insightmaker engine:
https://insightmaker.com/sites/default/files/API/files/API-js.html

code:
```javascript
if(graph instanceof SimpleNode){
	// Runs without old insightaker MXgraph GUI
	// This is what OpenSystemDynamics use.
} else {
	// Runs with old insightaker MXgraph GUI 
}
```


**stochsd\OpenSystemDynamics\js\Variables.js**

*Defines all default-attributes for primitives.*
*Add primitive here if needed*


**stochsd\OpenSystemDynamics\js\mxShim.js**

* Defines the base primitve class for insightmaker called SimpleNode*
* All primitives are SimpleNodes with diffrent attributes. No inheritance is used*

*Event handlers to override if you want to listen to events from the insightmaker engine: *
defaultAttributeChangeHandler
defaultPositionChangeHandler
defaultPrimitiveCreatedHandler
defaultPrimitiveBeforeDestroyHandler

*OpenSystemDynamics overrides these functions editor.js*


**stochsd\OpenSystemDynamics\opensystemdynamics\settings.js**

*Settings for open system dynamics.*
*When the application is not being developed set showDebug to false.*


**stochsd\OpenSystemDynamics\opensystemdynamics\newAPI.js**

*New suggested api functions for insightmaker engine*
*E.G. functions for managing ghosts and finding available names*
*centerCoordinates function*


**stochsd\OpenSystemDynamics\opensystemdynamics\transform.js**

*Useful functions for 2Doperations and measuments such as: distance, translate and rotate*

**stochsd\OpenSystemDynamics\opensystemdynamics\imc.js**

*plug-in interface for communicating with OpenSystemDynamics.*
*This is used by MultiSimulationAnalyser.*


**stochsd\OpenSystemDynamics\opensystemdynamics\environment.js**

*Wraper for running inside Web Browser or Node-Webkit.*


**stochsd\OpenSystemDynamics\opensystemdynamics\emenu.js**

*Menu library for dropdown menus*


**stochsd\OpenSystemDynamics\opensystemdynamics\libsvg.js**

*Drawing functions for drawing svg.*

