// Vietnamese command text falls back to English until translated command text is added.
// Add or override any command key here without touching en.js.
try {
	module.exports = require("./en.js");
}
catch (err) {
	module.exports = {};
}
