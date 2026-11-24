// Bengali command text falls back to English until individual commands are translated.
// Add or override any command key here without touching en.js.
try {
	module.exports = require("./en.js");
}
catch (err) {
	module.exports = {};
}
