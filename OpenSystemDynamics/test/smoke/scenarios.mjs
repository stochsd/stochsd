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
	Visuals.unselectAll();
	Visuals.get(${primitiveExpression}.id).select();
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
	Visuals.unselectAll();
`;

const visuals = `
	return {
		onePointers: Visuals.onePointers().map(o => o.id + ":" + o.type).sort(),
		twoPointers: Visuals.twoPointers().map(o => o.id + ":" + o.type).sort(),
	};
`;

// Everything about each visual that loading a model sets up, one line per visual
const visualDetails = `
	const round = values => values.map(value => Math.round(value * 10) / 10);
	return Visuals.all().map(visual => {
		const parts = [visual.id, visual.constructor.name, visual.type, "color=" + visual.color];
		if (visual.is_ghost) parts.push("ghost");
		if (visual.name_element) parts.push("name=" + visual.name_element.textContent, "name_pos=" + visual.name_pos,
			"name_at=" + ["x", "y", "text-anchor"].map(a => visual.name_element.getAttribute(a)).join(","));
		if (visual instanceof TwoPointer) {
			parts.push("from=" + round([visual.startX, visual.startY]), "to=" + round([visual.endX, visual.endY]));
		} else {
			parts.push("pos=" + round(visual.getPos()));
		}
		if (visual.dialog?.displayIdList) parts.push("shows=" + visual.dialog.displayIdList.join(","));
		if (visual.getStartAttach) parts.push("attached=" + (visual.getStartAttach()?.id ?? "-") + "," + (visual.getEndAttach()?.id ?? "-"));
		if (visual.type == "flow") parts.push("valve=" + visual.valveIndex + "," + visual.variableSide);
		return parts.join(" | ");
	}).sort();
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
	Math.resetTestSeed();
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
			const count = `return Visuals.all().length`;
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
		// Uses real mouse and keyboard events, so it goes through the same event handlers as a user
		name: "mouse-and-keyboard",
		async run(page) {
			await page.run(`
				${buildModel}
				// Without a time unit, clicking in the diagram opens the time unit dialog instead
				setTimeUnits("Year");
				$(".ui-dialog-content").each(function () { try { $(this).dialog("close"); } catch (e) { } });
			`);
			const [offsetX, offsetY] = await page.run(`const o = $(SVG.svgElement).offset(); return [o.left, o.top];`);
			const toPage = ([x, y]) => [x + offsetX, y + offsetY];
			const selection = () => page.run(`return Visuals.selected().map(visual => visual.id).sort()`);
			const positionOf = id => page.run(`return Visuals.get("${id}").getPos()`);
			const flowId = await page.run(`return primitives("Flow")[0].id`);
			const stock2Id = await page.run(`return primitives("Stock")[1].id`);
			const steps = {};

			await page.click(...toPage([500, 200]));
			steps.clickStock2 = await selection();

			await page.drag(toPage([500, 200]), toPage([520, 260]));
			steps.dragStock2 = { position: await positionOf(stock2Id), flowEnd: await positionOf(`${flowId}.end_anchor`) };

			await page.click(...toPage([650, 100]));
			steps.clickEmpty = await selection();

			await page.drag(toPage([150, 150]), toPage([560, 450]));
			steps.rubberBandSelect = await selection();

			await page.click(...toPage([650, 100]));
			await page.click(...toPage([350, 220]));
			steps.clickFlowValve = await selection();

			const flowEnd = await positionOf(`${flowId}.end_anchor`);
			await page.drag(toPage(flowEnd), toPage([600, 350]));
			steps.dragFlowEndAnchor = {
				selection: await selection(),
				flowEnd: await positionOf(`${flowId}.end_anchor`),
				endAttach: await page.run(`return Visuals.get("${flowId}").getEndAttach()?.id ?? null`),
			};

			await page.click(...toPage([200, 200]));
			await page.key("ArrowRight", { code: "ArrowRight", keyCode: 39, modifiers: 8 });
			steps.shiftArrowRight = await page.run(`return primitives("Stock").map(s => Visuals.get(s.id).getPos())`);

			await page.key("a", { code: "KeyA", keyCode: 65, modifiers: 2 });
			steps.ctrlA = (await selection()).length;

			await page.click(...toPage([650, 100]));
			await page.click(...toPage([200, 400]));
			await page.key("Delete", { code: "Delete", keyCode: 46 });
			steps.deleteAuxiliary = await page.run(`return primitives().map(getName)`);

			steps.xml = await page.run(modelXml);
			return steps;
		},
	},
	{
		// Tools and actions that work on the current selection
		name: "selection-tools",
		async run(page) {
			await page.run(buildModel);
			const select = primitiveExpression => page.run(`
				Visuals.unselectAll();
				Visuals.get(${primitiveExpression}.id).select();
			`);
			const steps = {};

			await select(`primitives("Stock")[0]`);
			await page.run(`ToolBox.setTool("rotatename", mouse.left); ToolBox.setTool("rotatename", mouse.left);`);
			steps.rotateName = await page.run(`return Visuals.get(primitives("Stock")[0].id).name_pos`);

			await select(`primitives("Flow")[0]`);
			await page.run(`ToolBox.setTool("movevalve", mouse.left);`);
			steps.moveValve = await page.run(`const flow = Visuals.get(primitives("Flow")[0].id); return [flow.valveIndex, flow.variableSide]`);

			await select(`primitives("Link")[0]`);
			await page.run(`
				const link = Visuals.get(primitives("Link")[0].id);
				link.b1_anchor.setPos([300, 500]);
				link.update();
				ToolBox.setTool("straightenlink", mouse.left);
			`);
			steps.straightenLink = await page.run(`const link = Visuals.get(primitives("Link")[0].id); return [link.b1_anchor.getPos(), link.b2_anchor.getPos()]`);

			await page.run(`
				Visuals.unselectAll();
				Visuals.get(primitives("Stock")[1].id).select();
				Visuals.get(primitives("Variable")[0].id).select();
				Visuals.setSelectionColor("#ff0000");
				History.storeUndoState();
			`);
			steps.setColor = await page.run(`return primitives().map(p => getName(p) + ": " + p.getAttribute("Color"))`);

			steps.buttonsWithStockSelected = await page.run(`
				Visuals.unselectAll();
				Visuals.get(primitives("Stock")[0].id).select();
				ToolBox.updateButtons();
				return $(".tool-button:disabled").map((i, e) => e.id).get().sort();
			`);
			steps.buttonsWithConstantSelected = await page.run(`
				Visuals.unselectAll();
				Visuals.get(primitives("Variable").find(p => p.getAttribute("isConstant") == "true").id).select();
				ToolBox.updateButtons();
				return $(".tool-button:disabled").map((i, e) => e.id).get().sort();
			`);
			steps.xml = await page.run(modelXml);
			return steps;
		},
	},
	{
		// Selecting by clicking different kinds of visuals with the mouse, with and without shift
		name: "click-select",
		async run(page) {
			await page.run(`
				${buildModel}
				setTimeUnits("Year");
				$(".ui-dialog-content").each(function () { try { $(this).dialog("close"); } catch (e) { } });
			`);
			const [offsetX, offsetY] = await page.run(`const o = $(SVG.svgElement).offset(); return [o.left, o.top];`);
			const click = (x, y, modifiers = 0) => page.click(x + offsetX, y + offsetY, { modifiers });
			const selection = () => page.run(`return Visuals.all().filter(visual => visual.isSelected()).map(visual => visual.id).sort()`);
			const shift = 8;
			const steps = {};

			for (const [name, x, y] of [["table", 950, 150], ["timePlot", 950, 400], ["text", 125, 625], ["rectangle", 250, 650], ["link", 200, 300]]) {
				await click(650, 100);
				await click(x, y);
				steps[name] = await selection();
			}
			await click(650, 100);
			await click(200, 200);
			await click(500, 200, shift);
			steps.shiftClickSecondStock = await selection();
			await click(200, 200, shift);
			steps.shiftClickFirstStockAgain = await selection();
			await click(650, 100);
			steps.clickEmpty = await selection();
			return steps;
		},
	},
	{
		// Drawing a flow with the mouse, right clicking while dragging to add bends
		name: "flow-with-bends",
		async run(page) {
			await page.run(`
				${clickTool("stock", 200, 200)}
				${clickTool("stock", 500, 400)}
				setTimeUnits("Year");
				$(".ui-dialog-content").each(function () { try { $(this).dialog("close"); } catch (e) { } });
				ToolBox.setTool("flow", mouse.left);
			`);
			const [offsetX, offsetY] = await page.run(`const o = $(SVG.svgElement).offset(); return [o.left, o.top];`);
			const at = (x, y) => [x + offsetX, y + offsetY];
			const move = (x, y) => page.mouse("mouseMoved", ...at(x, y));
			const rightClick = async (x, y) => {
				await page.mouse("mousePressed", ...at(x, y), { button: "right" });
				await page.mouse("mouseReleased", ...at(x, y), { button: "right" });
			};

			await move(220, 200);
			await page.mouse("mousePressed", ...at(220, 200));
			await move(215, 200);
			await move(300, 200);
			await move(350, 200);
			await rightClick(350, 200);
			await move(350, 300);
			await move(350, 400);
			await rightClick(350, 400);
			await move(420, 400);
			await move(480, 400);
			await page.mouse("mouseReleased", ...at(480, 400));

			return await page.run(`
				const flow = Visuals.get(primitives("Flow")[0].id);
				return {
					anchors: flow.getAnchors().map(anchor => anchor.id + ":" + anchor.getPos().map(Math.round)),
					attached: [flow.getStartAttach()?.id ?? null, flow.getEndAttach()?.id ?? null],
					selected: Visuals.all().filter(visual => visual.isSelected()).map(visual => visual.id).sort(),
				};
			`);
		},
	},
	{
		// Right clicking close to the last bend while drawing a flow removes the bend again
		name: "flow-remove-bend",
		async run(page) {
			await page.run(`
				${clickTool("stock", 200, 200)}
				${clickTool("stock", 500, 400)}
				setTimeUnits("Year");
				$(".ui-dialog-content").each(function () { try { $(this).dialog("close"); } catch (e) { } });
				ToolBox.setTool("flow", mouse.left);
			`);
			const [offsetX, offsetY] = await page.run(`const o = $(SVG.svgElement).offset(); return [o.left, o.top];`);
			const at = (x, y) => [x + offsetX, y + offsetY];
			const move = (x, y) => page.mouse("mouseMoved", ...at(x, y));
			const rightClick = async (x, y) => {
				await page.mouse("mousePressed", ...at(x, y), { button: "right" });
				await page.mouse("mouseReleased", ...at(x, y), { button: "right" });
			};
			const anchors = () => page.run(`
				return Visuals.get(primitives("Flow")[0].id).getAnchors().map(anchor => anchor.id + ":" + anchor.getPos().map(Math.round));
			`);
			const steps = {};

			await move(220, 200);
			await page.mouse("mousePressed", ...at(220, 200));
			await move(215, 200);
			await move(350, 200);
			await rightClick(350, 200);
			await move(350, 300);
			steps.afterBend = await anchors();
			await move(350, 205);
			await rightClick(350, 205);
			steps.afterRemovingBend = await anchors();
			steps.anchorVisualsLeft = await page.run(`return Visuals.onePointers().map(visual => visual.id).filter(id => id.startsWith(primitives("Flow")[0].id + ".")).sort()`);
			steps.anchorElementsLeft = await page.run(`return $("#svgplane [node_id^='" + primitives("Flow")[0].id + ".']").length`);
			await move(480, 400);
			await page.mouse("mouseReleased", ...at(480, 400));
			steps.final = await anchors();
			return steps;
		},
	},
	{
		// Deleting a stock that has a ghost, a flow starting in it, a link and a numberbox showing it
		name: "delete-stock-with-ghost",
		async run(page) {
			await page.run(buildModel);
			const flowId = await page.run(`return primitives("Flow")[0].id`);
			await page.run(`
				${selectOnly(`primitives("Stock")[0]`)}
				ToolBox.setTool("delete", mouse.left);
			`);
			return {
				primitives: await page.run(primitiveSummary),
				visuals: await page.run(visuals),
				flowAttached: await page.run(`const flow = Visuals.get("${flowId}"); return [flow.getStartAttach()?.id ?? null, flow.getEndAttach()?.id ?? null]`),
				xml: await page.run(modelXml),
			};
		},
	},
	{
		// A link that is not attached in both ends is deleted when the mouse is released
		name: "unattached-link",
		async run(page) {
			await page.run(`
				${clickTool("stock", 200, 200)}
				${clickTool("variable", 400, 200)}
				setTimeUnits("Year");
				$(".ui-dialog-content").each(function () { try { $(this).dialog("close"); } catch (e) { } });
			`);
			const [offsetX, offsetY] = await page.run(`const o = $(SVG.svgElement).offset(); return [o.left, o.top];`);
			const at = (x, y) => [x + offsetX, y + offsetY];
			const count = () => page.run(`return { links: primitives("Link").length, visuals: Visuals.all().map(visual => visual.id).sort() }`);
			const steps = {};

			await page.run(`ToolBox.setTool("link", mouse.left);`);
			await page.drag(at(200, 200), at(300, 350));
			steps.linkToNothing = await count();

			await page.run(`ToolBox.setTool("link", mouse.left);`);
			await page.drag(at(200, 200), at(400, 200));
			steps.linkToVariable = await count();
			return steps;
		},
	},
	{
		// Renaming updates the plots and tables showing the renamed primitive
		name: "rename",
		async run(page) {
			await page.run(buildModel);
			await page.run(`
				const stock = primitives("Stock")[0];
				for (const display of primitives().filter(p => ["Table", "TimePlot"].includes(getType(p)))) {
					display.setAttribute("Primitives", stock.id);
					Visuals.get(display.id).render();
				}
				setName(stock, "Population");
			`);
			await new Promise(resolve => setTimeout(resolve, 500));
			return {
				primitives: await page.run(primitiveSummary),
				tableHeader: await page.run(`return $(Visuals.get(primitives("Table")[0].id).htmlElement).find("th").map((i, e) => e.textContent.trim()).get()`),
				xml: await page.run(modelXml),
			};
		},
	},
	{
		// A link into a flow that was drawn after the flow. Undo and delete used to crash,
		// since removing the link updated the flow after the flow had been removed
		name: "link-to-flow",
		async run(page) {
			await page.run(`
				${buildModel}
				${dragTool("link", [350, 400], [350, 205])}
			`);
			const steps = {};
			steps.linkEnds = await page.run(`const link = primitives("Link").at(-1); return [getName(link.source), getName(link.target)]`);
			await page.run(`History.restoreUndoState()`);
			steps.afterUndoReload = await page.run(visuals);
			await page.run(`
				Visuals.unselectAll();
				Visuals.get(primitives("Flow")[0].id).select();
				ToolBox.setTool("delete", mouse.left);
			`);
			steps.afterDeletingFlow = await page.run(primitiveSummary);
			steps.crashDialogs = await page.run(`return $(".ui-dialog-title:visible").filter((i, e) => e.textContent.includes("Crash")).length`);
			return steps;
		},
	},
	{
		// Copying and pasting with Ctrl+C and Ctrl+V. The pasted primitives refer to each other instead of the copied ones,
		// and the model is the same after undo and redo, which reloads it from XML
		name: "copy-paste",
		async run(page) {
			await page.run(`
				${buildModel}
				setTimeUnits("Year");
				$(".ui-dialog-content").each(function () { try { $(this).dialog("close"); } catch (e) { } });
				const timePlot = primitives("TimePlot")[0];
				setDisplayIdsForTimePlot(timePlot, [stock1.id, stock2.id], ["L", "R"]);
				// Recreates the visual so it shows the stocks
				Visuals.get(timePlot.id).remove();
				syncAllVisuals();
				History.storeUndoState();
			`);
			const [offsetX, offsetY] = await page.run(`const o = $(SVG.svgElement).offset(); return [o.left, o.top];`);
			const ctrl = key => page.key(key, { code: "Key" + key.toUpperCase(), keyCode: key.toUpperCase().charCodeAt(0), modifiers: 2 });
			const newPrimitives = `
				return primitives().filter(p => Number(p.id) > 62).map(p => {
					const parts = [p.id, getType(p), getName(p)];
					if (["Flow", "Link"].includes(getType(p))) parts.push((p.source?.id ?? "-") + "->" + (p.target?.id ?? "-"));
					for (const attribute of ["Source", "Target", "Primitives", "Sides", "FlowRate", "Equation"]) {
						if (p.getAttribute(attribute)) parts.push(attribute + "=" + p.getAttribute(attribute));
					}
					return parts.join(" | ");
				});
			`;
			const steps = {};

			// Stock1, Stock2, Flow1, Auxiliary1, Link1, the ghost, the numberbox and the time plot
			await page.run(`
				Visuals.unselectAll();
				for (const type of ["Stock", "Flow", "Variable", "Link", "Ghost", "Numberbox", "TimePlot"]) {
					primitives(type).forEach(p => Visuals.get(p.id).select());
				}
			`);
			await ctrl("c");
			await page.mouse("mouseMoved", 450 + offsetX, 500 + offsetY);
			await ctrl("v");
			steps.pasted = await page.run(newPrimitives);
			steps.selected = await page.run(`return Visuals.selectedParents().map(visual => visual.id).sort()`);
			steps.positions = await page.run(`return primitives("Stock").map(p => getName(p) + " " + Visuals.get(p.id).getPos())`);

			const details = await page.run(visualDetails);
			await page.run(`History.doUndo()`);
			steps.afterUndo = await page.run(newPrimitives);
			await page.run(`History.doRedo()`);
			steps.sameAfterRedo = JSON.stringify(await page.run(visualDetails)) == JSON.stringify(details);

			// Pasting again without moving the mouse puts the copies a bit further down
			await ctrl("v");
			steps.pastedAgain = await page.run(`return primitives("Stock").map(p => getName(p) + " " + Visuals.get(p.id).getPos())`);

			// In a text field Ctrl+V pastes text, not primitives
			await page.run(`$("body").append('<input id="copy-paste-input">'); $("#copy-paste-input").focus();`);
			const count = await page.run(`return primitives().length`);
			await ctrl("v");
			steps.pastedInTextField = await page.run(`return primitives().length`) - count;
			await page.run(`$("#copy-paste-input").remove()`);

			steps.simulation = await page.run(simulate);
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

				for (const visual of Visuals.onePointers().concat(Visuals.twoPointers())) {
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
				visuals: await page.run(visualDetails),
				primitives: await page.run(primitiveSummary),
				resavedXml: await page.run(modelXml),
				simulation: await page.run(simulate),
			};
		},
	});
}
