module.exports.config = {
    role: 0,
    countDown: 5,
    category: "anime",
    shortDescription: "pat the friend tag",
    longDescription: "pat the friend tag",
    guide: "{pn} pat [Tag someone you want to pat]",
    author: "0xMr_King x ┃ Tanin Islam",
  
  name: "pat",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "0xMr_King x ┃ Tanin Islam",
  description: "pat the friend tag",
  commandCategory: "anime",
  usages: "pat [Tag someone you want to pat]",
  cooldowns: 5,
};


module.exports.onStart = async ({ api, event, args }) => {
	const axios = require('axios');
	const request = require('request');
	const fs = require("fs");
    var out = (msg) => api.sendMessage(msg, event.threadID, event.messageID);
  if (!args.join("")) return out("Please tag someone");
  else
  return axios.get('https://api.satou-chan.xyz/api/endpoint/pat').then(res => {
        let getURL = res.data.url;
        let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
        var mention = ((Object.keys(event.mentions).length) ? Object.keys(event.mentions) : (event.messageReply && event.messageReply.senderID ? [event.messageReply.senderID] : []))[0];
                  let tag = event.mentions[mention].replace("@", "");    
        
 let callback = function () {
            api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        api.sendMessage({
						        body: "Pats, " + tag + ". Yosh yosh!",
                                          mentions: [{
          tag: tag,
          id: ((Object.keys(event.mentions).length) ? Object.keys(event.mentions) : (event.messageReply && event.messageReply.senderID ? [event.messageReply.senderID] : []))[0]
        }],
						attachment: fs.createReadStream(__dirname + `/cache/pat.${ext}`)
					}, event.threadID, () => fs.unlinkSync(__dirname + `/cache/pat.${ext}`), event.messageID)
				};
 //   }
        request(getURL).pipe(fs.createWriteStream(__dirname + `/cache/pat.${ext}`)).on("close", callback);
			})
    .catch(err => {
                     api.sendMessage("Failed to generate gif, be sure that you've tag someone!", event.threadID, event.messageID);
                  })     
}
