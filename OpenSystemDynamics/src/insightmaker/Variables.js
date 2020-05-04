"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/

var graph;
var primitiveBank = {};
var defaultSolver = '{"enabled": false, "algorithm": "RK1", "timeStep": 1}';

var doc = document.implementation.createDocument("","",null);



// This is a list of all primitives that can be loaded and saved
// Important: The order of the array is the order which primitives are saved.
// Therefor Flows and Links must be at the end since they depend on Stocks and Variables for their connections
const saveblePrimitiveTypes = ["TextArea","Rectangle","Circle","Line","Arrow","Setting","Stock","Variable","Converter","Ghost","Text","Numberbox","Table","Diagram","TimePlot","ComparePlot","XyPlot","HistoPlot","Flow","Link"];

// A list of all primitives, inclduing Generic which is used non-savable primitives
const allPrimitiveTypes = ["Generic"].concat(saveblePrimitiveTypes);

// Model types. Types that are affecting the logic of the simulations. This must be correct in order for the simulation to work.
const allModelTypes=["Stock","State","Transition","Action","Agents","Variable","Converter","Flow"];


primitiveBank.text = doc.createElement('Text');
primitiveBank.text.setAttribute('name', getText('Text Area'));
primitiveBank.text.setAttribute('LabelPosition', "Middle");

primitiveBank.folder = doc.createElement('Folder');
primitiveBank.folder.setAttribute('name', getText('New Folder'));
primitiveBank.folder.setAttribute('Note', '');
primitiveBank.folder.setAttribute('Type', 'None');
primitiveBank.folder.setAttribute('Solver', defaultSolver);
primitiveBank.folder.setAttribute('Image', 'None');
primitiveBank.folder.setAttribute('FlipHorizontal', false);
primitiveBank.folder.setAttribute('FlipVertical', false);
primitiveBank.folder.setAttribute('LabelPosition', "Middle");
primitiveBank.folder.setAttribute('AgentBase', "");

primitiveBank.ghost = doc.createElement('Ghost');
primitiveBank.ghost.setAttribute('Source', '');

primitiveBank.picture = doc.createElement('Picture');
primitiveBank.picture.setAttribute('name', '');
primitiveBank.picture.setAttribute('Note', '');
primitiveBank.picture.setAttribute('Image', 'Growth');
primitiveBank.picture.setAttribute('FlipHorizontal', false);
primitiveBank.picture.setAttribute('FlipVertical', false);
primitiveBank.picture.setAttribute('LabelPosition', "Bottom");


/* Used for primitives that does not have a corresponding element in insightmaker */
primitiveBank.generic = doc.createElement('Generic');
setValuedProperties(primitiveBank.generic);

primitiveBank.numberbox = doc.createElement('Numberbox');
primitiveBank.numberbox.setAttribute("RoundToZero", true);
primitiveBank.numberbox.setAttribute("RoundToZeroAtValue", 1e-12);
setValuedProperties(primitiveBank.numberbox);

primitiveBank.table = doc.createElement('Table');
primitiveBank.table.setAttribute('Primitives', '');
primitiveBank.table.setAttribute("RoundToZero", true);
primitiveBank.table.setAttribute("RoundToZeroAtValue", 1e-12);
setValuedProperties(primitiveBank.table);

primitiveBank.diagram = doc.createElement('Diagram');
primitiveBank.diagram.setAttribute('Primitives', '');
setValuedProperties(primitiveBank.diagram);

primitiveBank.timeplot = doc.createElement('TimePlot');
primitiveBank.timeplot.setAttribute('Primitives', '');
primitiveBank.timeplot.setAttribute('LineWidth', 2);
primitiveBank.timeplot.setAttribute("HasNumberedLines", true);
primitiveBank.timeplot.setAttribute("ColorFromPrimitive", true);
setValuedProperties(primitiveBank.timeplot);


