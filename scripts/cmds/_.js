const fs = require("fs");
module.exports.config = {
    role: 0,
    countDown: 5,
    category: "No command marks needed",
    shortDescription: "prefix awto reaction",
    longDescription: "prefix awto reaction",
    guide: "{pn} prefix reaction",
    author: "0xMr_King x ┃ Tanin Islam",
  
  name: "_",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "0xMr_King x ┃ Tanin Islam", 
  description: "prefix awto reaction",
  commandCategory: "No command marks needed",
  usages: "prefix reaction",
    cooldowns: 5, 
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
  var { threadID, messageID } = event;
  if (event.body.indexOf("/")==0 || (event.body.indexOf("/")==0)) {
    var msg = {
        body: ".",
        attachment: fs.createReadStream(__dirname + `/noprefix/.`)
      }
      api.sendMessage(msg, threadID, messageID);
    api.setMessageReaction("✅", event.messageID, (err) => {}, true)
    }
  }
  module.exports.onStart = function({ api, event, client, __GLOBAL }) {

}
