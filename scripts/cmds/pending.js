// Credit : 0xMr_King x ┃ Tanin Islam
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { Readable } = require("stream");

let approval = null;
try {
  approval = require("../../includes/approve");
} catch (_) {}

const ownerInfo = {
  name: "Aliya Official V4",
  supportGroup: "https://m.me/j/AbY50_CsjwrZMPkP/?send_source=gc%3Acopy_invite_link_t"
};

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
      return global.utils.getPrefix(threadID) || "(";
  } catch (_) {}
  return (global.GoatBot && global.GoatBot.config && global.GoatBot.config.prefix) || "(";
}

function contactLink() {
  try {
    if (approval && typeof approval.contactLinks === "function")
      return approval.contactLinks()[0];
  } catch (_) {}
  return "https://m.me/0xmrking";
}

function parseNumbers(input, max) {
  const valid = [];
  const invalid = [];
  const seen = new Set();

  for (const token of String(input || "").split(/[\s,]+/).filter(Boolean)) {
    const number = Number(token);
    if (!Number.isInteger(number) || number < 1 || number > max) {
      invalid.push(token);
      continue;
    }
    if (seen.has(number)) continue;
    seen.add(number);
    valid.push(number);
  }

  return { valid, invalid };
}

// "1" = permanent, "1 add 7" = 7 days. Several selections may be combined:
// "1 2 add 30 3" -> #1 permanent, #2 30 days, #3 permanent.
function parseApprovalInput(input, max) {
  const tokens = String(input || "").trim().split(/[\s,]+/).filter(Boolean);
  const selections = [];
  const invalid = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!/^\d+$/.test(token)) {
      invalid.push(token);
      continue;
    }
    const index = Number(token);
    if (index < 1 || index > max) {
      invalid.push(token);
      continue;
    }

    let days = 0;
    if (/^add$/i.test(tokens[i + 1] || "")) {
      const rawDays = tokens[i + 2];
      if (/^\d+$/.test(rawDays || "") && Number(rawDays) > 0) {
        days = Math.min(Number(rawDays), 3650);
        i += 2;
      } else {
        invalid.push("add");
      }
    }

    if (!selections.some(s => s.index === index)) selections.push({ index, days });
  }

  return { selections, invalid };
}

function buildConnectMessage(threadID, days = 0) {
  const prefix = getPrefix(threadID);
  const nickNameBot = (global.GoatBot && global.GoatBot.config && global.GoatBot.config.nickNameBot) || "Aliya Official V4";
  const approvalLine = days > 0
    ? `ᥫ᭡ 𝐀𝐩𝐩𝐫𝐨𝐯𝐞𝐝 : ${days} days\n`
    : "";

  return (
`𓍢ִ໋🌸✧ ── ͟͟͞͞Group Connected Successfully ── ✧🌸𓍢ִ໋🌷͙֒  

ᥫ᭡ 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞 : ${nickNameBot}
ᥫ᭡ 𝐁𝐨𝐭 𝐏𝐫𝐞𝐟𝐢𝐱 : ${prefix}
${approvalLine}ᥫ᭡ 𝐔𝐬𝐚𝐠𝐞 : Type ${prefix}help to see all commands

✧─────── ͟͟͞͞Aliya Official V4 ───────✧
👑 𝐎𝐰𝐧𝐞𝐫 : ${ownerInfo.name}
💬 𝐂𝐨𝐧𝐭𝐚𝐜𝐭 : ${contactLink()}
🤖 𝐒𝐮𝐩𝐩𝐨𝐫𝐭 𝐆𝐂 : ${ownerInfo.supportGroup}`
  );
}

async function tryCall(fn, ...args) {
  if (typeof fn !== "function") return false;
  try {
    await fn.apply(null, args);
    return true;
  } catch (_) {
    return false;
  }
}

