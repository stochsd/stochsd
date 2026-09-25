class MacroDialog extends jqDialog {
	constructor() {
		super();
		this.setTitle("Macro");
		this.seed = "";
		this.setHtml(`
		<div style="display: flex;">
			<div style="min-width: 400px;" >
				<textarea class="macro-text enter-apply" cols="30" rows="10"></textarea>
			</div>
			<div style="padding:0; margin-left: 1em;">
				${this.renderHelpButtonHtml("macro-help")}
				<table class="modern-table zebra" title="SetRandSeed makes stochstics simulations reproducable." style="margin-top: 1em;">
					<tr>	
						<td style="padding:1px;">
							Seed = <input class="seed-field" type="number" />
						</td>
					</tr>
					<tr>
						<td>
							<button class="set-seed-button" disabled>SetRandSeed</button>
						</td>
					</tr>
				</table>
			</div>
		</div>
		`);

		this.setHelpButtonInfo("macro-help", "Macro Help", `<div style="max-width: 400px;">
			<p>Macros allow you to define code that can be used in the model. For example, you can here define your own functions, or set a seed value to make the simulation reproducible.</p>
			<b>Examples:</b>
			<div class="accordion">
				<h3>Define single-line function</h3>
				<div>
					<p class="example-code">
						myFn(a, b, c) &lt;- sin((a+b+c)/(a*b*c))
					</p>
				</div>
				<h3>Define multi-line function</h3>
				<div>
					<p class="example-code">
						Function myFn(a, b, c) <br/>
						x &lt;- (a+b+c) <br/>
						y &lt;- (a*b*c) <br/>
						return sin(x/y) <br/>
						End Function <br/>
					</p>
				</div>
				<h3>Set seed for reproducible stochastic simulations.</h3>
				<div>
					<p>To make a stochastic simulation model <i>reproducible</i>, you have to lock the <i>seed</i> for the random number generators in the model. Then the same sequences of random numbers will be generated for each simulation run. This can be done with the following line.</p>
					<div class="example-code">SetRandSeed(37)</div>
					<p>By changing the argument, you will get another (reproducible) simulation run.</p>
				</div>
			</div>
			<br/>
			<b>Key bindings (for macro text input):</b>
			<ul style="margin: 0.5em 0;">
				<li>${keyHtml("Esc")} &rarr; Cancels changes</li>
				<li>${keyHtml("Enter")} &rarr; Applies changes</li>
				<li>${keyHtml(["Shift", "Enter"])} &rarr; Adds new line</li>
			</ul>
		</div>`);

		this.cmMacroField = new CodeMirror.fromTextArea(document.getElementsByClassName("macro-text")[0],
			{
				mode: "stochsd-dynamic-mode",
				theme: "stochsdtheme resize",
				lineWrapping: false,
				lineNumbers: false,
				matchBrackets: true,
				extraKeys: {
					"Esc": () => {
						this.dialogParameters.buttons["Cancel"]();
					},
					"Enter": () => {
						this.dialogParameters.buttons["Apply"]();
					},
					"Ctrl-Space": "autocomplete"
				},
				hintOptions: {
					hint: (cm, options) => Autocomplete.getCompletions(cm, options, this.primitive)
				}
			}
		);
		this.cmMacroField.refresh()

		this.setSeedButton = $(this.dialogContent).find(".set-seed-button");
		$(this.dialogContent).find(".seed-field").keyup((event) => {
			this.seed = $(event.target).val();
			if (event.key === "Enter" && this.seed.length !== 0) {
				this.setSeedButton.click();
			} else {
				this.setSeedButton.attr("disabled", this.seed.length === 0);
			}
		});
		this.setSeedButton.click((event) => {
			const macro = this.cmMacroField.getValue();
			this.cmMacroField.setValue(`${macro}\nSetRandSeed(${this.seed})`);
			this.cmMacroField.focus();
		});
		this.bindEnterApplyEvents();
	}
	beforeShow() {
		this.cmMacroField.setValue(getMacros());
	}
	afterShow() {
		this.updateSize();
		this.cmMacroField.refresh()
	}
	resize() {
		this.updateSize();
	}
	updateSize() { }
	makeApply() {
		setMacros(this.cmMacroField.getValue());
	}
}

