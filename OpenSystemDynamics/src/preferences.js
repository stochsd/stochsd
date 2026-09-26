/** @typedef {"TimeUnit" | "DefinitionEditor" | "ConverterEditor"} PreferenceCategory */

/** @typedef {string | { on: string, off: string }} PreferenceImage - One image, or one image per checkbox state */

/**
 * @typedef {Object} PreferenceInfo
 * @property {PreferenceCategory} category - The group the preference is shown under in the PreferencesDialog.
 * @property {boolean} default - The value used until the user changes it.
 * @property {"boolean"} type - Decides how the preference is edited.
 * @property {string} title
 * @property {string} description
 * @property {PreferenceImage} [image]
 */

/** @satisfies {Record<string, PreferenceInfo>} */
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

/** @typedef {keyof typeof preferencesTemplate} PreferenceKey */
/** @typedef {Record<PreferenceKey, boolean>} StoredPreferences - What is stored as JSON in localStorage under "preferences" */

class Preferences {
	static setup() {
		const prefs = Preferences.getAll()
		Object.entries(preferencesTemplate).forEach(([key, info]) => {
			if (prefs[key] == undefined)
				prefs[key] = info.default
		})
		Preferences.store(prefs)
	}
	/**
	 * @param {PreferenceKey} key
	 * @returns {boolean}
	 */
	static get(key) {
		return Preferences.getAll()[key]
	}
	/** @returns {StoredPreferences} */
	static getAll() {
		const prefsString = localStorage.getItem("preferences")
		return prefsString ? JSON.parse(prefsString) : /** @type {StoredPreferences} */ ({})
	}
	/** 
	 * @param {PreferenceKey} key
	 * @param {boolean} value
	 */
	static set(key, value) {
		const prefs = Preferences.getAll()
		prefs[key] = value
		Preferences.store(prefs)
	}
	/** @param {StoredPreferences} object */
	static store(object) {
		localStorage.setItem("preferences", JSON.stringify(object))
	}
	/** @returns {PreferenceCategory[]} */
	static getCategories() {
		return [...new Set(Object.values(preferencesTemplate).map(info => info.category))]
	}
	/**
	 * @param {PreferenceCategory} category
	 * @returns {PreferenceKey[]}
	 */
	static getKeysInCategory(category) {
		return /** @type {PreferenceKey[]} */ (Object.keys(preferencesTemplate)).filter(key => preferencesTemplate[key].category == category)
	}
}