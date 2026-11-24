const axios = require("axios");
const { getPrefix } = global.utils;
const { commands } = global.GoatBot;

const FOLDER_ID = "1Z7l0gyGeoladQdvVsJpwG8W16UXTMhOX";
const CATEGORIES_PER_PAGE = 5;
const AUTO_DELETE_MS = 120000;

function valueOf(value, fallback = "") {
	if (typeof value === "string") return value;
	if (value && typeof value === "object") {
		return value.en || value.bn || value.vi || Object.values(value)[0] || fallback;
	}
	return fallback;
}

function clean(value) {
	return String(value || "").replace(/\s+/g, " ").trim();
}

function roleText(role) {
	const labels = ["All users", "Group admin", "Bot admin", "Bot owner", "Bot developer"];
	return labels[role] || "All users";
}

function getAllCommands() {
	const list = [];
	for (const [key, cmd] of commands) {
		if (!cmd || !cmd.config) continue;
		const c = cmd.config;
		const name = clean(c.name || key);
		if (!name) continue;
		list.push({
			name,
			category: clean(c.category || "UNCATEGORIZED").toUpperCase(),
			shortDescription: clean(valueOf(c.shortDescription, valueOf(c.description, valueOf(c.longDescription, "")))),
			aliases: Array.isArray(c.aliases) ? c.aliases.map(clean).filter(Boolean) : [],
			version: clean(c.version || "4.0.0"),
			role: Number.isInteger(c.role) ? c.role : 0,
			countDown: c.countDown || 5,
			author: clean(c.author || "Uɴᴋɴᴏᴡɴ"),
			guide: valueOf(c.guide, "")
		});
	}
	list.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
	return list;
}

function groupByCategory(list) {
	const categories = {};
	for (const item of list) {
		if (!categories[item.category]) {
			categories[item.category] = [];
		}
		categories[item.category].push(item.name);
	}
	return categories;
}

function findCommand(list, input) {
	const query = clean(input).toLowerCase();
	if (!query) return null;
	return list.find(item => item.name.toLowerCase() === query)
		|| list.find(item => item.aliases.some(alias => alias.toLowerCase() === query))
		|| null;
}

async function getRandomDriveAttachment(api, messageID) {
	try {
		if (messageID) api.setMessageReaction("🛜", messageID, () => {}, true);

		const response = await axios.get(`https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}`).catch(async () => {
			return await axios.get(`https://docs.google.com/uc?export=list&id=${FOLDER_ID}`);
		});

		const htmlData = response.data;
		const matches = [...htmlData.matchAll(/"([^"]+)"\s*,\s*\[\s*"([^"]+)"\s*,\s*([0-9]+)\s*,\s*"([^"]+)"/g)];

		let fileId = "";
		if (matches && matches.length > 0) {
			const randomMatch = matches[Math.floor(Math.random() * matches.length)];
			fileId = randomMatch[1];
		} else {
			const fallbackMatches = [...htmlData.matchAll(/\/file\/d\/([a-zA-Z0-9_-]+)\/view/g)];
			if (fallbackMatches.length > 0) {
				fileId = fallbackMatches[Math.floor(Math.random() * fallbackMatches.length)][1];
			}
		}

		if (!fileId) {
			if (messageID) api.setMessageReaction("❌", messageID, () => {}, true);
			return [];
		}

		if (messageID) api.setMessageReaction("☃️", messageID, () => {}, true);
		const downloadUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
		const stream = await global.utils.getStreamFromURL(downloadUrl);
		return stream ? [stream] : [];
	} catch (err) {
		console.error("Drive attachment error:", err);
		if (messageID) api.setMessageReaction("❌", messageID, () => {}, true);
		return [];
	}
}

async function sendAutoDeleteMessage(api, event, message, body, replyMeta = null) {
	const { messageID } = event;
	const attachment = await getRandomDriveAttachment(api, messageID);
	const payload = attachment.length ? { body, attachment } : { body };

	message.reply(payload, (err, info) => {
		if (err || !info || !info.messageID) {
			if (messageID) api.setMessageReaction("❌", messageID, () => {}, true);
			return;
		}

		if (messageID) api.setMessageReaction("🍃", messageID, () => {}, true);

		if (replyMeta) {
			global.GoatBot.onReply.set(info.messageID, {
				commandName: "help",
				messageID: info.messageID,
				author: replyMeta.author,
				page: replyMeta.page,
				totalPages: replyMeta.totalPages
			});
		}

		setTimeout(() => {
			api.unsendMessage(info.messageID, () => {});
			if (replyMeta) {
				global.GoatBot.onReply.delete(info.messageID);
			}
		}, AUTO_DELETE_MS);
	});
}

