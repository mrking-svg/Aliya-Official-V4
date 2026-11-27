const axios = require("axios");

const roniTriggers = [
  "baby",
  "bby",
  "babu",
  "bbu",
  "jan",
  "bot",
  "জান",
  "জানু",
  "বেবি",
  "wifey",
  "aliya"
];

const baseApiUrl = "https://baby-one-zeta.vercel.app";
const botToken = process.env.BABY_BOT_TOKEN || "aliya-bot-token-2026";
const TEACH_REWARD = 2000;
const TEACH_WAIT_MS = 2 * 60 * 1000;
// Facebook treats rapid unsend+send bursts as abuse. Keep a small gap between
// teach prompts and serialize API/DB writes. Set to 0 only in local tests.
const TEACH_PROMPT_GAP_MS = Math.max(0, Number(process.env.ALIYA_TEACH_PROMPT_GAP_MS ?? 1500));
const TEACH_SAVE_TIMEOUT_MS = 8000;
const OWNER_DENY = "You are Not the main Owner,Main Owner is Mr.king.";
const OWNER_TRIGGER_RX = /^(owner|boss|admin|main owner|mr\.?king|jiraya|ji raya|0xmrking)$/i;

const teachTimers = new Map();
const teachSessions = new Map();
const sentMeta = new Map();

const sessionKey = (threadID, senderID) => `${threadID}:${senderID}`;
const formatReward = (n) => {
  const v = Number(n) || 0;
  return v >= 1000 && v % 1000 === 0 ? `${v / 1000}K` : formatCount(v);
};

module.exports.config = {
  name: "baby",
  aliases: ["bby", "bbu", "jan", "janu", "wifey", "aliya"],
  version: "27.3",
  author: "0xMr_King x ┃ Tanin Islam",
  countDown: 0,
  role: 0,
  description: "Smartest response bot API integrated with fast performance",
  category: "chat",
  guide: {
    en: "{pn} [message] | {pn} teach [trigger] - [reply] , [reply] | {pn} teach on | {pn} teach off | {pn} find [trigger] | {pn} edit [new reply]"
  }
};

const makeBold = (text) => {
  if (!text) return "";
  return String(text).split("").map(char => {
    const code = char.codePointAt(0);
    if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D400 + code - 65);
    if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + code - 97);
    if (code >= 48 && code <= 57) return String.fromCodePoint(0x1D7CE + code - 48);
    return char;
  }).join("");
};

const formatCount = (num) => {
  const n = Number(num) || 0;
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toLocaleString();
};

const handleMediaCheck = (attachments) => {
  if (attachments && attachments.length > 0) {
    const type = attachments[0].type;
    const replies = {
      video: ["Mb nai bby pore dio", "ajaira sop video😒", "1 ta kidni de then dekhmu"],
      audio: ["Sent 100000000tk to bkash then I will listen", "aj boyra bole kisu sunte parlam na😤"],
      photo: ["iss amk picture diye potanor chesta 🌚😘", "pic dekhe ki hobe jokon mb e nai"],
      animated_image: ["iss gif pic diye potanor chesta 🌚😘", "pic dekhe ki hobe jokon mb e nai"],
      sticker: ["ki re sticker dekhass keno 😾", "sticker na  diye kotha bolo 😸", "sticker pathiye ki bhabchho? 😼"]
    };
    if (replies[type]) {
      const list = replies[type];
      return list[Math.floor(Math.random() * list.length)];
    }
  }
  return null;
};

const defaultReplies = [
  "Hi Apu Ami asole onek din dhorei tomake pochondo Kori kintu bolte pari na ajke sahos kore tomake friend request diye dilam plz accept Koro nahole ami bachbo na ",
  "bou thakle chuman na thakle guman🛌",
  "এমবি নাই ভাই, এমবি কিনে দে তারপর কথা কমু 📱💸",
  "umm i don't have any teach about that 👾",
  "go to https://baby-one-zeta.vercel for chatting 😴",
  "wanna hear a joke ? You are pregnant 🙂‍↕️",
  "Tomar kotha to tmr network o sune na ami ki sunbo😞",
  "eto questions Kno koro boring Lage edi 😴",
  "Watch Muhhobbat gumsuda meri (a pakistan series/drama you will have some relax vipe)its available on YouTube 😌",
  "kobe je  Mr.king Real vabe khusi hobe k jne 🛌🎀"
];