primitiveBank.compareplot = doc.createElement('ComparePlot');
primitiveBank.compareplot.setAttribute('Primitives', '');
primitiveBank.compareplot.setAttribute('LineWidth', 2);
primitiveBank.compareplot.setAttribute("HasNumberedLines", true);
primitiveBank.compareplot.setAttribute("ColorFromPrimitive", true);
setValuedProperties(primitiveBank.compareplot);

primitiveBank.xyplot = doc.createElement('XyPlot');
primitiveBank.xyplot.setAttribute('Primitives', '');
primitiveBank.xyplot.setAttribute('LineWidth', 2);
setValuedProperties(primitiveBank.xyplot);

primitiveBank.histoplot = doc.createElement('HistoPlot');
primitiveBank.histoplot.setAttribute('Primitives', '');
primitiveBank.histoplot.setAttribute('NumberOfBars', 10);
primitiveBank.histoplot.setAttribute('NumberOfBarsAuto', true);
primitiveBank.histoplot.setAttribute('LowerBound', 0);
primitiveBank.histoplot.setAttribute('LowerBoundAuto', true);
primitiveBank.histoplot.setAttribute('UpperBound', 1);
primitiveBank.histoplot.setAttribute('UpperBoundAuto', true);
primitiveBank.histoplot.setAttribute('IsPDF', false); 
setValuedProperties(primitiveBank.histoplot);


primitiveBank.line = doc.createElement('Line');
setValuedProperties(primitiveBank.line);

primitiveBank.arrow = doc.createElement('Arrow');
setValuedProperties(primitiveBank.arrow);

primitiveBank.rectangle = doc.createElement('Rectangle');
setValuedProperties(primitiveBank.rectangle);

primitiveBank.circle = doc.createElement('Circle');
setValuedProperties(primitiveBank.circle);

primitiveBank.textarea = doc.createElement('TextArea');
setValuedProperties(primitiveBank.textarea);

primitiveBank.display = doc.createElement('Display');
primitiveBank.display.setAttribute('name', getText('Default Display'));
primitiveBank.display.setAttribute('Note', '');
primitiveBank.display.setAttribute('Type', 'Time Series');
primitiveBank.display.setAttribute('xAxis', getText("Time") + ' (%u)');
primitiveBank.display.setAttribute('yAxis', '');
primitiveBank.display.setAttribute('yAxis2', '');
primitiveBank.display.setAttribute('showMarkers', false);
primitiveBank.display.setAttribute('showLines', true);
primitiveBank.display.setAttribute('showArea', false);
primitiveBank.display.setAttribute('ThreeDimensional', false);
primitiveBank.display.setAttribute('Primitives', '');
primitiveBank.display.setAttribute('Primitives2', '');
primitiveBank.display.setAttribute('AutoAddPrimitives', false);
primitiveBank.display.setAttribute('ScatterplotOrder', 'X Primitive, Y Primitive');
primitiveBank.display.setAttribute('Image', 'Display');
primitiveBank.display.setAttribute('FlipHorizontal', false);
primitiveBank.display.setAttribute('FlipVertical', false);
primitiveBank.display.setAttribute('LabelPosition', "Bottom");
primitiveBank.display.setAttribute('legendPosition', "Automatic");

function setValuedProperties(cell) {
	cell.setAttribute('Units', "Unitless")
	cell.setAttribute('MaxConstraintUsed', false)
	cell.setAttribute('MinConstraintUsed', false)
	cell.setAttribute('MaxConstraint', '100');
	cell.setAttribute('MinConstraint', '0');
	cell.setAttribute('ShowSlider', false);
	cell.setAttribute('SliderMax', 100);
	cell.setAttribute('SliderMin', 0);
	cell.setAttribute('SliderStep', '');
}

