const path = require("path");
const fs = require("fs-extra");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const sharp = require("sharp");

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
	const abs = Math.abs(n);
	const units = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
	for (const [unit, suffix] of units) {
		if (abs >= unit) return `${Number((n / unit).toFixed(2))}${suffix}`;
	}
	return String(Math.round(n));
}

function parseAmount(value) {
	if (global.utils && typeof global.utils.parseMoney === "function") {
		const parsed = global.utils.parseMoney(value);
		if (Number.isFinite(parsed)) return Math.floor(parsed);
	}
	if (typeof value === "number") return Number.isFinite(value) ? Math.floor(value) : NaN;
	const raw = String(value == null ? "" : value).trim().replace(/[$,]/g, "").toLowerCase();
	const match = raw.match(/^(\d+(?:\.\d+)?)\s*([kmbt]?)$/);
	if (!match) return NaN;
	const multipliers = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };
	return Math.floor(Number(match[1]) * (multipliers[match[2]] || 1));
}

function shortName(name, maxLength = 18) {
	if (!name) return "Regular User";
	const text = String(name);
	return text.length <= maxLength ? text : text.slice(0, maxLength) + "...";
}

function getBank(user) {
	const raw = (user && user.data && typeof user.data.bank === "object" && !Array.isArray(user.data.bank))
		? user.data.bank
		: {};
	return {
		balance: Math.max(0, Math.floor(Number(raw.balance) || 0)),
		lastInterest: Number(raw.lastInterest) || 0,
		loan: Math.max(0, Math.floor(Number(raw.loan) || 0)),
		loanAt: Number(raw.loanAt) || 0
	};
}

async function saveBank(usersData, userID, user, bank, wallet) {
	const patch = {
		data: {
			...(user && user.data && typeof user.data === "object" ? user.data : {}),
			bank
		}
	};
	if (typeof wallet === "number" && Number.isFinite(wallet)) patch.money = wallet;
	await usersData.set(userID, patch);
}

function creditLine(user, bank, wallet) {
	const net = (Number(wallet) || 0) + (Number(bank.balance) || 0);
	return Math.max(100000, Math.min(5000000, Math.floor(net * 0.5)));
}

function amountFromArgs(args, mentions = {}) {
	const mentionKeys = new Set(Object.keys(mentions).map(id => String(id)));
	for (const raw of args || []) {
		const token = String(raw == null ? "" : raw).trim();
		if (!token || mentionKeys.has(token) || /^<@!?\d+>$/.test(token)) continue;
		const amount = parseAmount(token);
		if (Number.isFinite(amount) && amount > 0) return amount;
	}
	return NaN;
}

function targetIDFrom(event) {
	if (event.messageReply && event.messageReply.senderID) return event.messageReply.senderID;
	const mentions = event.mentions || {};
	const keys = Object.keys(mentions);
	return keys.length ? keys[0] : null;
}

function sendText({ api, event, message }, body) {
	if (message && typeof message.reply === "function") return message.reply(body);
	return api.sendMessage(body, event.threadID, event.messageID);
}

function bankCard(user, bank, wallet, userID) {
	const line = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
	const net = wallet + bank.balance - bank.loan;
	const nextInterest = bank.lastInterest
		? new Date(bank.lastInterest + 86400000).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })
		: "Ready now";
	return line + "\n" +
		"🏦  " + bold("ALIYA NATIONAL BANK") + "\n" +
		line + "\n" +
		"👤 " + bold("Account") + ": " + bold(shortName(user.name || "Facebook User", 24)) + "\n" +
		"🔢 " + bold("ID") + ": ••••" + String(userID || "").slice(-4) + "\n\n" +
		"💰 " + bold("Bank balance") + ": $" + bold(compact(bank.balance)) + "\n" +
		"🪙 " + bold("Wallet") + ": $" + bold(compact(wallet)) + "\n" +
		"💎 " + bold("Net worth") + ": $" + bold(compact(net)) + "\n\n" +
		"📈 " + bold("Savings interest") + ": +2% / 24h\n" +
		"🕒 " + bold("Next interest") + ": " + bold(nextInterest) + "\n" +
		"🧾 " + bold("Active loan") + ": $" + bold(compact(bank.loan)) + (bank.loan ? " (+5% on repay)" : "") + "\n" +
		line + "\n" +
		"💡 " + bold("Help") + ": " + bold("bank help") + "\n" +
		bold("Made with 🤍 by 0xMr_King x");
}

