var preferencesTemplate = {
	"promptTimeUnitDialogOnStart": {
		category: "TimeUnit",
		default: true,
		type: "boolean",
		title: "Prompt TimeUnitDialog on Startup",
		description: "Controls if the TimeUnitDialog is shown on startup."
	},
	"forceTimeUnit": {
		category: "TimeUnit",
		default: true,
		type: "boolean",
		title: "Force TimeUnit",
		description: "Controls if a TimeUnit must be set in order to edit."
	},
	"showFunctionHelper": {
		category: "DefinitionEditor",
		default: false,
		type: "boolean",
		title: "Show Function Helper",
		description: "Show help in DefinitionEditor depending on cursor position. (Experimental feature)",
		image: "./graphics/showArgumentHelper.png",
	},
	"showConverterPlotPreview": {
		category: "ConverterEditor",
		default: true,
		type: "boolean",
		title: "Show Converter Plot Preview",
		description: "Show Converter Plot Preview while editing converter values.",
		image: {
			on: "./graphics/showConverterPlotPreviewOn.png",
			off: "./graphics/showConverterPlotPreviewOff.png"
		}
	}
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
	static getCategories() {
		return [...new Set(Object.values(preferencesTemplate).map(info => info.category))]
	}
	static getKeysInCategory(category) {
		return Object.keys(preferencesTemplate).filter(key => preferencesTemplate[key].category == category)
	}
}