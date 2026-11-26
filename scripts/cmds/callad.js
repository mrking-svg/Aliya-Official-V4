const AUTHOR = "0xMr_King x ┃ Tanin Islam";
const { getStreamsFromAttachment } = global.utils;
const MEDIA = ["photo", "png", "animated_image", "video", "audio"];
const cooldown = new Map();

function textOf(args) {
	return args.join(" ").trim();
}

module.exports = {
	config: {
		name: "callad",
		aliases: ["report", "feedback"],
		version: "2.0.0",
		author: AUTHOR,
		countDown: 10,
		role: 0,
		category: "system",
		shortDescription: "Send feedback to bot admins and get a reply back",
		guide: {
			en: "{pn} <message>   send a report to all bot admins"
		}
	},

	onStart: async function ({ message, event, args, usersData, threadsData, api, commandName, prefix }) {
		const body = textOf(args);
		if (!body) return message.reply({ body: `Please write your message. Usage: ${prefix}callad <message>`, effect: "love" });

		const cfg = global.GoatBot.config;
		const adminIDs = (cfg.adminBot || []).map(String);
		if (!adminIDs.length) return message.reply({ body: "No bot admin is configured.", effect: "love" });

		const uid = String(event.senderID);
		const last = cooldown.get(uid) || 0;
		if (Date.now() - last < 60000) return message.reply({ body: "Please wait one minute before sending another report.", effect: "love" });
		cooldown.set(uid, Date.now());

		const name = await usersData.getName(uid).catch(() => uid);
		const thread = event.isGroup ? await threadsData.get(event.threadID).catch(() => null) : null;
		const source = event.isGroup
			? `\n- Group: ${(thread && thread.threadName) || event.threadID}\n- Thread ID: ${event.threadID}`
			: "\n- Source: direct message";

		const attachments = await getStreamsFromAttachment([
			...(event.attachments || []),
			...((event.messageReply && event.messageReply.attachments) || [])
		].filter(item => MEDIA.includes(item.type)));

		const content =
			`📨 FEEDBACK\n- From: ${name} (${uid})${source}\n\n` +
			`${body}\n\nReply to this message to send a response back.`;

		let sent = 0;
		let failed = 0;
		for (const adminID of adminIDs) {
			try {
				const out = await api.sendMessage(
					{ body: content, attachment: attachments.length ? attachments : undefined },
					adminID
				);
				sent++;
				if (out && out.messageID && global.GoatBot.onReply)
					global.GoatBot.onReply.set(out.messageID, {
						commandName,
						type: "toUser",
						senderUID: uid,
						threadID: event.threadID,
						messageIDSender: event.messageID,
						author: adminID
					});
			} catch (e) {
				failed++;
			}
		}

		return message.reply({ body: `Sent your feedback to ${sent} admin(s).${failed ? ` Failed: ${failed}.` : ""}`, effect: "love" });
	},

	onReply: async function ({ message, event, api, args, Reply, usersData, commandName, prefix }) {
		if (!Reply || !["toUser", "toAdmin"].includes(Reply.type)) return;

		if (Reply.type === "toUser") {
			const admins = (global.GoatBot.config.adminBot || []).map(String);
			if (!admins.includes(String(event.senderID))) return;
			const body = args.join(" ").trim();
			if (!body) return message.reply({ body: "Write a reply first.", effect: "love" });

			try {
				const out = await api.sendMessage(
					{ body: `📍 Reply from admin ${event.senderID}:\n\n${body}\n\nReply to this message to continue.`, effect: "love" },
					Reply.threadID,
					undefined,
					Reply.messageIDSender
				);
				if (out && out.messageID && global.GoatBot.onReply)
					global.GoatBot.onReply.set(out.messageID, {
						commandName,
						type: "toAdmin",
						adminID: event.senderID,
						threadID: event.threadID,
						messageIDSender: event.messageID,
						author: Reply.senderUID
					});
				return message.reply({ body: "Your reply was delivered.", effect: "love" });
			} catch (e) {
				return message.reply({ body: `Could not deliver the reply: ${e.message}`, effect: "love" });
			}
		}

		if (String(event.senderID) !== String(Reply.author)) return;
		const body = args.join(" ").trim();
		if (!body) return message.reply({ body: "Write a reply first.", effect: "love" });

		try {
			const out = await api.sendMessage(
				{ body: `📝 Reply from user ${event.senderID}:\n\n${body}\n\nReply to this message to continue.`, effect: "love" },
				Reply.adminID,
				undefined,
				Reply.messageIDSender
			);
			if (out && out.messageID && global.GoatBot.onReply)
				global.GoatBot.onReply.set(out.messageID, {
					commandName,
					type: "toUser",
					senderUID: event.senderID,
					threadID: event.threadID,
					messageIDSender: event.messageID,
					author: Reply.adminID
				});
			return message.reply({ body: "Your reply was delivered to the admin.", effect: "love" });
		} catch (e) {
			return message.reply({ body: `Could not deliver the reply: ${e.message}`, effect: "love" });
		}
	}
};
