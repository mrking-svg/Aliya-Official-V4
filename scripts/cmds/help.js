const { getPrefix } = global.utils;
const { commands } = global.GoatBot;

const PER_PAGE = 15;

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

function roleLabel(role) {
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
			category: clean(c.category || "OTHER").toUpperCase(),
			description: clean(valueOf(c.shortDescription, valueOf(c.description, valueOf(c.longDescription, "")))),
			aliases: Array.isArray(c.aliases) ? c.aliases.map(clean).filter(Boolean) : [],
			role: Number.isInteger(c.role) ? c.role : 0,
			guide: valueOf(c.guide, ""),
			countDown: c.countDown || 5
		});
	}
	list.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
	return list;
}

function buildPage(list, page, totalPages, prefix) {
	const items = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);
	let out = `ALIYA V4 - COMMAND LIST\n`;
	out += `Page ${page}/${totalPages} | Total commands: ${list.length} | Prefix: ${prefix}\n\n`;
	for (const item of items) {
		out += `${prefix}${item.name}`;
		if (item.description) out += ` - ${item.description}`;
		out += `\n`;
	}
	out += `\nUse ${prefix}help <page> to switch page`;
	out += `\nUse ${prefix}help <command> for details`;
	return out;
}

function buildDetail(item, prefix) {
	const usage = clean(item.guide).replace(/\{pn\}/g, `${prefix}${item.name}`) || `${prefix}${item.name}`;
	let duration = `${item.countDown}s`;
	try {
		if (global.utils && typeof global.utils.formatDuration === "function") {
			duration = global.utils.formatDuration(item.countDown);
		}
	}
	catch (e) { /* keep the simple seconds fallback */ }

	return `COMMAND DETAILS\n\n`
		+ `Name: ${item.name}\n`
		+ `Category: ${item.category}\n`
		+ `Description: ${item.description || "No description"}\n`
		+ `Aliases: ${item.aliases.length ? item.aliases.join(", ") : "None"}\n`
		+ `Permission: ${roleLabel(item.role)}\n`
		+ `Cooldown: ${duration}\n`
		+ `Usage: ${usage}`;
}

function findCommand(list, input) {
	const query = clean(input).toLowerCase();
	if (!query) return null;
	return list.find(item => item.name.toLowerCase() === query)
		|| list.find(item => item.aliases.some(alias => alias.toLowerCase() === query))
		|| null;
}

function registerReply(message, content, page, totalPages, author) {
	message.reply(content, (err, info) => {
		if (err || !info || !info.messageID) return;
		global.GoatBot.onReply.set(info.messageID, {
			commandName: "help",
			messageID: info.messageID,
			author,
			page,
			totalPages
		});
	});
}

module.exports = {
	config: {
		name: "help",
		aliases: ["menu-base", "cmds-base", "menu"],
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
		const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
		const input = args.join(" ").trim();

		let content;
		let page = 1;

		if (/^\d+$/.test(input)) {
			page = Math.min(Math.max(parseInt(input, 10), 1), totalPages);
			content = buildPage(list, page, totalPages, prefix);
		}
		else {
			const found = findCommand(list, input);
			content = found ? buildDetail(found, prefix) : buildPage(list, page, totalPages, prefix);
		}

		return registerReply(message, content, page, totalPages, event.senderID);
	},

	onReply: async function ({ message, event, Reply }) {
		if (event.senderID !== Reply.author) return;
		const body = clean(event.body);
		if (!/^\d+$/.test(body)) return;

		const page = parseInt(body, 10);
		if (page < 1 || page > Reply.totalPages) return;

		const prefix = getPrefix(event.threadID);
		const list = getAllCommands();
		const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
		return registerReply(message, buildPage(list, page, totalPages, prefix), page, totalPages, event.senderID);
	}
};
