const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const OWNER_CREDIT = "0xMr_King x ┃ Tanin Islam";

function creditOk() {
  return module.exports.config.credits === OWNER_CREDIT;
}

module.exports.config = {
    role: 2,
    countDown: 10,
    category: "Admin",
    shortDescription: "ছবিতে রিপ্লাই দিয়ে বটের প্রোফাইল পিকচার সেট করুন",
    longDescription: "ছবিতে রিপ্লাই দিয়ে বটের প্রোফাইল পিকচার সেট করুন",
    guide: "{pn} setpp (ছবিতে রিপ্লাই দিন)",
  
  name: "setpp",
  version: "1.3.0",
  hasPermssion: 2,
  credits: "0xMr_King x ┃ Tanin Islam",
  description: "ছবিতে রিপ্লাই দিয়ে বটের প্রোফাইল পিকচার সেট করুন",
  commandCategory: "Admin",
  usages: "setpp (ছবিতে রিপ্লাই দিন)",
  cooldowns: 10,
  dependencies: {
    "fs-extra": "",
    "axios": ""
  }
};

module.exports.onLoad = function () {
  if (!creditOk()) console.log("❌ [setpp] ক্রেডিট বদলানো হয়েছে, কমান্ড বন্ধ।");
};

module.exports.onStart = async function ({ api, event }) {
  const { threadID, messageID, senderID, messageReply } = event;

  // 🔒 ক্রেডিট লক
  if (!creditOk()) {
    return api.sendMessage({ body: "⛔ ক্রেডিট বদলানো হয়েছে! কমান্ড বন্ধ।", effect: "love" }, threadID, messageID);
  }

  // শুধু বট অ্যাডমিন
  const adminBot = (global.config && global.config.adminBot) || [];
  if (!adminBot.includes(String(senderID))) {
    return api.sendMessage({ body: "❌ শুধু বট অ্যাডমিন ব্যবহার করতে পারবে।", effect: "love" }, threadID, messageID);
  }

  if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage({ body: "📸 একটি ছবিতে রিপ্লাই দিন।", effect: "love" }, threadID, messageID);
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage({ body: "❌ এটা ছবি নয়।", effect: "love" }, threadID, messageID);
  }

  const cacheDir = path.join(__dirname, "cache");
  const imgPath = path.join(cacheDir, `setpp_${Date.now()}.jpg`);

  try {
    fs.ensureDirSync(cacheDir);

    const res = await axios.get(attachment.url, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, Buffer.from(res.data));

    api.changeAvatar(fs.createReadStream(imgPath), "", null, (err) => {
      fs.removeSync(imgPath);

      if (err) {
        console.log("setpp error:", err);
        return api.sendMessage({ body: "❌ প্রোফাইল পিকচার সেট হয়নি।", effect: "love" }, threadID);
      }

      return api.sendMessage(
{ body: `╔════════════════════╗
  ✅ 𝗡𝗘𝗪 𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗣𝗜𝗖 𝗦𝗘𝗧
╚════════════════════╝

🖼️ বটের নতুন প্রোফাইল পিক
সফলভাবে সেট হয়েছে!

━━━━━━━━━━━━━━━━━━
👑 0xMr_King x ┃ Tanin Islam`, effect: "love" },
        threadID
      );
    });
  } catch (e) {
    console.log("setpp error:", e);
    if (fs.existsSync(imgPath)) fs.removeSync(imgPath);
    return api.sendMessage({ body: "❌ কিছু সমস্যা হয়েছে।", effect: "love" }, threadID, messageID);
  }
};
