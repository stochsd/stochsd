class NewModelDialog extends jqDialog {
	// This dialog is not used.
	// At start TimeUnitDialog is used instead 
	constructor() {
		super();
		this.setTitle("New model");
	}
	beforeShow() {
		this.setHtml(`
		<table class="modern-table zebra">
		<tr>
			<td>Time units</td>
			<td style="padding:1px;">
				<input class="input-timeunits enter-apply" name="length" style="width:100px;" value="" type="text">
				<!--
				<button class="input-timeunits-default-value" data-default-value="Years">Years</button>
				<button class="input-timeunits-default-value" data-default-value="Minutes">Minutes</button>
				-->
			</td>
		</tr>
		</table>
		`);
		this.bindEnterApplyEvents();

		$(this.dialogContent).find(".input-timeunits-default-value").click((event) => {
			let selectedUnit = $(event.target).data("default-value");
			$(this.dialogContent).find(".input-timeunits").val(selectedUnit);
			this.makeApply();
		});
	}
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			"Create": () => {
				this.makeApply();
			}
		};
	}
	beforeClose() {
		// If the users closes the window without choosing anything
		// We currently does not use default values for this
		// if($(this.dialogContent).find(".input-timeunits").val().trim()=="") {
		// 	setTimeUnits("tu");
		//	ToolBox.updateTimeUnitButton();
		//}
	}
	makeApply() {
		let timeUnits = $(this.dialogContent).find(".input-timeunits").val();
		if (!isTimeUnitOk(timeUnits.trim())) {
			xAlert("You have to enter a time unit for the model, e.g. Years or Minutes");
			return;
		}
		setTimeUnits(timeUnits);
		ToolBox.updateTimeUnitButton();

		$(this.dialog).dialog('close');
	}
}


class PreferencesDialog extends jqDialog {
	constructor() {
		super();
		this.setTitle("Preferences");
	}
	beforeShow() {
		const preferences = Preferences.get()
		this.setHtml(`<div class="preferences">${Object.entries(preferencesTemplate).map(([key, info]) => {
			const id = "preference-" + key
			return `<div class="preference">
				<div style="display: flex; justify-content: space-between;">
					<span class="title">${info.title}</span>
					<button class="btn_reset" id="reset-${key}" >Reset</button>
				</div>
				${info.type == "boolean"
					? `<div>
					<input id="${id}" name="${key}" type="checkbox" ${checkedHtml(preferences[key])}>
					<label for="${id}">${info.description}<label/>
				</div>`
					: ""}
				${info.image ? `<img id="image-${key}" src="${this.imageSrc(info, preferences[key])}"/>` : ""}
			</div>`
		}).join("")}`)
		Object.entries(preferencesTemplate).forEach(([key, info]) => {
			const input = $(this.dialogContent).find("#preference-" + key)
			const updateImage = () => {
				if (info.image)
					$(this.dialogContent).find(`#image-${key}`).attr("src", this.imageSrc(info, input.is(":checked")))
			}
			input.on("change", updateImage)
			$(this.dialogContent).find(`#reset-${key}`).on("click", () => {
				if (info.type == "boolean")
					input.prop("checked", info.default)
				updateImage()
			})
		})
	}
	imageSrc(info, value) {
		if (typeof info.image == "string")
			return info.image
		return value ? info.image.on : info.image.off
	}
	makeApply() {
		const preferences = Preferences.get()
		Object.entries(preferencesTemplate).forEach(([key, info]) => {
			const element = $(this.dialogContent).find("#preference-" + key)
			const value = info.type == "boolean" ? element.is(":checked") : undefined
			preferences[key] = value
		})
		Preferences.store(preferences)
	}
}

class SimulationSettings extends jqDialog {
	constructor() {
		super();
		this.setTitle("Simulation Settings");
	}
	beforeShow() {
		let start = getTimeStart();
		let length = getTimeLength();
		let step = getTimeStep();
		let timeUnit = getTimeUnits();
		this.setHtml(`
		<table class="modern-table zebra">
		<tr>
			<td>Start Time</td>
			<td style="padding:1px;">
				<input class="input-start enter-apply" name="start" style="width:100px;" value="${start}" type="number">
				&nbsp ${timeUnit} &nbsp
			</td>
		</tr><tr>
			<td>Length</td>
			<td style="padding:1px;">
				<input class="input-length enter-apply" name="length" style="width:100px;" value="${length}" type="number">
				&nbsp ${timeUnit} &nbsp
			</td>
		</tr><tr>
			<td>Time Step</td>
			<td style="padding:1px;">
				<input class="input-step enter-apply" name="step" style="width:100px;" value="${step}" type="number">
				&nbsp ${timeUnit} &nbsp
			</td>
		</tr><tr>
			<td>Method</td>
			<td style="padding:1px;"><select class="input-method enter-apply" style="width:104px">
			<option value="RK1" ${(getAlgorithm() == "RK1") ? "selected" : ""}>Euler</option>
			<option value="RK4" ${(getAlgorithm() == "RK4") ? "selected" : ""}>RK4</option>
			</select></td>
		</tr>
		</table>
		<div class="simulation-settings-warning"></div>
		`);

		this.bindEnterApplyEvents();

		this.start_field = $(this.dialogContent).find(".input-start");
		this.length_field = $(this.dialogContent).find(".input-length");
		this.step_field = $(this.dialogContent).find(".input-step");
		this.warning_div = $(this.dialogContent).find(".simulation-settings-warning");
		this.method_select = $(this.dialogContent).find(".input-method");

		this.start_field.keyup(() => this.checkValidTimeSettings());
		this.length_field.keyup(() => this.checkValidTimeSettings());
		this.step_field.keyup(() => this.checkValidTimeSettings());
		this.method_select.change(() => this.checkValidTimeSettings());

		this.checkValidTimeSettings();
	}

