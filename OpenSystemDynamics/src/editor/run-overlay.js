class SubscribePool {
	constructor() {
		this.subscribers = [];
	}
	subscribe(handler) {
		this.subscribers.push(handler);
	}
	publish(message) {
		for (let i in this.subscribers) {
			this.subscribers[i](message);
		}
	}
}

class runOverlay {
	static init() {
		$(document).ready(() => {
			$("#svgBlockOverlay").mousedown(() => {
				$("#svgBlockOverlay").css("opacity", 0.5);
				yesNoAlert("Do you want to terminate the simulation now to change the model?", function (answer) {
					$("#svgBlockOverlay").css("opacity", 0);
					if (answer == "yes") {
						RunResults.resetSimulation();
					}
				});

			});
		});
	}
	static block() {
		unselect_all();
		$("#svgBlockOverlay").show();
	}
	static unblock() {
		$("#svgBlockOverlay").hide();
	}
}
runOverlay.init();