async function updateApprovalLists(threadID, approved) {
  let changed = false;
  try {
    const cfg = global.GoatBot && global.GoatBot.config;
    if (!cfg) return false;

    if (cfg.threadApproval && Array.isArray(cfg.threadApproval.approvedThreadIDs)) {
      const ids = cfg.threadApproval.approvedThreadIDs.map(String);
      const has = ids.includes(String(threadID));
      if (approved && !has) {
        cfg.threadApproval.approvedThreadIDs.push(String(threadID));
        changed = true;
      } else if (!approved && has) {
        cfg.threadApproval.approvedThreadIDs = cfg.threadApproval.approvedThreadIDs.filter(id => String(id) !== String(threadID));
        changed = true;
      }
    }

    if (cfg.whiteListMode && Array.isArray(cfg.whiteListMode.whiteListIds)) {
      const ids = cfg.whiteListMode.whiteListIds.map(String);
      const has = ids.includes(String(threadID));
      if (approved && !has) {
        cfg.whiteListMode.whiteListIds.push(String(threadID));
        changed = true;
      } else if (!approved && has) {
        cfg.whiteListMode.whiteListIds = cfg.whiteListMode.whiteListIds.filter(id => String(id) !== String(threadID));
        changed = true;
      }
    }

    if (changed && global.client && global.client.dirConfig && typeof fs.writeFileSync === "function") {
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(cfg, null, 2));
    }
  } catch (_) {}
  return changed;
}

// Download the image and attach it as a real photo. Passing a URL through the
// "url" field only produces a link preview, which is why imgur showed as text.
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

async function sendConnectedMessage(api, threadID, days = 0) {
  const textMsg = buildConnectMessage(threadID, days);

  try {
    const stream = await getRemoteImageStream(DIRECT_IMAGE_URL);
    if (stream) {
      await api.sendMessage({ body: textMsg, attachment: stream }, threadID);
      return true;
    }
  } catch (_) {}

  const imagePath = path.join(__dirname, "../../func/botconnect.jpeg");
  if (fs.existsSync(imagePath)) {
    try {
      const attachment = fs.createReadStream(imagePath);
      attachment.on("error", () => {});
      await api.sendMessage({ body: textMsg, attachment }, threadID);
      return true;
    } catch (_) {}
  }

  try {
    await api.sendMessage(textMsg, threadID);
  } catch (_) {}
  return false;
}

