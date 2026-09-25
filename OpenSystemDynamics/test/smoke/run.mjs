// Smoke tests for StochSD. See README.md in this folder.
//
//   node run.mjs              run all scenarios and compare against snapshots
//   node run.mjs --update     accept the current behaviour as the new snapshots
//   node run.mjs dialogs      only run scenarios whose name contains "dialogs"

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

// Node < 22 only has WebSocket behind a flag, so restart with the flag if needed
if (typeof WebSocket === "undefined") {
	const result = spawnSync(process.execPath, ["--experimental-websocket", "--no-warnings", ...process.argv.slice(1)], { stdio: "inherit" });
	process.exit(result.status ?? 1);
}

const { launchBrowser } = await import("./browser.mjs");
const { scenarios } = await import("./scenarios.mjs");

const appUrl = new URL("../../src/index.html", import.meta.url).href;
const snapshotDir = new URL("./snapshots/", import.meta.url).pathname;
mkdirSync(snapshotDir, { recursive: true });

const args = process.argv.slice(2);
const update = args.includes("--update");
const filters = args.filter(arg => !arg.startsWith("--"));
const selected = scenarios.filter(s => filters.length === 0 || filters.some(f => s.name.includes(f)));

// Shows the part of the snapshot that differs, with a few lines of context
function printDiff(expectedText, actualText) {
	const expected = expectedText.split("\n");
	const actual = actualText.split("\n");
	let start = 0;
	while (start < expected.length && start < actual.length && expected[start] === actual[start]) {
		start++;
	}
	let endExpected = expected.length - 1;
	let endActual = actual.length - 1;
	while (endExpected >= start && endActual >= start && expected[endExpected] === actual[endActual]) {
		endExpected--;
		endActual--;
	}
	const maxLines = 20;
	const context = 3;
	for (let i = Math.max(0, start - context); i < start; i++) {
		console.log(`      ${expected[i]}`);
	}
	expected.slice(start, endExpected + 1).slice(0, maxLines).forEach(line => console.log(`    - ${line}`));
	actual.slice(start, endActual + 1).slice(0, maxLines).forEach(line => console.log(`    + ${line}`));
	if (endExpected - start >= maxLines || endActual - start >= maxLines) {
		console.log("      ...");
	}
}

const page = await launchBrowser();
let failures = 0;
try {
	for (const scenario of selected) {
		// Start every scenario from a freshly loaded app with empty localStorage
		await page.goto(appUrl);
		await page.run(`localStorage.clear()`);
		page.errors = [];
		await page.reload();

		let result;
		try {
			result = await scenario.run(page);
		} catch (err) {
			result = { scenarioCrashed: String(err.message).split("\n")[0] };
		}
		result = { ...result, errors: page.errors };

		const actualText = JSON.stringify(result, null, 2) + "\n";
		const snapshotFile = `${snapshotDir}${scenario.name}.json`;
		const actualFile = `${snapshotDir}${scenario.name}.actual.json`;

		const isNew = !existsSync(snapshotFile);
		if (update || isNew) {
			writeFileSync(snapshotFile, actualText);
			rmSync(actualFile, { force: true });
			console.log(`${isNew ? "NEW  " : "SAVED"} ${scenario.name}${page.errors.length ? `  (${page.errors.length} errors)` : ""}`);
			continue;
		}

		const expectedText = readFileSync(snapshotFile, "utf8");
		if (expectedText === actualText) {
			rmSync(actualFile, { force: true });
			console.log(`PASS  ${scenario.name}`);
		} else {
			failures++;
			writeFileSync(actualFile, actualText);
			console.log(`FAIL  ${scenario.name}   (full output in snapshots/${scenario.name}.actual.json)`);
			// New errors usually point straight at the cause, so show them before the diff
			const expectedErrors = JSON.parse(expectedText).errors ?? [];
			const newErrors = [result.scenarioCrashed, ...result.errors].filter(e => e && !expectedErrors.includes(e));
			newErrors.forEach(error => console.log(`    ! ${error}`));
			printDiff(expectedText, actualText);
		}
	}
} finally {
	await page.close();
}

if (failures > 0) {
	console.log(`\n${failures} of ${selected.length} scenarios changed. If the change is intended, run with --update.`);
	process.exit(1);
}
console.log(`\nAll ${selected.length} scenarios ${update ? "saved" : "passed"}.`);
