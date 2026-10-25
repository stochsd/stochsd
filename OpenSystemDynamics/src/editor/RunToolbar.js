class RunToolbar {    
    /** @param {"play" | "pause"} mode */
    static setMode(mode) {
        const playPauseImage = $("#play-pause-image")
        if (mode == "play") {
            playPauseImage.attr("src", "graphics/play.svg")
        } else {
            playPauseImage.attr("src", "graphics/pause.svg")
        }
    }

    /** @param {boolean} done  */
	static setProgressStatus(done) {
		done
			? $("#progress-bar").attr("data-done", "")
			: $("#progress-bar").removeAttr("data-done")
	}
	/** @param {number} currentTime */
	static updateProgressLength(currentTime) {
		let start = getTimeStart();
		let progress = clampValue((currentTime - start) / getTimeLength(), 0, 1);
		$("#progress-bar")[0].style.setProperty("--progress", `${100 * progress}%`)
	}
	/** @param {number} currentTime */
	static updateProgressText(currentTime) {
		let number_options = { precision: 3 };
		let current = format_number(currentTime, number_options);
		let startTime = format_number(getTimeStart(), number_options);
		let endTime = format_number(getTimeStart() + getTimeLength(), number_options);
		let timeStep = primitives("Setting")[0].getAttribute("TimeStep");
		let alg_str = getAlgorithm() === "RK1" ? "Euler" : "RK4";
		$("#progress-bar-text").html(`${startTime} / ${current} / ${endTime} </br> ${alg_str}(DT = ${timeStep})`);
	}
	/** @param {number} currentTime */
	static updateProgressBar(currentTime) {
		this.updateProgressLength(currentTime)
		this.updateProgressText(currentTime)
	}
}
