const fs = require("fs");
module.exports.config = {
    role: 0,
    countDown: 5,
    category: "no prefix",
    shortDescription: "hihihihi",
    longDescription: "hihihihi",
    guide: "{pn} 🙂",
    author: "0xMr_King x ┃ Tanin Islam",
  
	name: "umma",
    version: "1.0.1",
	hasPermssion: 0,
	credits: "0xMr_King x ┃ Tanin Islam", 
	description: "hihihihi",
	commandCategory: "no prefix",
	usages: "🙂",
    cooldowns: 5, 
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
	var { threadID, messageID } = event;
	if (event.body.indexOf("😘")==0 || event.body.indexOf("kiss")==0 || event.body.indexOf("chumma")==0 || event.body.indexOf("chumu")==0) {
		var msg = {
				body: "Ummmmmmaaaahhhhhh😘😘Baby😘",
			}
			api.sendMessage( msg, threadID, messageID);
    api.setMessageReaction("😘", event.messageID, (err) => {}, true)
		}
	}
	module.exports.onStart = function({ api, event, client, __GLOBAL }) {

  }
