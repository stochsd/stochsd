## Simulation Time 

```
RunResults.results // Show the value of the last run for all primitives.
RunResults.varnameList // The names of the primitives that the result shows
RunResults.varIdList // Id of primitives  
```

```javascript
primitives(type)
e.g.
primitives("Stock") -> an array with all Stocks
```

Sets attributes on primitives:
```javascript 
this.primitive.setAttribute("AttributeName", value);
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

