var preferencesTemplate = {
	"promptTimeUnitDialogOnStart": {
		default: true,
		type: "boolean",
		title: "Prompt TimeUnitDialog on Startup",
		description: "Controls if the TimeUnitDialog is shown on startup."
	},
	"forceTimeUnit": {
		default: true,
		type: "boolean",
		title: "Force TimeUnit",
		description: "Controls if a TimeUnit must be set in order to edit."
	},
	// primitiveFontSize
	// showArgumentHelper
	// theme (classic/modern)
}

class Preferences {
	static setup() {
		const prefs = Preferences.get()
		Object.entries(preferencesTemplate).forEach(([key, info]) => {
			if (prefs[key] == undefined)
				prefs[key] = info.default
		})
		Preferences.store(prefs)
	}
	static get(key) {
		const prefsString = localStorage.getItem("preferences")
		const prefs = prefsString ? JSON.parse(prefsString) : {}
		return key ? prefs[key] : prefs
	}
	static set(key, value) {
		const prefs = Preferences.get()
		prefs[key] = value
		Preferences.store(prefs)
	}
	static store(object) {
		localStorage.setItem("preferences", JSON.stringify(object))
	}
}