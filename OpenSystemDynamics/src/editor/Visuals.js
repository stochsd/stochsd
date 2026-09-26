// @ts-check
// Stores all visual objects in the diagram, by id.
// OnePointers are visuals with a single position, e.g. stocks, variables and the anchor points of TwoPointers.
// TwoPointers are visuals spanning two points, e.g. flows, links, plots, tables and shapes.
// A visual's parent is the top level visual it belongs to, e.g. the flow an anchor belongs to.
// A top level visual is its own parent. Children have ids like "<parent id>.start_anchor".
// Nothing outside this class should touch the maps directly.
class Visuals {
	/** @type {{ [id: string]: OnePointer }} */
	static #onePointers = {};
	/** @type {{ [id: string]: TwoPointer }} */
	static #twoPointers = {};
	// Displays are the plots and tables, i.e. the TwoPointers that show values of primitives
	/** @type {VisualType[]} */
	static #displayTypes = ["timeplot", "xyplot", "compareplot", "histoplot", "table"];
	// The visuals a link can attach to. Flows only attach to stocks, which FlowVisual checks itself
	/** @type {VisualType[]} */
	static #attachableTypes = ["flow", "stock", "constant", "variable", "converter"];

	/** @param {OnePointer} visual */
	static addOnePointer(visual) {
		this.#onePointers[visual.id] = visual;
	}

	/** @param {TwoPointer} visual */
	static addTwoPointer(visual) {
		this.#twoPointers[visual.id] = visual;
	}

	/** @param {string} id */
	static remove(id) {
		delete this.#onePointers[id];
		delete this.#twoPointers[id];
	}

	/**
	 * The id of the parent, e.g. "12" for "12.start_anchor". A top level visual is its own parent.
	 * @param {string} id
	 */
	static getParentId(id) {
		return id.toString().split(".")[0];
	}

	/** @param {string} id @returns {OnePointer | TwoPointer | undefined} */
	static get(id) {
		return this.#onePointers[id] ?? this.#twoPointers[id];
	}

	/** @param {string} id @returns {OnePointer | undefined} */
	static getOnePointer(id) {
		return this.#onePointers[id];
	}

	/** @param {string} id @returns {TwoPointer | undefined} */
	static getTwoPointer(id) {
		return this.#twoPointers[id];
	}

