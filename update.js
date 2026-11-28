"use strict";

/*
 * Legacy entry point kept for compatibility.
 * The old version downloaded and eval()'d remote code from Goat-Bot-V2.
 * It now only delegates to the local read-only Aliya update checker.
 */

module.exports = require("./updater.js");

if (require.main === module) {
	const { checkForUpdates, formatResult } = module.exports;
	checkForUpdates()
		.then(result => console.log(formatResult(result)))
		.catch(err => console.error(formatResult({ ok: false, error: err.message || String(err) })));
}
