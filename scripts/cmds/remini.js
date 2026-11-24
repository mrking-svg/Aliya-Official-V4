const axios = require("axios");

const baseApiUrl = async () => require("./baseApiUrl.json").mahmud;

module.exports = {
        config: {
                name: "remini",
                aliases: [],
                version: "3.7",
                author: "0xMr_King x ┃ Tanin Islam",
                countDown: 10,
                role: 0,
                description: {
                        en: "Enhance or restore image quality using Remini AI",
                        vi: "Nâng cao chất lượng hình ảnh bằng Remini AI"
                },
                category: "tools",
                guide: {
                        en: '   {pn} [url]: Remini image via URL' +
                                '\n   {pn} [reply]: Reply to an image to remini',
                        vi: '   {pn} [url]: Nâng cấp ảnh qua URL' +
                                '\n   {pn} [reply]: Phản hồi ảnh để nâng cấp'
                }
        },

        langs: {
                en: {
                        noImage: "• Baby, please reply to an image or provide a link.",
                        success: "✅ | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐫𝐞𝐦𝐢𝐧𝐢 𝐢𝐦𝐚𝐠𝐞 𝐛𝐚𝐛𝐲",
                        error: "× API error: %1. Contact 0xMr_King x ┃ Tanin Islam for help.\n•WhatsApp: 01836298139"
                },
                vi: {
                        noImage: "• Cưng ơi, hãy phản hồi một bức ảnh hoặc gửi link.",
                        success: "✅ | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮'𝐫 𝐫𝐞𝐦𝐢𝐧𝐢 𝐢𝐦𝐚𝐠𝐞 𝐛𝐚𝐛𝐲",
                        error: "× Lỗi: %1. Liên hệ 0xMr_King x ┃ Tanin Islam để được hỗ trợ.\n•WhatsApp: 01836298139"
                }
        },

        onStart: async function ({ api, message, args, event, getLang }) {
                const authorName = "0xMr_King x ┃ Tanin Islam";
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                let imgUrl;
                if (event.messageReply?.attachments?.[0]?.type === "photo") {
                        imgUrl = event.messageReply.attachments[0].url;
                } else if (args[0]) {
                        imgUrl = args.join(" ");
                }

                if (!imgUrl) return api.sendMessage(getLang("noImage"), event.threadID, event.messageID);

                api.setMessageReaction("😘", event.messageID, () => {}, true);

                try {
                        const response = await axios.get(`${await baseApiUrl()}/api/remini?imgUrl=${encodeURIComponent(imgUrl)}`, {
                                method: "GET",
                                responseType: "stream",
                                headers: { 'User-Agent': 'Mozilla/5.0' }
                        });

                        api.setMessageReaction("🪽", event.messageID, () => {}, true);

                        return api.sendMessage({
                                body: getLang("success"),
                                attachment: response.data
                        }, event.threadID, event.messageID);

                } catch (err) {
                        console.error("error", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        return api.sendMessage(getLang("error", err.message), event.threadID, event.messageID);
                }
        }
};
