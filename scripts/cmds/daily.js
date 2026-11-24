"use strict";

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

const DAILY_REWARD = { coin: 5000, exp: 300 };
const DAY_KEY_FORMAT = "DD/MM/YYYY";
// Imgur returned 429 for these links. Use the same reliable Google Drive image
// source as top.js, with a second host as fallback and a local runtime cache.
const BACKGROUND_URLS = [
	"https://lh3.googleusercontent.com/d/1xJse_WHLrgUDfKUVUZfAvE3EctB40QZx",
	"https://drive.google.com/uc?export=download&id=1xJse_WHLrgUDfKUVUZfAvE3EctB40QZx"
];
const BACKGROUND_CACHE = path.join(__dirname, "cache", "daily_background.img");

const BOLD_MAP = (() => {
	const map = {};
	const plain = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");
	const glyphs = Array.from("𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗");
	for (let i = 0; i < plain.length; i++) map[plain[i]] = glyphs[i];
	return map;
})();

function bold(text) {
	return Array.from(String(text == null ? "" : text)).map(c => BOLD_MAP[c] || c).join("");
}

// Full clear = exactly 20M. Rewards are split by effort: 200 messages is the
// biggest grind, then the 40x slot / 30x dice marathons, then quiz games.
const TASKS = [
	{ key: "slot", title: "Play Slot", detail: "Play slot 40 times", target: 40, reward: 2500000, match: n => n === "slot" },
	{ key: "dice", title: "Play Dice", detail: "Play dice 30 times", target: 30, reward: 2000000, match: n => n === "dice" || n === "roll" },
	{ key: "msg1", title: "Give 1 Msg", detail: "Give 1 msg", target: 1, reward: 100000, message: true },
	{ key: "msg200", title: "Msg 200 Times", detail: "Msg 200 times", target: 200, reward: 4000000, message: true },
	{ key: "wifuvid", title: "Use Wifuvid", detail: "Use wifuvid 10 times", target: 10, reward: 1000000, match: n => n === "wifuvid" },
	{ key: "pair", title: "Use Pair Cmds", detail: "Use any pair command", target: 1, reward: 1000000, match: n => /^pair/.test(n) },
	{ key: "word", title: "Word Puzzle", detail: "Play word 20 times", target: 20, reward: 1000000, match: n => ["word", "wordle", "unscramble"].includes(n) },
	{ key: "quiz", title: "General Quiz", detail: "Play quiz 10 times", target: 10, reward: 1000000, match: n => n === "quiz" || n === "quizgame" },
	{ key: "mathgame", title: "Math Quiz", detail: "Play mathgame 10 times", target: 10, reward: 800000, match: n => n === "mathgame" },
	{ key: "math", title: "Math Duel", detail: "Play math 10 times", target: 10, reward: 800000, match: n => n === "math" },
	{ key: "wbquiz", title: "Weeb Quiz", detail: "Play wbquiz 10 times", target: 10, reward: 800000, match: n => n === "wbquiz" },
	{ key: "flagquiz", title: "Flag Quiz", detail: "Play flagquiz 10 times", target: 10, reward: 800000, match: n => n === "flagquiz" },
	{ key: "animequiz", title: "Anime Quiz", detail: "Play animequiz 5 times", target: 5, reward: 600000, match: n => n === "animequiz" },
	{ key: "ffqz2", title: "Free Fire Quiz", detail: "Play ffqz2 5 times", target: 5, reward: 600000, match: n => n === "ffqz2" },
	{ key: "narutoquiz", title: "Naruto Quiz", detail: "Play narutoquiz 5 times", target: 5, reward: 600000, match: n => n === "narutoquiz" },
	{ key: "flaggame", title: "Flag Game", detail: "Play flaggame 10 times", target: 10, reward: 600000, match: n => n === "flaggame" },
	{ key: "guessnumber", title: "Guess Number", detail: "Play guessnumber 10 times", target: 10, reward: 500000, match: n => n === "guessnumber" },
	{ key: "cartoongame", title: "Cartoon Quiz", detail: "Play cartoongame 10 times", target: 10, reward: 500000, match: n => n === "cartoongame" },
	{ key: "animalgame", title: "Animal Quiz", detail: "Play animalgame 10 times", target: 10, reward: 400000, match: n => n === "animalgame" },
	{ key: "wordgame", title: "Word Game", detail: "Play wordgame 10 times", target: 10, reward: 400000, match: n => n === "wordgame" }
];

