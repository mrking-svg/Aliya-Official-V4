const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Readable } = require("stream");

const ownerInfo = {
  name: "Aliya Official V4",
  supportGroup: "https://m.me/j/AbY50_CsjwrZMPkP/?send_source=gc%3Acopy_invite_link_t"
};

const IMAGE_ENDPOINT = "https://xsaim8x-xxx-api.onrender.com/api/botconnect";
const DIRECT_IMAGE_URL = "https://i.imgur.com/q1CYPUA.jpeg";

function getBotID(api) {
  try {
    return String(api.getCurrentUserID());
  } catch (_) {
    return "";
  }
}

function getPrefix(threadID) {
  try {
    if (global.utils && typeof global.utils.getPrefix === "function")
      return global.utils.getPrefix(threadID) || (global.GoatBot?.config?.prefix || "!");
  } catch (_) {}
  return (global.GoatBot && global.GoatBot.config && global.GoatBot.config.prefix) || "!";
}

async function getRemoteImageStream(url) {
  if (global.utils && typeof global.utils.getStreamFromURL === "function") {
    try {
      const stream = await global.utils.getStreamFromURL(url);
      if (stream) return stream;
    } catch (_) {}
  }

  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const buffer = Buffer.from(res.data || []);
    if (buffer.length) return Readable.from(buffer);
  } catch (_) {}
  return null;
}

async function getConnectImage(botID, prefix) {
  const url = `${IMAGE_ENDPOINT}?botuid=${encodeURIComponent(botID)}&prefix=${encodeURIComponent(prefix)}`;
  const stream = await getRemoteImageStream(url);
  if (stream) return stream;
  return getRemoteImageStream(DIRECT_IMAGE_URL);
}

function buildConnectText(threadID) {
  const prefix = getPrefix(threadID);
  const botName = (global.GoatBot && global.GoatBot.config && global.GoatBot.config.nickNameBot) || "Aliya Official V4";

  return [
    "𓍢ִ໋🌸✧ ── ͟͟͞͞Group Connected Successfully ── ✧🌸𓍢ִ໋🌷͙֒",
    "",
    `ᥫ᭡ 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞 : ${botName}`,
    `ᥫ᭡ 𝐁𝐨𝐭 𝐏𝐫𝐞𝐟𝐢𝐱 : ${prefix}`,
    `ᥫ᭡ 𝐔𝐬𝐚𝐠𝐞 : Type ${prefix}help to see all commands`,
    "",
    `✧─────── ͟͟͞͞${ownerInfo.name} ───────✧`,
    `👑 𝐎𝐰𝐧𝐞𝐫 : ${ownerInfo.name}`,
    `🤖 𝐒𝐮𝐩𝐩𝐨𝐫𝐭 𝐆𝐂 : ${ownerInfo.supportGroup}`
  ].join("\n");
}

// Returns true only when Messenger actually accepted the message. The old
// version swallowed every error and printed "Approved successfully" even for
// pending threads the bot had not joined yet.
async function sendConnect(api, threadID) {
  const botID = getBotID(api);
  if (botID) {
    try {
      await api.changeNickname((global.GoatBot.config.nickNameBot || "Aliya Official V4"), threadID, botID);
    } catch (_) {}
  }

  const body = buildConnectText(threadID);
  let lastError = null;

  try {
    const attachment = await getConnectImage(botID, getPrefix(threadID));
    if (attachment) {
      await api.sendMessage({ body, attachment }, threadID);
      return true;
    }
  } catch (err) {
    lastError = err;
  }

  const local = path.join(__dirname, "../../func/botconnect.jpeg");
  if (fs.existsSync(local)) {
    try {
      const attachment = fs.createReadStream(local);
      attachment.on("error", () => {});
      await api.sendMessage({ body, attachment }, threadID);
      return true;
    } catch (err) {
      lastError = err;
    }
  }

  try {
    await api.sendMessage(body, threadID);
    return true;
  } catch (err) {
    lastError = err;
  }

  console.warn("[pending] could not send connect message to", threadID, lastError?.message || lastError);
  return false;
}

async function fetchThreads(api, tag) {
  const out = [];
  let before = null;
  for (let page = 0; page < 10; page++) {
    const batch = (await api.getThreadList(100, before, [tag])) || [];
    out.push(...batch.map(thread => ({ ...thread, pendingTag: tag })));
    if (batch.length < 100) break;
    const next = batch[batch.length - 1].timestamp;
    if (!next || next === before) break;
    before = next;
  }
  return out;
}

// A thread left in PENDING cannot receive messages yet, even if the admin saw
// an "approved" confirmation. Re-read INBOX before claiming success.
async function getJoinedThreadIDs(api) {
  try {
    const inbox = await fetchThreads(api, "INBOX");
    return new Set(inbox.map(thread => String(thread.threadID)));
  } catch (err) {
    console.warn("[pending] cannot verify INBOX:", err.message || err);
    return null;
  }
}

