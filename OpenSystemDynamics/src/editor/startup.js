function showDebug() {
	$("#btn_debug").show();
}

function hashUpdate() {
	if (location.hash == "#debug") {
		showDebug();
	}
}


// https://stackoverflow.com/questions/7083693/detect-if-page-has-finished-loading
// Initilzing without everything load = $(document).ready caused bugs. $(window).load solves this
$(window).load(function () {
	$("a").click((e) => {
		// Important to use "currentTarget" instead of "target", because sometimes
		// the <a> element is outside a <button>
		// .currentTarget will point to the <a> but .target will point to the <button>
		let url = e.currentTarget.href;
		if (environment.openLink(url)) {
			e.preventDefault();
		}
	});
	DragAndDrop.init();
	SVG.init()
	MousePan.init()
	RectSelector.init();
	Preferences.setup();

	$(".tool-button").mousedown(function (event) {
		let toolName = $(this).attr("data-tool");
		ToolBox.setTool(toolName, event.which);
	});

	$(window).bind('hashchange', hashUpdate);
	hashUpdate();

	if (Settings.showDebug) {
		showDebug();
	}

	$(document).keydown(function (event) {
		// Only works if no dialog is open
		if (jqDialog.blockingDialogOpen) {
			return;
		}
		if (event.key == "Delete") {
			DeleteTool.enterTool();
		}
		let moveSize = 2;
		if (event.shiftKey) {
			moveSize = 16;
		}
		if (event.key == "ArrowLeft") {
			MouseTool.mouseMove(mouse.downX - moveSize, mouse.downY, false);
			event.preventDefault();
		}
		if (event.key == "ArrowUp") {
			MouseTool.mouseMove(mouse.downX, mouse.downY - moveSize, false);
			event.preventDefault();
		}
		if (event.key == "ArrowRight") {
			MouseTool.mouseMove(mouse.downX + moveSize, mouse.downY, false);
			event.preventDefault();
		}
		if (event.key == "ArrowDown") {
			MouseTool.mouseMove(mouse.downX, mouse.downY + moveSize, false);
			event.preventDefault();
		}
		if (event.ctrlKey) {
			if (event.key == "1" || event.key.toLowerCase() == "r") {
				event.preventDefault();
				RunTool.enterTool();
			}
			if (event.key == "2") {
				event.preventDefault();
				StepTool.enterTool();
			}
			if (event.key == "3") {
				event.preventDefault();
				ResetTool.enterTool();
			}
			if (event.key.toLowerCase() == "o") {
				event.preventDefault();
				$("#btn_load").click();
			}
			if (event.key.toLowerCase() == "s") {
				event.preventDefault();
				$("#btn_save").click();
			}
			if (event.key.toLowerCase() == "p") {
				event.preventDefault();
				$("#btn_print_model").click();
			}
			if (event.key.toLowerCase() == "a") {
				for (let visual of Visuals.onePointers()) { visual.select(); }
				for (let visual of Visuals.twoPointers()) { visual.select(); }
			}
			if (event.key.toLowerCase() == "z") {
				History.doUndo();
			}
			if (event.key.toLowerCase() == "y") {
				History.doRedo();
			}
			if (event.key.toLowerCase() == "c") {
				// Clipboard.copy();
			}
			if (event.key.toLowerCase() == "v") {
				// Clipboard.paste();
				// History.storeUndoState();
			}
		}
		environment.keyDown(event);
	});

	$(SVG.svgElement).mousedown(mouseDownHandler);
	SVG.svgElement.addEventListener('contextmenu', function (event) {
		event.preventDefault();
		return false;
	}, false);
	// the mousemove and mouseup event needs to be attached to the html to allow swipping the mouse outside
	$("html").mousemove(mouseMoveHandler);
	$("html").mouseup(mouseUpHandler);
	ToolBox.setTool("mouse");
	$("#btn_file").click(async function () {
		await updateRecentsMenu();
	});
	$("#btn_new").click(function () {
		saveChangedAlert(function () {
			fileManager.newModel();
		});
	});
	$("#btn_load").click(function () {
		saveChangedAlert(function () {
			fileManager.loadModel();
		});
	});
	$("#btn_save").click(function () {
		History.storeUndoState();
		fileManager.saveModel();
	});
	$("#btn_save_as").click(function () {
		History.storeUndoState();
		fileManager.saveModelAs();
	});
	$("#btn_recent_clear").click(function () {
		yesNoAlert("Are you sure you want to clear Recent List?", (answer) => {
			if (answer === "yes") {
				fileManager.clearRecent();
			}
		});
	});
	$("#btn_simulation_settings").click(function () {
		simulationSettings.show();
	});
	$("#progress-bar").dblclick(function () {
		simulationSettings.show();
	})
	$("#btn_equation_list").click(function () {
		equationList.show();
	});
	$("#btn_print_model").click(function () {
		printDiagram();
	});
	$("#btn_black").click(function () {
		setColorToSelection("black");
	});
	$("#btn_grey").click(function () {
		setColorToSelection("silver");
	});
	$("#btn_red").click(function () {
		setColorToSelection("red");
	});
	$("#btn_deeppink").click(function () {
		setColorToSelection("deeppink");
	});
	$("#btn_brown").click(function () {
		setColorToSelection("brown");
	});
	$("#btn_orange").click(function () {
		setColorToSelection("orange");
	});
	$("#btn_gold").click(function () {
		setColorToSelection("gold");
	});
	$("#btn_olive").click(function () {
		setColorToSelection("olive");
	});
	$("#btn_green").click(function () {
		setColorToSelection("green");
	});
	$("#btn_teal").click(function () {
		setColorToSelection("teal");
	});
	$("#btn_blue").click(function () {
		setColorToSelection("blue");
	});
	$("#btn_purple").click(function () {
		setColorToSelection("purple");
	});
	$("#btn_magenta").click(function () {
		setColorToSelection("magenta");
	});
	$("#btn_macro").click(function () {
		macroDialog.show();
	});
	$("#btn_debug").click(function () {
		debugDialog.show();
	});
	$("#btn_about").click(function () {
		aboutDialog.show();
	});
	$("#btn_preferences").click(function () {
		preferencesDialog.show();
	});
	$("#btn_fullpotentialcss").click(function () {
		fullPotentialCssDialog.show();
	});
	$("#btn_license").click(function () {
		licenseDialog.show();
	});
	$("#btn_thirdparty").click(function () {
		thirdPartyLicensesDialog.show();
	});
	$("#btn_restart").click(function () {
		saveChangedAlert(function () {
			applicationReload();
		});
	});
	$("#btn_preserve_restart").click(function () {
		preserveRestart();
	});
	$(".btn_load_plugin").click((event) => {
		let pluginName = $(event.target).data("plugin-name");
		loadPlugin(pluginName);
	});
	$("#btn_timeunit").click(function () {
		timeUnitDialog.show();
	})
	if (fileManager.hasSaveAs()) {
		$("#btn_save_as").show();
	}
	if (fileManager.hasRecentFiles()) {
		for (let i = 0; i < Settings.MaxRecentFiles; i++) {
			$(`#btn_recent_${i}`).click(async function (event) {
				saveChangedAlert(async function () {
					let recentIndex = parseInt(event.currentTarget.getAttribute("data-recent-index"));
					await fileManager.loadRecentByIndex(recentIndex);
					setTimeout(() => {
						ToolBox.updateTimeUnitButton();
						InfoBar.update();
						ToolBox.updateButtons();
					}, 200);
				});
			});
		}
	}
	macroDialog = new MacroDialog();
	definitionEditor = new DefinitionEditor();
	converterDialog = new ConverterDialog();
	preferencesDialog = new PreferencesDialog();
	simulationSettings = new SimulationSettings();
	timeUnitDialog = new TimeUnitDialog();
	equationList = new EquationListDialog();
	debugDialog = new DebugDialog();
	aboutDialog = new AboutDialog();
	fullPotentialCssDialog = new FullPotentialCSSDialog();
	thirdPartyLicensesDialog = new ThirdPartyLicensesDialog();
	licenseDialog = new LicenseDialog();

	// When the program is fully loaded we create a new model
	//~ fileManager.newModel();

	nwController.ready();
	environment.ready();
	fileManager.ready();
	restoreAfterRestart();
	RunResults.updateProgressBar();
	ToolBox.updateTimeUnitButton();

	History.unsavedChanges = false;
	InfoBar.init();
});

