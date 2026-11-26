module.exports.config = {
    role: 0,
    countDown: 0,
    category: "Box",
    shortDescription: "Change your group Emoji",
    longDescription: "Change your group Emoji",
    guide: "{pn} groupemoji [name]",
    author: "0xMr_King x ┃ Tanin Islam",
  
	name: "groupemoji",
	aliases: ["setemoji"],
	version: "1.0.0", 
	hasPermssion: 0,
	credits: "0xMr_King x ┃ Tanin Islam",
	description: "Change your group Emoji",
	commandCategory: "Box", 
	usages: "groupemoji [name]", 
	cooldowns: 0,
	dependencies: [] 
};

module.exports.onStart = async function({ api, event, args }) {
	var emoji = args.join(" ")
	if (!emoji) api.sendMessage({ body: "You have not entered Emoji 🐸", effect: "love" }, event.threadID, event.messageID)
	else api.changeThreadEmoji(emoji, event.threadID, () => api.sendMessage({ body: `🔨 The bot successfully changed Emoji to: ${emoji}`, effect: "love" }, event.threadID, event.messageID));
};