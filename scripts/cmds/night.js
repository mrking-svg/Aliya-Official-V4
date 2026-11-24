const fs = require("fs");
module.exports.config = {
    role: 0,
    countDown: 5,
    category: "no prefix",
    shortDescription: "hihihihi",
    longDescription: "hihihihi",
    guide: "{pn} night",
    author: "0xMr_King x ┃ Tanin Islam",
  
	name: "night",
    version: "1.0.1",
	hasPermssion: 0,
	credits: "0xMr_King x ┃ Tanin Islam", 
	description: "hihihihi",
	commandCategory: "no prefix",
	usages: "night",
    cooldowns: 5, 
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
	var { threadID, messageID } = event;
	if (event.body.indexOf("Good night")==0 || event.body.indexOf("good night")==0 || event.body.indexOf("Gud night")==0 || event.body.indexOf("Gud nini")==0) {
		var msg = {
				body: "Good night 🌉✨ Bye tc 💫🥀 Sweet dreams 😴",
				attachment: fs.createReadStream(__dirname + `/cache/night.jpg`)
			}
			api.sendMessage(msg, threadID, messageID);
    api.setMessageReaction("😴", event.messageID, (err) => {}, true)
		}
	}
	module.exports.onStart = function({ api, event, client, __GLOBAL }) {

  }