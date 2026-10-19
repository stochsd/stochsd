// @ts-check
class Simulation {
	/** @type {"none" | "running" | "stopped" | "stepping" | "paused"} */
	static runState;
	/** @type {PausedSimulationResults | undefined} */
	static simulationController
	/** @type {string[]} */
	static recordedIds
	/** @type {number[][]} */
	static results
	/** @type {{ [id: string]: () => void }} */
	static subscribers;

	static init() {
		this.runState = "none";
		this.recordedIds = [];
		this.results = [];
		this.subscribers = {};
		this.updateFrequency = 100;
		this.updateCounter = 0; // Updates every time updateCounter goes down to zero
		this.simulationTime = 0;
	}
	static createHeader() {
		// Get list of primitives that we want to observe from the model
		let primitive_array = getPrimitiveList();

		// Create list of ids, id0 is reserved for time 
		this.recordedIds = ["0"].concat(getID(primitive_array));

		// Reset results
		this.results = [];
	}
	static storeResults(res) {
		// This method is executed after the simulation is finished
		// res is the result of the simulation
		let index = this.results.length;
		while (index < res.periods) {
			let time = res.times[index];
			this.simulationTime = res.times[index];
			let currentRunResults = [];
			currentRunResults.push(time);
			for (let key in this.recordedIds) {
				if (key == "0") {
					// On location 0 we always have time
					continue;
				}
				//~ do_global_log(JSON.stringify(res));
				let value = res.value(findID(this.recordedIds[key]))[index];
				currentRunResults.push(value);
			}
			this.push(currentRunResults);
			index++;
		}
		//~ this.triggerRunFinished();
	}
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
	static runPauseSimulation() {
		switch (this.runState) {
			case "running":
				this.pauseSimulation();
				break;
			case "paused":
				this.resumeSimulation();
				break;
			default:
				this.runSimulation();
		}
	}
	static resumeSimulation() {
		RunToolbar.setMode("pause")
		this.runState = "running";
		// Simulation controller can only be undefined if the first pause event has never triggered
		// In such a case it is enought to just change this.runState, otherwise we also have to trigger the controllers resume() function.
		if (this.simulationController) {
			this.simulationController.resume();
		}
	}
	static runSimulation() {
		this.simulationDone = false;
		this.stopSimulation();
		RunToolbar.setMode("pause")
		this.createHeader();
		if (getTimeLength() / getTimeStep() < 1000) {
			setPauseInterval(getTimeLength() / 10);
		} else {
			// We can only take 1000 iterations between every update to avoid the feeling of program freezing
			setPauseInterval(getTimeStep() * 1000);
		}
		this.runState = "running";
		runOverlay.block();
		runModel({
			rate: -1,
			onPause: (res) => {
				// We always need to do this, even if we paused the simulation, otherwise we cannot unpause
				// Here is the only place we can get a handle to the simulationController
				this.simulationController = res;

				// If still running continue with next cycle
				if (this.runState == "running") {
					RunToolbar.updateProgressBar(this.getCurrentTime());
					RunToolbar.setProgressStatus(false);
					do_global_log("length " + this.results.length)
					this.continueRunSimulation(res)
				}
			},
			onSuccess: (res) => {
				// Run finished

				// On especially longer simulation onSuccess is called multiple times
				// This is a hack to get around that 
				if (this.simulationDone === false) {
					this.simulationDone = true;
					// In some cases onPause was never executed and in such cases we need to do store Result directly on res
					this.storeResults(res);
					RunToolbar.updateProgressBar(this.getCurrentTime());
					RunToolbar.setProgressStatus(true);
					this.notifySubscribers();
					this.stopSimulation();
				} else {
					console.log("Extra onSuccess call from IM-engine");
				}
			},
			onError: (res) => {
				do_global_log("onError stop simulation");
				this.stopSimulation();
			}
		});
	}
	/** @param {PausedSimulationResults} res */
	static continueRunSimulation(res) {
		this.storeResults(res);
		if (this.updateCounter == 0) {
			this.updateCounter = this.updateFrequency;
		}
		this.updateCounter -= 1;
		res.resume();
	}
	static stepSimulation() {
		/* experiment
		if (this.runState == "running") {
			this.resetSimulation();
			this.simulationController = undefined;
			this.runState = "stepping";
			return;
		}
		*/
		// if stepping was already started
		if (this.simulationController) {
			this.simulationController.resume();
			return;
		}
		// Else start the stepping
		this.stopSimulation();
		this.createHeader();
		//~ alert("stepping init");
		setPauseInterval(getTimeStep());
		runOverlay.block();
		runModel({
			onPause: (res) => {
				this.simulationDone = false;
				this.storeResults(res);
				RunToolbar.updateProgressBar(this.getCurrentTime());
				RunToolbar.setProgressStatus(false);
				this.notifySubscribers();
				this.simulationController = res;
			},
			onSuccess: (res) => {
				this.simulationDone = true;
				runOverlay.unblock();
				this.storeResults(res);
				RunToolbar.updateProgressBar(this.getCurrentTime());
				RunToolbar.setProgressStatus(true);
				this.notifySubscribers();
			},
			onError: (res) => {
				this.stopSimulation();
			}
		});
	}
	static pauseSimulation() {
		this.runState = "paused";
		RunToolbar.setMode("play")
	}
	static resetSimulation() {
		this.stopSimulation();
		this.createHeader();
		RunToolbar.updateProgressBar(this.getCurrentTime());
		this.notifySubscribers();
	}
	static stopSimulation() {
		runOverlay.unblock();
		endRunningSimulation();
		this.runState = "stopped";
		this.simulationController = undefined;
		RunToolbar.setMode("play")
		this.updateCounter = 0;
	}
	/**
	 * @param {string} id 
	 * @param {()=>void} handler 
	 */
	static subscribe(id, handler) {
		this.subscribers[id] = handler;
	}
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
Simulation.init();

