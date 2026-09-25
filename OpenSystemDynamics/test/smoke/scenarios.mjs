// Smoke test scenarios. Each scenario starts from a freshly loaded app,
// drives it through code, and returns a JSON object that is compared against a stored snapshot.
// The snapshots do not say the behaviour is correct, only that it has not changed.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// ---- Code snippets that run inside the page ----

// Simulates using a tool that creates a primitive with one click, e.g. stock
const clickTool = (tool, x, y) => `
	ToolBox.setTool("${tool}", mouse.left);
	currentTool.leftMouseDown(${x}, ${y});
	currentTool.leftMouseUp(${x}, ${y});
	History.storeUndoState();
`;

// Simulates using a tool that is dragged from one point to another, e.g. flow
const dragTool = (tool, [x1, y1], [x2, y2]) => `
	ToolBox.setTool("${tool}", mouse.left);
	currentTool.leftMouseDown(${x1}, ${y1});
	currentTool.mouseMove(${x1}, ${y1}, false);
	currentTool.mouseMove(${(x1 + x2) / 2}, ${(y1 + y2) / 2}, false);
	currentTool.mouseMove(${x2}, ${y2}, false);
	currentTool.leftMouseUp(${x2}, ${y2}, false);
	History.storeUndoState();
`;

const selectOnly = primitiveExpression => `
	unselect_all();
	get_object(${primitiveExpression}.id).select();
`;

// Builds a model containing every kind of primitive, using the tools the same way the mouse does
export const buildModel = `
	${clickTool("stock", 200, 200)}
	${clickTool("stock", 500, 200)}
	${clickTool("variable", 200, 400)}
	${clickTool("constant", 350, 400)}
	${clickTool("converter", 500, 400)}
	${dragTool("flow", [220, 200], [480, 200])}
	${dragTool("link", [200, 200], [200, 400])}
	${dragTool("link", [350, 400], [500, 400])}
	${selectOnly(`primitives("Stock")[0]`)}
	${clickTool("ghost", 700, 400)}
	${selectOnly(`primitives("Stock")[0]`)}
	${clickTool("numberbox", 700, 500)}
	${dragTool("text", [50, 600], [200, 650])}
	${dragTool("rectangle", [250, 600], [350, 700])}
	${dragTool("ellipse", [400, 600], [500, 700])}
	${dragTool("line", [550, 600], [650, 700])}
	${dragTool("table", [800, 50], [1100, 250])}
	${dragTool("timeplot", [800, 300], [1100, 500])}
	${dragTool("compareplot", [800, 550], [1100, 750])}
	${dragTool("xyplot", [50, 750], [350, 880])}
	${dragTool("histoplot", [400, 750], [700, 880])}

	const [stock1, stock2] = primitives("Stock");
	setValue2(stock1, "100");
	setValue2(stock2, "0");
	setValue2(primitives("Flow")[0], "5");
	const [auxiliary, parameter] = primitives("Variable");
	setValue2(auxiliary, "2*[Stock1] + T()");
	setValue2(parameter, "3");
	setValue2(primitives("Converter")[0], "0,0;10,20");
	syncAllVisuals();
	History.storeUndoState();
	unselect_all();
`;

const visuals = `
	return {
		objects: Object.values(object_array).map(o => o.id + ":" + o.type).sort(),
		connections: Object.values(connection_array).map(o => o.id + ":" + o.type).sort(),
	};
`;

const primitiveSummary = `
	return primitives().map(p => [getType(p), getName(p), getValue(p), DefinitionError.getMessage(p)].join(" | "));
`;

// XML is split into one tag per line, so snapshot diffs point at the tag that changed
const modelXml = `
	return createModelFileData().replace(/></g, ">\\n<").split("\\n");
`;

const simulate = `
	RunResults.resetSimulation();
	ToolBox.setTool("run", mouse.left);
	const started = Date.now();
	while (RunResults.runState !== "stopped" && Date.now() - started < 20000) {
		await new Promise(resolve => setTimeout(resolve, 50));
	}
	return { runState: RunResults.runState, csv: RunResults.toCsv().trim().split("\\n") };
`;