const botRequest = async (method, route, body = {}, timeout = 15000) => {
  const url = `${baseApiUrl}/api/bot/${route}`;
  const config = { timeout, headers: { "x-bot-token": botToken } };
  const res = method === "get" ? await axios.get(url, config) : await axios.post(url, body, config);
  return res.data;
};

const fetchBotResponse = async (text, name) => {
  try {
    const data = await botRequest("post", "reply", { text, name });
    if (data && data.message) return data;
  } catch (e) {}

  try {
    const res = await axios.post(`${baseApiUrl}/api/aliya`, { text, name }, { timeout: 8000 });
    if (res.data && res.data.message) {
      return { message: res.data.message, trigger: null, originalResponse: null };
    }
  } catch (e) {}

  const message = defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
  return { message, trigger: null, originalResponse: null };
};

const isOwner = (senderID) => {
  const cfg = global.GoatBot?.config || {};
  const ids = [...(cfg.adminBot || []), ...(cfg.developer || [])].map(String);
  return ids.includes(String(senderID));
};

const creditTeach = async (usersData, senderID, count) => {
  const user = await usersData.get(senderID);
  await usersData.set(senderID, { money: (Number(user.money) || 0) + TEACH_REWARD * count });
};

// A Facebook send error must never become an uncaught exception in a timer or
// callback. A real block stops the whole bot through the existing handler;
// ordinary rate-limit errors just end this teach session quietly.
function isFacebookBlockError(value) {
  return /blocked login|facebook blocked login|temporarily blocked|account.*blocked/i.test(String(value || ""));
}

function handleTeachSendError(err) {
  const text = String((err && (err.message || err.error)) || err || "");
  if (isFacebookBlockError(text)) {
    try { process.emit("aliyaFacebookBlocked", "baby teach send"); } catch (_) {}
  }
}

function safeTeachSend(api, payload, threadID, callback, replyID) {
  let settled = false;
  const done = (err, info) => {
    if (settled) return;
    settled = true;
    handleTeachSendError(err);
    if (typeof callback === "function") callback(err, info);
  };
  try {
    const result = api.sendMessage(payload, threadID, done, replyID);
    if (result && typeof result.catch === "function") result.catch(err => done(err, null));
    return result;
  } catch (err) {
    done(err, null);
    return null;
  }
}

// Only one teach save runs at a time. Rapid replies are queued instead of
// firing overlapping axios calls and usersData writes.
function queueTeachSave(session, task) {
  const job = (session.chain || Promise.resolve()).then(task, task);
  session.chain = job.catch(() => {});
  return job;
}

function stopTeachSession(key, api, unsend = false) {
  const session = teachSessions.get(key);
  if (!session) return false;
  session.closed = true;
  if (session.timer) clearTimeout(session.timer);
  if (session.promptTimer) clearTimeout(session.promptTimer);
  if (session.messageID) {
    teachTimers.delete(session.messageID);
    if (global.GoatBot && global.GoatBot.onReply) global.GoatBot.onReply.delete(session.messageID);
    if (unsend && api) {
      try { const p = api.unsendMessage(session.messageID); if (p && p.catch) p.catch(() => {}); } catch (_) {}
    }
  }
  teachSessions.delete(key);
  return true;
}

// Called only when a teach-on session ends: on `(baby teach off`, on a reply
// with "teach off", or after 2 minutes of inactivity. No per-teach spam.
function finishTeachSession(api, event, session, replyID = null) {
  const count = Number(session.count) || 0;
  const name = session.name || "there";
  if (!stopTeachSession(session.key, api, true)) return;
  if (count <= 0) {
    return safeTeachSend(api, makeBold("Teach off 🐇"), event.threadID, undefined, replyID || undefined);
  }
  const total = formatReward(TEACH_REWARD * count);
  return safeTeachSend(
    api,
    makeBold(`Hey ${name}, you have got ${total} total for teach 🐇`),
    event.threadID,
    undefined,
    replyID || undefined
  );
}

