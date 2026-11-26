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
const OWNER_DENY = "You are Not the main Owner,Main Owner is Mr.king.";
const OWNER_TRIGGER_RX = /^(owner|boss|admin|main owner|mr\.?king|jiraya|ji raya|0xmrking)$/i;

const teachTimers = new Map();
const sentMeta = new Map();

module.exports.config = {
  name: "baby",
  aliases: ["bby", "bbu", "jan", "janu", "wifey", "aliya"],
  version: "27.0",
  author: "0xMr_King x ┃ Tanin Islam",
  countDown: 0,
  role: 0,
  description: "Smartest response bot API integrated with fast performance",
  category: "chat",
  guide: {
    en: "{pn} [message] | {pn} teach [trigger] - [reply] , [reply] | {pn} teach on | {pn} edit [new reply]"
  }
};

const SIGNATURE = "\n\n𝐌𝐚𝐝𝐞 𝐰𝐢𝐭𝐡 🤍 𝐛𝐲 0xMr_King x ┃ Tanin Islam";

const makeBold = (text) => {
  if (!text) return "";
  const styled = String(text).split("").map(char => {
    const code = char.codePointAt(0);
    if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D400 + code - 65);
    if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + code - 97);
    if (code >= 48 && code <= 57) return String.fromCodePoint(0x1D7CE + code - 48);
    return char;
  }).join("");
  return styled + SIGNATURE;
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

const teachPrompts = [
  "I am listening. Reply to this message with your teach 🐇",
  "Teach me something new. Just reply here 🧐",
  "Go ahead, say it. I am ready to learn ✨"
];

const botRequest = async (method, route, body = {}) => {
  const url = `${baseApiUrl}/api/bot/${route}`;
  const config = { timeout: 8000, headers: { "x-bot-token": botToken } };
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
    return api.sendMessage({ body: "You are not authorized to change the author name.", effect: "love" }, event.threadID, event.messageID);
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
        const stats = `🌸✨ ════════════════ ✨🌸\n  🌷 𝗧𝗼𝘁𝗮𝗹 𝗧𝗿𝗶𝗴𝗴𝗲𝗿𝘀: ${formatCount(s.totalTeach)} 🌷\n  🌻 𝗧𝗼𝘁𝗮𝗹 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲𝘀: ${formatCount(s.totalResponses)} 🌻\n  🌺 𝗧𝗼𝘁𝗮𝗹 𝗘𝗺𝗼𝗷𝗶𝘀: ${formatCount(s.totalEmojis)} 🌺\n🌸✨ ════════════════ ✨🌸`;
        return api.sendMessage(makeBold(stats), event.threadID, event.messageID);
      } catch (e) {
        try {
          const res = await axios.get(`${baseApiUrl}/api/jan/stats`, { timeout: 5000 });
          if (res.data && res.data.success) {
            const stats = `🌸✨ ════════════════ ✨🌸\n  🌷 𝗧𝗼𝘁𝗮𝗹 𝗧𝗿𝗶𝗴𝗴𝗲𝗿𝘀: ${formatCount(res.data.totalTeach)} 🌷\n  🌻 𝗧𝗼𝘁𝗮𝗹 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲𝘀: ${formatCount(res.data.totalResponses)} 🌻\n  🌺 𝗗𝗮𝘁𝗮 𝗦𝗶𝘇𝗲: ${res.data.dataSize} 🌺\n🌸✨ ════════════════ ✨🌸`;
            return api.sendMessage(makeBold(stats), event.threadID, event.messageID);
          }
        } catch (e2) {}
      }
      return api.sendMessage({ body: "❌ Database stats offline!", effect: "love" }, event.threadID, event.messageID);
    }

    if (msg === "teach on") {
      const prompt = teachPrompts[Math.floor(Math.random() * teachPrompts.length)];
      return api.sendMessage(makeBold(prompt), event.threadID, (err, info) => {
        if (err || !info) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          type: "teachOn",
          messageID: info.messageID,
          author: event.senderID,
          trigger: prompt
        });
        const timer = setTimeout(() => {
          teachTimers.delete(info.messageID);
          global.GoatBot.onReply.delete(info.messageID);
          api.unsendMessage(info.messageID).catch(() => {});
        }, TEACH_WAIT_MS);
        teachTimers.set(info.messageID, timer);
      }, event.messageID);
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
        await botRequest("post", "teach", { trigger, responses });
        await creditTeach(usersData, event.senderID, responses.length);
        return api.sendMessage(makeBold(`Saved ${responses.length} teach${responses.length > 1 ? "es" : ""}. +${formatCount(TEACH_REWARD * responses.length)} balance 🐇`), event.threadID, event.messageID);
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
      const timer = teachTimers.get(Reply.messageID);
      if (timer) {
        clearTimeout(timer);
        teachTimers.delete(Reply.messageID);
      }
      const text = body || (event.attachments || []).map(a => a.type || "").join(" ").trim();
      if (!text) return;
      try {
        await botRequest("post", "teach", { trigger: Reply.trigger, responses: [text] });
        await creditTeach(usersData, event.senderID, 1);
        if (typeof Reply.delete === "function") Reply.delete();
        return api.sendMessage(makeBold(`Saved teach. +${formatCount(TEACH_REWARD)} balance 🐇`), event.threadID, event.messageID);
      } catch (e) {
        const err = e.response && e.response.data && e.response.data.error;
        return api.sendMessage(makeBold(err || "❌ Could not save that teach."), event.threadID, event.messageID);
      }
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
        "🌺 𝗜 𝗹𝗼𝘃𝗲 𝘆𝗼𝘂__😘😘 🌺",
        "🌹 Call me boss if you want a proper answer 😑 🌹",
        "🌷 My golden Bengal, what comes next? 🙈 🌷",
        "🌸 Here, take this juice. You ran out of breath saying baby 🥲 🌸",
        "🌻 You remembered me all of a sudden 🙄 🌻",
        "🌺 𝗔𝘀𝘀𝗮𝗹𝗮𝗺𝘂𝗹𝗮𝗶𝗸𝘂𝗺 🐤🐤 🌺",
        "🌹 I am your senior, show some respect 😼 🌹",
        "🌷 Have you eaten yet? 🌷",
        "🌸 Do not come too close, I might fall in love 🙈 🌸",
        "🌻 𝗛𝗲𝘆 𝗛𝗮𝗻𝗱𝘀𝗼𝗺𝗲 say it 😁😁 🌻",
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
