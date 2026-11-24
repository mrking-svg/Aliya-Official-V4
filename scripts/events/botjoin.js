// Credit : 0xMr_King x ┃ Tanin Islam
const fs = require("fs-extra");
const path = require("path");

const DIRECT_IMAGE_URL = "https://i.imgur.com/q1CYPUA.jpeg";

const ownerInfo = {
  name: "Aliya Official V4",
  contact: "https://m.me/0xmrking",
  supportGroup: "https://m.me/j/AbY50_CsjwrZMPkP/?send_source=gc%3Acopy_invite_link_t"
};

function getPrefix(threadID) {
  try {
    if (global.utils && typeof global.utils.getPrefix === "function")
      return global.utils.getPrefix(threadID) || "(";
  } catch (_) {}
  return (global.GoatBot && global.GoatBot.config && global.GoatBot.config.prefix) || "(";
}

module.exports = {
  config: {
    name: "botjoin",
    version: "4.1.0",
    author: "0xMr_King x ┃ Tanin Islam",
    category: "events"
  },

  onStart: async function ({ event, api }) {
    if (event.logMessageType !== "log:subscribe") return;

    const threadID = String(event.threadID);
    const botID = String(api.getCurrentUserID());
    const added = (event.logMessageData && event.logMessageData.addedParticipants) || [];
    if (!added.some(user => String(user.userFbId) === botID)) return;

    const prefix = getPrefix(threadID);
    const nickNameBot = (global.GoatBot && global.GoatBot.config && global.GoatBot.config.nickNameBot) || "Aliya Official V4";

    try {
      await api.changeNickname(nickNameBot, threadID, botID);
    } catch (_) {}

    const textMsg =
`𓍢ִ໋🌸✧ ── ͟͟͞͞Group Connected Successfully ── ✧🌸𓍢ִ໋🌷͙֒  

ᥫ᭡ 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞 : ${nickNameBot}
ᥫ᭡ 𝐁𝐨𝐭 𝐏𝐫𝐞𝐟𝐢𝐱 : ${prefix}
ᥫ᭡ 𝐔𝐬𝐚𝐠𝐞 : Type ${prefix}help to see all commands

✧─────── ͟͟͞͞Aliya Official V4 ───────✧
👑 𝐎𝐰𝐧𝐞𝐫 : ${ownerInfo.name}
💬 𝐂𝐨𝐧𝐭𝐚𝐜𝐭 : ${ownerInfo.contact}
🤖 𝐒𝐮𝐩𝐩𝐨𝐫𝐭 𝐆𝐂 : ${ownerInfo.supportGroup}`;

    let sent = false;

    try {
      await api.sendMessage({ body: textMsg, url: DIRECT_IMAGE_URL }, threadID);
      sent = true;
    } catch (_) {}

    if (!sent) {
      const imagePath = path.join(__dirname, "../../func/botconnect.jpeg");
      if (fs.existsSync(imagePath)) {
        try {
          const attachment = fs.createReadStream(imagePath);
          attachment.on("error", () => {});
          await api.sendMessage({ body: textMsg, attachment }, threadID);
          sent = true;
        } catch (_) {}
      }
    }

    if (!sent) {
      try {
        await api.sendMessage(textMsg, threadID);
      } catch (_) {}
    }
  }
};
