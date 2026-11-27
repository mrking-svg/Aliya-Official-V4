module.exports.config = {
    role: 2,
    countDown: 0,
    category: "System",
    shortDescription: "Delete all messages on ACC Bot",
    longDescription: "Delete all messages on ACC Bot",
    guide: "{pn} [thread/all]",
    author: "0xMr_King x ┃ Tanin Islam",
  
	name: "delmsg",
	version: "1.0.0",
	hasPermssion: 2,
	credits: "0xMr_King x ┃ Tanin Islam",
	description: "Delete all messages on ACC Bot",
	commandCategory: "System",
	usages: "[thread/all]",
	cooldowns: 0
};

module.exports.onStart = function({ api, event, args, getText }) {
if (args[0] == "all") {
 return api.getThreadList(1000, null, ["INBOX"], (err, list) => {
 	if (err) throw err;
 	list.forEach(item => (item.threadID != event.threadID) ? api.deleteThread(item.threadID) : "");
 	api.sendMessage({ body: "Successfully erase all messages" }, event.threadID)
 })
}
else return api.getThreadList(1000, null, ["INBOX"], (err, list) => {
 	if (err) throw err;
 	list.forEach(item => (item.isGroup == true && item.threadID != event.threadID) ? api.deleteThread(item.threadID) : "");
 	api.sendMessage({ body: "Successfully erase all group messages" }, event.threadID)
 })
}