const FULL_CLEAR_REWARD = TASKS.reduce((sum, task) => sum + task.reward, 0);

const TASK_CAPTION = bold("Here is your daily task bby"); //[span_9](start_span)[span_9](end_span)

function dayKey() {
	return moment.tz("Asia/Dhaka").format(DAY_KEY_FORMAT); //[span_10](start_span)[span_10](end_span)
}

function safePrefix(prefix) {
	return String(prefix || (global.GoatBot && global.GoatBot.config && global.GoatBot.config.prefix) || "("); //[span_11](start_span)[span_11](end_span)
}

function moneyText(n) {
	if (global.utils && typeof global.utils.formatCompact === "function")
		return global.utils.formatCompact(n); //[span_12](start_span)[span_12](end_span)
	const v = Number(n) || 0; //[span_13](start_span)[span_13](end_span)
	if (v >= 1e12) return (v / 1e12).toFixed(2) + "T"; // extra guard
	if (v >= 1e9) return (v / 1e9).toFixed(2) + "B"; // extra guard
	if (v >= 1e6) return (v / 1e6).toFixed(2) + "M"; // extra guard
	if (v >= 1e3) return (v / 1e3).toFixed(2) + "K"; // extra guard
	return String(Math.round(v)); //[span_14](start_span)[span_14](end_span)
}

function ensureState(user) {
	if (!user.data || typeof user.data !== "object") user.data = {}; //[span_15](start_span)[span_15](end_span)
	const key = dayKey(); //[span_16](start_span)[span_16](end_span)
	let s = user.data.daily; //[span_17](start_span)[span_17](end_span)
	if (!s || s.day !== key) s = { day: key, progress: {}, claimed: {} }; //[span_18](start_span)[span_18](end_span)
	if (!s.progress || typeof s.progress !== "object") s.progress = {}; //[span_19](start_span)[span_19](end_span)
	if (!s.claimed || typeof s.claimed !== "object") s.claimed = {}; //[span_20](start_span)[span_20](end_span)
	user.data.daily = s; //[span_21](start_span)[span_21](end_span)
	return s; //[span_22](start_span)[span_22](end_span)
}

const writeLocks = new Map();
function withLock(id, worker) {
	const prev = writeLocks.get(id) || Promise.resolve(); //[span_23](start_span)[span_23](end_span)
	const next = prev.catch(() => {}).then(worker); //[span_24](start_span)[span_24](end_span)
	writeLocks.set(id, next); //[span_25](start_span)[span_25](end_span)
	next.then(() => { if (writeLocks.get(id) === next) writeLocks.delete(id); }).catch(() => {}); //[span_26](start_span)[span_26](end_span)
	return next; //[span_27](start_span)[span_27](end_span)
}

let usersDataRef = null;
function store(provided) {
	if (provided && typeof provided.get === "function") return provided;
	if (global.dailyUsersData && typeof global.dailyUsersData.get === "function") return global.dailyUsersData; //[span_28](start_span)[span_28](end_span)
	if (global.db && global.db.usersData && typeof global.db.usersData.get === "function") return global.db.usersData; //[span_29](start_span)[span_29](end_span)
	return usersDataRef; //[span_30](start_span)[span_30](end_span)
}