async function sendTeachPrompt(api, event, session) {
  if (!session || session.closed) return null;

  if (session.promptTimer) {
    clearTimeout(session.promptTimer);
    session.promptTimer = null;
  }
  const wait = Math.max(0, TEACH_PROMPT_GAP_MS - (Date.now() - (session.lastPromptAt || 0)));
  if (wait > 0) {
    session.promptTimer = setTimeout(() => {
      session.promptTimer = null;
      sendTeachPrompt(api, event, session);
    }, wait);
    if (typeof session.promptTimer.unref === "function") session.promptTimer.unref();
    return null;
  }

  session.lastPromptAt = Date.now();
  let prompt = "";
  let trigger = session.trigger || "baby";
  try {
    const randomTeach = await botRequest("get", "random", {}, TEACH_SAVE_TIMEOUT_MS);
    const line = randomTeach && (randomTeach.message || randomTeach.response || randomTeach.text);
    if (line) {
      prompt = String(line);
      trigger = String(randomTeach.trigger || trigger);
    }
  } catch (_) {}
  if (session.closed) return null;
  if (!prompt) prompt = defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
  session.trigger = trigger;

  return new Promise(resolve => {
    safeTeachSend(api, makeBold(prompt), event.threadID, (err, info) => {
      if (session.closed) return resolve(null);
      if (err || !info) {
        // Facebook refused this send. End quietly instead of retrying in a
        // tight loop; extra sends are what turn a rate limit into a block.
        stopTeachSession(session.key, api, false);
        return resolve(null);
      }
      session.messageID = info.messageID;
      if (global.GoatBot && global.GoatBot.onReply) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          type: "teachOn",
          messageID: info.messageID,
          author: event.senderID,
          sessionKey: session.key,
          trigger
        });
      }
      if (session.timer) clearTimeout(session.timer);
      session.timer = setTimeout(() => {
        teachTimers.delete(info.messageID);
        if (global.GoatBot && global.GoatBot.onReply) global.GoatBot.onReply.delete(info.messageID);
        // 2 min inactivity = session end -> send the total reward summary.
        finishTeachSession(api, event, session);
      }, TEACH_WAIT_MS);
      if (typeof session.timer.unref === "function") session.timer.unref();
      teachTimers.set(info.messageID, session.timer);
      resolve(info);
    }, event.messageID);
  });
}

const sendBaby = (api, event, text, data = {}) => api.sendMessage(
  makeBold(text),
  event.threadID,
  (err, info) => {
    if (err || !info) return;
    global.GoatBot.onReply.set(info.messageID, {
      commandName: module.exports.config.name,
      type: "chat",
      messageID: info.messageID,
      author: event.senderID,
      ...data
    });
    sentMeta.set(info.messageID, data);
    if (sentMeta.size > 500) sentMeta.delete(sentMeta.keys().next().value);
  },
  event.messageID
);

