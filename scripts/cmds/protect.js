const AUTHOR = "0xMr_King x ┃ Tanin Islam";

const lastWarning = new Map();

function globalEnabled() {
	const guard = global.GoatBot && global.GoatBot.config && global.GoatBot.config.advancedGuard;
	return !guard || guard.enable !== false;
}

function warnThrottled(api, threadID, text) {
	const key = String(threadID);
	const now = Date.now();
	if (now - (lastWarning.get(key) || 0) < 10000) return;
	lastWarning.set(key, now);
	try { api.sendMessage(text, threadID); } catch (e) { /* never break event flow */ }
}

function adminIdsOf(info) {
	const ids = [];
	for (const item of (info && info.adminIDs) || []) {
		if (typeof item === "string" || typeof item === "number") ids.push(String(item));
		else if (item && (item.id || item.userFbId)) ids.push(String(item.id || item.userFbId));
	}
	return ids;
}

async function snapshot(api, threadID) {
	const info = await api.getThreadInfo(threadID);
	const nicknames = {};
	for (const member of (info && info.members) || []) {
		const uid = member.userID || member.id || member.userFbId;
		if (uid) nicknames[String(uid)] = member.nickname || "";
	}
	return {
		enable: true,
		name: (info && info.threadName) || "",
		emoji: (info && info.emoji) || "",
		color: (info && (info.color || info.threadColor)) || "",
		imageSrc: (info && info.imageSrc) || "",
		nicknames,
		by: null,
		at: Date.now()
	};
}

async function save(threadsData, threadID, data) {
	await threadsData.set(threadID, data, "data.protect");
}

module.exports = {
	config: {
		name: "protect",
		aliases: ["lockgroup", "grouplock"],
		version: "2.0.0",
		author: AUTHOR,
		countDown: 5,
		role: 1,
		category: "group",
		shortDescription: "Lock group name, emoji, theme and nicknames",
		guide: {
			en: "{pn} on     snapshot and lock the current group identity\n" +
				"{pn} off    disable the lock\n" +
				"{pn} status show the current lock state"
		}
	},

	onStart: async function ({ api, event, args, threadsData, prefix, message }) {
		if (!globalEnabled()) return;
		const threadID = event.threadID;
		const mode = String(args[0] || "").toLowerCase();

		if (mode === "on") {
			try {
				const data = await snapshot(api, threadID);
				data.by = event.senderID;
				await save(threadsData, threadID, data);
				return message.reply(
					`🛡️ Group identity locked.\n` +
					`Name, emoji, theme and nicknames are protected from non-admin changes.\n` +
					`Admins can still change them and the lock will follow.`
				);
			}
			catch (err) {
				return message.reply({ body: `Could not read group info: ${err.message}` });
			}
		}

		if (mode === "off") {
			await threadsData.set(threadID, null, "data.protect");
			return message.reply({ body: "🔓 Group identity lock disabled." });
		}

		const data = await threadsData.get(threadID, "data.protect", null);
		if (mode === "status" || !mode)
			return message.reply(
				`Group identity lock: ${data && data.enable ? "ON" : "OFF"}\n` +
				`Usage: ${prefix}protect on | ${prefix}protect off | ${prefix}protect status`
			);

		return message.reply({ body: `Usage: ${prefix}protect on | ${prefix}protect off | ${prefix}protect status` });
	},

	onEvent: async function ({ api, event, threadsData, role }) {
		if (!globalEnabled()) return;

		const threadID = event.threadID;
		const data = await threadsData.get(threadID, "data.protect", null);
		if (!data || !data.enable) return;

		const interesting = ["log:thread-name", "log:thread-icon", "log:thread-color", "log:thread-image", "log:user-nickname"];
		if (!interesting.includes(event.logMessageType)) return;

		const log = event.logMessageData || {};
		const author = event.author || log.author || log.userFbId || log.participant_id;
		const botID = api.getCurrentUserID();
		if (author && String(author) === String(botID)) return;

		const adminIDs = adminIdsOf(event.threadInfo);
		const isAdmin = Number(role || 0) >= 1 || (author && adminIDs.includes(String(author)));

		try {
			if (isAdmin) {
				if (event.logMessageType === "log:thread-name" && log.name !== undefined)
					data.name = log.name || "";
				if (event.logMessageType === "log:thread-icon" && log.thread_icon !== undefined)
					data.emoji = log.thread_icon || "";
				if (event.logMessageType === "log:thread-color" && (log.theme_id !== undefined || log.color !== undefined))
					data.color = log.theme_id || log.color || "";
				if (event.logMessageType === "log:thread-image")
					data.imageSrc = log.url || (log.image && log.image.url) || "";
				if (event.logMessageType === "log:user-nickname" && log.participant_id)
					data.nicknames[String(log.participant_id)] = log.nickname || "";
				data.at = Date.now();
				await save(threadsData, threadID, data);
				return;
			}

			if (event.logMessageType === "log:thread-name" && data.name)
				await api.setTitle(data.name, threadID);
			else if (event.logMessageType === "log:thread-icon" && data.emoji)
				await api.changeThreadEmoji(data.emoji, threadID);
			else if (event.logMessageType === "log:thread-color" && data.color)
				await api.changeThreadColor(data.color, threadID);
			else if (event.logMessageType === "log:thread-image" && data.imageSrc && global.utils && typeof global.utils.getStreamFromURL === "function")
				await api.changeGroupImage(await global.utils.getStreamFromURL(data.imageSrc), threadID);
			else if (event.logMessageType === "log:user-nickname" && log.participant_id)
				await api.changeNickname(data.nicknames[String(log.participant_id)] || "", threadID, log.participant_id);
			else
				return;

			warnThrottled(api, threadID,
				`🛡️ Group identity is locked. Only admins can change it.\nMade by ${AUTHOR}`);
		}
		catch (err) {
			// A failed restore must never stop the event handler.
		}
	}
};
