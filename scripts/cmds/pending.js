// Credit : 0xMr_King x ┃ Tanin Islam
const fs = require("fs-extra");
const path = require("path");

let approval = null;
try {
  approval = require("../../includes/approve");
} catch (_) {}

const ownerInfo = {
  name: "Aliya Official V4",
  contact: "https://m.me/0xmrking",
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

function buildConnectMessage(threadID) {
  const prefix = getPrefix(threadID);
  const nickNameBot = (global.GoatBot && global.GoatBot.config && global.GoatBot.config.nickNameBot) || "Aliya Official V4";

  return (
`𓍢ִ໋🌸✧ ── ͟͟͞͞Group Connected Successfully ── ✧🌸𓍢ִ໋🌷͙֒  

ᥫ᭡ 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞 : ${nickNameBot}
ᥫ᭡ 𝐁𝐨𝐭 𝐏𝐫𝐞𝐟𝐢𝐱 : ${prefix}
ᥫ᭡ 𝐔𝐬𝐚𝐠𝐞 : Type ${prefix}help to see all commands

✧─────── ͟͟͞͞Aliya Official V4 ───────✧
👑 𝐎𝐰𝐧𝐞𝐫 : ${ownerInfo.name}
💬 𝐂𝐨𝐧𝐭𝐚𝐜𝐭 : ${ownerInfo.contact}
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

module.exports = {
  config: {
    name: "pending",
    aliases: ["pen", "approve-base", "পেন্ডিং"],
    version: "4.1.0",
    author: "0xMr_King x ┃ Tanin Islam",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Approve or refuse pending threads"
    },
    longDescription: {
      en: "Reply with thread numbers to approve or reply with c[number(s)] / cancel[number(s)] to refuse."
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
        "𓍢ִ໋🌸✧ ── ͟͟͞͞Aliya v4 Pending List ── ✧🌸𓍢ִ໋🌷͙֒\n\nᥫ᭡ Total Pending Threads: %1\n\n%2\n\n💡 Guide:\n- Approve: Reply with numbers (e.g., 1 2 3)\n- Refuse: Reply with c[number] or cancel[number] (e.g., c 1 2 or cancel 3)",
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
    const { valid, invalid } = parseNumbers(rawInput, Reply.pending.length);

    for (const token of invalid)
      await tryCall(() => message.reply(getLang("invaildNumber", token)));

    if (valid.length === 0) {
      return message.reply(
        isCancel
          ? "Please provide at least one valid thread number to cancel."
          : "Please provide at least one valid thread number to approve."
      );
    }

    let count = 0;
    const botID = getBotID(api);

    if (isCancel) {
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

    for (const index of valid) {
      const targetThread = String(Reply.pending[index - 1].threadID);
      const textMsg = buildConnectMessage(targetThread);

      await tryCall(() => api.handleMessageRequest && api.handleMessageRequest(targetThread, true));
      await tryCall(() => threadsData && threadsData.create && threadsData.create(targetThread));
      await tryCall(() => threadsData && threadsData.refreshInfo && threadsData.refreshInfo(targetThread));
      await tryCall(() => approval && approval.approveById && approval.approveById(api, targetThread, event.senderID));
      await updateApprovalLists(targetThread, true);

      if (threadsData && typeof threadsData.set === "function")
        await tryCall(() => threadsData.set(targetThread, true, "data.approved"));

      if (botID)
        await tryCall(() => api.changeNickname && api.changeNickname((global.GoatBot.config.nickNameBot || "Aliya Official V4"), targetThread, botID));

      let sent = false;

      try {
        await api.sendMessage({ body: textMsg, url: DIRECT_IMAGE_URL }, targetThread);
        sent = true;
      } catch (_) {}

      if (!sent) {
        const imagePath = path.join(__dirname, "../../func/botconnect.jpeg");
        if (fs.existsSync(imagePath)) {
          try {
            const attachment = fs.createReadStream(imagePath);
            attachment.on("error", () => {});
            await api.sendMessage({ body: textMsg, attachment }, targetThread);
            sent = true;
          } catch (_) {}
        }
      }

      if (!sent) {
        try {
          await api.sendMessage(textMsg, targetThread);
        } catch (_) {}
      }

      count++;
    }

    return message.reply(getLang("approveSuccess", count));
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

      if (list.length === 0)
        return message.reply(getLang("returnListClean"));

      const body = list.map((group, i) => `${i + 1}. ${group.name || "Unnamed group"} (${group.threadID})`).join("\n");
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
