module.exports.config = {
    role: 2,
    countDown: 5,
    category: "system",
    shortDescription: "Send messages to groups!",
    longDescription: "Send messages to groups!",
    guide: "{pn} [Text]",
    author: "0xMr_King x ┃ Tanin Islam",
  
	name: "sendsms",
	version: "1.0.1",
	hasPermssion: 2,
	credits: "0xMr_King x ┃ Tanin Islam",
	description: "Send messages to groups!",
	commandCategory: "system",
	usages: "[Text]",
	cooldowns: 5
};

module.exports.languages = {
	
	"en": {
		"sendSuccess": "Sent message to %1 thread!",
		"sendFail": "[!] Can't send message to %1 thread"
	}
}

module.exports.onStart = async ({ api, event, args, getText }) => {
	var allThread = global.data.allThreadID || [];
	var count = 1,
		cantSend = [];
	for (const idThread of allThread) {
		if (isNaN(parseInt(idThread)) || idThread == event.threadID) ""
		else {
			api.sendMessage("__Notification from MainSever__\n\n" + args.join(" ") , idThread, (error, info) => {
				if (error) cantSend.push(idThread);
			});
			count++;
			await new Promise(resolve => setTimeout(resolve, 500));
		}
	}
	return api.sendMessage(getText("sendSuccess", count), event.threadID, () => (cantSend.length > 0 ) ? api.sendMessage(getText("sendFail", cantSend.length), event.threadID, event.messageID) : "", event.messageID);
}