function bump(userID, keys, providedUsersData) {
	const usersData = store(providedUsersData); //[span_31](start_span)[span_31](end_span)
	if (providedUsersData && typeof providedUsersData.get === "function") global.dailyUsersData = providedUsersData;
	if (!usersData || typeof usersData.get !== "function" || !keys.length) return; //[span_32](start_span)[span_32](end_span)
	withLock(String(userID), async () => { //[span_33](start_span)[span_33](end_span)
		const user = await usersData.get(userID); //[span_34](start_span)[span_34](end_span)
		if (!user) return; //[span_35](start_span)[span_35](end_span)
		const state = ensureState(user); //[span_36](start_span)[span_36](end_span)
		let changed = false; //[span_37](start_span)[span_37](end_span)
		for (const t of TASKS) { //[span_38](start_span)[span_38](end_span)
			if (!keys.includes(t.key)) continue; //[span_39](start_span)[span_39](end_span)
			const current = Number(state.progress[t.key] || 0); //[span_40](start_span)[span_40](end_span)
			if (current >= t.target) continue; //[span_41](start_span)[span_41](end_span)
			state.progress[t.key] = current + 1; //[span_42](start_span)[span_42](end_span)
			changed = true; //[span_43](start_span)[span_43](end_span)
		}
		if (changed) await usersData.set(userID, { data: user.data }); //[span_44](start_span)[span_44](end_span)
	}).catch(err => console.error("[DAILY_TRACKER] save failed:", err && err.message ? err.message : err)); //[span_45](start_span)[span_45](end_span)
}

if (!global.__aliyaDailyTaskTracker) {
	global.__aliyaDailyTaskTracker = true; //[span_46](start_span)[span_46](end_span)
	global.dailyTaskTracker = function (userID, commandName, usersData) { //[span_47](start_span)[span_47](end_span)
		try {
			const name = String(commandName || "").toLowerCase(); //[span_48](start_span)[span_48](end_span)
			if (!name) return; //[span_49](start_span)[span_49](end_span)
			const keys = TASKS.filter(t => typeof t.match === "function" && t.match(name)).map(t => t.key); //[span_50](start_span)[span_50](end_span)
			if (keys.length) bump(userID, keys, usersData); //[span_51](start_span)[span_51](end_span)
		} catch (e) { console.error("[DAILY_TRACKER] task match failed:", e && e.message ? e.message : e); } //[span_52](start_span)[span_52](end_span)
	};
	global.dailyMessageTracker = function (userID, usersData) { //[span_53](start_span)[span_53](end_span)
		try { bump(userID, TASKS.filter(t => t.message).map(t => t.key), usersData); } //[span_54](start_span)[span_54](end_span)
		catch (e) { console.error("[DAILY_TRACKER] message match failed:", e && e.message ? e.message : e); } //[span_55](start_span)[span_55](end_span)
	};
}

async function fetchBuffer(url, timeout) {
	const r = await axios.get(url, { responseType: "arraybuffer", timeout: timeout || 12000 }); //[span_56](start_span)[span_56](end_span)
	const buf = Buffer.from(r.data); //[span_57](start_span)[span_57](end_span)
	const contentType = String(r.headers?.["content-type"] || "").toLowerCase(); // extra guard
	const isImageType = contentType.startsWith("image/"); // extra guard
	const isJPEG = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff; // extra guard
	const isPNG = buf.length > 8 && buf.subarray(1, 4).toString() === "PNG"; // extra guard
	if (!isImageType && !isJPEG && !isPNG) throw new Error("Not an image response: " + contentType); // extra guard
	return buf;
}

async function loadRandomBackgroundBuffer() {
	// 1. Runtime cache first — a successful download is reused on later calls.
	try {
		if (fs.existsSync(BACKGROUND_CACHE)) {
			const cached = fs.readFileSync(BACKGROUND_CACHE);
			if (cached.length > 4096) return cached;
		}
	}
	catch (e) { /* cache is optional */ }

	// 2. Try every working source (not Imgur — it rate-limits this bot).
	for (const url of BACKGROUND_URLS) {
		try {
			const buf = await fetchBuffer(url, 15000);
			try {
				fs.ensureDirSync(path.dirname(BACKGROUND_CACHE));
				fs.writeFileSync(BACKGROUND_CACHE, buf);
			}
			catch (e) { /* cache write failure must not break the card */ }
			return buf;
		}
		catch (e) { /* try the next source */ }
	}
	return null;
}

