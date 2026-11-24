const fs = require("fs-extra");
const path = require("path");
const log = require("../logger/log.js");

const defaultLangFile = path.join(__dirname, "en.lang");
const languageCache = new Map();
const warnedFiles = new Set();

function safeLangCode(code) {
	const cleaned = String(code || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
	return cleaned || "en";
}

function parseLanguageFile(filePath) {
	const obj = {};
	let content = "";
	try {
		content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : "";
	}
	catch (err) {
		content = "";
	}

	const lines = content
		.split(/\r?\n|\r/)
		.filter(line => line && !line.trim().startsWith("#") && !line.trim().startsWith("//") && line.trim() !== "");

	for (const sentence of lines) {
		const separator = sentence.indexOf("=");
		if (separator === -1) continue;

		const itemKey = sentence.slice(0, separator).trim();
		const itemValue = sentence.slice(separator + 1).trim();
		const headIndex = itemKey.indexOf(".");
		if (headIndex === -1) continue;

		const head = itemKey.slice(0, headIndex);
		const key = itemKey.slice(headIndex + 1);
		const value = itemValue.replace(/\\n/gi, "\n");

		if (!obj[head]) obj[head] = {};
		obj[head][key] = value;
	}
	return obj;
}

function loadLanguageFile(filePath) {
	if (languageCache.has(filePath)) return languageCache.get(filePath);

	if (!fs.existsSync(filePath) && !warnedFiles.has(filePath)) {
		warnedFiles.add(filePath);
		log.warn("LANGUAGE", `Can't find language file "${path.basename(filePath)}", using "en.lang"`);
	}

	const data = parseLanguageFile(filePath);
	languageCache.set(filePath, data);
	return data;
}

const defaultLanguage = loadLanguageFile(defaultLangFile);

// Missing keys in a translation file are filled from en.lang instead of showing
// "Can't find text" during startup or while a user is in a group with another language.
function withDefaults(langObj) {
	const merged = {};
	for (const [head, keys] of Object.entries(defaultLanguage))
		merged[head] = { ...keys };
	for (const [head, keys] of Object.entries(langObj || {}))
		merged[head] = { ...(merged[head] || {}), ...keys };
	return merged;
}

function languageObjectFor(code) {
	const file = path.join(__dirname, `${safeLangCode(code)}.lang`);
	return withDefaults(loadLanguageFile(file));
}

const configuredLanguage = global.GoatBot?.config?.language || "en";
global.language = languageObjectFor(configuredLanguage);

function getText(head, key, ...args) {
	let langObj = global.language;
	const currentLanguage = global.GoatBot?.config?.language || configuredLanguage;

	// config.json can be reloaded while the bot is running, so do not keep using the
	// language that was active when this module was first loaded.
	if (safeLangCode(currentLanguage) !== safeLangCode(configuredLanguage))
		langObj = languageObjectFor(currentLanguage);

	if (typeof head === "object" && head !== null) {
		const requestedLang = head.lang || currentLanguage || "en";
		head = head.head;
		langObj = languageObjectFor(requestedLang);
	}

	if (!head || !langObj[head] || !Object.prototype.hasOwnProperty.call(langObj[head], key)) {
		return `Missing language key: ${head}.${key}`;
	}

	let text = String(langObj[head][key]);
	text = text.replace(/%(\d+)/g, (match, n) => {
		const value = args[Number(n) - 1];
		return value === undefined ? match : String(value);
	});

	return text;
}

module.exports = getText;
