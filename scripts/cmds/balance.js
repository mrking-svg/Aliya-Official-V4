const BOLD_MAP = (() => {
	const map = {};
	const plain = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");
	const glyphs = Array.from("𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗");
	for (let i = 0; i < plain.length; i++) map[plain[i]] = glyphs[i];
	return map;
})();

function bold(text) {
	return Array.from(String(text == null ? "" : text)).map(ch => BOLD_MAP[ch] || ch).join("");
}

function compact(value) {
	if (global.utils && typeof global.utils.formatCompact === "function")
		return global.utils.formatCompact(value);
	const n = Number(value) || 0;
	if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
	if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
	if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
	if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
	return String(Math.round(n));
}

module.exports = {
	config: {
		name: "balance",
		aliases: ["bal", "money"],
		version: "1.5.0",
		author: "0xMr_King x ┃ Tanin Islam",
		countDown: 5,
		role: 0,
		category: "economy",
		shortDescription: { en: "Check wallet, bank and net worth with compact format" },
		guide: { en: "{pn} | {pn} @mention | reply to a message" }
	},

	onStart: async function ({ api, event, usersData }) {
		const { threadID, messageID, mentions, messageReply, senderID } = event;
		let targetID = senderID;

		if (messageReply) targetID = messageReply.senderID;
		else if (mentions && Object.keys(mentions).length) targetID = Object.keys(mentions)[0];

		try {
			const userData = await usersData.get(targetID) || {};
			const name = userData.name || "Facebook User";
			const wallet = Number(userData.money) || 0;
			const bank = Number(userData.data?.bank?.balance || 0);
			const net = wallet + bank;

			const card =
				"╭──────────────────────────────╮\n" +
				"│  " + bold("ALIYA ECONOMY CARD") + "  │\n" +
				"╰──────────────────────────────╯\n\n" +
				"👤 " + bold("User") + ": " + bold(name) + "\n" +
				"🪙 " + bold("Wallet") + ": $" + bold(compact(wallet)) + "\n" +
				"🏦 " + bold("Bank") + ": $" + bold(compact(bank)) + "\n" +
				"💎 " + bold("Net worth") + ": $" + bold(compact(net)) + "\n\n" +
				"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
				"🌸 " + bold("Status") + ": " + bold("Cutest Pookie") + " ✨\n" +
				"💡 " + bold("Use") + ": " + bold("bank") + " / " + bold("stock") + " / " + bold("top") + "\n" +
				"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
				"𝐌𝐚𝐝𝐞 𝐰𝐢𝐭𝐡 🤍 𝐛𝐲 𝟎𝐱𝐌𝐫_𝐊𝐢𝐧𝐠 𝐱";

			return api.sendMessage(card, threadID, messageID);
		}
		catch (err) {
			console.error("BALANCE", err);
			return api.sendMessage("❌ " + bold("Could not load balance. Please try again."), threadID, messageID);
		}
	}
};
