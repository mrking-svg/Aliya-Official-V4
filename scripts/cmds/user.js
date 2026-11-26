const AUTHOR = "0xMr_King x ┃ Tanin Islam";
const { getTime } = global.utils;

function targetFrom(event, args, offset) {
	if (event.type === "message_reply" && event.messageReply && event.messageReply.senderID)
		return { uid: event.messageReply.senderID, reason: args.slice(offset).join(" ") };
	const mentions = event.mentions || {};
	const keys = Object.keys(mentions);
	if (keys.length)
		return { uid: keys[0], reason: args.slice(offset).join(" ").replace(mentions[keys[0]], "").trim() };
	if (args[offset] && !isNaN(args[offset]))
		return { uid: args[offset], reason: args.slice(offset + 1).join(" ") };
	return { uid: null, reason: args.slice(offset).join(" ") };
}

module.exports = {
	config: {
		name: "user",
		aliases: ["users"],
		version: "2.0.0",
		author: AUTHOR,
		countDown: 5,
		role: 2,
		category: "owner",
		shortDescription: "Search users and ban/unban them globally",
		guide: {
			en: "{pn} find <name>\n{pn} ban [@tag|uid|reply] <reason>\n{pn} unban [@tag|uid|reply]"
		}
	},

	onStart: async function ({ message, event, args, usersData, prefix }) {
		const mode = String(args[0] || "").toLowerCase();

		if (["find", "search", "-f", "-s"].includes(mode)) {
			const keyword = args.slice(1).join(" ").toLowerCase();
			if (!keyword) return message.reply({ body: `Usage: ${prefix}user find <name>`, effect: "love" });
			const all = await usersData.getAll();
			const found = all.filter(u => String(u.name || "").toLowerCase().includes(keyword)).slice(0, 30);
			if (!found.length) return message.reply({ body: `No user matches "${keyword}".`, effect: "love" });
			return message.reply(
				`Found ${found.length} user(s):\n` +
				found.map(u => `• ${u.name || "Unknown"} — ${u.userID}`).join("\n")
			);
		}

		if (["ban", "-b", "unban", "-u"].includes(mode)) {
			const ban = ["ban", "-b"].includes(mode);
			const offset = event.type === "message_reply" ? 1 : 2;
			const { uid, reason: rawReason } = targetFrom(event, args, offset);
			if (!uid || isNaN(uid)) return message.reply({ body: "Please tag a user, reply, or give a valid UID.", effect: "love" });

			const data = await usersData.get(uid);
			const name = (data && data.name) || uid;
			const info = (data && data.banned) || {};

			if (ban) {
				if (info.status === true)
					return message.reply({ body: `${name} (${uid}) is already banned.\nReason: ${info.reason || "none"}\nDate: ${info.date || "unknown"}`, effect: "love" });
				const reason = String(rawReason || "").replace(/\s+/g, " ").trim() || "No reason given";
				const date = getTime("DD/MM/YYYY HH:mm:ss");
				await usersData.set(uid, { banned: { status: true, reason, date } });
				return message.reply({ body: `Banned ${name} (${uid}) from using the bot.\nReason: ${reason}\nDate: ${date}`, effect: "love" });
			}

			if (info.status !== true) return message.reply({ body: `${name} (${uid}) is not banned.`, effect: "love" });
			await usersData.set(uid, { banned: {} });
			return message.reply({ body: `Unbanned ${name} (${uid}). They can use the bot again.`, effect: "love" });
		}

		return message.reply(
			`User manager by ${AUTHOR}\n` +
			`Usage:\n${prefix}user find <name>\n${prefix}user ban <uid|@tag|reply> <reason>\n${prefix}user unban <uid|@tag|reply>`
		);
	}
};