const parseTeach = (raw) => {
  const text = String(raw || "").trim();
  let trigger = "";
  let body = "";
  const dash = text.indexOf(" - ");
  if (dash >= 0) {
    trigger = text.slice(0, dash).trim();
    body = text.slice(dash + 3).trim();
  } else {
    const space = text.search(/\s+/);
    trigger = space >= 0 ? text.slice(0, space).trim() : text;
    body = space >= 0 ? text.slice(space + 1).trim() : "";
  }
  const responses = body.split(/\s*,\s*/).map(s => s.trim()).filter(Boolean).slice(0, 20);
  return { trigger, responses };
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
  if (module.exports.config.author !== "0xMr_King x ┃ Tanin Islam") {
    return api.sendMessage({ body: "You are not authorized to change the author name." }, event.threadID, event.messageID);
  }

  const rawMsg = args ? args.join(" ") : "";
  const msg = rawMsg.toLowerCase().trim();

  try {
    api.setMessageReaction("🏵️", event.messageID, () => {}, true);

    const name = usersData && usersData.getName ? await usersData.getName(event.senderID).catch(() => "") : "";

    if (!args[0]) {
      const ran = ["Bolo baby", "I love you", "Welcome to Aliya Bot! 😎"];
      return api.sendMessage(makeBold(ran[Math.floor(Math.random() * ran.length)]), event.threadID, event.messageID);
    }

    if (msg === "list" || msg === "datacheck") {
      try {
        const s = await botRequest("get", "stats");
        const stats = `🌸✨ ════════════════ ✨🌸\n  🌷 𝐓𝐨𝐭𝐚𝐥 𝐓𝐫𝐢𝐠𝐠𝐞𝐫𝐬: ${formatCount(s.totalTeach)} 🌷\n  🌻 𝐓𝐨𝐭𝐚𝐥 𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞𝐬: ${formatCount(s.totalResponses)} 🌻\n  🌺 𝐓𝐨𝐭𝐚𝐥 𝐄𝐦𝐨𝐣𝐢𝐬: ${formatCount(s.totalEmojis)} 🌺\n🌸✨ ════════════════ ✨🌸`;
        return api.sendMessage(makeBold(stats), event.threadID, event.messageID);
      } catch (e) {
        try {
          const res = await axios.get(`${baseApiUrl}/api/jan/stats`, { timeout: 5000 });
          if (res.data && res.data.success) {
            const stats = `🌸✨ ════════════════ ✨🌸\n  🌷 𝐓𝐨𝐭𝐚𝐥 𝐓𝐫𝐢𝐠𝐠𝐞𝐫𝐬: ${formatCount(res.data.totalTeach)} 🌷\n  🌻 𝐓𝐨𝐭𝐚𝐥 𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞𝐬: ${formatCount(res.data.totalResponses)} 🌻\n  🌺 𝐃𝐚𝐭𝐚 𝐒𝐢𝐳𝐞: ${res.data.dataSize} 🌺\n🌸✨ ════════════════ ✨🌸`;
            return api.sendMessage(makeBold(stats), event.threadID, event.messageID);
          }
        } catch (e2) {}
      }
      return api.sendMessage({ body: "❌ Database stats offline!" }, event.threadID, event.messageID);
    }

    if (/^find\b/i.test(msg)) {
      const query = rawMsg.replace(/^\s*find\s*/i, "").trim();
      if (!query) {
        return api.sendMessage(makeBold("Use: find [trigger]"), event.threadID, event.messageID);
      }
      try {
        const found = await botRequest("post", "find", { trigger: query });
        const responses = Array.isArray(found.responses) ? found.responses : [];
        const text = responses.length
          ? `🔎 𝐅𝐨𝐮𝐧𝐝 : ${found.trigger || query}\n𝐓𝐨𝐭𝐚𝐥 𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞𝐬: ${formatCount(responses.length)}\n\n` +
            responses.map((r, i) => `${i + 1}. ${r}`).join("\n")
          : `🔎 𝐍𝐨 𝐭𝐞𝐚𝐜𝐡 𝐟𝐨𝐮𝐧𝐝 𝐟𝐨𝐫: ${query}`;
        return api.sendMessage(makeBold(text), event.threadID, event.messageID);
      } catch (e) {
        const err = e.response && e.response.data && e.response.data.error;
        return api.sendMessage(makeBold(err || "❌ Could not find that teach."), event.threadID, event.messageID);
      }
    }

    if (msg === "teach off" || msg === "teachoff") {
      const key = sessionKey(event.threadID, event.senderID);
      const session = teachSessions.get(key);
      if (!session) {
        return api.sendMessage(makeBold("No active teach session."), event.threadID, event.messageID);
      }
      return finishTeachSession(api, event, session, event.messageID);
    }

    if (msg === "teach on" || msg === "teachon") {
      const key = sessionKey(event.threadID, event.senderID);
      stopTeachSession(key, api, true);
      const session = {
        key, trigger: "baby", messageID: null, timer: null,
        promptTimer: null, lastPromptAt: 0, chain: Promise.resolve(), closed: false,
        count: 0, name: name || "there"
      };
      teachSessions.set(key, session);
      await sendTeachPrompt(api, event, session);
      return;
    }

    if (/^teach\b/i.test(msg)) {
      const { trigger, responses } = parseTeach(rawMsg.replace(/^\s*teach\s*/i, ""));
      if (!trigger || !responses.length) {
        return api.sendMessage(makeBold("Use: teach [trigger] - [reply] , [another reply]"), event.threadID, event.messageID);
      }
      if (OWNER_TRIGGER_RX.test(trigger) && !isOwner(event.senderID)) {
        return api.sendMessage(OWNER_DENY, event.threadID, event.messageID);
      }
      try {
        await botRequest("post", "teach", { trigger, responses }, TEACH_SAVE_TIMEOUT_MS);
        await creditTeach(usersData, event.senderID, responses.length);
        return api.sendMessage(makeBold(`Saved ${responses.length} teach${responses.length > 1 ? "es" : ""}. +${formatReward(TEACH_REWARD * responses.length)} balance 🐇`), event.threadID, event.messageID);
      } catch (e) {
        const err = e.response && e.response.data && e.response.data.error;
        return api.sendMessage(makeBold(err || "❌ Could not save that teach."), event.threadID, event.messageID);
      }
    }

    if (/^edit\b/i.test(msg)) {
      if (!isOwner(event.senderID)) {
        return api.sendMessage(OWNER_DENY, event.threadID, event.messageID);
      }
      const target = event.messageReply;
      const newResponse = rawMsg.replace(/^\s*edit\s*/i, "").trim();
      const meta = target && target.messageID ? sentMeta.get(target.messageID) : null;
      if (!target || !meta || !meta.trigger || !meta.originalResponse || !newResponse) {
        return api.sendMessage(makeBold("Reply to one of my messages with: edit [new reply]"), event.threadID, event.messageID);
      }
      try {
        await botRequest("post", "edit", {
          trigger: meta.trigger,
          oldResponse: meta.originalResponse,
          newResponse
        });
        sentMeta.set(target.messageID, { ...meta, originalResponse: newResponse });
        return api.sendMessage(makeBold("Teach updated 🐇"), event.threadID, event.messageID);
      } catch (e) {
        const err = e.response && e.response.data && e.response.data.error;
        return api.sendMessage(makeBold(err || "❌ Could not edit that teach."), event.threadID, event.messageID);
      }
    }

    const mediaReply = handleMediaCheck(event.attachments);
    const hit = mediaReply
      ? { message: mediaReply, trigger: null, originalResponse: null }
      : await fetchBotResponse(rawMsg, name);

    return sendBaby(api, event, hit.message, {
      trigger: hit.trigger,
      originalResponse: hit.originalResponse
    });

  } catch (err) {
    console.error(err);
  }
};

