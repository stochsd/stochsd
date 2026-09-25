// Stores all visual objects in the diagram, by id.
// OnePointers are visuals with a single position, e.g. stocks, variables and the anchor points of TwoPointers.
// TwoPointers are visuals spanning two points, e.g. flows, links, plots, tables and shapes.
// Nothing outside this class should touch the maps directly.
class Visuals {
	/** @type {{ [id: string]: OnePointer }} */
	static #onePointers = {};
	/** @type {{ [id: string]: TwoPointer }} */
	static #twoPointers = {};

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
