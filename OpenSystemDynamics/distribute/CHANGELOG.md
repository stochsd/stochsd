# Change Log for update 202x.xx.xx

## Bug fixes
- Using method *RK4* and function *StopIf* sometimes resulted in NumberBoxes not showing a value at the end of a simulation. This is fixed.
- Fix formatting of number bugs
- Using html like symbols in *TextBox* e.g. "<" or ">" will be shown correctly.
- *Fix* function works correctly.

## Changes
- Better tick scaling on axis for *TimePlot*, *ComparePlot* and *XYPlot*. Now sets ticks on nicer numbers and does not just divide the range in even parts.
- *RandBoolean* is replaced by *RandBernoulli* that return value 0 or 1. Old *RandBoolean* will still work but it is not visible to user.
- *NumberBoxes* have **Hide frame** option.
- *Plots* have how new option **Show Data when hovering**.
- HelpButton is no longer focusable for easier navigation with *tab* and *shift+tab*.
- *Enter* and *Shift+Enter* works consistently in *DefinitionEditor*, *ConverterEditor*, *TextBox* and *Macro Dialog*
- Progressbar changes width to accomodate simulation info.
