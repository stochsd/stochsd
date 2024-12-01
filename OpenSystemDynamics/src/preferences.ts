export const preferencesTemplate = <const>{
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
	"showFunctionHelper": {
		default: false,
		type: "boolean",
		title: "Show Function Helper",
		description: "Show help in DefinitionEditor depending on cursor position. (Experimental feature)",
		image: "./graphics/showArgumentHelper.png",
	},
	"showConverterPlotPreview": {
		default: true,
		type: "boolean",
		title: "Show Converter Plot Preview",
		description: "Show Converter Plot Preview while editing converter values."
	}
	// primitiveFontSize
	// showArgumentHelper
	// theme (classic/modern)
}

export class Preferences {
	static setup() {
		const pref = Preferences.get()
		Object.entries(preferencesTemplate).forEach(([key, info]) => {
			if (pref[key] == undefined)
				pref[key] = info.default
		})
		Preferences.store(pref)
	}
	static get(key?: string) {
		const preferencesString = localStorage.getItem("preferences")
		const preferences = preferencesString ? JSON.parse(preferencesString) : {}
		return key ? preferences[key] : preferences
	}
	static set(key: string, value: any) {
		const pref = Preferences.get()
		pref[key] = value
		Preferences.store(pref)
	}
	static store(object: any) {
		localStorage.setItem("preferences", JSON.stringify(object))
	}
}

(window as any).preferencesTemplate = preferencesTemplate;
(window as any).Preferences = Preferences;