const BANK_HELP =
	"🏦 " + bold("BANK MENU") + "\n" +
	"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
	"• bank — your account card\n" +
	"• bank deposit <amount|all> — wallet → bank\n" +
	"• bank withdraw <amount|all> — bank → wallet\n" +
	"• bank transfer @user <amount> — bank → another bank\n" +
	"• bank loan <amount> — take a loan (max 50% net worth)\n" +
	"• bank loan repay — repay loan + 5% fee\n" +
	"• bank interest — collect 2% daily savings interest\n" +
	"• bank top — richest vault leaderboard (image)\n" +
	"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
	"Amounts accept " + bold("1K / 2.5M / 3B / 1T") + " and " + bold("all") + ".";

function shortBankName(name) {
	return shortName(name, 25);
}

async function sendBankTop(api, event, messageID, usersData) {
	const allUsers = await usersData.getAll();
	const rows = (Array.isArray(allUsers) ? allUsers : [])
		.map(user => {
			let data = user && user.data;
			if (typeof data === "string") {
				try { data = JSON.parse(data); } catch (e) { data = {}; }
			}
			const bank = data && typeof data.bank === "object" && !Array.isArray(data.bank) ? data.bank : {};
			return {
				id: user.userID,
				name: user.name || "Facebook User",
				balance: Math.max(0, Math.floor(Number(bank.balance) || 0))
			};
		})
		.filter(user => user.balance > 0)
		.sort((a, b) => b.balance - a.balance)
		.slice(0, 15);

	if (!rows.length)
		return api.sendMessage("❌ " + bold("No bank deposits yet. Use bank deposit <amount> first."), event.threadID, messageID);

	const width = 1200;
	const height = 1800;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");

	const bgUrl = "https://lh3.googleusercontent.com/d/1xJse_WHLrgUDfKUVUZfAvE3EctB40QZx";
	try {
		const response = await axios.get(bgUrl, {
			responseType: "arraybuffer",
			timeout: 12000,
			headers: { "User-Agent": "Mozilla/5.0" }
		});
		const bg = await loadImage(Buffer.from(response.data));
		ctx.drawImage(bg, 0, 0, width, height);
	}
	catch (e) {
		const grad = ctx.createLinearGradient(0, 0, width, height);
		grad.addColorStop(0, "#071427");
		grad.addColorStop(1, "#10284c");
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, width, height);
	}

	ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
	ctx.fillRect(0, 0, width, height);

	ctx.textAlign = "center";
	ctx.fillStyle = "#ffffff";
	ctx.font = "bold 70px Arial";
	ctx.shadowColor = "#ffd700";
	ctx.shadowBlur = 22;
	ctx.fillText("BANK TOP", width / 2, 100);
	ctx.fillStyle = "#ffe9a8";
	ctx.font = "30px Arial";
	ctx.shadowBlur = 8;
	ctx.fillText("RICHEST VAULTS IN ALIYA ECONOMY", width / 2, 150);
	ctx.shadowBlur = 0;

	const drawNeonCircle = (x, y, radius, color) => {
		ctx.save();
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI * 2);
		ctx.lineWidth = 8;
		ctx.strokeStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur = 20;
		ctx.stroke();
		ctx.restore();
	};

	const drawTopUser = async (user, x, y, radius, borderColor, rank, moneyColor) => {
		const avatarUrl = `https://graph.facebook.com/${user.id}/picture?width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
		try {
			const avatarData = (await axios.get(avatarUrl, { responseType: "arraybuffer", timeout: 8000 })).data;
			const circleBuffer = await sharp(avatarData)
				.resize(radius * 2, radius * 2)
				.composite([{
					input: Buffer.from(`<svg><circle cx="${radius}" cy="${radius}" r="${radius}" fill="black"/></svg>`),
					blend: "dest-in"
				}])
				.png()
				.toBuffer();
			const avatar = await loadImage(circleBuffer);
			ctx.drawImage(avatar, x - radius, y - radius, radius * 2, radius * 2);
		}
		catch (e) {
			ctx.fillStyle = "#222222";
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI * 2);
			ctx.fill();
		}
		drawNeonCircle(x, y, radius, borderColor);

		const badgeX = x + radius - 20;
		const badgeY = y - radius + 20;
		ctx.fillStyle = "#ffffff";
		ctx.shadowColor = borderColor;
		ctx.shadowBlur = 15;
		ctx.beginPath();
		ctx.arc(badgeX, badgeY, 35, 0, Math.PI * 2);
		ctx.fill();
		ctx.shadowBlur = 0;
		ctx.fillStyle = borderColor;
		ctx.font = "bold 35px Arial";
		ctx.textAlign = "center";
		ctx.fillText(`#${rank}`, badgeX, badgeY + 12);

		ctx.fillStyle = "#ffffff";
		ctx.font = "bold 38px Arial";
		ctx.fillText(shortBankName(user.name), x, y + radius + 55);
		ctx.fillStyle = moneyColor;
		ctx.font = "bold 32px Arial";
		ctx.fillText("$" + compact(user.balance), x, y + radius + 95);
	};

	if (rows[0]) await drawTopUser(rows[0], 600, 380, 140, "#ffd700", "1", "#ffcc00");
	if (rows[1]) await drawTopUser(rows[1], 280, 410, 110, "#00f0ff", "2", "#ccffff");
	if (rows[2]) await drawTopUser(rows[2], 920, 410, 110, "#00f0ff", "3", "#ccffff");

	ctx.textAlign = "left";
	const startX = 100;
	const startY = 730;
	const rowHeight = 82;
	for (let i = 3; i < rows.length; i++) {
		const user = rows[i];
		const y = startY + (i - 3) * rowHeight;
		ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
		ctx.fillRect(startX, y, width - startX * 2, 65);

		ctx.save();
		ctx.lineWidth = 8;
		ctx.strokeStyle = "#00f0ff";
		ctx.shadowColor = "#00f0ff";
		ctx.shadowBlur = 12;
		ctx.beginPath();
		ctx.moveTo(startX, y + 8);
		ctx.lineTo(startX, y + 57);
		ctx.stroke();
		ctx.restore();

		ctx.fillStyle = "#ffffff";
		ctx.font = "bold 32px Arial";
		ctx.fillText(`#${i + 1}`, startX + 30, y + 43);
		ctx.fillStyle = "#ffccff";
		ctx.fillText(shortBankName(user.name), startX + 120, y + 43);
		ctx.textAlign = "right";
		ctx.fillStyle = "#00f0ff";
		ctx.fillText("$" + compact(user.balance), width - startX - 30, y + 43);
		ctx.textAlign = "left";
	}

	let threadName = "GLOBAL BANK LEADERBOARD";
	try {
		const info = await api.getThreadInfo(event.threadID);
		if (info && info.threadName) threadName = info.threadName;
	}
	catch (e) { /* optional */ }

	ctx.textAlign = "center";
	ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
	ctx.font = "bold 35px Arial";
	ctx.fillText(String(threadName).toUpperCase(), width / 2, height - 40);

	const cacheDir = path.join(__dirname, "cache");
	fs.ensureDirSync(cacheDir);
	const filePath = path.join(cacheDir, `bank_top_${Date.now()}.png`);
	fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

	return api.sendMessage({
		body: "🏦 " + bold("BANK TOP") + " • Richest vaults",
		attachment: fs.createReadStream(filePath)
	}, event.threadID, () => {
		try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
	}, messageID);
}