	checkValidTimeSettings() {
		if (isNaN(this.start_field.val()) || this.start_field.val().trim() === "") {
			this.warning_div.html(warningHtml(`Start <b>${this.start_field.val()}</b> is not a decimal number.`, true));
			return false;
		} else if (isNaN(this.length_field.val()) || this.length_field.val().trim() === "") {
			this.warning_div.html(warningHtml(`Length <b>${this.length_field.val()}</b> is not a decimal number.`, true));
			return false;
		} else if (isNaN(this.step_field.val()) || this.step_field.val().trim() === "") {
			this.warning_div.html(warningHtml(`Step <b>${this.step_field.val()}</b> is not a decimal number.`, true));
			return false;
		} else if (Number(this.length_field.val()) <= 0) {
			this.warning_div.html(warningHtml(`Length must be &gt;0`, true));
			return false;
		} else if (Number(this.step_field.val()) <= 0) {
			this.warning_div.html(warningHtml(`Step must be &gt;0`, true));
			return false;
		} else if (Settings.limitSimulationSteps && Number(this.length_field.val()) / Number(this.step_field.val()) > 1e5) {
			let iterations = Math.ceil(Number(this.length_field.val()) / Number(this.step_field.val()));
			let iters_str = format_number(iterations, { use_e_format_upper_limit: 1e5, precision: 3 });
			this.warning_div.html(warningHtml(`
				This Length requires ${iters_str} time steps. <br/>
				The limit is 10<sup>5</sup> time steps per simulation.
			`, true));
			return false;

		} else if (Settings.limitSimulationSteps && Number(this.length_field.val()) / Number(this.step_field.val()) > 1e4) {
			let iterations = Math.ceil(Number(this.length_field.val()) / Number(this.step_field.val()));
			let iters_str = format_number(iterations, { use_e_format_upper_limit: 1e4, precision: 3 });
			this.warning_div.html(noteHtml(`
				This Length requires ${iters_str} time steps. <br/>
				More than 10<sup>4</sup> time steps per simulation <br/>
				may significantly slow down the simulation.`
			));
			return true;
		} else if ($(this.method_select).find(":selected").val() === "RK4") {
			this.warning_div.html(noteHtml(`
				Do not use RK4 without a good reason, <br/>
				and NEVER if the model contains discontinuities <br/>
				(e.g. <b>Pulse</b>, <b>Step</b> or <b>Random numbers</b>)!
			`));
			return true;
		}

		this.warning_div.html("");
		return true;
	}

	makeApply() {
		let validSettings = this.checkValidTimeSettings();
		if (validSettings) {
			setTimeStart(this.start_field.val());
			setTimeLength(this.length_field.val());
			setTimeStep(this.step_field.val());
			let method = $(".input-method :selected").val();
			setAlgorithm(method);
			if (RunResults.runState == "none" || RunResults.runState == "stopped") {
				RunResults.updateProgressBar();
			}
		}
	}
}

class TimeUnitDialog extends jqDialog {
	constructor() {
		super();
		this.validName = false;
		this.setTitle("Set Time Unit");
		this.setHtml(`
			<div style="min-height: 70px; margin: 8px 0px;">
				Specify the Time Unit to enable model building.</br></br>
				<div style="display: flex; justify-content: space-between; width: 100%; align-items: baseline;">
					<b>Time Unit:</b><span>${this.renderHelpButtonHtml("timeunit-help")}</span>
				</div>
				<input class="timeunit-field enter-apply" style="width:100%; box-sizing: border-box;" type="text"/>
				<div style="margin-top: 4px;" class="complain-div"></div>
			</div>
		`);

		this.setHelpButtonInfo("timeunit-help", "Time Unit Help", `<div style="max-width: 400px;">
			<p>It is crucial to be consistent and choose one, and only one, time unit across the model. The time unit can e.g. be second, minute, hour, day, week, month, year, century, or whatever you choose. For a generic model you can specify it as e.g. "Time Unit", "t.u." or "tu".</p>
			<b>Key bindings:</b>
			<ul style="margin: 0.5em 0;">
				<li>${keyHtml("Esc")} &rarr; Cancels changes</li>
				<li>${keyHtml("Enter")} &rarr; Applies changes</li>
			</ul>
		</div>
		`)

		$(this.dialogContent).find(".timeunit-field").keyup((event) => {
			this.showComplain(this.checkValid());
		});
		$(this.dialogContent).find(".enter-apply").keydown(event => {
			if (event.key === "Enter") {
				event.preventDefault();
				this.dialogParameters.buttons["Apply"]();
			}
		});
	}
	beforeShow() {
		$(this.dialogContent).find(".timeunit-field").val(getTimeUnits());
	}
	afterShow() {
		$(this.dialog).find(".timeunit-field").get(0).focus();
	}
	checkValid() {
		let value = $(this.dialogContent).find(".timeunit-field").val();
		return isTimeUnitOk(value);
	}
	showComplain(ok) {
		let complainDiv = $(this.dialogContent).find(".complain-div");
		if (ok) {
			complainDiv.html("");
		} else {
			complainDiv.html(warningHtml(`Time Unit must contain character A-Z or a-z.`));
		}
	}
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			"Apply": (event) => {
				if (this.checkValid()) {
					let timeUnit = $(this.dialogContent).find(".timeunit-field").val();
					setTimeUnits(timeUnit);
					$(this.dialog).dialog('close');
					ToolBox.updateTimeUnitButton();
					History.storeUndoState();
				} else {
					this.showComplain(this.validName);
				}
			}
		};
	}
}


