# Smoke tests

Opens StochSD in headless Chrome, drives it through code and compares what happens against stored snapshots.
The purpose is to make refactoring safe: the snapshots don't say that the behaviour is *correct*, only that it hasn't *changed*.

No npm install or build is needed, only Node.js (20 or newer) and Chrome or Chromium.

```
node run.mjs              # run all scenarios
node run.mjs dialogs      # run only scenarios whose name contains "dialogs"
node run.mjs --update     # accept the current behaviour as the new snapshots
```

If Chrome isn't found, set the `CHROME` environment variable to its path.

## When a scenario fails

The output shows any new errors from the page first, followed by the part of the snapshot that changed.
The full output is written to `snapshots/<scenario>.actual.json` so it can be diffed against `snapshots/<scenario>.json`.

- If the change is a bug, fix it.
- If the change is intended (e.g. a new attribute in the saved file), run `node run.mjs --update` and commit the updated snapshots together with the change.

## What is tested

The scenarios are in `scenarios.mjs`. Every scenario starts from a freshly loaded app, and records all uncaught exceptions and `console.error`s.

- **startup**: state of an empty model after loading.
- **build-and-simulate**: creates every primitive type with the tools (the same calls as the mouse handlers make), sets definitions and runs a simulation.
- **undo-redo-delete**: undo, redo, and delete.
- **mouse-and-keyboard**: real mouse and key events: clicking, dragging, rubber band selection, dragging a flow anchor, Shift+Arrow, Ctrl+A and Delete.
- **dialogs**: opens the dialog of every primitive, plot and the global dialogs.
- **model-&lt;file&gt;**: every file in `models/` is opened the same way as the app opens a file (including the page reload), saved again and simulated.

`Math.random` is replaced by a seeded generator, so stochastic models give the same results every run.

## Adding models

Drop any `.ssd` file into `models/` and run `node run.mjs`. A snapshot is created for it on the first run.
Real models that use many different features are the best tests, so it is worth adding a few.
