module.exports.config = {
    role: 0,
    countDown: 5,
    category: "no prefix",
    shortDescription: "জুয়েল লিখলে ☠️ রিয়েক্ট দিবে",
    longDescription: "জুয়েল লিখলে ☠️ রিয়েক্ট দিবে",
    guide: "{pn} জুয়েল",
    author: "0xMr_King x ┃ Tanin Islam",
  
  name: "jwl",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "0xMr_King x ┃ Tanin Islam",
  description: "জুয়েল লিখলে ☠️ রিয়েক্ট দিবে",
  commandCategory: "no prefix",
  usages: "জুয়েল",
  cooldowns: 5
};

const clean = s => String(s)
  .normalize("NFC")
  .replace(/[\u200B-\u200D\uFEFF]/g, "")
  .toLowerCase();

const triggers = [
  "জুয়েল", "জুয়েল ভাই", "জুয়েল ভাইয়া", "জুয়েল বস",
  "juwel", "juwel vai", "juwel bhai", "jewel", "jwl",
  "mr juwel"
].map(clean);

module.exports.handleEvent = function ({ api, event }) {
  const { messageID, body } = event;
  if (!body) return;

  console.log("[jwl] message:", body);

  const text = clean(body);
  if (triggers.some(t => text.includes(t))) {
    console.log("[jwl] matched, reacting");
    api.setMessageReaction("☠️", messageID, err => {
      if (err) console.log("[jwl] react error:", err);
    }, true);
  }
};

module.exports.onStart = function () {};
