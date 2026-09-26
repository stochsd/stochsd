class CrashRecoveryDialog extends jqDialog {
 	constructor(error) {
		super();
		this.error = error;
		this.setTitle("⚠️ Crash Recovery");
		this.setHtml(`<div class="">
			<p font-size="1.5rem;">StochSD unexpectedly crashed.</p>
			<button id="attempt-restore">Restore & Reload (Recommended)</button>
			<br/>
			<br/>
			<hr/>
			<details>
				<summary style="cursor: default;">Recover from an older state</summary>
				<p>Select a saved state to restore from.</p>
				<div style="display: flex; gap: 1rem;">
					<div style="display: flex; flex-direction: column; gap:0.5rem">
						<div><b>STATES</b></div>
						${History.undoStates.map((state, index) => ({state, index})).reverse().map(({state, index}) => {
							const step = index - History.undoIndex
							return `<div class="undo-state" data-index="${index}">
								<button class="undo-state-btn" data-index="${index}">Restore</button>
								${this.stepMessage(step)}
							</div>`}
						).join("")}
					</div>
					<div>
						<div><b>PREVIEW</b> (Simplified layout - might be inaccurate or missing)</div>
						<img class="state-preview" height="300px" style="border: 1px solid black;" />
					</div>
				</div>
			</details>
			<details>
				<summary style="cursor: default;">Error details: ${escapeHtml(errorSummary(this.error))}</summary>
				<button id="copy-error-details">Copy error details</button>
				<pre class="error-details" style="max-height: 300px; overflow: auto; white-space: pre-wrap; font-size: 0.8rem; background: #f4f4f4; padding: 0.5rem;">${escapeHtml(errorDetails(this.error))}</pre>
			</details>
		</div>`);
		this.bindEvents()
	}
	bindEvents() {
		const restoreButton = $(this.dialogContent).find("#attempt-restore")[0]
		restoreButton.addEventListener("click", () => {
			preserveRestart();
		})
		const copyButton = $(this.dialogContent).find("#copy-error-details")[0]
		copyButton.addEventListener("click", async () => {
			try {
				await navigator.clipboard.writeText(errorDetails(this.error))
				copyButton.textContent = "Copied"
			} catch (err) {
				copyButton.textContent = "Could not copy, select the text below instead"
			}
		})
		const undostatesButtons = $(this.dialogContent).find(".undo-state-btn")
		undostatesButtons.map(i => {
			const button = undostatesButtons[i];
			const index = $(button).data("index")
			button.addEventListener("click", () => {
				console.log("click restore", index)
				History.undoIndex = index;
				History.restoreUndoState();
				preserveRestart();
			})
		})
		const undoDivs = $(this.dialogContent).find(".undo-state")
		const previewImage = $(this.dialogContent).find(".state-preview")[0]
		undoDivs.map(i => {
			const divElement = undoDivs[i];
			const index = $(divElement).data("index")
			divElement.addEventListener("mouseover", () => {
				console.log("hover restore", index)
				previewImage.src = History.undoImages[index]
			})
		})
	}
	/** @param {number} step */
	stepMessage(step) {
		console.log(typeof step)
		const absoluteSteps = Math.abs(step)
		const stepString = absoluteSteps > 1 ? "Steps" : "Step"
		const direction = step < 0 ? "Back" : "Forward"
		if (step == 0) {
			return `Current`
		} else {
			return `${absoluteSteps} ${stepString} ${direction}`
		}
	}
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			// "Reload & Restore": () => {
			// 	preserveRestart();
			// },
		};
	}
}
/** @param {string} text */
function escapeHtml(text) {
	return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Anything can be thrown, not only errors, so this never throws itself
/** @param {unknown} value */
function describeThrown(value) {
	try {
		if (typeof value == "object" && value !== null) {
			return JSON.stringify(value, null, 2) ?? String(value);
		}
		return String(value);
	} catch (err) {
		return Object.prototype.toString.call(value);
	}
}

// One line describing the error, e.g. "TypeError: x is undefined"
/** @param {unknown} error */
function errorSummary(error) {
	if (error instanceof Error) {
		return `${error.name}: ${error.message}`;
	}
	return `Not an Error object: ${describeThrown(error)}`;
}

// Everything known about the error: name, message, stack, extra properties and the chain of causes
/** @param {unknown} error */
function errorDetails(error) {
	const lines = [
		`StochSD ${stochsd.version}`,
		`Time: ${new Date().toISOString()}`,
		`User agent: ${navigator.userAgent}`,
		`Undo state: ${History.undoIndex + 1} of ${History.undoStates.length}`,
		"",
	];
	const seen = new Set();
	const describe = (error, label, indent) => {
		const pad = " ".repeat(indent);
		if (seen.has(error)) {
			lines.push(`${pad}${label}: (circular reference to an error above)`);
			return;
		}
		if (!(error instanceof Error)) {
			lines.push(`${pad}${label}: ${errorSummary(error)}`);
			return;
		}
		seen.add(error);
		lines.push(`${pad}${label}: ${errorSummary(error)}`);
		// The stack usually starts with the summary line, which is already shown
		const stack = (error.stack ?? "").split("\n").filter(line => line.trim() && line.trim() != errorSummary(error).trim());
		lines.push(...(stack.length ? stack : ["(no stack trace)"]).map(line => `${pad}  ${line.trim()}`));
		// Extra properties such as code or fileName
		for (const key of Object.getOwnPropertyNames(error)) {
			if (!["name", "message", "stack", "cause", "errors"].includes(key)) {
				lines.push(`${pad}  ${key}: ${describeThrown(error[key])}`);
			}
		}
		if (error instanceof AggregateError) {
			error.errors.forEach((inner, i) => describe(inner, `Error ${i + 1} of ${error.errors.length}`, indent + 2));
		}
		if ("cause" in error) {
			describe(error.cause, "Caused by", indent);
		}
	};
	describe(error, "Crash", 0);
	return lines.join("\n");
}

/** @param {unknown} error  */
function handleCrash(error) {
	console.error(error)
	const dialog = new CrashRecoveryDialog(error)
	dialog.show()
}