module.exports.onReply = async ({ api, event, args, usersData, Reply }) => {
  if (module.exports.config.author !== "0xMr_King x ┃ Tanin Islam") return;
  try {
    const body = String(event.body || "").trim();
    const prefix = global.GoatBot?.config?.prefix || "!";

    if (body.startsWith(prefix)) return;

    if (Reply && Reply.type === "teachOn") {
      if (String(Reply.author) !== String(event.senderID)) return;
      const key = Reply.sessionKey || sessionKey(event.threadID, event.senderID);
      const session = teachSessions.get(key);
      if (!session || session.messageID !== Reply.messageID || session.closed) return;

      const timer = teachTimers.get(Reply.messageID);
      if (timer) {
        clearTimeout(timer);
        teachTimers.delete(Reply.messageID);
      }
      if (session.timer) {
        clearTimeout(session.timer);
        session.timer = null;
      }
      // Remove the old reply handle immediately so a double-tap cannot save
      // the same message twice or open two prompt loops.
      if (typeof Reply.delete === "function") Reply.delete();

      const text = body || (event.attachments || []).map(a => a.type || "").join(" ").trim();
      if (/^(teach\s+off|off)$/i.test(text)) {
        return finishTeachSession(api, event, session, event.messageID);
      }
      if (!text) {
        return sendTeachPrompt(api, event, session);
      }

      const trigger = Reply.trigger || session.trigger;
      let saved = false;
      try {
        saved = await queueTeachSave(session, async () => {
          if (session.closed) return false;
          await botRequest("post", "teach", { trigger, responses: [text] }, TEACH_SAVE_TIMEOUT_MS);
          await creditTeach(usersData, event.senderID, 1);
          session.count = (Number(session.count) || 0) + 1;
          return true;
        });
      } catch (_) {
        saved = false;
      }
      if (session.closed) return;
      if (!saved) {
        safeTeachSend(api, makeBold("❌ Could not save that teach."), event.threadID, undefined, event.messageID);
      }
      // No per-teach confirmation here. The total is announced only when the
      // session ends via teach off or 2 min of inactivity.
      return sendTeachPrompt(api, event, session);
    }

    if (event.attachments && event.attachments[0] && event.attachments[0].type === "sticker") {
      return require("./autosticker").sendRandomSticker(api, event.threadID, event.messageID);
    }

    if (/\b(gan|gaan|song|music)\b/i.test(body)) {
      return require("./gan").onStart({ api, event, args });
    }

    if (/\b(anime\s*video|video\s*dew|anime\s*vid)\b/i.test(body)) {
      return require("./wifuvid").onStart({ api, event, args });
    }

    const mediaReply = handleMediaCheck(event.attachments);
    const name = usersData && usersData.getName ? await usersData.getName(event.senderID).catch(() => "") : "";
    const hit = mediaReply
      ? { message: mediaReply, trigger: null, originalResponse: null }
      : await fetchBotResponse(body || "fallback", name);

    return sendBaby(api, event, hit.message, {
      trigger: hit.trigger,
      originalResponse: hit.originalResponse
    });

  } catch (err) {
    console.error(err);
  }
};