module.exports = {
  config: {
    name: "pending",
    aliases: ["pen", "approve-base", "পেন্ডিং"],
    version: "5.0.0",
    author: "0xMr_King x ┃ Tanin Islam",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Approve or refuse pending threads"
    },
    longDescription: {
      en: "Reply with 1 to approve permanently, or 1 add 7 to approve for 7 days. c1 / cancel 1 refuses."
    },
    category: "admin"
  },

  langs: {
    en: {
      invaildNumber: "%1 is not a valid number",
      cancelSuccess: "Refused %1 thread(s)!",
      approveSuccess: "Approved successfully %1 thread(s)!",
      cantGetPendingList: "Can't get the pending list!",
      returnListPending:
        "𓍢ִ໋🌸✧ ── ͟͟͞͞Aliya v4 Pending List ── ✧🌸𓍢ִ໋🌷͙֒\n\nᥫ᭡ Total Pending Threads: %1\n\n%2\n\n💡 Guide:\n- Permanent: reply with 1\n- Timed: reply with 1 add 7 (7 days)\n- Refuse: reply with c1 or cancel 1",
      returnListClean: "𓍢ִ໋🌸✧ Pending list is completely clean! ✧🌸"
    }
  },

  onReply: async function ({ api, event, Reply, getLang, message, threadsData }) {
    if (!Reply || String(event.senderID) !== String(Reply.author)) return;
    if (!Array.isArray(Reply.pending) || Reply.pending.length === 0)
      return message.reply(getLang("returnListClean"));

    const body = String(event.body || "");
    const trimmedBody = body.trim();
    const isCancel = /^(?:c|cancel)\b/i.test(trimmedBody) || /^c\d/i.test(trimmedBody);
    const rawInput = isCancel
      ? trimmedBody.replace(/^(?:cancel|c)\s*/i, "").trim()
      : trimmedBody;

    let count = 0;

    if (isCancel) {
      const { valid, invalid } = parseNumbers(rawInput, Reply.pending.length);
      for (const token of invalid)
        await tryCall(() => message.reply(getLang("invaildNumber", token)));

      if (valid.length === 0)
        return message.reply("Please provide at least one valid thread number to cancel.");

      const botID = getBotID(api);
      for (const index of valid) {
        const targetThreadID = String(Reply.pending[index - 1].threadID);

        await tryCall(() => api.handleMessageRequest && api.handleMessageRequest(targetThreadID, false));
        await tryCall(() => api.removeUserFromGroup && api.removeUserFromGroup(botID, targetThreadID));
        await tryCall(() => approval && approval.remove && approval.remove(targetThreadID));
        await updateApprovalLists(targetThreadID, false);

        if (threadsData && typeof threadsData.set === "function")
          await tryCall(() => threadsData.set(targetThreadID, false, "data.approved"));

        count++;
      }
      return message.reply(getLang("cancelSuccess", count));
    }

    const { selections, invalid } = parseApprovalInput(rawInput, Reply.pending.length);
    for (const token of invalid)
      await tryCall(() => message.reply(getLang("invaildNumber", token)));

    if (selections.length === 0)
      return message.reply("Please provide at least one valid thread number to approve.");

    const botID = getBotID(api);
    let permanent = 0;
    let timed = 0;

    for (const { index, days } of selections) {
      const targetThread = String(Reply.pending[index - 1].threadID);

      await tryCall(() => api.handleMessageRequest && api.handleMessageRequest(targetThread, true));
      await tryCall(() => threadsData && threadsData.create && threadsData.create(targetThread));
      await tryCall(() => threadsData && threadsData.refreshInfo && threadsData.refreshInfo(targetThread));
      await tryCall(() => approval && approval.approveById && approval.approveById(api, targetThread, event.senderID, days));
      await updateApprovalLists(targetThread, true);

      if (threadsData && typeof threadsData.set === "function")
        await tryCall(() => threadsData.set(targetThread, true, "data.approved"));

      if (botID)
        await tryCall(() => api.changeNickname && api.changeNickname((global.GoatBot.config.nickNameBot || "Aliya Official V4"), targetThread, botID));

      await sendConnectedMessage(api, targetThread, days);

      if (days > 0) timed++;
      else permanent++;
      count++;
    }

    const details = [
      permanent ? `${permanent} permanent` : "",
      timed ? `${timed} timed` : ""
    ].filter(Boolean).join(", ");
    return message.reply(`${getLang("approveSuccess", count)}${details ? ` (${details})` : ""}`);
  },

  onStart: async function ({ api, event, getLang, commandName, message, threadsData }) {
    const { threadID, messageID } = event;

    try {
      const fetchThreads = async tag => {
        const out = [];
        let before = null;

        for (let page = 0; page < 10; page++) {
          if (typeof api.getThreadList !== "function") break;
          const batch = (await api.getThreadList(100, before, [tag])) || [];
          out.push(...batch);
          if (batch.length < 100) break;

          const next = batch[batch.length - 1].timestamp;
          if (!next || next === before) break;
          before = next;
        }
        return out;
      };

      const [pending, spam] = await Promise.all([
        fetchThreads("PENDING"),
        fetchThreads("OTHER")
      ]);

      const seen = new Set();
      const list = [...pending, ...spam].filter(group => {
        if (!group || !group.threadID || group.isGroup === false) return false;
        const id = String(group.threadID);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      // Include groups the approval gate itself marked pending (bot already joined).
      if (approval && typeof approval.pendingList === "function") {
        for (const id of approval.pendingList()) {
          if (seen.has(String(id))) continue;
          seen.add(String(id));
          let name = String(id);
          try {
            const info = await api.getThreadInfo(id);
            name = (info && (info.threadName || info.name)) || name;
          } catch (_) {}
          list.push({ threadID: String(id), name, isGroup: true });
        }
      }

      if (list.length === 0)
        return message.reply(getLang("returnListClean"));

      const body = list.map((group, i) =>
        `${i + 1}. ${group.name || "Unnamed group"} (${group.threadID})`
      ).join("\n");
      const replyText = getLang("returnListPending", list.length, body);

      return api.sendMessage(replyText, threadID, (err, info) => {
        if (err || !info || !info.messageID) return;
        const onReply = global.GoatBot && global.GoatBot.onReply;
        if (!onReply || typeof onReply.set !== "function") return;
        onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
          pending: list
        });
      }, messageID);
    } catch (_) {
      return message.reply(getLang("cantGetPendingList"));
    }
  }
};
