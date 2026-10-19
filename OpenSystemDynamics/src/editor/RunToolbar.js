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
}