async function getAvatarBuffer(usersData, uid) {
	const urls = []; //[span_63](start_span)[span_63](end_span)
	try {
		if (usersData && typeof usersData.getAvatarUrl === "function") { //[span_64](start_span)[span_64](end_span)
			const u = await usersData.getAvatarUrl(uid); //[span_65](start_span)[span_65](end_span)
			if (u) urls.push(u); //[span_66](start_span)[span_66](end_span)
		}
	} catch (e) { } //[span_67](start_span)[span_67](end_span)
	urls.push(`https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`); //[span_68](start_span)[span_68](end_span)
	for (const u of urls) { //[span_69](start_span)[span_69](end_span)
		try { return await fetchBuffer(u, 10000); } //[span_70](start_span)[span_70](end_span)
		catch (e) { } //[span_71](start_span)[span_71](end_span)
	}
	return null; //[span_72](start_span)[span_72](end_span)
}

function rr(ctx, x, y, w, h, r) {
	r = Math.min(r, w / 2, h / 2); //[span_73](start_span)[span_73](end_span)
	ctx.beginPath(); //[span_74](start_span)[span_74](end_span)
	ctx.moveTo(x + r, y); //[span_75](start_span)[span_75](end_span)
	ctx.arcTo(x + w, y, x + w, y + h, r); //[span_76](start_span)[span_76](end_span)
	ctx.arcTo(x + w, y + h, x, y + h, r); //[span_77](start_span)[span_77](end_span)
	ctx.arcTo(x, y + h, x, y, r); //[span_78](start_span)[span_78](end_span)
	ctx.arcTo(x, y, x + w, y, r); //[span_79](start_span)[span_79](end_span)
	ctx.closePath(); //[span_80](start_span)[span_80](end_span)
}

function shortName(name, max) {
	const s = String(name || "Facebook User"); //[span_81](start_span)[span_81](end_span)
	return s.length > max ? s.slice(0, max - 1) + "..." : s; //[span_82](start_span)[span_82](end_span)
}

function statusOf(task, state) {
	const done = Number(state.progress[task.key] || 0); //[span_83](start_span)[span_83](end_span)
	if (state.claimed[task.key]) return { label: "CLAIMED", color: "#7dffb2", bg: "rgba(38, 166, 102, 0.28)" }; //[span_84](start_span)[span_84](end_span)
	if (done >= task.target) return { label: "READY", color: "#ffe27a", bg: "rgba(218, 165, 32, 0.30)" }; //[span_85](start_span)[span_85](end_span)
	return { label: "IN PROGRESS", color: "#8fd0ff", bg: "rgba(56, 140, 220, 0.25)" }; //[span_86](start_span)[span_86](end_span)
}

