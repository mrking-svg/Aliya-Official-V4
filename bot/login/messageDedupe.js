'use strict';

// MQTT can deliver the same message more than once while the listener is
// reconnecting (for example right after a group/theme refresh). A duplicate
// must not run the command a second time: the second run normally only emits
// the global "wait N seconds" reply, which looks like a duplicate response.

function createMessageDedupe(cache, opts) {
	const size = Math.max(10, Number(opts && opts.size) || 50);
	const windowMs = Math.max(1000, Number(opts && opts.windowMs) || 4000);
	const seen = Array.isArray(cache) ? cache : [];
	const recent = new Map();

	return function isDuplicate(event) {
		if (!event || (event.type !== "message" && event.type !== "message_reply")) return false;

		const id = event.messageID ? String(event.messageID) : "";
		if (id && seen.includes(id)) return true;

		const now = Date.now();
		const body = typeof event.body === "string" ? event.body : "";
		const attachments = event.attachments ? event.attachments.length : 0;
		// Deliberately ignore event.type: a re-delivered message can arrive as
		// message once and as message_reply on the next listener.
		const signature = [
			String(event.threadID || ""),
			String(event.senderID || ""),
			attachments,
			body
		].join("\u0001");

		const last = recent.get(signature) || 0;
		if (last && now - last < windowMs) return true;

		if (id) {
			seen.push(id);
			while (seen.length > size) seen.shift();
		}
		recent.set(signature, now);
		while (recent.size > size) recent.delete(recent.keys().next().value);
		return false;
	};
}

module.exports = { createMessageDedupe };
