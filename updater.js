"use strict";

/*
 * Aliya Official V4 update checker.
 *
 * This is intentionally READ-ONLY. The old updater pulled files from
 * ntkhang03/Goat-Bot-V2 and overwrote local config/source files. That is not
 * safe for this fork, so it has been replaced with a status checker that only
 * reports what is available in the real upstream repository.
 */

const axios = require("axios");
const { execFileSync } = require("child_process");

const REPO = "mrking-svg/Aliya-Official-v4";
const BRANCH = "main";
const API_URL = `https://api.github.com/repos/${REPO}`;
const RAW_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const REQUEST_CONFIG = {
	timeout: 10000,
	headers: { "User-Agent": "Aliya-Official-v4-update-check" }
};

function getLocalVersion() {
	try {
		return require("./package.json").version || "unknown";
	}
	catch (e) {
		return "unknown";
	}
}

function getLocalCommit() {
	try {
		return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
			cwd: process.cwd(),
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"]
		}).trim();
	}
	catch (e) {
		return null;
	}
}

function firstLine(message) {
	return String(message || "").split(/\r?\n|\r/)[0] || "";
}

function describeManifest(versions, localVersion) {
	if (!Array.isArray(versions) || versions.length === 0)
		return "remote versions.json is empty or invalid";

	const latest = versions[versions.length - 1]?.version || "unknown";
	const index = versions.findIndex(entry => entry && entry.version === localVersion);

	if (index === -1)
		return `local version ${localVersion} is not listed (manifest latest: ${latest})`;
	if (index === versions.length - 1)
		return `local version is latest in manifest (${latest})`;

	return `${versions.length - 1 - index} newer version(s) listed (latest: ${latest})`;
}

async function checkForUpdates() {
	const localVersion = getLocalVersion();

	const [commitResponse, versionsResponse, packageResponse] = await Promise.all([
		axios.get(`${API_URL}/commits/${BRANCH}`, REQUEST_CONFIG),
		axios.get(`${RAW_URL}/versions.json`, REQUEST_CONFIG),
		axios.get(`${RAW_URL}/package.json`, REQUEST_CONFIG)
	]);

	const remoteVersion = packageResponse.data?.version || "unknown";
	const commit = commitResponse.data;
	const localCommit = getLocalCommit();

	return {
		ok: true,
		repo: REPO,
		localVersion,
		remoteVersion,
		versionStatus: remoteVersion === localVersion ? "same" : "different",
		manifest: describeManifest(versionsResponse.data, localVersion),
		localCommit,
		remoteCommit: String(commit?.sha || "").slice(0, 7) || "unknown",
		remoteCommitDate: commit?.commit?.committer?.date || "unknown",
		remoteCommitMessage: firstLine(commit?.commit?.message),
		applied: false,
		note: "Read-only check. No files were changed."
	};
}

function formatResult(result) {
	if (!result.ok)
		return `❌ Update check failed: ${result.error}`;

	const lines = [
		"🔄 Aliya V4 update check (read-only)",
		`Repo: ${result.repo}`,
		`Version: local ${result.localVersion} | remote ${result.remoteVersion} (${result.versionStatus})`,
		`Manifest: ${result.manifest}`,
		`Latest commit: ${result.remoteCommit} — ${result.remoteCommitMessage || "no message"}`
	];

	if (result.localCommit)
		lines.push(`Local commit: ${result.localCommit}`);

	lines.push(result.note);
	return lines.join("\n");
}

module.exports = { checkForUpdates, formatResult, REPO, BRANCH };

if (require.main === module) {
	checkForUpdates()
		.then(result => console.log(formatResult(result)))
		.catch(err => console.error(formatResult({ ok: false, error: err.message || String(err) })));
}
