// @ts-check
class Simulation {
	/** @type {"none" | "running" | "stopped" | "stepping" | "paused"} */
	static status;
	/** @type {PausedEngineResults | undefined} */
	static pausedRun

	static init() {
		this.status = "none";
		this.updateFrequency = 100;
		this.updateCounter = 0; // Updates every time updateCounter goes down to zero
	}
	static toggle() {
		switch (this.status) {
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
		this.status = "running";
		// pausedRun can only be undefined if the first pause event has never triggered
		// In such a case it is enough to just change this.status, otherwise we also have to call pausedRun.resume().
		if (this.pausedRun) {
			this.pausedRun.resume();
		}
	}
	static run() {
		this.simulationDone = false;
		this.stop();
		RunToolbar.setMode("pause")
		SimulationResults.reset();
		// We can only take 1000 iterations between every update to avoid the feeling of program freezing
		const pauseInterval = getTimeLength() / getTimeStep() < 1000 ? getTimeLength() / 10 : getTimeStep() * 1000;
		this.status = "running";
		runOverlay.block();
		runModel({
			pauseInterval,
			rate: -1,
			onPause: (res) => {
				// We always need to do this, even if we paused the simulation, otherwise we cannot unpause
				// Here is the only place we can get a handle to the pausedRun
				this.pausedRun = res;

				// If still running continue with next cycle
				if (this.status == "running") {
					RunToolbar.updateProgressBar(SimulationResults.getCurrentTime());
					RunToolbar.setProgressStatus(false);
					do_global_log("length " + SimulationResults.length)
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
		if (this.status == "running") {
			this.reset();
			this.pausedRun = undefined;
			this.status = "stepping";
			return;
		}
		*/
		// if stepping was already started
		if (this.pausedRun) {
			this.pausedRun.resume();
			return;
		}
		// Else start the stepping
		this.stop();
		SimulationResults.reset();
		//~ alert("stepping init");
		runOverlay.block();
		runModel({
			pauseInterval: getTimeStep(),
			onPause: (res) => {
				this.simulationDone = false;
				SimulationResults.storeResults(res);
				RunToolbar.updateProgressBar(SimulationResults.getCurrentTime());
				RunToolbar.setProgressStatus(false);
				SimulationResults.notifySubscribers();
				this.pausedRun = res;
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
		this.status = "paused";
		RunToolbar.setMode("play")
	}
	static reset() {
		this.stop();
		SimulationResults.reset();
		RunToolbar.updateProgressBar(SimulationResults.getCurrentTime());
		SimulationResults.notifySubscribers();
	}
	static stop() {
		runOverlay.unblock();
		endRunningSimulation();
		this.status = "stopped";
		this.pausedRun = undefined;
		RunToolbar.setMode("play")
		this.updateCounter = 0;
	}
}
Simulation.init();

