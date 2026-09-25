class InfoBar {

	static init() {
		this.infoDefinitionElement = $(".info-bar__definition")[0];
		this.cmInfoDef = new CodeMirror(this.infoDefinitionElement,
			{
				mode: "stochsd-dynamic-mode",
				theme: "stochsdtheme oneline",
				readOnly: "nocursor",
				lineWrapping: false
			}
		);
		this.infoRestricted = $(".info-bar__definition-restricted");
		this.infoDE = $(".info-bar__definition-error");
		$(this.infoDefinitionElement).find(".CodeMirror").css("border", "none");
		InfoBar.update()
		ToolBox.updateButtons()
	}
	static setRestricted(isRestricted, primName) {
		// this.infoRestricted.html(isRestricted ? `<b>(${primName} ≥ 0)<b>` : "" );
		this.infoRestricted.html(isRestricted ? `(Restricted)` : "");
	}
	static update() {
		let selected = Visuals.selectedParents();

		if (selected.length == 0) {
			$(this.infoDefinitionElement).find(".CodeMirror").addClass("cm-comment")
			this.cmInfoDef.setValue("Nothing selected")
			this.infoDE.html("");
			this.setRestricted(false);
		} else if (selected.length == 1) {
			$(this.infoDefinitionElement).find(".CodeMirror").removeClass("cm-comment")
			let selected = selected[0];
			let primitive = selected[0].primitive;
			if (selected.is_ghost) {
				primitive = findID(primitive.getAttribute("Source"));
			}
			let name = primitive.getAttribute("name");
			let definition = getValue(primitive);
			this.infoDE.html(`${DefinitionError.getMessage(primitive)}`);

			let isRestricted = primitive.getAttribute("NonNegative") === "true" || primitive.getAttribute("OnlyPositive") === "true";
			this.setRestricted(isRestricted, name);

			let definitionLines = definition.split("\n");
			if (definitionLines[0] !== "") {
				this.cmInfoDef.setValue(`[${name}] = ${definitionLines[0]}`);
			} else {
				let type = selected.type;

				// Make first letter uppercase
				// let Type = type.charAt(0).toUpperCase() + type.slice(1); 
				let Type = type_basename[type];
				switch (type) {
					case "numberbox":
						let targetName = `${getName(findID(selected.primitive.getAttribute("Target")))}`
						this.cmInfoDef.setValue(`Numberbox: Value of [${targetName}]`);
						break;
					case "timeplot":
					case "compareplot":
					case "table":
					case "xyplot":
					case "histoplot":
						let names = selected.dialog.displayIdList.map(findID).filter(exist => exist).map(getName);
						this.cmInfoDef.setValue(`${Type}: ${names.map(name => ` [${name}]`)}`);
						break;
					case "link":
						let source = selected.getStartAttach() ? `[${getName(selected.getStartAttach().primitive)}]` : "NONE";
						let target = selected.getEndAttach() ? `[${getName(selected.getEndAttach().primitive)}]` : "NONE";
						this.cmInfoDef.setValue(`Link: ${source} -> ${target}`);
						break;
					default:
						this.cmInfoDef.setValue(`${Type} selected`);
				}
			}
		} else {
			$(this.infoDefinitionElement).find(".CodeMirror").removeClass("cm-comment")
			this.cmInfoDef.setValue(`${selected.length} objects selected`);
			this.infoDE.html("");
			this.setRestricted(false);
		}
	}
}

