class TextAreaDialog extends DisplayDialog {
	constructor(id) {
		super(id);
		this.setTitle("Text");
		this.setHtml(`<div style="height: 100%;">
			<div style="display: flex; justify-content: space-between; width: 100%; align-items: baseline;">
					<b>Text:</b><span>${this.renderHelpButtonHtml("text-help")}</span>
			</div>
			<textarea class="text enter-apply" style="resize: none;"></textarea>
			<div class="vertical-space"></div>
			<table class="modern-table zebra"><tr title="Only hides when there is any text.">
				<td>Hide frame when there is text:</td>
				<td><input type="checkbox" class="hide-frame-checkbox enter-apply" /></td>
			</tr></table>
		</div>`);

		this.setHelpButtonInfo("text-help", "Text Help", `<div style="max-width: 400px;">
			<b>Key bindings:</b>
			<ul style="margin: 0.5em 0;">
				<li>${keyHtml("Esc")} &rarr; Cancels changes</li>
				<li>${keyHtml("Enter")} &rarr; Applies changes</li>
				<li>${keyHtml(["Shift", "Enter"])} &rarr; Adds new line</li>
			</ul>
		</div>`);

		this.textArea = $(this.dialogContent).find(".text");
		this.hideFrameCheckbox = $(this.dialogContent).find(".hide-frame-checkbox");
		this.bindEnterApplyEvents();
	}
	beforeShow() {
		let oldText = getName(this.primitive);
		this.textArea.val(oldText);
		this.hideFrameCheckbox.prop("checked", this.primitive.getAttribute("HideFrame") === "true");
		$(this.dialogContent).find(".text").focus();
	}
	afterShow() {
		this.updateSize();
	}
	resize() {
		this.updateSize();
	}
	updateSize() {
		let width = this.getWidth();
		let height = this.getHeight();
		this.textArea.width(width - 10);
		this.textArea.height(height - 70);
	}
	beforeCreateDialog() {
		this.dialogParameters.width = "500";
		this.dialogParameters.height = "400";
	}
	makeApply() {
		let newText = $(this.dialogContent).find(".text").val();
		setName(this.primitive, newText);
		this.primitive.setAttribute("HideFrame", this.hideFrameCheckbox.prop("checked"));
	}
}

