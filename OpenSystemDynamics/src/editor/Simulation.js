// @ts-check
class Simulation {
	/** @type {"none" | "running" | "stopped" | "stepping" | "paused"} */
	static runState;
	/** @type {PausedEngineResults | undefined} */
	static simulationController

	static init() {
		this.runState = "none";
		this.updateFrequency = 100;
		this.updateCounter = 0; // Updates every time updateCounter goes down to zero
	}
	static toggle() {
		switch (this.runState) {
			case "running":
				this.pause();
				break;
			case "paused":
				this.resume();
				break;
			default:
				this.run();
		}
	}
	static resume() {
		RunToolbar.setMode("pause")
		this.runState = "running";
		// Simulation controller can only be undefined if the first pause event has never triggered
		// In such a case it is enought to just change this.runState, otherwise we also have to trigger the controllers resume() function.
		if (this.simulationController) {
			this.simulationController.resume();
		}
	}
	static run() {
		this.simulationDone = false;
		this.stop();
		RunToolbar.setMode("pause")
		SimulationResults.createHeader();
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
					RunToolbar.updateProgressBar(SimulationResults.getCurrentTime());
					RunToolbar.setProgressStatus(false);
					do_global_log("length " + SimulationResults.results.length)
					this.continue(res)
				}
			},
			onSuccess: (res) => {
				// Run finished

				// On especially longer simulation onSuccess is called multiple times
				// This is a hack to get around that 
				if (this.simulationDone === false) {
					this.simulationDone = true;
					// In some cases onPause was never executed and in such cases we need to do store Result directly on res
					SimulationResults.storeResults(res);
					RunToolbar.updateProgressBar(SimulationResults.getCurrentTime());
					RunToolbar.setProgressStatus(true);
					SimulationResults.notifySubscribers();
					this.stop();
				} else {
					console.log("Extra onSuccess call from IM-engine");
				}
			},
			onError: (res) => {
				do_global_log("onError stop simulation");
				this.stop();
			}
		});
	}
	/** @param {PausedEngineResults} res */
	static continue(res) {
		SimulationResults.storeResults(res);
		if (this.updateCounter == 0) {
			this.updateCounter = this.updateFrequency;
		}
		this.updateCounter -= 1;
		res.resume();
	}
	static step() {
		/* experiment
		if (this.runState == "running") {
			this.reset();
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
		this.stop();
		SimulationResults.createHeader();
		//~ alert("stepping init");
		setPauseInterval(getTimeStep());
		runOverlay.block();
		runModel({
			onPause: (res) => {
				this.simulationDone = false;
				SimulationResults.storeResults(res);
				RunToolbar.updateProgressBar(SimulationResults.getCurrentTime());
				RunToolbar.setProgressStatus(false);
				SimulationResults.notifySubscribers();
				this.simulationController = res;
			},
			onSuccess: (res) => {
				this.simulationDone = true;
				runOverlay.unblock();
				SimulationResults.storeResults(res);
				RunToolbar.updateProgressBar(SimulationResults.getCurrentTime());
				RunToolbar.setProgressStatus(true);
				SimulationResults.notifySubscribers();
			},
			onError: (res) => {
				this.stop();
			}
		});
	}
	static pause() {
		this.runState = "paused";
		RunToolbar.setMode("play")
	}
	static reset() {
		this.stop();
		SimulationResults.createHeader();
		RunToolbar.updateProgressBar(SimulationResults.getCurrentTime());
		SimulationResults.notifySubscribers();
	}
	static stop() {
		runOverlay.unblock();
		endRunningSimulation();
		this.runState = "stopped";
		this.simulationController = undefined;
		RunToolbar.setMode("play")
		this.updateCounter = 0;
	}
}
Simulation.init();

