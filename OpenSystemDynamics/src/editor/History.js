class History {
	/** @type {string[]} */
	static undoImages = []
	/** @type {string[]} */
	static #undoStates = []
	static get undoStates() {
		return this.#undoStates
	}
	static set undoStates(value) {
		this.#undoStates = value
		this.#updateUndoRedoButtons()
	}
	static #undoIndex = -1
	static get undoIndex() {
		return this.#undoIndex
	}
	static set undoIndex(value) {
		this.#undoIndex = value
		this.#updateUndoRedoButtons()
	}
	static #updateUndoRedoButtons() {
		$("#btn_undo").prop("disabled", this.undoStates.length == 0 || this.undoIndex == 0)
		$("#btn_redo").prop("disabled", this.undoStates.length == 0 || this.undoIndex == this.undoStates.length - 1)
	}
	static addUndoImage() {
		const divBackground = $("#svgplanebackground")[0]
		const width = divBackground.clientWidth
		const height = divBackground.clientHeight
		const svgElement = $("#svgplane")[0]
		const image = convertSvgToBase64(svgElement, 0, 0, width, height);
		this.undoImages.push(image)
	}

	static init() {
		// We define this.undoIndex as pointing to the currently active undoState
		// If we are at the first step with no undo-states behind it is -1
		this.undoStates = [];
		this.undoIndex = -1;
		this.lastUndoState = "";
		this.undoLimit = 10;

		// Tells if the last state is saved to file
		// This is used for determining if the program should ask about saving
		History.unsavedChanges = false;

	}

	static storeUndoState() {
		// Create new XML for state
		let InsightMakerDocumentWriter = new InsightMakerDocument();
		InsightMakerDocumentWriter.appendPrimitives();
		let undoState = InsightMakerDocumentWriter.getXmlString();

		// Add to undo history if it is different then previous state
		if (this.lastUndoState != undoState) {
			// Preserves only states from 0 to undoIndex
			this.undoStates.splice(this.undoIndex + 1);
			this.undoImages.splice(this.undoIndex + 1);

			this.undoStates.push(undoState);
			this.addUndoImage()
			this.undoIndex = this.undoStates.length - 1;
			this.lastUndoState = undoState;
			this.unsavedChanges = true;

			if (this.undoLimit < this.undoStates.length) {
				this.undoStates = this.undoStates.slice(this.undoStates.length - this.undoLimit);
				this.undoImages = this.undoImages.slice(this.undoImages.length - this.undoLimit);
				this.undoIndex = this.undoStates.length - 1;
			}
		}
	}

	static forceCustomUndoState(newState) {
		this.undoStates = [];
		this.undoStates.push(newState);
		this.addUndoImage()
		this.undoIndex = 0;
		this.lastUndoState = newState;
		this.unsavedChanges = false;
	}

	static doUndo() {
		if (this.undoIndex > 0) {
			this.undoIndex--;
			this.restoreUndoState();
		} else {
			xAlert("No more undo");
		}
	}

	static doRedo() {
		if (this.undoIndex < this.undoStates.length - 1) {
			this.undoIndex++;
			this.restoreUndoState();
		} else {
			xAlert("No more redo");
		}
	}

	static getCurrentState() {
		return this.undoStates[this.undoIndex];
	}

	static debug() {
		console.error("undo index " + this.undoIndex);
		console.error("history length " + this.undoStates.length);
		console.error(this.undoStates);
	}

	static restoreUndoState() { 
		try {
			this.lastUndoState = this.undoStates[this.undoIndex];
			loadModelFromXml(this.lastUndoState);
		} catch (err) {
			handleCrash(err)
		}
	}

	static clearUndoHistory() {
		this.undoStates = [];
		this.undoIndex = -1;
	}

	static toLocalStorage() {
		localStorage.setItem("undoState_length", this.undoStates.length);

		for (let i in this.undoStates) {
			let state = this.undoStates[i];
			localStorage.setItem("undoState_" + i, state);
		}

		localStorage.setItem("undoIndex", this.undoIndex);
	}

	static fromLocalStorage() {
		this.clearUndoHistory();
		let undoState_length = localStorage.getItem("undoState_length");
		for (let i = 0; i < undoState_length; i++) {
			let state = localStorage.getItem("undoState_" + i);
			this.undoStates.push(state);
			this.addUndoImage()
		}
		this.undoIndex = localStorage.getItem("undoIndex");
		this.restoreUndoState();
	}
}
History.init();

