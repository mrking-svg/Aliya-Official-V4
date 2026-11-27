const AUTHOR = "0xMr_King x ┃ Tanin Islam";

function commandExists(name) {
	return !!(global.GoatBot && global.GoatBot.commands && global.GoatBot.commands.has(name));
}

function aliasExists(name) {
	return !!(global.GoatBot && global.GoatBot.aliases && global.GoatBot.aliases.has(name));
}

function formatList(data) {
	return Object.keys(data).map(name => `• ${name}: ${(data[name] || []).join(", ")}`).join("\n");
}

module.exports = {
	config: {
		name: "setalias",
		aliases: ["addalias"],
		version: "2.0.0",
		author: AUTHOR,
		countDown: 5,
		role: 0,
		category: "config",
		shortDescription: "Add or remove group/global command aliases",
		guide: {
			en: "{pn} add <alias> <command>\n" +
				"{pn} add <alias> <command> -g   bot admin only\n" +
				"{pn} remove <alias> <command>\n" +
				"{pn} list [-g]"
		}
	},

	onStart: async function ({ message, event, args, threadsData, globalData, role, prefix }) {
		const mode = String(args[0] || "").toLowerCase();
		let local = await threadsData.get(event.threadID, "data.aliases", {});
		if (!local || typeof local !== "object" || Array.isArray(local)) local = {};

		if (!mode || mode === "help") {
			return message.reply(
				`Alias manager by ${AUTHOR}\n` +
				`Usage:\n${prefix}setalias add <alias> <command>\n` +
				`${prefix}setalias add <alias> <command> -g\n` +
				`${prefix}setalias remove <alias> <command>\n${prefix}setalias list [-g]`
			);
		}

		if (mode === "list") {
			if (String(args[1] || "").toLowerCase() === "-g") {
				const stored = await globalData.get("setalias", "data", []);
				const list = Array.isArray(stored) ? stored : [];
				if (!list.length) return message.reply({ body: "No global aliases are configured." });
				return message.reply({ body: `Global aliases:\n${list.map(item => `• ${item.commandName}: ${(item.aliases || []).join(", ")}`).join("\n")}` });
			}
			if (!Object.keys(local).length) return message.reply({ body: "This group has no custom aliases." });
			return message.reply({ body: `Group aliases:\n${formatList(local)}` });
		}

		if (!["add", "remove", "rm", "delete", "-d"].includes(mode))
			return message.reply({ body: `Unknown option "${mode}". Use ${prefix}setalias for the command list.` });

		const alias = String(args[1] || "").toLowerCase();
		const commandName = String(args[2] || "").toLowerCase();
		const globalMode = String(args[3] || "").toLowerCase() === "-g";
		if (!alias || !commandName) return message.reply({ body: `Usage: ${prefix}setalias ${mode} <alias> <command>` });

		const adding = mode === "add";
		const adminLevel = Number(role || 0) >= 2;

		if (globalMode) {
			if (!adminLevel) return message.reply({ body: "Only bot admins can change global aliases." });
			if (adding && (commandExists(alias) || aliasExists(alias)))
				return message.reply({ body: `Alias "${alias}" is already used by a command or alias.` });

			const stored = await globalData.get("setalias", "data", []);
			const list = Array.isArray(stored) ? stored : [];
			let entry = list.find(item => item && item.commandName === commandName);
			if (!entry) {
				entry = { commandName, aliases: [] };
				list.push(entry);
			}
			const index = (entry.aliases || []).indexOf(alias);
			if (adding && index === -1) entry.aliases.push(alias);
			if (!adding && index > -1) entry.aliases.splice(index, 1);
			if (!entry.aliases.length) list.splice(list.indexOf(entry), 1);

			await globalData.set("setalias", list, "data");
			if (adding) global.GoatBot.aliases.set(alias, commandName);
			else global.GoatBot.aliases.delete(alias);
			return message.reply({ body: `${adding ? "Added" : "Removed"} global alias "${alias}" ${adding ? "for" : "from"} "${commandName}".` });
		}

		if (adding && commandExists(alias))
			return message.reply({ body: `Alias "${alias}" is already a command name.` });
		for (const name of Object.keys(local))
			if ((local[name] || []).includes(alias))
				return message.reply({ body: `Alias "${alias}" is already used in this group.` });

		const list = Array.isArray(local[commandName]) ? local[commandName] : [];
		const index = list.indexOf(alias);
		if (adding && index === -1) list.push(alias);
		if (!adding && index > -1) list.splice(index, 1);
		if (list.length) local[commandName] = list;
		else delete local[commandName];

		await threadsData.set(event.threadID, local, "data.aliases");
		return message.reply({ body: `${adding ? "Added" : "Removed"} group alias "${alias}" ${adding ? "for" : "from"} "${commandName}".` });
	}
};