module.exports.onChat = async ({ api, event }) => {
  try {
    if (module.exports.config.author !== "0xMr_King x ┃ Tanin Islam") return;
    if (event.type === "message_reply") return;

    const body = event.body ? event.body.toLowerCase().trim() : "";
    const prefix = global.GoatBot?.config?.prefix || "!";
    if (body.startsWith(prefix)) return;

    let matchedTrigger = null;
    let queryText = "";

    for (const trigger of roniTriggers) {
      if (body === trigger || body.startsWith(trigger + " ")) {
        matchedTrigger = trigger;
        queryText = event.body.substring(trigger.length).trim();
        break;
      }
    }

    if (!matchedTrigger) return;

    api.setMessageReaction("🌸", event.messageID, () => {}, true);

    const mediaReply = handleMediaCheck(event.attachments);
    if (mediaReply) {
      return sendBaby(api, event, mediaReply, { trigger: null, originalResponse: null });
    }

    if (!queryText) {
      const randomMessages = [
        "🌸 You called me, and I will answer every single word 😘 🌸",
        "🌷 I sent you a message instead of a rose 🌷",
        "🌻 Tell me what is on your mind 🤭 🌻",
        "🌺 𝐈 𝐥𝐨𝐯𝐞 𝐲𝐨𝐮__😘😘 🌺",
        "🌹 Call me boss if you want a proper answer 😑 🌹",
        "🌷 My golden Bengal, what comes next? 🙈 🌷",
        "🌸 Here, take this juice. You ran out of breath saying baby 🥲 🌸",
        "🌻 You remembered me all of a sudden 🙄 🌻",
        "🌺 𝐀𝐬𝐬𝐚𝐥𝐚𝐦𝐮𝐥𝐚𝐢𝐤𝐮𝐦 🐤🐤 🌺",
        "🌹 I am your senior, show some respect 😼 🌹",
        "🌷 Have you eaten yet? 🌷",
        "🌸 Do not come too close, I might fall in love 🙈 🌸",
        "🌻 𝐇𝐞𝐲 𝐇𝐚𝐧𝐝𝐬𝐨𝐦𝐞 say it 😁😁 🌻",
        "🌺 Tell me, my love, how are you? 😚 🌺",
        "🌹 Stop calling me, okay? 😿 🌹",
        "🌷 I want my JaNu, are you single? 🌷"
      ];
      const babyMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
      return sendBaby(api, event, babyMessage, { trigger: null, originalResponse: null });
    }

    const hit = await fetchBotResponse(queryText, "");
    return sendBaby(api, event, hit.message, {
      trigger: hit.trigger,
      originalResponse: hit.originalResponse
    });

  } catch (err) {
    console.error(err);
  }
};
