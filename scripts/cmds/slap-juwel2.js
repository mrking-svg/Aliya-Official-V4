module.exports.config = {
    role: 0,
    countDown: 5,
    category: "general",
    shortDescription: "Slap the friend tag",
    longDescription: "Slap the friend tag",
    guide: "{pn} slap [Tag someone you want to slap]",
    author: "0xMr_King x ┃ Tanin Islam",
  
  name: "slap-juwel2",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "0xMr_King x ┃ Tanin Islam",
  description: "Slap the friend tag",
  commandCategory: "general",
  usages: "slap [Tag someone you want to slap]",
  cooldowns: 5,
};


module.exports.onStart = async ({ api, event, args }) => {
	const axios = require('axios');
	const request = require('request');
	const fs = require("fs");
    var out = (msg) => api.sendMessage(msg, event.threadID, event.messageID);
  if (!args.join("")) return out("Please tag someone");
  else
  return axios.get('https://api.waifu.pics/sfw/slap').then(res => {
        let getURL = res.data.url;
        let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
        var mention = ((Object.keys(event.mentions).length) ? Object.keys(event.mentions) : (event.messageReply && event.messageReply.senderID ? [event.messageReply.senderID] : []))[0];
                  let tag = event.mentions[mention].replace("@", "");    
        
 let callback = function () {
            api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        api.sendMessage({
						        body: "Slapped! " + tag + "\n\n*sorry, i thought there's mosquito*",
                                          mentions: [{
          tag: tag,
          id: ((Object.keys(event.mentions).length) ? Object.keys(event.mentions) : (event.messageReply && event.messageReply.senderID ? [event.messageReply.senderID] : []))[0]
        }],
						attachment: fs.createReadStream(__dirname + `/cache/slap.${ext}`)
					}, event.threadID, () => fs.unlinkSync(__dirname + `/cache/slap.${ext}`), event.messageID)
				};
 //   }
        request(getURL).pipe(fs.createWriteStream(__dirname + `/cache/slap.${ext}`)).on("close", callback);
			})
    .catch(err => {
                     api.sendMessage({ body: "Failed to generate gif, be sure that you've tag someone!", effect: "love" }, event.threadID, event.messageID);
    api.setMessageReaction("☹️", event.messageID, (err) => {}, true);
                  })     
}
