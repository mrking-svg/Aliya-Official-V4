'use strict';

// MQTT can deliver the same message more than once while the listener is
// reconnecting. A duplicate must not run the command a second time: the second
// run usually only produces the global "wait N seconds" reply.

function createMessageDedupe(cache, opts) {
	const size = Math.max(10, Number(opts && opts.size) || 50);
	const seen = Array.isArray(cache) ? cache : [];

	return function isDuplicate(event) {
		if (!event || !event.messageID) return false;
		if (event.type !== "message" && event.type !== "message_reply") return false;
		const id = String(event.messageID);
		if (seen.includes(id)) return true;
		seen.push(id);
		while (seen.length > size) seen.shift();
		return false;
	};
}

module.exports = { createMessageDedupe };
