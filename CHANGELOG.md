# Changelog

All notable changes to StochSD will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and the versioning of StochSD is based on the date of release (YYYY.MM.DD).

## [Unreleased]

### Added
- Drag and Drop functionality for ssd-files.
- Code-highlighting with CodeMirror for ConverterDialog.
- Converter plot preview in ConverterDialog.
- Pasting two columns from spreadsheet application into converter dialog works.

### Fixed
- UI cleanup and style update for menu and tool-buttons.


## 2022.04.15

### Added
- Code-highlighting and autocomplete suggestions to MacroDialog with CodeMirror.
- PreferenceDialog
  - Force TimeUnit preferences
  - Show Experimental Function Helper
- Link to official StochSD forum inside StochSD.
- Better support for PWA StochSD

## Fixed
- Ghosted Converter Bugs
- Recent Files fixes for nwjs-environment (desktop version).

## 2022.01.02

### Added
- Generations list in Dialog ComparePlot, with editable labels.
- Autocomplete to DefinitionDialog, suggests functions and linked primitives (`Ctrl`+`Space` to show).
- CHANGELOG.
- Progresive Web App with Chromium based browsers.
- **Show/hide-option** data in plots when hovering.
- **Help-button** in ConverterDialog, TextAreaDialog and MacroDialog.
- **Hide-frame-option** in Numberbox.
- Icons in tool-menu (Optim, Sensi, StatRes and ParmVar).

## Removed
- KeepResults Option in ComparePlot, (simulations are always kept and results appear in editable table).

### Changed
- Function-libraries visible to user, edited and reorganized.
- StopIf function returns 1 on stop and otherwise 0.
- Resizing of svgplane is done with css and js (for performance).
- Update plots more sparingly when resizing them (for performance).
- Custom tick-setter for TimePlots, ComparePlots and XyPlot. (To remove weird numbers like 0.333...)
- Histogram no longer include maximum value by default, by setting a max-limit slightly higher than max.
- `Enter` -> Apply and `Shift`+`Enter`-> New Line, consistent across all text inputs.
- Progressbar changes width to accomodate simulation info.
- HelpButton is no longer focusable for easier navigation with *tab* and *shift+tab*.

### Fixed 
- ComparePlot bugs.
- MacroDialog-bug (dialog smaller each time it opened).
- Number formatting bugs.
- TextArea now interprets `<` and `>` characters correctly and not as HTML.
- Fix-function bugs.
- Bug for RK4 and function `StopIf` sometimes resulted in NumberBoxes not showing a value at the end of a simulation.
- Minor bugs.

### Depricated 
- Function RandBoolean, replaced with RandBernoulli.

## 2021.01.03
### Added
- Converter error messages.
- Clearer error messages for unmatched brackets.
- Values `pi`, `eps` and `e`.
- Code highlighting to definition.
- Clear Recent List button in file-menu.
- Zooming works with `Ctrl`+`Numpad+`/`Numpad-`.
- Stock/Flow/Constant/Auxiliary icons in primitive selectors.
- StopIf function.
- `Ctrl`+`R` to run simulation.
- More purely visual primitives (Line, Arrow, Elipse).
- Holding `Ctrl` while placing TwoPointer freezes angle to 90 or 45 degrees.

### Changed
- Flow arrow UI-behaviour improved.
- Progressbar color is set according green/orange, depending on done/running.
- Plots are look more consistent when empty.
- More attributes are saved to file for plots.

### Fixed
- Many minor bugs.



[Unreleased]: https://github.com/stochsd/stochsd