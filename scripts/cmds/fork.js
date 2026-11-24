const axios = require("axios");
module.exports = {
config: {
name: "fork",
version: "2.0.0",
author: "0xMr_King x ┃ Tanin Islam",
countDown: 5,
role: 0,
shortDescription: "Get Aliya Bot v4 Repository Link",
longDescription: "Sends the official GitHub repository and git clone instructions for Aliya Bot v4 with an image",
category: "system",
guide: {
en: "{p}fork"
}
},
onStart: async function ({ message, event }) {
const imageUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4Bajq7KeozS19EhsrKZXtn9MxZoTSyE0TxcaByeRNew&s=10";
const textMessage = `Made by 0xMr_King x ┃ Tanin Islam`;
try {
const imageStream = (await axios.get(imageUrl, { responseType: "stream" })).data;
return message.reply({
body: textMessage,
attachment: imageStream
});
} catch (error) {
return message.reply(textMessage);
}
}
};