async function imageCard(name, uid, tasks, state, prefix, avatarBuf) {
	let canvasLib;
	try { canvasLib = require("canvas"); }
	catch (e) { return null; }
	const { createCanvas, loadImage } = canvasLib;

	const W = 1100;
	const headerBoxH = 148;
	const padX = 36;
	const colGap = 20;
	const boxW = (W - padX * 2 - colGap) / 2;
	const rowH = 92;
	const rowGap = 10;
	const leftCount = Math.ceil(tasks.length / 2);
	const rows = leftCount;
	const startY = 28 + headerBoxH + 34;
	const H = startY + rows * (rowH + rowGap) + 56;
	const canvas = createCanvas(W, H);
	const ctx = canvas.getContext("2d");

	let bg = null;
	try {
		const bgBuf = await loadRandomBackgroundBuffer();
		if (bgBuf) {
			bg = await loadImage(bgBuf);
			if (!bg.width || !bg.height || bg.width < 100 || bg.height < 100) bg = null;
		}
	} catch (e) { bg = null; }

	if (bg) {
		const s = Math.max(W / bg.width, H / bg.height);
		const dw = bg.width * s;
		const dh = bg.height * s;
		ctx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);
	} else {
		const grad = ctx.createLinearGradient(0, 0, W, H);
		grad.addColorStop(0, "#091326");
		grad.addColorStop(1, "#10284c");
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, W, H);
	}

	ctx.fillStyle = "rgba(6, 11, 24, 0.42)";
	ctx.fillRect(0, 0, W, H);

	ctx.save();
	ctx.fillStyle = "rgba(12, 19, 36, 0.78)";
	rr(ctx, padX, 28, W - padX * 2, headerBoxH, 20);
	ctx.fill();
	ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
	ctx.lineWidth = 2;
	ctx.stroke();
	ctx.restore();

	let avatar = null;
	if (avatarBuf) {
		try { avatar = await loadImage(avatarBuf); }
		catch (e) { avatar = null; }
	}

	const avCX = padX + 74;
	const avCY = 28 + headerBoxH / 2;
	const avR = 46;

	ctx.save();
	ctx.beginPath();
	ctx.arc(avCX, avCY, avR, 0, Math.PI * 2);
	ctx.closePath();
	ctx.clip();
	if (avatar) {
		const s = Math.min(avatar.width, avatar.height);
		ctx.drawImage(avatar, (avatar.width - s) / 2, (avatar.height - s) / 2, s, s, avCX - avR, avCY - avR, avR * 2, avR * 2);
	} else {
		ctx.fillStyle = "#1b3b63";
		ctx.fillRect(avCX - avR, avCY - avR, avR * 2, avR * 2);
		ctx.fillStyle = "#d6e8ff";
		ctx.font = "bold 40px Arial";
		ctx.textAlign = "center";
		ctx.fillText(String(name || "?").charAt(0).toUpperCase(), avCX, avCY + 14);
	}
	ctx.restore();

	ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.arc(avCX, avCY, avR, 0, Math.PI * 2);
	ctx.stroke();

	ctx.textAlign = "left";
	ctx.fillStyle = "#ffffff";
	ctx.font = "bold 34px Arial";
	ctx.fillText(shortName(name, 28), padX + 140, 74);

	ctx.fillStyle = "#ffd86b";
	ctx.font = "bold 20px Arial";
	ctx.fillText(`ALIYA V4 • 20 TASKS • FULL CLEAR $${moneyText(FULL_CLEAR_REWARD)}`, padX + 140, 109);

	ctx.fillStyle = "rgba(215, 234, 255, 0.80)";
	ctx.font = "bold 17px Arial";
	ctx.fillText(`UID: ${uid}  •  ${dayKey()}`, padX + 140, 139);

	ctx.textAlign = "left";
	ctx.font = "bold 18px Arial";
	ctx.fillStyle = "#8fd0ff";
	ctx.fillText("╔══ TASKS 01-10 ══╗", padX, 28 + headerBoxH + 24);
	ctx.fillStyle = "#ffd86b";
	ctx.fillText("╔══ TASKS 11-20 ══╗", padX + boxW + colGap, 28 + headerBoxH + 24);

	tasks.forEach((t, i) => {
		const done = Math.min(Number(state.progress[t.key] || 0), t.target);
		const st = statusOf(t, state);
		const col = i < leftCount ? 0 : 1;
		const row = col === 0 ? i : i - leftCount;
		const boxX = padX + col * (boxW + colGap);
		const y = startY + row * (rowH + rowGap);

		ctx.save();
		ctx.fillStyle = "rgba(13, 21, 40, 0.80)";
		rr(ctx, boxX, y, boxW, rowH, 14);
		ctx.fill();
		ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
		ctx.lineWidth = 1.4;
		ctx.stroke();

		ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
		rr(ctx, boxX + 12, y + 18, 42, 42, 10);
		ctx.fill();
		ctx.fillStyle = "#ffd86b";
		ctx.font = "bold 20px Arial";
		ctx.textAlign = "center";
		ctx.fillText(String(i + 1).padStart(2, "0"), boxX + 33, y + 45);

		const badgeW = 110;
		const badgeH = 26;
		const badgeX = boxX + boxW - badgeW - 14;
		const badgeY = y + 12;
		ctx.fillStyle = st.bg;
		rr(ctx, badgeX, badgeY, badgeW, badgeH, 8);
		ctx.fill();
		ctx.strokeStyle = st.color;
		ctx.lineWidth = 1.1;
		ctx.stroke();
		ctx.fillStyle = st.color;
		ctx.font = "bold 12px Arial";
		ctx.fillText(st.label, badgeX + badgeW / 2, badgeY + 18);

		ctx.textAlign = "left";
		ctx.fillStyle = "#ffffff";
		ctx.font = "bold 19px Arial";
		ctx.fillText(t.title, boxX + 64, y + 32, boxW - 190);

		ctx.fillStyle = "rgba(220, 235, 252, 0.88)";
		ctx.font = "bold 14px Arial";
		ctx.fillText(`${t.detail}  (${done}/${t.target})`, boxX + 64, y + 56, boxW - 190);

		ctx.textAlign = "right";
		ctx.fillStyle = "#ffd86b";
		ctx.font = "bold 16px Arial";
		ctx.fillText(`+${moneyText(t.reward)}`, boxX + boxW - 14, y + 57);

		const bx = boxX + 16;
		const by = y + rowH - 15;
		const bw = boxW - 32;
		const bh = 7;
		ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
		rr(ctx, bx, by, bw, bh, 4);
		ctx.fill();
		if (done > 0) {
			ctx.fillStyle = st.color;
			rr(ctx, bx, by, Math.max(8, bw * (done / t.target)), bh, 4);
			ctx.fill();
		}
		ctx.restore();
	});

	ctx.save();
	ctx.fillStyle = "rgba(12, 19, 36, 0.78)";
	rr(ctx, padX, H - 46, W - padX * 2, 34, 12);
	ctx.fill();
	ctx.textAlign = "center";
	ctx.fillStyle = "rgba(235, 246, 255, 0.92)";
	ctx.font = "bold 16px Arial";
	ctx.fillText(`Select & claim: ${prefix}daily claim <1-${tasks.length}>  |  ${prefix}daily claim all`, W / 2, H - 23);
	ctx.restore();

	return canvas.toBuffer("image/png");
}

