module.exports.config = {
    role: 0,
    countDown: 5,
    category: "Utilities",
    shortDescription: "Search results on Google!",
    longDescription: "Search results on Google!",
    guide: "{pn} google [Text]",
    author: "0xMr_King x ┃ Tanin Islam",
  
    name: "google",
    aliases: ["search"],
    version: "1.0.0",
    hasPermssion: 0,
    credits: "0xMr_King x ┃ Tanin Islam",
    description: "Search results on Google!",
    commandCategory: "Utilities",
    usages: "google [Text]",
    cooldowns: 5,
    dependencies: {
        "request":"",
        "fs":""
    }
};

module.exports.onStart = function({ api, event, args }) {
    let textNeedSearch = "";
    const regex = /(https?:\/\/.*?\.(?:png|jpe?g|gif)(?:\?(?:[\w_-]+=[\w_-]+)(?:&[\w_-]+=[\w_-]+)*)?(.*))($)/;
    (event.type == "message_reply") ? textNeedSearch = event.messageReply.attachments[0].url: textNeedSearch = args.join(" ");
    (regex.test(textNeedSearch)) ? api.sendMessage({ body: `https://www.google.com/searchbyimage?&image_url=${textNeedSearch}`, effect: "love" }, event.threadID, event.messageID): api.sendMessage({ body: `https://www.google.com.vn/search?q=${encodeURIComponent(textNeedSearch)}`, effect: "love" }, event.threadID, event.messageID);
}