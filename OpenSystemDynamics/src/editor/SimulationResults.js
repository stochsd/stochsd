// @ts-check
class SimulationResults {
	/** Most rows to allocate before the run, so a very long run doesn't reserve all its memory up front */
	static #maxInitialCapacity = 100_000;
	/** Number of stored rows. The arrays have room for more, only indexes below length are valid */
	static length = 0;
	/** Time of each row */
	static times = new Float64Array(0);
	/**
	 * Values of each row for every recorded primitive id, in the order of getPrimitiveList.
	 * NaN means no value
	 * @type {Map<string, Float64Array>}
	 */
	static valuesById = new Map();
	/** @type {{ [plotId: string]: () => void }} */
	static subscribers = {};

	static reset() {
		/** @type {string[]} */
		const ids = getID(getPrimitiveList());
		// Room for every time step, storeResults grows the arrays if the engine records more
		const steps = Math.round(getTimeLength() / getTimeStep()) + 1;
		const capacity = Number.isFinite(steps) && 0 < steps ? Math.min(steps, this.#maxInitialCapacity) : 1000;
		this.length = 0;
		this.times = new Float64Array(capacity);
		this.valuesById = new Map(ids.map(id => [id, new Float64Array(capacity)]));
	}
	/** @param {number} rows */
	static #ensureCapacity(rows) {
		if (rows <= this.times.length) {
			return;
		}
		const capacity = Math.max(rows, this.times.length * 2);
		/** @param {Float64Array} array */
		const grow = array => {
			const grown = new Float64Array(capacity);
			grown.set(array.subarray(0, this.length));
			return grown;
		};
		this.times = grow(this.times);
		for (const [id, values] of this.valuesById) {
			this.valuesById.set(id, grow(values));
		}
	}
	/**
	 * Copies the rows that are new since the last call, called on every pause and when the simulation is finished
	 * @param {EngineResults} result
	 */
	static storeResults(result) {
		this.#ensureCapacity(result.periods);
		const ids = [...this.valuesById.keys()];
		const columns = [...this.valuesById.values()];
		// Look up each primitive's values once, findID walks the whole model
		const engineValues = ids.map(id => result.value(findID(id)));
		for (let index = this.length; index < result.periods; index++) {
			this.times[index] = result.times[index];
			for (let column = 0; column < columns.length; column++) {
				columns[column][index] = engineValues[column][index] ?? NaN;
			}
		}
		this.length = Math.max(this.length, result.periods);
	}
	/** @param {string} id  */
	static removeResultsForId(id) {
		this.valuesById.delete(id);
	}
	/**
	 * @param {string} id 
	 * @param {()=>void} handler 
	 */
	static subscribe(id, handler) {
		this.subscribers[id] = handler;
	}
	/**
	 * @param {string} primitiveId
	 * @returns {number | null} null if nothing is simulated or the primitive has no value
	 */
	static getLastValue(primitiveId) {
		const values = this.valuesById.get(primitiveId);
		if (this.length == 0 || !values) {
			return null;
		}
		return this.#toValue(values[this.length - 1]);
	}
	/** Time of the last stored result, or the start time if nothing has been simulated */
	static getCurrentTime() {
		return this.length != 0 ? this.times[this.length - 1] : getTimeStart();
	}
	/** @param {number} value */
	static #toValue(value) {
		return Number.isNaN(value) ? null : value;
	}
	/**
	 * Rows of [time, value of ids[0], value of ids[1], ...], with null where there is no value
	 * @param {string[]} ids
	 * @returns {(number | null)[][]}
	 */
	static getSelectiveIdResults(ids) {
		do_global_log("recorded ids " + JSON.stringify([...this.valuesById.keys()]) + " ids " + JSON.stringify(ids));
		const columns = ids.map(id => this.valuesById.get(id));
		const rows = [];
		for (let index = 0; index < this.length; index++) {
			const row = [this.times[index]];
			for (const values of columns) {
				row.push(values ? this.#toValue(values[index]) : null);
			}
			rows.push(row);
		}
		return rows;
	}
	static getFilteredSelectiveIdResults(ids, start, length, step) {
		let unfilteredResults = this.getSelectiveIdResults(ids);
		let filteredResults = [];
		let printInterval = step / getTimeStep();
		let printCounter = 1;

		for (let row_index in unfilteredResults) {
			let time = unfilteredResults[row_index][0];
			if (time < start) {
				continue;
			}
			if (time == start) {
				printCounter = printInterval;
			}
			if (time > start + length) {
				// End of loop
				return filteredResults;
			}
			if (printCounter < printInterval) {
				printCounter++;
				continue;
			} else {
				printCounter = 1;
			}
			filteredResults.push(unfilteredResults[row_index]);
		}
		// Make sure last value is added
		if (filteredResults.length !== 0 && unfilteredResults.length !== 0) {
			if (filteredResults[filteredResults.length - 1][0] !== unfilteredResults[unfilteredResults.length - 1][0]) {
				filteredResults.push(unfilteredResults[unfilteredResults.length - 1]);
			}
		}
		return filteredResults;
	}
	static notifySubscribers() {
		for (let id in this.subscribers) {
			if (findID(id)) {
				this.subscribers[id]();
			} else {
				delete this.subscribers[id];
			}
		}
	}
}
