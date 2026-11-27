const fs = require("fs");
const path = require("path");

const statusPath = path.join(__dirname, "text_status.json");

if (!fs.existsSync(statusPath)) {
 fs.writeFileSync(statusPath, JSON.stringify({ enabled: true }, null, 2));
}

module.exports.config = {
    role: 2,
    countDown: 2,
    category: "utility",
    shortDescription: "Send text every 5 seconds, with OFF switch",
    longDescription: "Send text every 5 seconds, with OFF switch",
    guide: "{pn} [off] or [count] [text]",
    author: "0xMr_King x ┃ Tanin Islam",
  
 name: "text",
 version: "1.0.5",
 hasPermssion: 2,
 credits: "0xMr_King x ┃ Tanin Islam",
 description: "Send text every 5 seconds, with OFF switch",
 commandCategory: "utility",
 usages: "[off] or [count] [text]",
 cooldowns: 2
};

module.exports.onStart = async function({ api, event, args }) {
 const statusData = JSON.parse(fs.readFileSync(statusPath));
 const cmd = args[0]?.toLowerCase();

 
 if (cmd === "off") {
 statusData.enabled = false;
 fs.writeFileSync(statusPath, JSON.stringify(statusData, null, 2));
 return api.sendMessage({ body: "Text কমান্ডটি এখন বন্ধ করা হয়েছে❌" }, event.threadID, event.messageID);
 }

 if (!statusData.enabled) {
 return api.sendMessage({ body: "এই কমান্ডটি বন্ধ রয়েছে🚫" }, event.threadID, event.messageID);
 }

 
 const count = parseInt(args[0]);
 const text = args.slice(1).join(" ");

 if (isNaN(count) || count < 1) {
 return api.sendMessage({ body: "কতবার পাঠাতে হবে তা ঠিকমতো দিন✅\nউদাহরণ: /text 5 Sahu" }, event.threadID, event.messageID);
 }

 if (!text) {
 return api.sendMessage({ body: "পাঠানোর জন্য কোনো টেক্সট পাওয়া যায়নি..!❎" }, event.threadID, event.messageID);
 }

 
 for (let i = 0; i < count; i++) {
 setTimeout(() => {
 api.sendMessage(text, event.threadID);
 }, i * 15000); 
 }
};