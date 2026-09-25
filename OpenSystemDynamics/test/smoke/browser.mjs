// Minimal Chrome DevTools Protocol client, so the smoke tests need no npm dependencies.
// Launches a headless Chrome, and gives a page object to navigate, evaluate code and collect errors.

import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function findChrome() {
	const candidates = [
		process.env.CHROME,
		"google-chrome",
		"google-chrome-stable",
		"chromium",
		"chromium-browser",
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
	].filter(Boolean);
	for (const candidate of candidates) {
		if (spawnSync(candidate, ["--version"]).status === 0) {
			return candidate;
		}
	}
	throw new Error("Could not find Chrome. Set the CHROME environment variable to its path.");
}

// Replaces Math.random with a seeded generator (mulberry32), so stochastic models give the same results every run
const seedRandomScript = `
	(() => {
		let seed = 12345;
		Math.random = function () {
			seed = (seed + 0x6D2B79F5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	})();
`;

export async function launchBrowser() {
	const port = 9300 + Math.floor(Math.random() * 600);
	const profileDir = mkdtempSync(join(tmpdir(), "stochsd-smoke-"));
	const chrome = spawn(findChrome(), [
		"--headless=new",
		"--disable-gpu",
		"--no-first-run",
		`--remote-debugging-port=${port}`,
		`--user-data-dir=${profileDir}`,
		"--allow-file-access-from-files",
		"--window-size=1400,900",
		"about:blank",
	], { stdio: "ignore" });

	let targets;
	for (let i = 0; i < 100 && !targets; i++) {
		try {
			targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
		} catch {
			await sleep(100);
		}
	}
	if (!targets) {
		chrome.kill();
		throw new Error("Chrome did not start");
	}

	const ws = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl);
	await new Promise((resolve, reject) => {
		ws.onopen = resolve;
		ws.onerror = reject;
	});

	let nextId = 1;
	const pending = {};
	const eventListeners = [];
	ws.onmessage = event => {
		const message = JSON.parse(event.data);
		if (message.id && pending[message.id]) {
			pending[message.id](message);
			delete pending[message.id];
		} else if (message.method) {
			eventListeners.forEach(listener => listener(message));
		}
	};
	const send = (method, params = {}) => new Promise(resolve => {
		const id = nextId++;
		pending[id] = resolve;
		ws.send(JSON.stringify({ id, method, params }));
	});
	const waitForEvent = (method, timeout = 15000) => new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeout);
		const listener = message => {
			if (message.method === method) {
				clearTimeout(timer);
				eventListeners.splice(eventListeners.indexOf(listener), 1);
				resolve(message.params);
			}
		};
		eventListeners.push(listener);
	});

	const page = {
		// Errors are collected here, and reset by the test runner between scenarios
		errors: [],

		async goto(url) {
			const loaded = waitForEvent("Page.loadEventFired");
			await send("Page.navigate", { url });
			await loaded;
			await sleep(300);
		},

		async reload() {
			const loaded = waitForEvent("Page.loadEventFired");
			await send("Page.reload");
			await loaded;
			await sleep(300);
		},

		// Runs code inside an async function in the page and returns its (JSON serializable) result
		async run(code) {
			const response = await send("Runtime.evaluate", {
				expression: `(async () => { ${code} })()`,
				awaitPromise: true,
				returnByValue: true,
			});
			const details = response.result.exceptionDetails;
			if (details) {
				throw new Error(details.exception?.description || details.text);
			}
			return response.result.result.value;
		},

		// Runs code that triggers a page reload (e.g. opening a file), and waits for the reload to finish
		async runAndWaitForReload(code) {
			const loaded = waitForEvent("Page.loadEventFired");
			await send("Runtime.evaluate", { expression: code });
			await loaded;
			await sleep(300);
		},

		// Real mouse input, at page coordinates. type is "mousePressed", "mouseMoved" or "mouseReleased"
		async mouse(type, x, y, { button = "left", modifiers = 0 } = {}) {
			const pressed = type === "mousePressed" || (type === "mouseMoved" && this.mouseIsDown);
			if (type === "mousePressed") this.mouseIsDown = true;
			if (type === "mouseReleased") this.mouseIsDown = false;
			await send("Input.dispatchMouseEvent", {
				type, x, y, modifiers,
				button: type === "mouseMoved" && !pressed ? "none" : button,
				buttons: pressed ? 1 : 0,
				clickCount: type === "mouseMoved" ? 0 : 1,
			});
		},

		// Presses and drags the mouse from one page coordinate to another, in a few steps
		async drag([x1, y1], [x2, y2], { steps = 5, modifiers = 0 } = {}) {
			await this.mouse("mouseMoved", x1, y1, { modifiers });
			await this.mouse("mousePressed", x1, y1, { modifiers });
			for (let i = 1; i <= steps; i++) {
				await this.mouse("mouseMoved", x1 + (x2 - x1) * i / steps, y1 + (y2 - y1) * i / steps, { modifiers });
			}
			await this.mouse("mouseReleased", x2, y2, { modifiers });
			await sleep(50);
		},

		async click(x, y, { modifiers = 0 } = {}) {
			await this.drag([x, y], [x, y], { steps: 0, modifiers });
		},

		// Real key press. modifiers: 2 = Ctrl, 8 = Shift
		async key(key, { code, keyCode, modifiers = 0 } = {}) {
			const params = { key, code, windowsVirtualKeyCode: keyCode, modifiers };
			await send("Input.dispatchKeyEvent", { type: "keyDown", ...params });
			await send("Input.dispatchKeyEvent", { type: "keyUp", ...params });
			await sleep(50);
		},

		async close() {
			ws.close();
			chrome.kill();
			await sleep(200);
			rmSync(profileDir, { recursive: true, force: true });
		},
	};

	eventListeners.push(message => {
		const params = message.params;
		if (message.method === "Runtime.exceptionThrown") {
			const details = params.exceptionDetails;
			const text = (details.exception?.description || details.text).split("\n")[0];
			const file = details.url?.split("/src/")[1] ?? "";
			page.errors.push(`Uncaught: ${text} (${file}:${details.lineNumber + 1})`);
		} else if (message.method === "Runtime.consoleAPICalled" && params.type === "error") {
			const text = params.args.map(arg => arg.value ?? arg.description).join(" ").split("\n")[0];
			page.errors.push(`console.error: ${text}`);
		} else if (message.method === "Log.entryAdded" && params.entry.level === "error") {
			page.errors.push(`Browser: ${params.entry.text} ${params.entry.url ?? ""}`.trim());
		}
	});

	await send("Runtime.enable");
	await send("Log.enable");
	await send("Page.enable");
	await send("Page.addScriptToEvaluateOnNewDocument", { source: seedRandomScript });

	return page;
}
