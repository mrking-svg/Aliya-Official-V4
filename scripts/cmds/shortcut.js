const AUTHOR = "0xMr_King x ┃ Tanin Islam";

const lastExpansion = new Map();

function listOf(items, keyword, type) {
	if (!keyword) return items;
	const k = keyword.toLowerCase();
	if (type === "start") return items.filter(x => x.key.startsWith(k));
	if (type === "end") return items.filter(x => x.key.endsWith(k));
	return items.filter(x => x.key.includes(k));
}

module.exports = {
	config: {
		name: "shortcut",
		aliases: ["short"],
		version: "2.0.0",
		author: AUTHOR,
		countDown: 5,
		role: 0,
		category: "group",
		shortDescription: "Create text shortcuts for this group",
		guide: {
			en: "{pn} add <key> => <text>\n{pn} del <key>\n{pn} list [start|end|contain <keyword>]\n{pn} remove"
		}
	},

	onStart: async function ({ message, event, args, threadsData, role, prefix }) {
		const body = String(event.body || "");
		const threadID = event.threadID;
		const list = await threadsData.get(threadID, "data.shortcut", []);
		if (!Array.isArray(list)) list.length = 0;
		const save = () => threadsData.set(threadID, list, "data.shortcut");
		const mode = String(args[0] || "").toLowerCase();

		if (mode === "add") {
			const split = String(body || "").split(/\s+/).slice(2).join(" ").split("=>");
			const key = (split[0] || "").trim().toLowerCase();
			const content = split.slice(1).join("=>").trim();
			if (!key || !content) return message.reply({ body: `Usage: ${prefix}shortcut add <key> => <text>`, effect: "love" });
			if (list.length >= 100) return message.reply({ body: "This group has reached the 100 shortcut limit.", effect: "love" });
			const found = list.find(x => x.key === key);
			if (found) {
				if (found.author !== event.senderID && Number(role || 0) < 1)
					return message.reply({ body: "Only a group admin can replace another member's shortcut.", effect: "love" });
				found.content = content;
				await save();
				return message.reply({ body: `Updated shortcut "${key}".`, effect: "love" });
			}
			list.push({ key, content, author: event.senderID });
			await save();
			return message.reply({ body: `Added shortcut "${key}" => ${content}`, effect: "love" });
		}

		if (["del", "delete", "rm"].includes(mode)) {
			const key = args.slice(1).join(" ").trim().toLowerCase();
			if (!key) return message.reply({ body: `Usage: ${prefix}shortcut del <key>`, effect: "love" });
			const index = list.findIndex(x => x.key === key);
			if (index === -1) return message.reply({ body: `No shortcut named "${key}".`, effect: "love" });
			if (list[index].author !== event.senderID && Number(role || 0) < 1)
				return message.reply({ body: "Only a group admin can delete another member's shortcut.", effect: "love" });
			list.splice(index, 1);
			await save();
			return message.reply({ body: `Deleted shortcut "${key}".`, effect: "love" });
		}

		if (mode === "remove" || mode === "reset") {
			if (Number(role || 0) < 1) return message.reply({ body: "Only group admins can remove all shortcuts.", effect: "love" });
			await threadsData.set(threadID, [], "data.shortcut");
			return message.reply({ body: "All shortcuts in this group were removed.", effect: "love" });
		}

		if (mode === "list") {
			if (!list.length) return message.reply({ body: "No shortcuts in this group yet.", effect: "love" });
			const keyword = ["start", "end", "contain", "has", "in"].includes(String(args[1] || "").toLowerCase())
				? args.slice(2).join(" ").trim()
				: args.slice(1).join(" ").trim();
			const type = ["start", "end", "contain", "has", "in"].includes(String(args[1] || "").toLowerCase())
				? String(args[1]).toLowerCase()
				: "contain";
			const shown = listOf(list, keyword, type);
			if (!shown.length) return message.reply({ body: `No shortcut matches "${keyword}".`, effect: "love" });
			return message.reply({ body: `Shortcuts (${shown.length}):\n${shown.map(x => `• ${x.key} => ${x.content}`).join("\n")}`, effect: "love" });
		}

		return message.reply(
			`Shortcuts by ${AUTHOR}\n` +
			`Usage:\n${prefix}shortcut add <key> => <text>\n${prefix}shortcut del <key>\n` +
			`${prefix}shortcut list\n${prefix}shortcut remove`
		);
	},

	onChat: async function ({ api, event, threadsData }) {
		if (event.type !== "message") return;
		if (typeof event.body !== "string" || !event.body.trim()) return;
		if (event.senderID === api.getCurrentUserID()) return;

		let prefix = "(";
		try {
			if (global.utils && typeof global.utils.getPrefix === "function")
				prefix = global.utils.getPrefix(event.threadID) || prefix;
		} catch (e) { /* keep default */ }
		if (event.body.startsWith(prefix)) return;

		const keyCheck = String(event.body).trim().toLowerCase();
		const list = await threadsData.get(event.threadID, "data.shortcut", []);
		if (!Array.isArray(list) || !list.length) return;

		const hit = list.find(x => keyCheck === x.key || keyCheck.startsWith(`${x.key} `));
		if (!hit) return;

		const now = Date.now();
		const coolKey = `${event.threadID}:${hit.key}`;
		if (now - (lastExpansion.get(coolKey) || 0) < 1500) return;
		lastExpansion.set(coolKey, now);
		if (lastExpansion.size > 2000) lastExpansion.clear();

		const extra = keyCheck.slice(hit.key.length).trim();
		try {
			api.sendMessage(extra ? `${hit.content} ${extra}` : hit.content, event.threadID, undefined, event.messageID);
		} catch (e) { /* ignore */ }
	}
};
