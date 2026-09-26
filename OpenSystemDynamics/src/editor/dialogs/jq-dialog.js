class jqDialog {
	static init() {
		// This is a static attribute that prevents delete key etc to be relevant when a dialog is open
		jqDialog.blockingDialogOpen = false;
	}
	constructor(title = null, contentHTML = null, size = null) {
		this.dialog = null;

		this.contentHTML = "Empty dialog";
		this.title = "Title";
		this.size = [600, 400];

		if (contentHTML) {
			this.contentHTML = contentHTML;
		}
		if (title) {
			this.title = title;
		}
		if (size) {
			this.size = size;
		}

		this.visible = false;
		// Decides if we this dialog should lock the background
		this.modal = true;
		let frm_dialog_resize = true;

		this.dialogDiv = document.createElement("div");
		this.dialogDiv.setAttribute("title", this.title);
		this.dialogDiv.setAttribute("style", "font-size: 13px; display: inline-block");
		this.dialogDiv.style.display = "none";

		this.dialogContent = document.createElement("div");
		this.dialogContent.innerHTML = this.contentHTML;

		this.dialogDiv.appendChild(this.dialogContent);
		document.body.appendChild(this.dialogDiv);

		this.dialogContent.setAttribute("style", "display: inline-block");


		this.dialogParameters = {
			autoOpen: false,
			modal: this.modal, // Adds overlay on background
			resizable: false,
			resize: (event, ui) => {
				this.resize(event, ui);
			},
			resizeStart: (event, ui) => {
				this.resizeStart(event, ui);
			},
			resizeStop: (event, ui) => {
				this.resizeStop(event, ui);
			},
			position: {
				my: "center",
				at: "center",
				of: window
			},
			beforeClose: () => {
				this.beforeClose();
			},
			close: () => {
				this.visible = false;
				jqDialog.blockingDialogOpen = false;
				this.afterClose();
			},
			width: this.size[0],
			height: this.size[1],
			open: (event, ui) => {
				if (this.dialogParameters.modal) {
					jqDialog.blockingDialogOpen = true;
				}

				let windowWidth = $(window).width();
				let windowHeight = $(window).height();
				$(event.target).css("maxWidth", (windowWidth - 50) + "px");
				$(event.target).css("maxHeight", (windowHeight - 50) + "px");
			}
		};
		this.dialogParameters.buttons = {
			"Cancel": () => {
				$(this.dialog).dialog('close');
			},
			"Apply": () => {
				this.applyChanges();
			}
		};
		this.dialogParameters.width = "auto";
		this.dialogParameters.height = "auto";
		this.beforeCreateDialog();
		this.dialog = $(this.dialogDiv).dialog(this.dialogParameters);
	}
	bindEnterApplyEvents() {
		$(this.dialogContent).find(".enter-apply").keydown(event => {
			if (!event.shiftKey) {
				if (event.key === "Enter") {
					event.preventDefault();
					this.applyChanges();
				}
			}
		});
	}
	renderHelpButtonHtml(helpId) {
		return (`<button id="${helpId}" class="help-button enter-apply" tabindex="-1" >
			?
		</button>`);
	}

	setHelpButtonInfo(helpId, title, contentHTML) {
		$(this.dialogContent).find(`#${helpId}`).off();
		$(this.dialogContent).find(`.enter-apply#${helpId}`).keydown(event => {
			if (!event.shiftKey) {
				if (event.key === "Enter") {
					event.preventDefault();
					this.applyChanges();
				}
			}
		});
		$(this.dialogContent).find(`#${helpId}`).click(event => {
			let dialog = new XAlertDialog(contentHTML);
			$(dialog.dialogContent).find(".accordion").accordion({
				heightStyle: "content",
				active: false,
				header: "h3",
				collapsible: true
			});
			dialog.setTitle(title);
			dialog.show();
		})
	}

	applyChanges() {
		this.makeApply();
		$(this.dialog).dialog('close');
		// We add a delay to make sure we closed first

		setTimeout(() => {
			History.storeUndoState();
			InfoBar.update();
			ToolBox.updateButtons();
		}, 200);
	}
	makeApply() {

	}
	getWidth() {
		return this.dialog.width();
	}
	getHeight() {
		return this.dialog.height();
	}
	resize(event, ui) {

	}
	resizeStart(event, ui) {

	}
	resizeStop(event, ui) {

	}
	beforeCreateDialog() {

	}
	beforeClose() {

	}
	afterClose() {

	}
	beforeShow() {

	}
	afterShow() {

	}
	show() {
		this.beforeShow();
		this.dialog.dialog("open");
		this.visible = true;
		this.afterShow();
	}
	setTitle(newTitle) {
		this.title = newTitle;
		this.dialog.dialog("widget").find(".ui-dialog-title").html(newTitle);
	}
	getTitle() {
		return this.title;
	}
	setHtml(newHtml) {
		this.dialogContent.innerHTML = newHtml;
	}
	getHtml() {
		return this.dialogContent.innerHTML;
	}
}
// Needed for the static init of this class
jqDialog.init();


