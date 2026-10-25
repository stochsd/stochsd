// @ts-check
class SimulationResults {
	/** @type {string[]} */
	static recordedIds = [];
	/** @type {number[][]} */
	static results = [];
	/** @type {{ [id: string]: () => void }} */
	static subscribers = {};
	static simulationTime = 0;

	static createHeader() {
		// Get list of primitives that we want to observe from the model
		let primitive_array = getPrimitiveList();

		// Create list of ids, id0 is reserved for time 
		this.recordedIds = ["0"].concat(getID(primitive_array));

		// Reset results
		this.results = [];
	}
	/** @param {EngineResults} result  */
	static storeResults(result) {
		// This method is executed after the simulation is finished
		// Look up each primitive's values once, findID walks the whole model.
		// Location 0 is time, which is not a primitive
		const valuesPerId = this.recordedIds.slice(1).map(id => result.value(findID(id)));
		let index = this.results.length;
		while (index < result.periods) {
			let time = result.times[index];
			this.simulationTime = result.times[index];
			let currentRunResults = [];
			currentRunResults.push(time);
			for (const values of valuesPerId) {
				currentRunResults.push(values[index]);
			}
			this.push(currentRunResults);
			index++;
		}
	}
	/** @param {string} id  */
	static removeResultsForId(id) {
		let index = this.recordedIds.indexOf(id);
		if (index !== -1) {
			// remove id
			this.recordedIds.splice(index, 1);


			// remove data 
			this.results.map(row => {
				row.splice(index, 1);
			});
		}
	}
	/**
	 * @param {string} id 
	 * @param {()=>void} handler 
	 */
	static subscribe(id, handler) {
		this.subscribers[id] = handler;
	}
	/** @param {number[]} newRow  */
	static push(newRow) {
		this.results.push(newRow);
	}
	static getResults() {
		return this.results;
	}
	static getLastValue(primitiveId) {
		let lastRow = this.getLastRow();
		if (lastRow == null) {
			//~ alert("early return");
			return null;
		}
		let varIdIndex = this.recordedIds.indexOf(primitiveId);
		return lastRow[varIdIndex];
	}
	/** Time of the last stored result, or the start time if nothing has been simulated */
	static getCurrentTime() {
		return this.getLastRow()?.[0] ?? getTimeStart();
	}
	static getLastRow() {
		//~ alert(this.results.length);
		if (this.results.length != 0) {
			return this.results[this.results.length - 1];
		} else {
			return null;
		}
	}
	/** @param {string[]} ids */
	static getSelectiveIdResults(ids) {
		// Contains the indexes from this.results that we want to return
		let selectedVarIdIndexes = [0]; // The first index is always 0 for time
		for (let i in ids) {
			let varIdIndex = this.recordedIds.indexOf(ids[i]);
			selectedVarIdIndexes.push(varIdIndex);
		}
		do_global_log("this.recordedIds " + JSON.stringify(this.recordedIds) + " ids " + JSON.stringify(ids));
		const returnResults = [];
		for (let row_index in this.results) {
			let tmpRow = [];
			for (let columnIndex in selectedVarIdIndexes) {
				let wantedIndex = selectedVarIdIndexes[columnIndex];
				if (wantedIndex != -1) {
					tmpRow.push(this.results[row_index][wantedIndex]);
				} else {
					tmpRow.push(null);
				}
			}
			returnResults.push(tmpRow);
		}
		return returnResults;
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