function removeUser(api, userID, threadID) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = err => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve();
    };
    try {
      const result = api.removeUserFromGroup(userID, threadID, done);
      if (result && typeof result.then === "function") result.then(() => done(), done);
    } catch (err) {
      done(err);
    }
    const timer = setTimeout(() => done(new Error("removeUserFromGroup timeout")), 10000);
    if (typeof timer.unref === "function") timer.unref();
  });
}

function label(item, index) {
  return `${index}. ${item?.name || item?.threadID || "unknown"}`;
}

module.exports = {
  config: {
    name: "pending",
    aliases: ["pen", "পেন্ডিং"],
    version: "6.1.0",
    author: "0xMr_King x ┃ Tanin Islam",
    countDown: 5,
    role: 2,
    shortDescription: { en: "Approve or refuse pending threads" },
    longDescription: { en: "Reply with numbers to approve or c[number(s)] / cancel[number(s)] to refuse." },
    category: "admin"
  },

  langs: {
    en: {
      invaildNumber: "%1 is not a valid number",
      cancelSuccess: "Refused %1 thread(s)!",
      approveSuccess: "Connected successfully in %1 thread(s)!",
      approvePartial: "Connected %1 thread(s). Skipped/failed %2: %3",
      cancelPartial: "Refused %1 thread(s). Failed %2: %3",
      cantGetPendingList: "Can't get the pending list!",
      returnListPending:
        "𓍢ִ໋🌸✧ ── ͟͟͞͞Aliya v4 Pending List ── ✧🌸𓍢ִ໋🌷͙֒\n\nᥫ᭡ Total Pending Threads: %1\n\n%2\n\n💡 Guide:\n- Approve: reply with numbers (e.g. 1 2 3)\n- Refuse: reply with c1 / cancel 1",
      returnListClean: "𓍢ִ໋🌸✧ Pending list is completely clean! ✧🌸"
    }
  },

  onReply: async function ({ api, event, Reply, getLang, message }) {
    if (!Reply || String(event.senderID) !== String(Reply.author)) return;
    if (!Array.isArray(Reply.pending) || Reply.pending.length === 0)
      return message.reply(getLang("returnListClean"));

    const body = String(event.body || "").trim();
    const isCancel = /^(?:c|cancel)\b/i.test(body) || /^c\d/i.test(body);
    const raw = isCancel ? body.replace(/^(?:cancel|c)\s*/i, "").trim() : body;
    const tokens = raw.split(/[\s,]+/).filter(Boolean);
    const valid = [];
    const invalid = [];

    for (const token of tokens) {
      const n = Number(token);
      if (!Number.isInteger(n) || n < 1 || n > Reply.pending.length) invalid.push(token);
      else if (!valid.includes(n)) valid.push(n);
    }

    for (const token of invalid)
      await message.reply(getLang("invaildNumber", token)).catch(() => {});

    if (valid.length === 0)
      return message.reply(isCancel
        ? "Please provide at least one valid thread number to cancel."
        : "Please provide at least one valid thread number to approve.");

    const botID = getBotID(api);
    const done = [];
    const failed = [];
    const joinedIDs = isCancel ? null : await getJoinedThreadIDs(api);

    for (const index of valid) {
      const item = Reply.pending[index - 1];
      const targetThread = String(item.threadID);

      if (isCancel) {
        try {
          if (botID) await removeUser(api, botID, targetThread);
          done.push(index);
        } catch (err) {
          failed.push(`${label(item, index)} (${err.message || "failed"})`);
        }
        continue;
      }

      if (joinedIDs && !joinedIDs.has(targetThread)) {
        failed.push(`${label(item, index)} (still pending - accept it in Messenger first)`);
        continue;
      }

      if (await sendConnect(api, targetThread)) done.push(index);
      else failed.push(`${label(item, index)} (bot could not message this group)`);
      // Avoid a burst of group messages that looks like spam to Facebook.
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (failed.length === 0)
      return message.reply(getLang(isCancel ? "cancelSuccess" : "approveSuccess", done.length));

    return message.reply(getLang(
      isCancel ? "cancelPartial" : "approvePartial",
      done.length,
      failed.length,
      failed.join("\n")
    ));
  },

  onStart: async function ({ api, event, getLang, commandName, message }) {
    try {
      const [pending, spam] = await Promise.all([
        fetchThreads(api, "PENDING"),
        fetchThreads(api, "OTHER")
      ]);
      const seen = new Set();
      const list = [...pending, ...spam].filter(group => {
        if (!group || !group.threadID || group.isGroup === false) return false;
        if (group.isSubscribed === false) return false;
        const id = String(group.threadID);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      if (list.length === 0)
        return message.reply(getLang("returnListClean"));

      const body = list.map((group, i) =>
        `${i + 1}. ${group.name || "Unnamed group"} (${group.threadID})`
      ).join("\n");

      return api.sendMessage(getLang("returnListPending", list.length, body), event.threadID, (err, info) => {
        if (err || !info || !info.messageID) return;
        const onReply = global.GoatBot && global.GoatBot.onReply;
        if (!onReply || typeof onReply.set !== "function") return;
        onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
          pending: list
        });
      }, event.messageID);
    } catch (err) {
      console.warn("[pending] list failed:", err.message || err);
      return message.reply(getLang("cantGetPendingList"));
    }
  }
};