module.exports = {
	config: {
		name: "bank",
		aliases: ["banking", "vault"],
		version: "1.0.0",
		author: "0xMr_King x ┃ Tanin Islam",
		countDown: 5,
		role: 0,
		category: "economy",
		shortDescription: { en: "Real bank: deposit, withdraw, transfer, loan, interest and bank top" },
		guide: { en: "{pn} | {pn} help | {pn} deposit <amount|all> | {pn} withdraw <amount|all> | {pn} transfer @user <amount> | {pn} loan <amount|repay> | {pn} interest | {pn} top" }
	},

	onStart: async function ({ api, event, args, usersData, message, messageID }) {
		const mid = event.messageID || messageID;
		const ctxSend = body => sendText({ api, event, message }, body);
		const sub = String(args[0] || "").toLowerCase();
		const senderID = event.senderID;

		try {
			const user = await usersData.get(senderID) || {};
			let wallet = Math.max(0, Math.floor(Number(user.money) || 0));
			let bank = getBank(user);

			if (!sub || ["balance", "bal", "me"].includes(sub)) {
				return ctxSend(bankCard(user, bank, wallet, senderID));
			}

			if (sub === "help") {
				return ctxSend(BANK_HELP);
			}

			if (sub === "top") {
				return sendBankTop(api, event, mid, usersData);
			}

			if (sub === "deposit") {
				const requested = String(args[1] || "").toLowerCase() === "all"
					? wallet
					: amountFromArgs(args.slice(1), event.mentions);
				if (!Number.isFinite(requested) || requested <= 0)
					return ctxSend("❌ " + bold("Usage") + ": bank deposit <amount|all>\nExample: bank deposit 1.5M");
				if (wallet < requested)
					return ctxSend("❌ " + bold("Not enough wallet money.") + "\nWallet: $" + compact(wallet));

				wallet -= requested;
				bank.balance += requested;
				await saveBank(usersData, senderID, user, bank, wallet);
				return ctxSend(
					"✅ " + bold("DEPOSIT COMPLETE") + "\n" +
					"🏦 Deposited: $" + bold(compact(requested)) + "\n" +
					"💰 Wallet now: $" + compact(wallet) + "\n" +
					"🏦 Bank now: $" + bold(compact(bank.balance))
				);
			}

			if (sub === "withdraw") {
				const requested = String(args[1] || "").toLowerCase() === "all"
					? bank.balance
					: amountFromArgs(args.slice(1), event.mentions);
				if (!Number.isFinite(requested) || requested <= 0)
					return ctxSend("❌ " + bold("Usage") + ": bank withdraw <amount|all>");
				if (bank.balance < requested)
					return ctxSend("❌ " + bold("Not enough bank balance.") + "\nBank: $" + compact(bank.balance));

				bank.balance -= requested;
				wallet += requested;
				await saveBank(usersData, senderID, user, bank, wallet);
				return ctxSend(
					"✅ " + bold("WITHDRAWAL COMPLETE") + "\n" +
					"🪙 Withdrawn: $" + bold(compact(requested)) + "\n" +
					"💰 Wallet now: $" + compact(wallet) + "\n" +
					"🏦 Bank now: $" + compact(bank.balance)
				);
			}

			if (sub === "transfer" || sub === "send") {
				const targetID = targetIDFrom(event);
				if (!targetID || String(targetID) === String(senderID))
					return ctxSend("❌ " + bold("Mention or reply to a user to transfer bank money."));
				const requested = amountFromArgs(args.slice(1), event.mentions);
				if (!Number.isFinite(requested) || requested <= 0)
					return ctxSend("❌ " + bold("Usage") + ": bank transfer @user <amount>");
				if (bank.balance < requested)
					return ctxSend("❌ " + bold("Not enough bank balance.") + "\nBank: $" + compact(bank.balance));

				const target = await usersData.get(targetID) || {};
				const targetBank = getBank(target);
				bank.balance -= requested;
				targetBank.balance += requested;
				await saveBank(usersData, senderID, user, bank);
				await saveBank(usersData, targetID, target, targetBank);
				return ctxSend(
					"✅ " + bold("BANK TRANSFER COMPLETE") + "\n" +
					"👤 To: " + bold(shortName(target.name || "Facebook User", 24)) + "\n" +
					"💸 Amount: $" + bold(compact(requested)) + "\n" +
					"🏦 Your bank: $" + compact(bank.balance)
				);
			}

			if (sub === "loan") {
				const action = String(args[1] || "").toLowerCase();
				const line = creditLine(user, bank, wallet);

				if (action === "repay" || action === "pay" || action === "payoff") {
					if (!bank.loan)
						return ctxSend("✅ " + bold("You have no active loan."));
					const total = Math.ceil(bank.loan * 1.05);
					if (wallet + bank.balance < total)
						return ctxSend("❌ " + bold("Not enough funds to repay.") + "\nNeeded: $" + compact(total) + "\nWallet + bank: $" + compact(wallet + bank.balance));

					let remaining = total;
					const fromBank = Math.min(bank.balance, remaining);
					bank.balance -= fromBank;
					remaining -= fromBank;
					const fromWallet = Math.min(wallet, remaining);
					wallet -= fromWallet;
					remaining -= fromWallet;
					bank.loan = 0;
					bank.loanAt = 0;
					await saveBank(usersData, senderID, user, bank, wallet);
					return ctxSend(
						"✅ " + bold("LOAN CLEARED") + "\n" +
						"🧾 Paid: $" + bold(compact(total)) + " (principal + 5% fee)\n" +
						"🏦 From bank: $" + compact(fromBank) + " | 🪙 From wallet: $" + compact(fromWallet) + "\n" +
						"💎 Debt free. Nice."
					);
				}

				if (bank.loan > 0)
					return ctxSend("❌ " + bold("Repay your active loan first.") + "\nActive: $" + compact(bank.loan) + "\nUse: bank loan repay");

				const requested = parseAmount(args[1]);
				if (!Number.isFinite(requested) || requested <= 0) {
					return ctxSend(
						"🏦 " + bold("LOAN OFFER") + "\n" +
						"💳 Credit line: $" + bold(compact(line)) + "\n" +
						"📉 Interest: " + bold("5%") + " flat on repay\n" +
						"💡 Usage: bank loan <amount> | bank loan repay"
					);
				}
				if (requested > line - bank.loan)
					return ctxSend("❌ " + bold("Loan limit exceeded.") + "\nMax now: $" + compact(line - bank.loan));

				bank.balance += requested;
				bank.loan += requested;
				bank.loanAt = Date.now();
				await saveBank(usersData, senderID, user, bank, wallet);
				return ctxSend(
					"✅ " + bold("LOAN APPROVED") + "\n" +
					"💳 Principal: $" + bold(compact(requested)) + "\n" +
					"🏦 Bank balance: $" + compact(bank.balance) + "\n" +
					"🧾 Total due: $" + compact(Math.ceil(requested * 1.05)) + "\n" +
					"💡 Repay with: bank loan repay"
				);
			}

			if (sub === "interest" || sub === "claim") {
				if (!bank.balance)
					return ctxSend("❌ " + bold("No savings interest.") + " Deposit money in your bank first.");
				const elapsed = Date.now() - bank.lastInterest;
				if (bank.lastInterest && elapsed < 86400000) {
					const hoursLeft = ((86400000 - elapsed) / 3600000).toFixed(1);
					return ctxSend("⏳ " + bold("Interest not ready.") + "\nNext claim in ~" + bold(hoursLeft + "h"));
				}
				const interest = Math.max(1, Math.floor(bank.balance * 0.02));
				bank.balance += interest;
				bank.lastInterest = Date.now();
				await saveBank(usersData, senderID, user, bank, wallet);
				return ctxSend(
					"📈 " + bold("DAILY INTEREST PAID") + "\n" +
					"💰 Interest: +$" + bold(compact(interest)) + " (2%)\n" +
					"🏦 Bank now: $" + bold(compact(bank.balance)) + "\n" +
					"🕒 Next interest: 24h later"
				);
			}

			return ctxSend("❌ " + bold("Unknown bank command.") + "\nUse: bank help");
		}
		catch (error) {
			console.error("BANK ERROR", error);
			return ctxSend("❌ " + bold("Bank error.") + " " + (error && error.message ? error.message : "Try again."));
		}
	}
};