	/** @returns {OnePointer[]} */
	static onePointers() {
		return Object.values(this.#onePointers);
	}

	/** @returns {TwoPointer[]} */
	static twoPointers() {
		return Object.values(this.#twoPointers);
	}

	/**
	 * All visuals. Ordered as numeric ids (the primitives) ascending first, then the rest in creation order,
	 * since that is the order the code relied on when the visuals were merged into one object.
	 * @returns {(OnePointer | TwoPointer)[]}
	 */
	static all() {
		return Object.values({ ...this.#onePointers, ...this.#twoPointers });
	}

	/** @returns {(OnePointer | TwoPointer)[]} */
	static selected() {
		return this.all().filter(visual => visual.isSelected());
	}

	/**
	 * All top level visuals, i.e. everything except children such as anchors
	 * @returns {(OnePointer | TwoPointer)[]}
	 */
	static parents() {
		return this.all().filter(visual => Visuals.getParentId(visual.id) == visual.id);
	}

	/**
	 * The parents of all selected visuals, each included once.
	 * Selecting an anchor therefore counts as selecting its flow, link or plot.
	 * @returns {(OnePointer | TwoPointer)[]}
	 */
	static selectedParents() {
		let parents = {};
		for (let visual of this.selected()) {
			let parent = visual.getParent();
			parents[parent.id] = parent;
		}
		return Object.values(parents);
	}

	/** @returns {TwoPointer[]} */
	static displays() {
		return this.twoPointers().filter(visual => this.#displayTypes.includes(visual.type));
	}

	/**
	 * Displays that show the primitive with this id
	 * @param {string} id
	 * @returns {TwoPointer[]}
	 */
	static displaysShowing(id) {
		return this.displays().filter(display => getDisplayIds(display.primitive).includes(id));
	}

	/**
	 * Flows and links whose start is attached to visual
	 * @returns {BaseConnection[]}
	 */
	static connectionsFrom(visual) {
		return this.#connections().filter(connection => connection.getStartAttach() == visual);
	}

	/**
	 * Flows and links whose end is attached to visual
	 * @returns {BaseConnection[]}
	 */
	static connectionsTo(visual) {
		return this.#connections().filter(connection => connection.getEndAttach() == visual);
	}

	/**
	 * Flows and links attached to visual in either end
	 * @returns {BaseConnection[]}
	 */
	static connectionsAttachedTo(visual) {
		return this.connectionsFrom(visual).concat(this.connectionsTo(visual));
	}

	/**
	 * Visuals that links can attach to, at position (x, y).
	 * Also used for flows, which then check themselves that it is a stock.
	 * @param {number} x @param {number} y
	 */
	static attachablesAt(x, y) {
		let found = this.all().filter(visual => {
			if (!this.#attachableTypes.includes(visual.type)) {
				return false;
			}
			let rect = visual.getBoundRect();
			return isInLimits(rect.minX, x, rect.maxX) && isInLimits(rect.minY, y, rect.maxY);
		});
		do_global_log("found array(" + found.length + ") " + found.map(visual => visual.id).join(","));
		return found;
	}

	/**
	 * The first visual that links can attach to at position (x, y), or null if there is none.
	 * Also used for flows, which then check themselves that it is a stock.
	 * @param {number} x @param {number} y
	 */
	static firstAttachableAt(x, y) {
		let found = this.attachablesAt(x, y)[0] ?? null;
		if (found) {
			do_global_log("firstAttachableAt choose " + found.id);
		}
		return found;
	}

	/** @returns {BaseConnection[]} */
	static #connections() {
		return this.twoPointers().filter(visual => visual instanceof BaseConnection);
	}

	static updateAll() {
		for (let visual of this.onePointers()) {
			visual.update();
		}
		for (let visual of this.twoPointers()) {
			visual.update();
		}
	}

	/**
	 * Updates all visuals, except displays (plots and tables) that are slow to redraw.
	 * Only the displays in displayIds are updated.
	 * @param {string[]} displayIds
	 */
	static updateAllExceptDisplays(displayIds = []) {
		for (let visual of this.onePointers()) {
			// dont update dummy_anchors, the twopointer parent of the dummy anchor has responsibility of the dummy_anchors 
			if (visual.type !== "dummy_anchor") {
				visual.update();
			}
		}
		this.updateTwoPointers(displayIds);
	}

	/**
	 * Updates all TwoPointers, e.g. after something they are attached to has moved.
	 * Displays (plots and tables) are slow to redraw, so only the displays in displayIds are updated.
	 * @param {string[]} displayIds
	 */
	static updateTwoPointers(displayIds = []) {
		for (let visual of this.twoPointers()) {
			if (!this.#displayTypes.includes(visual.type) || displayIds.includes(visual.id)) {
				visual.update();
			}
		}
	}

	/** @param {string} color */
	static setSelectionColor(color) {
		for (let visual of this.selected()) {
			visual.getParent().setColor(color);
		}
	}

	/** Deletes the primitives of the selected visuals from the model, which also removes their visuals */
	static deleteSelected() {
		for (let parent of this.selectedParents()) {
			// check if object not already deleted
			// e.i. link gets deleted automatically if any of it's attachments gets deleted
			if (this.get(parent.id)) {
				this.#deletePrimitive(parent.id);
			}
		}
	}

	/** Deletes a primitive and its ghosts from the model, and detaches flows from it */
	static #deletePrimitive(id) {
		removePrimitive(findID(id));
		for (let ghostId of findGhostsOfID(id)) {
			this.#deletePrimitive(ghostId);
		}
		cleanUnconnectedLinks();
		this.#detachFlowsFrom(id);
		RunResults.removeResultsForId(id);
	}

	static #detachFlowsFrom(id) {
		for (let flow of this.twoPointers().filter(visual => visual instanceof FlowVisual)) {
			if (flow.getStartAttach()?.id == id) {
				flow.setStartAttach(null);
				flow.update();
			}
			if (flow.getEndAttach()?.id == id) {
				flow.setEndAttach(null);
				flow.update();
			}
		}
	}

	static unselectAll() {
		this.unselectAllExcept(null);
	}

	/** @param {string | null} id */
	static unselectAllExcept(id) {
		for (let visual of this.onePointers()) {
			if (visual.id != id) {
				visual.unselect();
			}
		}
		for (let visual of this.twoPointers()) {
			if (visual.id != id) {
				visual.unselect();
			}
		}
	}
}
