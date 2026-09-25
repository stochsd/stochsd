class RunResults {
	/** @type {"none" | "running" | "stopped" | "stepping" | "paused"} */
	static runState;

	static init() {
		this.runState = "none";
		// Is always null if simulation is not running
		// Is a data structure returned from runModel if simulation is running it
		this.simulationController = null;
		this.varnameList = [];
		this.varIdList = [];
		this.results = [];
		this.runSubscribers = {};
		this.updateFrequency = 100;
		this.updateCounter = 0; // Updates everytime updateCounter goes down to zero
		this.simulationTime = 0;
	}
	static createHeader() {
		// Get list of primitives that we want to observe from the model
		let primitive_array = getPrimitiveList();

		// Create list of ids, id0 is reserved for time 
		this.varIdList = [0].concat(getID(primitive_array)).map(Number);

		// Create list of names
		this.varnameList = ["Time"].concat(getName(primitive_array));

		// Reset results
		this.results = [];
	}
	static toCsv() {
		// Under development
		let out = "";

		//~ let namesToDisplay = IdsToDisplay.map(findID).map(getName);
		let first = true;
		out += "Time"
		for (let id of this.varIdList) {
			let primitive = findID(id);
			if (primitive) {
				out += "," + getName(primitive);
			}
		}
		out += "\n";

		for (let row_index in this.results) {
			//~ for(let column_index in ["Time"].concat(namesToDisplay)) {
			first = true;
			for (let column_index in this.varIdList) {
				if (first) {
					out += stocsd_format(this.results[row_index][column_index], 6);
					first = false;
				} else {
					out += "," + stocsd_format(this.results[row_index][column_index], 6);
				}
			}
			out += "\n";
		}
		return out;
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
			for (let key in this.varIdList) {
				if (key == 0) {
					// On location 0 we always have time
					continue;
				}
				//~ do_global_log(JSON.stringify(res));
				let value = res.value(findID(this.varIdList[key]))[index];
				currentRunResults.push(value);
			}
			this.push(currentRunResults);
			index++;
		}
		//~ this.triggerRunFinished();
	}
	static removeResultsForId(id) {
		let index = this.varIdList.indexOf(parseInt(id));
		if (index !== -1) {
			// remove id
			this.varIdList.splice(index, 1);


			// remove name
			this.varnameList.splice(index, 1);

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
		$("#imgRunPauseTool").attr("src", "graphics/pause.svg");
		this.runState = "running";
		// Simulation controller can only be null if the first pause event has never triggered
		// In such a case it is enought to just change this.runState, otherwise we also have to trigger the controllers resume() function.
		if (this.simulationController != null) {

			this.simulationController.resume();
			// We have a bug that happens some times on resume because simulationController is null
			// Find out when it happens
			//~ console.error(getStackTrace());
		}
	}
	static runSimulation() {
		this.simulationDone = false;
		this.stopSimulation();
		$("#imgRunPauseTool").attr("src", "graphics/pause.svg");
		this.createHeader();
		if (getTimeLength() / getTimeStep() < 1000) {
			setPauseInterval(getTimeLength() / 10);
		} else {
			// We can only take 1000 iterations between every update to avoid the feeling of program freezing
			setPauseInterval(getTimeStep() * 1000);
		}
		this.runState = "running";
		runOverlay.block();
		this.simulationController = runModel({
			rate: -1,
			onPause: (res) => {
				// We always need to do this, even if we paused the simulation, otherwise we cannot unpause
				// Here is the only place we can get a handle to the simulationController
				this.simulationController = res;

				// If still running continue with next cycle
				if (this.runState == "running") {
					this.updateProgressBar();
					this.setProgressStatus(false);
					do_global_log("length " + this.results.length)
					if (this.simulationController == null) {
						do_global_log("simulation controller is null")
					}
					this.continueRunSimulation()
				}
			},
			onSuccess: (res) => {
				// Run finished

				// On especially longer simulation onSuccess is called multible times
				// This is a hack to get around that 
				if (this.simulationDone === false) {
					this.simulationDone = true;
					// In some cases onPause was never executed and in such cases we need to do store Result directly on res
					this.storeResults(res);
					this.updateProgressBar();
					this.setProgressStatus(true);
					this.triggerRunFinished();
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
	static continueRunSimulation() {
		this.storeResults(this.simulationController);
		if (this.updateCounter == 0) {
			this.updateCounter = this.updateFrequency;
		}
		this.updateCounter -= 1;
		this.simulationController.resume();
	}
	static stepSimulation() {
		/* experiment
		if (this.runState == "running") {
			this.resetSimulation();
			this.simulationController = null;
			this.runState = "stepping";
			return;
		}
		*/
		// if stepping was already started
		if (this.simulationController != null) {
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
				this.updateProgressBar();
				this.setProgressStatus(false);
				this.triggerRunFinished();
				this.simulationController = res;
			},
			onSuccess: (res) => {
				this.simulationDone = true;
				runOverlay.unblock();
				this.storeResults(res);
				this.updateProgressBar();
				this.setProgressStatus(true);
				this.triggerRunFinished();
			},
			onError: (res) => {
				this.stopSimulation();
			}
		});
	}
	static setProgressStatus(done) {
		done
			? $("#progress-bar").attr("data-done", "")
			: $("#progress-bar").removeAttr("data-done")
	}
	static updateProgressLength() {
		let progress = clampValue(this.getRunProgressFraction(), 0, 1);
		$("#progress-bar")[0].style.setProperty("--progress", `${100 * progress}%`)
	}
	static updateProgressText() {
		let number_options = { precision: 3 };
		let currentTime = format_number(this.getRunProgress(), number_options);
		let startTime = format_number(this.getRunProgressMin(), number_options);
		let endTime = format_number(this.getRunProgressMax(), number_options);
		let timeStep = this.getTimeStep();
		let alg_str = getAlgorithm() === "RK1" ? "Euler" : "RK4";
		$("#progress-bar-text").html(`${startTime} / ${currentTime} / ${endTime} </br> ${alg_str}(DT = ${timeStep})`);
	}
	static updateProgressBar() {
		this.updateProgressLength()
		this.updateProgressText()
	}
	static pauseSimulation() {
		this.runState = "paused";
		$("#imgRunPauseTool").attr("src", "graphics/run.svg");
	}
	static resetSimulation() {
		this.stopSimulation();
		this.createHeader();
		this.updateProgressBar();
		this.triggerRunFinished();
	}
	static stopSimulation() {
		runOverlay.unblock();
		endRunningSimulation();
		this.runState = "stopped";
		this.simulationController = null;
		$("#imgRunPauseTool").attr("src", "graphics/run.svg");
		this.updateCounter = 0;
	}
	static subscribeRun(id, handler) {
		this.runSubscribers[id] = handler;
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
		let varIdIndex = this.varIdList.indexOf(Number(primitiveId));
		return lastRow[varIdIndex];
	}
	static getTimeStep() {
		if (primitives("Setting")[0]) {
			return primitives("Setting")[0].getAttribute("TimeStep");
		} else if (this.results && 1 < this.results.length) {
			return `${this.results[1][0] - this.results[0][0]}`;
		}
		return "0";
	}
	static getRunProgress() {
		let lastRow = this.getLastRow();
		// If we have no last row return null
		if (lastRow == null && primitives("Setting")[0]) {
			return parseFloat(primitives("Setting")[0].getAttribute("TimeStart"));
		}
		// else return time
		return lastRow[0];
	}
	static getRunProgressFraction() {
		return (this.getRunProgress() - this.getRunProgressMin()) / (this.getRunProgressMax() - this.getRunProgressMin());
	}
	static getRunProgressMax() {
		return getTimeStart() + getTimeLength()
	}
	static getRunProgressMin() {
		return getTimeStart();
	}
	static getLastRow() {
		//~ alert(this.results.length);
		if (this.results.length != 0) {
			return this.results[this.results.length - 1];
		} else {
			return null;
		}
	}
	static getSelectiveIdResults(varIdList) {
		// Make sure the varIdList stored as numbers and not strings
		varIdList = varIdList.map(Number);

		// Contains the indexes from this.results that we want to return
		let selectedVarIdIndexes = [0]; // The first index is always 0 for time
		for (let i in varIdList) {
			let varIdIndex = this.varIdList.indexOf(varIdList[i]);
			selectedVarIdIndexes.push(varIdIndex);
		}
		do_global_log("this.varIdList " + JSON.stringify(this.varIdList) + " varIdList " + JSON.stringify(varIdList));
		let returnResults = [];
		for (let row_index in this.results) {
			let tmpRow = [];
			for (let column_index in selectedVarIdIndexes) {
				let wantedIndex = selectedVarIdIndexes[column_index];
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
	static getFilteredSelectiveIdResults(varIdList, start, length, step) {
		let unfilteredResults = this.getSelectiveIdResults(varIdList);
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
	static triggerRunFinished() {
		for (let id in this.runSubscribers) {
			if (findID(id)) {
				this.runSubscribers[id]();
			} else {
				delete this.runSubscribers[id];
			}
		}
	}
}
RunResults.init();