primitiveBank.stock = doc.createElement('Stock');
primitiveBank.stock.setAttribute('name', getText('New Stock'));
primitiveBank.stock.setAttribute('Note', '');
// Change made here By Magnus Gustafsson (2019-06-27)
// Original line:
// primitiveBank.stock.setAttribute('InitialValue', '0');
primitiveBank.stock.setAttribute('InitialValue', '');
primitiveBank.stock.setAttribute('StockMode', 'Store');
primitiveBank.stock.setAttribute('Delay', '10');
primitiveBank.stock.setAttribute('Volume', '100');
primitiveBank.stock.setAttribute('NonNegative', false);
setValuedProperties(primitiveBank.stock);
primitiveBank.stock.setAttribute('Image', 'None');
primitiveBank.stock.setAttribute('FlipHorizontal', false);
primitiveBank.stock.setAttribute('FlipVertical', false);
primitiveBank.stock.setAttribute('LabelPosition', "Middle");

primitiveBank.state = doc.createElement('State');
primitiveBank.state.setAttribute('name', getText('New State'));
primitiveBank.state.setAttribute('Note', '');
primitiveBank.state.setAttribute('Active', 'false');
primitiveBank.state.setAttribute('Residency', '0');
primitiveBank.state.setAttribute('Image', 'None');
primitiveBank.state.setAttribute('FlipHorizontal', false);
primitiveBank.state.setAttribute('FlipVertical', false);
primitiveBank.state.setAttribute('LabelPosition', "Middle");

primitiveBank.transition = doc.createElement('Transition');
primitiveBank.transition.setAttribute('name', getText('Transition'));
primitiveBank.transition.setAttribute('Note', '');
primitiveBank.transition.setAttribute('Trigger', 'Timeout');
primitiveBank.transition.setAttribute('Value', '1');
primitiveBank.transition.setAttribute('Repeat', false);
primitiveBank.transition.setAttribute('Recalculate', false);
setValuedProperties(primitiveBank.transition);

primitiveBank.action = doc.createElement('Action');
primitiveBank.action.setAttribute('name', getText('New Action'));
primitiveBank.action.setAttribute('Note', '');
primitiveBank.action.setAttribute('Trigger', 'Probability');
primitiveBank.action.setAttribute('Value', '0.5');
primitiveBank.action.setAttribute('Repeat', true);
primitiveBank.action.setAttribute('Recalculate', false);
primitiveBank.action.setAttribute('Action', 'Self.Move({Rand(), Rand()})');

primitiveBank.agents = doc.createElement('Agents');
primitiveBank.agents.setAttribute('name', getText('New Agent Population'));
primitiveBank.agents.setAttribute('Note', '');
primitiveBank.agents.setAttribute('Size', 100);
primitiveBank.agents.setAttribute('GeoWrap', false);
primitiveBank.agents.setAttribute('GeoDimUnits', 'Unitless');
primitiveBank.agents.setAttribute('GeoWidth', 200);
primitiveBank.agents.setAttribute('GeoHeight', 100);
primitiveBank.agents.setAttribute('Placement', "Random");
primitiveBank.agents.setAttribute('PlacementFunction', "{Rand()*Width(Self), Rand()*Height(Self)}");
primitiveBank.agents.setAttribute('Network', "None");
primitiveBank.agents.setAttribute('NetworkFunction', "RandBoolean(0.02)");
primitiveBank.agents.setAttribute('Agent', '');
primitiveBank.agents.setAttribute('Image', 'None');
primitiveBank.agents.setAttribute('FlipHorizontal', false);
primitiveBank.agents.setAttribute('FlipVertical', false);
primitiveBank.agents.setAttribute('LabelPosition', "Middle");
primitiveBank.agents.setAttribute('ShowSlider', false);
primitiveBank.agents.setAttribute('SliderMax', 100);
primitiveBank.agents.setAttribute('SliderMin', 0);
primitiveBank.agents.setAttribute('SliderStep', 1);

primitiveBank.variable = doc.createElement('Variable');
primitiveBank.variable.setAttribute('name', getText('New Variable'));
primitiveBank.variable.setAttribute('Note', '');
// Change made here By Magnus Gustafsson (2019-06-27)
// Original line:
// primitiveBank.variable.setAttribute('Equation', '0');
primitiveBank.variable.setAttribute('Equation', '');
setValuedProperties(primitiveBank.variable);
primitiveBank.variable.setAttribute('Image', 'None');
primitiveBank.variable.setAttribute('isConstant', false);
primitiveBank.variable.setAttribute('FlipHorizontal', false);
primitiveBank.variable.setAttribute('FlipVertical', false);
primitiveBank.variable.setAttribute('LabelPosition', "Middle");

