// Vietnamese event-command text falls back to English until translated event text is added.
// Add or override any event key here without touching en.js.
try {
	module.exports = require("./en.js");
}
catch (err) {
	module.exports = {};
}