module.exports = {
	config: {
		name: "daily",
		aliases: ["dailyreward", "dly"],
		version: "4.1.0",
		author: "0xMr_King x ┃ Tanin Islam", //[span_98](start_span)[span_98](end_span)
		countDown: 5,
		role: 0,
		description: { en: "Daily reward and daily task card" }, //[span_99](start_span)[span_99](end_span)
		category: "game", //[span_100](start_span)[span_100](end_span)
		guide: { en: "{pn} | {pn} task | {pn} claim all | {pn} claim <1-20>" }
	},

	onStart: async function ({ api, event, args, message, usersData, prefix }) {
		const { senderID, messageID, threadID, messageReply, mentions } = event; //[span_102](start_span)[span_102](end_span)
		const p = safePrefix(prefix); //[span_103](start_span)[span_103](end_span)
		const sub = String(args[0] || "").toLowerCase(); //[span_104](start_span)[span_104](end_span)
		if (usersData && typeof usersData.get === "function") {
			usersDataRef = usersData; //[span_105](start_span)[span_105](end_span)
			global.dailyUsersData = usersData;
		}

		const reply = body => (message && typeof message.reply === "function")
			? message.reply(body)
			: api.sendMessage(body, threadID, messageID); //[span_106](start_span)[span_106](end_span)

		try {
			const date = dayKey(); //[span_107](start_span)[span_107](end_span)
			const user = await usersData.get(senderID) || {}; //[span_108](start_span)[span_108](end_span)
			const state = ensureState(user); //[span_109](start_span)[span_109](end_span)
			await usersData.set(senderID, { data: user.data }); //[span_110](start_span)[span_110](end_span)

			if (!sub || sub === "info") {
				if (sub === "info")
					return reply(
						bold("DAILY INFO") + "\n" +
						bold("Reward") + `: ${moneyText(DAILY_REWARD.coin)} coin, ${DAILY_REWARD.exp} exp once per day\n` + //[span_111](start_span)[span_111](end_span)
						bold("Tasks") + `: ${TASKS.length} fixed tasks (10 left, 10 right) with quiz games, reset every day\n` +
						bold("Full clear") + `: $${moneyText(FULL_CLEAR_REWARD)} total task rewards\n` +
						bold("View") + `: ${p}daily task\n` +
						bold("Claim") + `: ${p}daily claim all | ${p}daily claim <1-${TASKS.length}>`
					);

				if (state.lastDaily === date)
					return reply(bold("ALREADY RECEIVED") + "\nYou already claimed today's " + moneyText(DAILY_REWARD.coin) + " coin and " + DAILY_REWARD.exp + " exp.\nCome back tomorrow."); //[span_115](start_span)[span_115](end_span)

				state.lastDaily = date; //[span_116](start_span)[span_116](end_span)
				await usersData.set(senderID, {
					money: (user.money || 0) + DAILY_REWARD.coin, //[span_117](start_span)[span_117](end_span)
					exp: (user.exp || 0) + DAILY_REWARD.exp, //[span_118](start_span)[span_118](end_span)
					data: user.data //[span_119](start_span)[span_119](end_span)
				});

				return reply(
					bold("DAILY REWARD CLAIMED") + "\n" +
					bold("User") + ": " + (user.name || "Facebook User") + "\n" + //[span_120](start_span)[span_120](end_span)
					bold("Coin") + ": +" + moneyText(DAILY_REWARD.coin) + "\n" + //[span_121](start_span)[span_121](end_span)
					bold("Exp") + ": +" + DAILY_REWARD.exp + "\n" + //[span_122](start_span)[span_122](end_span)
					bold("Made with") + " 🤍 " + bold("by") + " 0xMr_King x ┃ Tanin Islam" //[span_123](start_span)[span_123](end_span)
				);
			}

			if (sub === "task" || sub === "tasks") {
				let targetID = senderID; //[span_124](start_span)[span_124](end_span)
				if (mentions && Object.keys(mentions).length) targetID = Object.keys(mentions)[0]; //[span_125](start_span)[span_125](end_span)
				else if (args[1] && /^\d{5,}$/.test(args[1])) targetID = args[1]; //[span_126](start_span)[span_126](end_span)
				else if (messageReply && messageReply.senderID) { //[span_127](start_span)[span_127](end_span)
					const idInReply = String(messageReply.body || "").trim().match(/^\d{5,}$/); //[span_128](start_span)[span_128](end_span)
					targetID = idInReply ? idInReply[0] : String(messageReply.senderID); //[span_129](start_span)[span_129](end_span)
				}

				let target = user; //[span_130](start_span)[span_130](end_span)
				let targetState = state; //[span_131](start_span)[span_131](end_span)
				let name = user.name || "Facebook User"; //[span_132](start_span)[span_132](end_span)
				if (String(targetID) !== String(senderID)) { //[span_133](start_span)[span_133](end_span)
					target = await usersData.get(targetID) || {}; //[span_134](start_span)[span_134](end_span)
					targetState = ensureState(target); //[span_135](start_span)[span_135](end_span)
					name = (mentions && mentions[targetID]) || target.name || "Facebook User"; //[span_136](start_span)[span_136](end_span)
				}

				let buffer = null;
				try {
					const avatarBuf = await getAvatarBuffer(usersData, targetID); //[span_137](start_span)[span_137](end_span)
					buffer = await imageCard(name, targetID, TASKS, targetState, p, avatarBuf); //[span_138](start_span)[span_138](end_span)
				}
				catch (e) { buffer = null; } //[span_139](start_span)[span_139](end_span)

				if (buffer) {
					const cacheDir = path.join(__dirname, "cache"); //[span_140](start_span)[span_140](end_span)
					await fs.ensureDir(cacheDir); //[span_141](start_span)[span_141](end_span)
					const file = path.join(cacheDir, `daily_task_${Date.now()}.png`); //[span_142](start_span)[span_142](end_span)
					await fs.writeFile(file, buffer); //[span_143](start_span)[span_143](end_span)
					const payload = { body: TASK_CAPTION, attachment: fs.createReadStream(file) }; //[span_144](start_span)[span_144](end_span)
					return (message && typeof message.reply === "function")
						? message.reply(payload)
						: api.sendMessage(payload, threadID, messageID); //[span_145](start_span)[span_145](end_span)
				}
				return reply(TASK_CAPTION); //[span_146](start_span)[span_146](end_span)
			}

			if (sub === "claim") {
				const which = String(args[1] || "all").toLowerCase(); //[span_147](start_span)[span_147](end_span)
				let chosen;
				if (which === "all") chosen = TASKS; //[span_148](start_span)[span_148](end_span)
				else {
					const n = Number(which);
					if (!Number.isInteger(n) || n < 1 || n > TASKS.length)
						return reply(bold("INVALID TASK") + `\nUse ${p}daily claim all or ${p}daily claim 1 to ${TASKS.length}.`); //[span_149](start_span)[span_149](end_span)
					chosen = [TASKS[n - 1]]; //[span_150](start_span)[span_150](end_span)
				}

				const doneNames = [];
				let coin = 0;
				for (const t of chosen) { //[span_151](start_span)[span_151](end_span)
					const progress = Number(state.progress[t.key] || 0); //[span_152](start_span)[span_152](end_span)
					if (progress < t.target || state.claimed[t.key]) continue; //[span_153](start_span)[span_153](end_span)
					state.claimed[t.key] = true; //[span_154](start_span)[span_154](end_span)
					coin += t.reward; //[span_155](start_span)[span_155](end_span)
					doneNames.push(t); //[span_156](start_span)[span_156](end_span)
				}

				if (!doneNames.length)
					return reply(bold("NOTHING TO CLAIM") + "\nFinish the task first, or it was already claimed."); //[span_157](start_span)[span_157](end_span)

				await usersData.set(senderID, {
					money: (user.money || 0) + coin, //[span_158](start_span)[span_158](end_span)
					data: user.data //[span_159](start_span)[span_159](end_span)
				});

				let out = bold("TASK REWARD CLAIMED") + "\n"; //[span_160](start_span)[span_160](end_span)
				for (const t of doneNames) out += `  ${t.title} -> +${moneyText(t.reward)}\n`; //[span_161](start_span)[span_161](end_span)
				out += bold("Total") + `: +${moneyText(coin)}\n`; //[span_162](start_span)[span_162](end_span)
				out += bold("Made with") + " 🤍 " + bold("by") + " 0xMr_King x ┃ Tanin Islam"; //[span_163](start_span)[span_163](end_span)
				return reply(out); //[span_164](start_span)[span_164](end_span)
			}

			return reply(bold("DAILY COMMANDS") + "\n" +
				`${p}daily - claim ${moneyText(DAILY_REWARD.coin)} coin and ${DAILY_REWARD.exp} exp\n` +
				`${p}daily task - view your ${TASKS.length} daily tasks (full clear $${moneyText(FULL_CLEAR_REWARD)})\n` +
				`${p}daily claim all - claim all finished tasks\n` +
				`${p}daily claim 1 - claim task 1 to ${TASKS.length}`);
		} catch (err) {
			console.error("[daily]", err); //[span_169](start_span)[span_169](end_span)
			try { api.setMessageReaction("❌", messageID, () => {}, true); } //[span_170](start_span)[span_170](end_span)
			catch (e) { } //[span_171](start_span)[span_171](end_span)
			return reply(bold("DAILY ERROR") + "\n" + (err.message || err)); //[span_172](start_span)[span_172](end_span)
		}
	}
};