primitiveBank.button = doc.createElement('Button');
primitiveBank.button.setAttribute('name', getText('New Button'));
primitiveBank.button.setAttribute('Note', '');
primitiveBank.button.setAttribute('Function', 'showMessage("Button action triggered!\\n\\nIf you want to edit this Action, click on the button while holding down the Shift key on your keyboard.")');
primitiveBank.button.setAttribute('Image', 'None');
primitiveBank.button.setAttribute('FlipHorizontal', false);
primitiveBank.button.setAttribute('FlipVertical', false);
primitiveBank.button.setAttribute('LabelPosition', "Middle");

primitiveBank.converter = doc.createElement('Converter');
primitiveBank.converter.setAttribute('name', getText('New Converter'));
primitiveBank.converter.setAttribute('Note', '');
primitiveBank.converter.setAttribute('Source', 'Time');
// Change made here By Magnus Gustafsson (2019-06-27)
// Original line:
// primitiveBank.converter.setAttribute('Data', '0,0; 1,1; 2,4; 3,9');
primitiveBank.converter.setAttribute('Data', '');
primitiveBank.converter.setAttribute('Interpolation', 'Linear');
setValuedProperties(primitiveBank.converter);
primitiveBank.converter.setAttribute('Image', 'None');
primitiveBank.converter.setAttribute('FlipHorizontal', false);
primitiveBank.converter.setAttribute('FlipVertical', false);
primitiveBank.converter.setAttribute('LabelPosition', "Middle");

primitiveBank.flow = doc.createElement('Flow');
primitiveBank.flow.setAttribute('name', getText('Flow'));
primitiveBank.flow.setAttribute('Note', '');
// Change made here By Magnus Gustafsson (2019-06-27)
// Original line:
// primitiveBank.flow.setAttribute('FlowRate', '0');
primitiveBank.flow.setAttribute('FlowRate', '');
primitiveBank.flow.setAttribute('OnlyPositive', true);
primitiveBank.flow.setAttribute('TimeIndependent', false);
setValuedProperties(primitiveBank.flow);

primitiveBank.link = doc.createElement('Link');
primitiveBank.link.setAttribute('name', getText('Link'));
primitiveBank.link.setAttribute('Note', '');
primitiveBank.link.setAttribute('BiDirectional', false);

primitiveBank.setting = doc.createElement('Setting');
primitiveBank.setting.setAttribute('Note', '');
primitiveBank.setting.setAttribute('Version', '36');
primitiveBank.setting.setAttribute('Throttle', '1');
primitiveBank.setting.setAttribute('TimeLength', '100');
primitiveBank.setting.setAttribute('TimeStart', '0');
primitiveBank.setting.setAttribute('TimeStep', '1');
// Change made here By Magnus Gustafsson (2019-06-27)
// Original line:
// primitiveBank.setting.setAttribute('TimeUnits', 'Years');
primitiveBank.setting.setAttribute('TimeUnits', '');
primitiveBank.setting.setAttribute('Units', "");
primitiveBank.setting.setAttribute("SolutionAlgorithm", "RK1");
primitiveBank.setting.setAttribute("BackgroundColor", "white");
primitiveBank.setting.setAttribute("Macros", "");
primitiveBank.setting.setAttribute("SensitivityPrimitives", "");
primitiveBank.setting.setAttribute("SensitivityRuns", 50);
primitiveBank.setting.setAttribute("SensitivityBounds", "50, 80, 95, 100");
primitiveBank.setting.setAttribute("SensitivityShowRuns", "false");
primitiveBank.setting.setAttribute("StrictUnits", "true");
primitiveBank.setting.setAttribute("StrictLinks", "true");
primitiveBank.setting.setAttribute("StrictAgentResolution", "true");
primitiveBank.setting.setAttribute("StyleSheet", "{}");


