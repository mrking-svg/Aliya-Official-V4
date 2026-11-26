const activeTransfers = new Set();

function formatCoins(value) {
	if (global.utils && typeof global.utils.formatCompact === "function")
		return global.utils.formatCompact(value);
	const number = Number(value) || 0;
	if (number >= 1e12) return (number / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
	if (number >= 1e9) return (number / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
	if (number >= 1e6) return (number / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
	if (number >= 1e3) return (number / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
	return String(number);
}

function parseTarget(args, event) {
	const mentions = event.mentions || {};
	const mentionIDs = Object.keys(mentions);

	if (mentionIDs.length) {
		return { targetID: mentionIDs[0], amountText: args.filter(arg => !/^@/.test(arg)).join(" ") };
	}

	if (event.messageReply && event.messageReply.senderID) {
		return { targetID: event.messageReply.senderID, amountText: args.join(" ") };
	}

	if (/^\d+$/.test(args[0] || "")) {
		return { targetID: args[0], amountText: args.slice(1).join(" ") };
	}

	return { targetID: null, amountText: args.join(" ") };
}

async function displayName(api, usersData, userID) {
	try {
		if (usersData && typeof usersData.getName === "function") {
			const name = await usersData.getName(userID);
			if (name) return name;
		}
	}
	catch (e) { /* fall through to the Facebook lookup */ }

	try {
		const info = await api.getUserInfo(userID);
		if (info && info[userID] && info[userID].name) return info[userID].name;
	}
	catch (e) { /* keep the ID as the display name */ }

	return String(userID);
}

module.exports = {
	config: {
		name: "sendmoney",
		aliases: ["send", "transfer", "pay"],
		version: "1.0.0",
		author: "0xMr_King x ┃ Tanin Islam",
		countDown: 5,
		role: 0,
		category: "economy",
		shortDescription: "Transfer coins to another user",
		guide: "{pn} @user <amount> | {pn} <userID> <amount> | reply: {pn} <amount>"
	},

	onStart: async function ({ api, message, event, args, usersData, senderName }) {
		const senderID = String(event.senderID);
		const { targetID: rawTarget, amountText } = parseTarget(args, event);
		const targetID = rawTarget ? String(rawTarget) : null;

		if (!targetID) {
			return message.reply({ body: "Mention a user, reply to their message, or provide their user ID to send coins.", effect: "love" });
		}

		if (targetID === senderID) {
			return message.reply({ body: "You cannot send coins to yourself.", effect: "love" });
		}

		const amount = (global.utils && typeof global.utils.parseMoney === "function")
			? global.utils.parseMoney(amountText)
			: Number(String(amountText || "").replace(/,/g, "").trim());
		if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
			return message.reply({ body: "Enter a valid positive whole number of coins to send.", effect: "love" });
		}

		if (activeTransfers.has(senderID)) {
			return message.reply({ body: "Another transfer is still in progress. Please try again in a moment.", effect: "love" });
		}

		activeTransfers.add(senderID);
		try {
			if (!usersData || typeof usersData.get !== "function" || typeof usersData.subtractMoney !== "function" || typeof usersData.addMoney !== "function") {
				return message.reply({ body: "The wallet database is not available right now.", effect: "love" });
			}

			const [senderData, receiverData] = await Promise.all([
				usersData.get(senderID),
				usersData.get(targetID)
			]);

			const senderBalance = Number(senderData.money) || 0;
			const receiverBalance = Number(receiverData.money) || 0;

			if (senderBalance < amount) {
				return message.reply({ body: `You do not have enough coins. Your balance: ${formatCoins(senderBalance)} coins.`, effect: "love" });
			}

			await usersData.subtractMoney(senderID, amount);
			await usersData.addMoney(targetID, amount);

			const [newSenderData, newReceiverData] = await Promise.all([
				usersData.get(senderID),
				usersData.get(targetID)
			]);

			const fromName = senderName || await displayName(api, usersData, senderID);
			const toName = await displayName(api, usersData, targetID);

			return message.reply(
				`TRANSFER SUCCESSFUL\n\n`
				+ `From: ${fromName}\n`
				+ `To: ${toName}\n`
				+ `Amount: ${formatCoins(amount)} coins\n`
				+ `Sender balance: ${formatCoins(newSenderData.money)} coins\n`
				+ `Receiver balance: ${formatCoins(newReceiverData.money)} coins`
			);
		}
		catch (error) {
			console.error("SENDMONEY", error);
			return message.reply({ body: "The transfer could not be completed. Please try again.", effect: "love" });
		}
		finally {
			activeTransfers.delete(senderID);
		}
	}
};
