# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this the versioning of this project is based on the date of release (YYYY.MM.DD).

## [Unreleased]

### Added
- Add autocomplete to DefinitionDialog (suggests functions and linked primitives).
- CHANGELOG.
- Progresive Web App with chromium based browsers.
- KeepResults option saved to file for ComparePlots.
- Show/hide tooltip highlighter in plots.
- NumberBoxes have **Hide frame** option.
- Help-button in ConverterDialog, TextAreaDialog and MacroDialog.
- Hide-frame option in Numberbox.
- Tools-icons in menu (Optim, Sensi, StatRes and ParmVar).

### Changed
- StopIf function returns 1 on stop and otherwise 0.
- Resizing of svgplane is done with css and js (for performance).
- Update plots more sparingly when resizing them (for performance).
- Custom tick-setter for TimePlots, ComparePlots and XyPlot. (To remove weird numbers like 0.333...)
- Histogram no longer include maximum value by default, by setting a max-limit slightly higher than max.
- Make `Enter` -> Apply and `Shift`+`Enter`-> New Line, consistent accross all text inputs.
- Progressbar changes width to accomodate simulation info.
- HelpButton is no longer focusable for easier navigation with *tab* and *shift+tab*.

### Fixed 
- MacroDialog getting smaller each times it's open.
- Number formatting bugs.
- TextArea now interprets `<` and `>` correctly and not as html.
- Fix-function bugs.
- RK4 and function `StopI` sometimes resulted in NumberBoxes not showing a value at the end of a simulation.
- Minor bugs.

### Depricated
- Function RandBoolean, replaced with RandBernoulli.


## 2021-01-03
### Added 
- Converter error messages.
- Clearer error messages for unmatched brackets.
- Values `pi`, `eps` and `e`.
- Code highlighting to definition.
- Clear Recent List button in file-menu.
- Zooming works with `Ctrl`+`Numpad+`/`Numpad-`.
- Stock/Flow/Constant/Auxilliary icons in primitive selectors.
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