// Opens a model the same way the app does when a file is opened (it reloads the page)
const openModel = (fileName, xml) => `
	History.forceCustomUndoState(${JSON.stringify(xml)});
	fileManager.fileName = ${JSON.stringify(fileName)};
	preserveRestart();
`;

// ---- Scenarios ----

export const scenarios = [
	{
		name: "startup",
		async run(page) {
			return {
				visuals: await page.run(visuals),
				tool: await page.run(`return currentTool.name`),
				undo: await page.run(`return [History.undoIndex, History.undoStates.length]`),
				xml: await page.run(modelXml),
			};
		},
	},
	{
		name: "build-and-simulate",
		async run(page) {
			await page.run(buildModel);
			return {
				visuals: await page.run(visuals),
				primitives: await page.run(primitiveSummary),
				infoBar: await page.run(`
					${selectOnly(`primitives("Stock")[0]`)}
					InfoBar.update();
					return InfoBar.cmInfoDef.getValue();
				`),
				xml: await page.run(modelXml),
				simulation: await page.run(simulate),
			};
		},
	},
	{
		name: "undo-redo-delete",
		async run(page) {
			await page.run(buildModel);
			const count = `return Object.keys(object_array).length + Object.keys(connection_array).length`;
			const steps = { built: await page.run(count) };
			await page.run(`ToolBox.setTool("undo", mouse.left); ToolBox.setTool("undo", mouse.left);`);
			steps.afterTwoUndos = await page.run(count);
			await page.run(`ToolBox.setTool("redo", mouse.left); ToolBox.setTool("redo", mouse.left);`);
			steps.afterTwoRedos = await page.run(count);
			await page.run(`${selectOnly(`primitives("Stock")[1]`)} ToolBox.setTool("delete", mouse.left);`);
			steps.afterDeletingStock2 = await page.run(count);
			steps.visualsAfterDelete = await page.run(visuals);
			steps.xmlAfterDelete = await page.run(modelXml);
			await page.run(`ToolBox.setTool("undo", mouse.left);`);
			steps.afterUndoDelete = await page.run(count);
			return steps;
		},
	},
	{
		name: "dialogs",
		async run(page) {
			await page.run(buildModel);
			return await page.run(`
				const closeAll = () => $(".ui-dialog-content").each(function () {
					try { $(this).dialog("close"); } catch (e) { }
				});
				const opened = [];
				const visibleTitle = () => $(".ui-dialog:visible .ui-dialog-title").map((i, e) => e.textContent).get().join(", ");

				for (const visual of Object.values(object_array).concat(Object.values(connection_array))) {
					if (visual.dialog?.show) {
						visual.dialog.show();
						opened.push(visual.type + " -> " + visibleTitle());
						closeAll();
					}
				}
				for (const primitive of primitives().filter(p => ["Stock", "Variable", "Flow", "Converter"].includes(getType(p)))) {
					openPrimitiveDialog(primitive.id);
					opened.push(getName(primitive) + " -> " + visibleTitle());
					closeAll();
				}
				const globalDialogs = { preferencesDialog, simulationSettings, timeUnitDialog, macroDialog, equationList, aboutDialog, licenseDialog, thirdPartyLicensesDialog, fullPotentialCssDialog };
				for (const [name, dialog] of Object.entries(globalDialogs)) {
					dialog.show();
					opened.push(name + " -> " + visibleTitle());
					closeAll();
				}
				return opened;
			`);
		},
	},
];

// Every model file in models/ is opened, re-saved and simulated
const modelsDir = new URL("./models/", import.meta.url).pathname;
for (const fileName of readdirSync(modelsDir).filter(f => !f.startsWith(".")).sort()) {
	scenarios.push({
		name: `model-${fileName}`,
		async run(page) {
			const xml = readFileSync(join(modelsDir, fileName), "utf8");
			await page.runAndWaitForReload(openModel(fileName, xml));
			return {
				visuals: await page.run(visuals),
				primitives: await page.run(primitiveSummary),
				resavedXml: await page.run(modelXml),
				simulation: await page.run(simulate),
			};
		},
	});
}
