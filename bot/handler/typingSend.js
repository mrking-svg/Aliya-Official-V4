'use strict';

// Wrap api.sendMessage so EVERY response - text, image, video, audio/mp3,
// sticker, file - shows the typing indicator until the send actually finishes.
// This also covers commands that call api.sendMessage directly instead of the
// message.reply() helper.

const typing = require("./typingIndicator.js");

function withStop(promise, stop) {
	if (!promise || typeof promise.then !== "function") {
		stop();
		return promise;
	}
	return promise.then(
		value => { stop(); return value; },
		err => { stop(); throw err; }
	);
}

function wrap(api) {
	if (!api || typeof api.sendMessage !== "function" || api.__typingSendWrapped) return api;
	const original = api.sendMessage.bind(api);
	api.__typingSendWrapped = true;

	api.sendMessage = function (form, threadID, ...rest) {
		// Keep the exact original argument shape so reply IDs and isGroup still work.
		if (!typing.isEnabled("send") || !threadID || typeof threadID === "function")
			return original(form, threadID, ...rest);

		const handle = typing.start(api, threadID, "send");
		let stopped = false;
		function stop() {
			if (stopped) return;
			stopped = true;
			try { typing.stopThread(threadID); } catch (_e) { /* ignore */ }
			try { handle.stop(); } catch (_e) { /* ignore */ }
		}

		if (typeof rest[0] === "function") {
			const callback = rest[0];
			const done = (err, info) => {
				stop();
				try { callback(err, info); } catch (_e) { /* caller callback must not break send */ }
			};
			try {
				return original(form, threadID, done, ...rest.slice(1));
			}
			catch (err) { stop(); throw err; }
		}

		try {
			return withStop(original(form, threadID, ...rest), stop);
		}
		catch (err) { stop(); throw err; }
	};

	return api;
}

module.exports = { wrap };