/** 
 * @typedef {Object} Primitive
 * @property {string} type - Type of primitive, e.g. "Stock", "Flow", "Variable", "Converter", "Ghost", "Link"
 * @property {string} id - Unique identifier for the primitive
 * @property {Element} value - The XML Element representing the primitive
 * @property {(name: string) => any} getAttribute - Function to get an attribute value by name
 * @property {(name: string, value: any) => void} setAttribute - Function to set an attribute value by name
 * */

/**
 * @returns {Primitive[]} - Returns a list of all primitives of type "Stock", "Flow", "Variable", and "Converter"
 */
function getPrimitiveList() {
	const primitiveList = primitives("Stock").concat(primitives("Flow")).concat(primitives("Variable")).concat(primitives("Converter"));
	return primitiveList;
}

class XAlertDialog extends jqDialog {
	/** @param {string} message @param {() => void} closeHandler */
	constructor(message, closeHandler = null) {
		super();
		this.setTitle("Alert");
		this.message = message;
		this.setHtml(message);
		this.closeHandler = closeHandler;
	}
	afterClose() {
		if (this.closeHandler) {
			this.closeHandler();
		}
	}
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			"OK": () => {
				$(this.dialog).dialog('close');
			}
		};
	}
}
function xAlert(message, closeHandler) {
	let dialog = new XAlertDialog(message, closeHandler);
	dialog.show();
}

class YesNoDialog extends jqDialog {
	constructor(message, closeHandler) {
		super();
		this.setTitle("");
		this.message = message;
		this.setHtml(message);
		this.closeHandler = closeHandler;
		this.answer = "no";
	}
	afterClose() {
		if (this.closeHandler) {
			this.closeHandler(this.answer);
		}
	}
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			"Yes": () => {
				this.answer = "yes";
				$(this.dialog).dialog('close');
			},
			"No": () => {
				this.answer = "no";
				$(this.dialog).dialog('close');
			}
		};
	}
}
function yesNoAlert(message, closeHandler) {
	let dialog = new YesNoDialog(message, closeHandler);
	dialog.show();
}

class YesNoCancelDialog extends jqDialog {
	constructor(message, closeHandler) {
		super();
		this.setTitle("");
		this.message = message;
		this.setHtml(message);
		this.closeHandler = closeHandler;
		this.answer = "cancel";
	}
	afterClose() {
		if (this.closeHandler) {
			this.closeHandler(this.answer);
		}
	}
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			"Yes": () => {
				this.answer = "yes";
				$(this.dialog).dialog('close');
			},
			"No": () => {
				this.answer = "no";
				$(this.dialog).dialog('close');
			},
			"Cancel": () => {
				this.answer = "cancel";
				$(this.dialog).dialog('close');
			}
		};
	}
}
function yesNoCancelAlert(message, closeHandler) {
	let dialog = new YesNoCancelDialog(message, closeHandler);
	dialog.show();
}

function saveChangedAlert(continueHandler) {
	// If we have no unsaved changes we just continue directly	
	if (!History.unsavedChanges) {
		continueHandler();
		return;
	}
	// Else ask if we want to save first
	yesNoCancelAlert("You have unsaved changes. Do you want to save first?", function (answer) {
		switch (answer) {
			case "yes":
				fileManager.finishedSaveHandler = continueHandler;
				fileManager.saveModel();
				break;
			case "no":
				continueHandler();
				break;
			case "cancel":
				break;
		}
	});
}

