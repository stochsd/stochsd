var preferences = {
    "promptTimeUnitDialogOnStart": {default: true, type: "bool", title: "Prompt TimeUnitDialog on Startup", description: "Controls if the TimeUnitDialog is shown on startup."},
    "forceTimeUnit": {default: true, type: "bool", title: "Force TimeUnit", description: "Controls if a TimeUnit must be set in order to edit."},
    // primitiveFontSize
    // showArgumentHelper
    // theme (classic/modern)
}

// Store values in localStorage
preferences.prototype.setValue = () => {}
preferences.prototype.getValue = () => {}