function buildDetailMessage(c, prefix) {
	const aliasText = c.aliases.length ? c.aliases.join(", ") : "None";
	const usage = clean(c.guide).replace(/\{pn\}|\{p\}/g, `${prefix}${c.name}`) || `${prefix}${c.name}`;

	return `𓍢ִ໋🌸✧ ── ͟͟͞͞Cᴏᴍᴍᴀɴᴅ Dᴇᴛᴀɪʟs ── ✧🌸𓍢ִ໋🌷͙֒ ᥫ᭡—͞  

ᥫ᭡ Nᴀᴍᴇ : ${c.name}
ᥫ᭡ Cᴀᴛᴇɢᴏʀʏ : ${(c.category || "UNCATEGORIZED").toUpperCase()}
ᥫ᭡ Dᴇsᴄʀɪᴘᴛɪᴏɴ : ${c.shortDescription || "N/A"}
ᥫ᭡ Aʟɪᴀsᴇs : ${aliasText}
ᥫ᭡ Vᴇʀsɪᴏɴ : ${c.version || "4.0.0"}
ᥫ᭡ Pᴇʀᴍɪssɪᴏɴ : ${roleText(c.role)}
ᥫ᭡ Cᴏᴏʟᴅᴏᴡɴ : ${c.countDown || 5}s
ᥫ᭡ Aᴜᴛʜᴏʀ : ${c.author || "Uɴᴋɴᴏᴡɴ"}
ᥫ᭡ Usᴀɢᴇ : ${usage}

𓍢ִ໋🌷 Aᴜᴛᴏ ᴅᴇʟᴇᴛɪɴɢ ɪɴ 2 ᴍɪɴᴜᴛᴇs... ✨`;
}

function buildMenuMessage(list, page, prefix) {
	const categories = groupByCategory(list);
	const catNames = Object.keys(categories);
	const totalCmds = list.length;
	const totalPages = Math.max(1, Math.ceil(catNames.length / CATEGORIES_PER_PAGE));

	if (page < 1 || page > totalPages) page = 1;

	const pageCats = catNames.slice((page - 1) * CATEGORIES_PER_PAGE, page * CATEGORIES_PER_PAGE);

	let helpText = `𓍢ִ໋🌸✧ ── ͟͟͞͞Aliya v4 Menu ── ✧🌸𓍢ִ໋🌷͙֒ ᥫ᭡—͞  \n\n`;
	helpText += `🌸 Pᴀɢᴇ : ${page}/${totalPages} ✧ Tᴏᴛᴀʟ : ${totalCmds} Cᴍᴅs\n`;
	helpText += `🌸 Pʀᴇғɪx : ${prefix}\n\n`;

	pageCats.forEach((cat) => {
		helpText += `𓍢ִ໋🌷͙֒ ✨ ── ${cat} ── ✨\n`;
		const cmds = categories[cat];
		helpText += `ᥫ᭡ ${cmds.join(" • ")}\n\n`;
	});

	helpText += `𓍢ִ໋🌷 Aᴜᴛᴏ ᴅᴇʟᴇᴛɪɴɢ ɪɴ 2 ᴍɪɴᴜᴛᴇs... ✨`;

	return { helpText, page, totalPages };
}

module.exports = {
	config: {
		name: "help",
		aliases: ["menu-base", "cmds-base"],
		version: "4.1.0",
		author: "0xMr_King x ┃ Tanin Islam",
		countDown: 5,
		role: 0,
		category: "info",
		shortDescription: "Show all available commands",
		guide: "{pn} | {pn} <page> | {pn} <command>"
	},

	onStart: async function ({ api, message, args, event }) {
		const prefix = getPrefix(event.threadID);
		const list = getAllCommands();
		const input = args.join(" ").trim();

		if (input && !/^\d+$/.test(input)) {
			const c = findCommand(list, input);
			if (c) {
				const infoMsg = buildDetailMessage(c, prefix);
				return sendAutoDeleteMessage(api, event, message, infoMsg);
			}
		}

		const requestedPage = parseInt(input, 10) || 1;
		const { helpText, page, totalPages } = buildMenuMessage(list, requestedPage, prefix);

		return sendAutoDeleteMessage(api, event, message, helpText, {
			author: event.senderID,
			page,
			totalPages
		});
	},

	onReply: async function ({ api, message, event, Reply }) {
		if (event.senderID !== Reply.author) return;
		const body = clean(event.body);
		if (!/^\d+$/.test(body)) return;

		const requestedPage = parseInt(body, 10);
		if (requestedPage < 1 || requestedPage > Reply.totalPages) return;

		const prefix = getPrefix(event.threadID);
		const list = getAllCommands();
		const { helpText, page, totalPages } = buildMenuMessage(list, requestedPage, prefix);

		return sendAutoDeleteMessage(api, event, message, helpText, {
			author: event.senderID,
			page,
			totalPages
		});
	}
};
			
