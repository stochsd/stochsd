// Copies the selected primitives and pastes them as new primitives.
// The clipboard holds copies of the primitives' XML, so pasting still works after the originals are changed or deleted.
// References between the copied primitives (flow and link ends, ghosts, numberboxes, plots and definitions)
// are moved over to the pasted primitives. References to primitives that were not copied are kept if that
// is harmless, otherwise the reference, or the pasted primitive, is dropped.
class Clipboard {
	/** @type {{ id: string, type: string, value: Element, sourceId: string | null, targetId: string | null }[]} */
	static #items = [];
	// Mouse position of the last paste, to spread out pastes that are made without moving the mouse
	static #lastPasteAt = null;
	static #pastesAtSamePlace = 0;

	static copy() {
		let parents = Visuals.selectedParents().filter(visual => findID(visual.id));
		if (parents.length == 0) {
			return;
		}
		this.#items = parents.map(visual => {
			let primitive = findID(visual.id);
			return {
				id: String(primitive.id),
				type: getType(primitive),
				value: primitive.value.cloneNode(true),
				sourceId: primitive.source ? String(primitive.source.id) : null,
				targetId: primitive.target ? String(primitive.target.id) : null,
			};
		});
		this.#lastPasteAt = null;
	}

	// Pastes the copied primitives centered at the mouse, and selects them.
	// If the mouse is outside the diagram they are pasted next to the copied primitives.
	static paste() {
		let items = this.#pastableItems();
		if (items.length == 0) {
			return;
		}
		let idMap = {};
		let nextId = Math.max(1, ...primitives().map(primitive => Number(primitive.id)).filter(id => id)) + 1;
		for (let item of items) {
			idMap[item.id] = String(nextId++);
		}
		let nameMap = this.#newNames(items);

		let root = graph.children[0].children[0];
		let pasted = items.map(item => {
			let primitive = new SimpleNode();
			primitive.value = item.value.cloneNode(true);
			primitive.parent = root;
			primitive.parentNode = root;
			primitive.id = idMap[item.id];
			primitive.value.setAttribute("id", primitive.id);
			root.children.push(primitive);
			return primitive;
		});
		clearPrimitiveCache();

		items.forEach((item, i) => this.#updateReferences(pasted[i], item, idMap, nameMap));
		syncAllVisuals();

		for (let primitive of pasted) {
			Visuals.get(primitive.id)?.select();
		}
		let [diffX, diffY] = this.#pasteOffset();
		MouseTool.defaultRelativeMove(Visuals.selected(), diffX, diffY);
		for (let [i, item] of items.entries()) {
			let link = item.type == "Link" ? Visuals.getTwoPointer(pasted[i].id) : null;
			if (!link) {
				continue;
			}
			// Links from primitives that were not copied are redrawn between their ends
			if (!(item.sourceId in idMap)) {
				link.resetBezierPoints();
			}
			// The anchors and handles of a link depend on each other, so it takes a few updates
			// for them to settle after the move, the same way as in syncLink
			for (let j = 0; j < 8; j++) {
				link.update();
			}
		}
		InfoBar.update();
	}

	// The copied items that can be pasted, i.e. those whose required references still exist
	static #pastableItems() {
		let ids = new Set();
		let exists = id => ids.has(id) || findID(id) != null;
		let pastable = [];
		let add = (condition) => {
			for (let item of this.#items) {
				if (!ids.has(item.id) && condition(item)) {
					ids.add(item.id);
					pastable.push(item);
				}
			}
		};
		// Ordered so that what a primitive refers to is added before the primitive itself
		const dependentTypes = ["Ghost", "Flow", "Numberbox", "Link"];
		add(item => !dependentTypes.includes(item.type));
		add(item => item.type == "Ghost" && exists(item.value.getAttribute("Source")));
		add(item => item.type == "Flow");
		add(item => item.type == "Numberbox" && exists(item.value.getAttribute("Target")));
		// A link must end at a pasted primitive, since only the end uses the link
		add(item => item.type == "Link" && ids.has(item.targetId) && item.sourceId != null && exists(item.sourceId));
		return pastable;
	}

	// New names for the items whose names are taken, as { lowercase old name: new name }.
	// "Stock1" becomes "Stock1_1", and "Stock1_1" becomes "Stock1_2".
	static #newNames(items) {
		let nameMap = {};
		let taken = new Set();
		for (let item of items) {
			let name = item.value.getAttribute("name");
			if (item.type == "Ghost" || !name) {
				continue;
			}
			if (findName(name) == null && !taken.has(name.toLowerCase())) {
				taken.add(name.toLowerCase());
				continue;
			}
			let base = name.replace(/_\d+$/, "");
			let counter = 1;
			while (findName(`${base}_${counter}`) != null || taken.has(`${base}_${counter}`.toLowerCase())) {
				counter++;
			}
			let newName = `${base}_${counter}`;
			taken.add(newName.toLowerCase());
			nameMap[name.toLowerCase()] = newName;
		}
		return nameMap;
	}

	static #updateReferences(primitive, item, idMap, nameMap) {
		let value = primitive.value;
		let mapId = id => idMap[id] ?? id;
		let name = value.getAttribute("name");
		if (name && nameMap[name.toLowerCase()] && item.type != "Ghost") {
			value.setAttribute("name", nameMap[name.toLowerCase()]);
		}
		for (let attribute of ["FlowRate", "Equation", "InitialValue"]) {
			let definition = value.getAttribute(attribute);
			if (definition) {
				value.setAttribute(attribute, definition.replace(/\[([^\]]+)\]/g,
					(match, name) => nameMap[name.toLowerCase()] ? `[${nameMap[name.toLowerCase()]}]` : match
				));
			}
		}
		switch (item.type) {
			case "Ghost":
				value.setAttribute("Source", mapId(value.getAttribute("Source")));
				value.setAttribute("name", getName(findID(value.getAttribute("Source"))));
				break;
			case "Converter":
				value.setAttribute("Source", mapId(value.getAttribute("Source")));
				break;
			case "Numberbox":
				value.setAttribute("Target", mapId(value.getAttribute("Target")));
				break;
			case "Flow":
				// A flow can not be attached to a stock that was not copied, since that would change the stock
				setSource(primitive, item.sourceId in idMap ? findID(idMap[item.sourceId]) : null);
				setTarget(primitive, item.targetId in idMap ? findID(idMap[item.targetId]) : null);
				break;
			case "Link":
				setSource(primitive, findID(mapId(item.sourceId)));
				setTarget(primitive, findID(idMap[item.targetId]));
				break;
		}
		if (value.hasAttribute("Primitives")) {
			this.#updateDisplayIds(primitive, idMap);
		}
	}

	// Plots and tables show the pasted primitives instead of the copied ones, and stop showing deleted primitives
	static #updateDisplayIds(display, idMap) {
		let ids = getCSA(display, "Primitives");
		let keep = ids.map(id => id in idMap || findID(id) != null);
		display.value.setAttribute("Primitives", ids.filter((id, i) => keep[i]).map(id => idMap[id] ?? id).join(","));
		// Only time plots have sides, one for each id
		let sides = display.value.hasAttribute("Sides") ? getCSA(display, "Sides") : [];
		if (ids.length == sides.length) {
			display.value.setAttribute("Sides", sides.filter((side, i) => keep[i]).join(","));
		}
	}

	// How far the pasted primitives, which are selected and still where they were copied from, must be moved
	static #pasteOffset() {
		let rects = Visuals.selectedParents().map(visual => visual.getBoundRect());
		let minX = Math.min(...rects.map(rect => rect.minX));
		let maxX = Math.max(...rects.map(rect => rect.maxX));
		let minY = Math.min(...rects.map(rect => rect.minY));
		let maxY = Math.max(...rects.map(rect => rect.maxY));
		let center = [(minX + maxX) / 2, (minY + maxY) / 2];

		let diagram = SVG.svgElement.parentElement;
		let mouseInDiagram = isInLimits(diagram.scrollLeft, mouse.x, diagram.scrollLeft + diagram.clientWidth)
			&& isInLimits(diagram.scrollTop, mouse.y, diagram.scrollTop + diagram.clientHeight);
		let target = mouseInDiagram ? [mouse.x, mouse.y] : center;

		if (this.#lastPasteAt && this.#lastPasteAt[0] == target[0] && this.#lastPasteAt[1] == target[1]) {
			this.#pastesAtSamePlace++;
		} else {
			this.#lastPasteAt = target;
			this.#pastesAtSamePlace = mouseInDiagram ? 0 : 1;
		}
		let spread = 20 * this.#pastesAtSamePlace;
		let diffX = target[0] + spread - center[0];
		let diffY = target[1] + spread - center[1];
		// Keep the pasted primitives inside the diagram
		return [Math.max(diffX, -minX), Math.max(diffY, -minY)];
	}
}
