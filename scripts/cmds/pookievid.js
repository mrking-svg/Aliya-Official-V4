// Banner Image: https://files.catbox.moe/ixj7u8.jpg

const axios = require("axios");

const FOLDER_ID = "1b8YEL1AW0HsErePZjiyY-D_-XkXu8xMi";

// Facebook flags rapid bursts of large media sends as abuse (error 1357001).
// Keep one video per user every 30s and a global 8s gap between sends.
const USER_COOLDOWN_MS = 30 * 1000;
const GLOBAL_COOLDOWN_MS = 8 * 1000;
const lastUserUse = new Map();
let lastGlobalUse = 0;

function cooldownLeft(event) {
    const now = Date.now();
    const uid = String(event.senderID || "");
    const userLast = Number(lastUserUse.get(uid) || 0);
    const left = Math.max(
        USER_COOLDOWN_MS - (now - userLast),
        GLOBAL_COOLDOWN_MS - (now - lastGlobalUse)
    );
    if (left > 0) return Math.ceil(left / 1000);
    lastUserUse.set(uid, now);
    lastGlobalUse = now;
    if (lastUserUse.size > 1000) lastUserUse.delete(lastUserUse.keys().next().value);
    return 0;
}

module.exports.config = {
    name: "pookievid",
    aliases: ["pookie", "pookie-vid"],
    version: "4.0.0",
    author: "0xMr_King x ┃ Tanin Islam",
    role: 0,
    category: "media",
    guide: { en: "Use {p}pookievid, {p}pookievid sync to count files, or comment '🎀' to get a random video." }
};

module.exports.onChat = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID()) return;

    const msg = event.body ? event.body.trim() : "";
    if (msg === "🎀") {
        return handleDriveMedia(api, event);
    }
};

module.exports.onStart = async ({ api, event, args }) => {
    if (args[0] && args[0].toLowerCase() === "sync") {
        return handleDriveSync(api, event);
    }
    return handleDriveMedia(api, event);
};

async function handleDriveSync(api, event) {
    const { threadID, messageID } = event;
    try {
        api.setMessageReaction("⏳", messageID, () => {}, true);

        const response = await axios.get(`https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}`).catch(async () => {
            return await axios.get(`https://docs.google.com/uc?export=list&id=${FOLDER_ID}`);
        });

        const htmlData = response.data;
        const matches = [...htmlData.matchAll(/"([^"]+)"\s*,\s*\[\s*"([^"]+)"\s*,\s*([0-9]+)\s*,\s*"([^"]+)"/g)];
        
        let totalFiles = 0;
        let videoCount = 0;
        let pictureCount = 0;
        let musicCount = 0;

        if (matches && matches.length > 0) {
            totalFiles = matches.length;
            matches.forEach(match => {
                const name = match[2].toLowerCase();
                if (name.endsWith(".mp4") || name.endsWith(".mkv") || name.endsWith(".mov") || name.endsWith(".3gp")) videoCount++;
                else if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".gif") || name.endsWith(".webp")) pictureCount++;
                else if (name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".m4a") || name.endsWith(".ogg")) musicCount++;
            });
        } else {
            const fallbackMatches = [...htmlData.matchAll(/\/file\/d\/([a-zA-Z0-9_-]+)\/view/g)];
            totalFiles = fallbackMatches.length;
            videoCount = totalFiles;
        }

        api.setMessageReaction("✅", messageID, () => {}, true);

        const report = `📁 𝔖𝔶𝔫𝔠 𝔖𝔲𝔠𝔠𝔢𝔰𝔰𝔣𝔲𝔲𝔩!\n\n` +
                       `• 𝖳𝗈𝗍𝖺𝗅 𝖥𝗂𝗅𝖾𝗌: ${totalFiles}\n` +
                       `• 𝖵𝗂𝖽𝖾𝗈 / 𝖬𝖯𝖦 𝖥𝗂𝗅𝖾𝗌: ${videoCount}\n` +
                       `• 𝖯𝗂𝖼𝗍𝗎𝗋𝖾 𝖥𝗂𝗅𝖾𝗌: ${pictureCount}\n` +
                       `• 𝖬𝖯𝟥 / 𝖲𝗈𝗇𝗀 𝖥𝗂𝗅𝖾𝗌: ${musicCount}`;

        return api.sendMessage(report, threadID, messageID);

    } catch (err) {
        console.error(err);
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage({ body: "❌ Error sync!" }, threadID, messageID);
    }
}

async function handleDriveMedia(api, event) {
    const { threadID, messageID } = event;

    const wait = cooldownLeft(event);
    if (wait > 0) {
        api.setMessageReaction("⏳", messageID, () => {}, true);
        return api.sendMessage({
            body: `❌ একসাথে অনেক ভিডিও চাইছেন 🐇 ${wait} সেকেন্ড পরে আবার চেষ্টা করুন।`
        }, threadID, messageID);
    }

    try {
        api.setMessageReaction("🛜", messageID, () => {}, true);

        const response = await axios.get(`https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}`).catch(async () => {
            return await axios.get(`https://docs.google.com/uc?export=list&id=${FOLDER_ID}`);
        });

        const htmlData = response.data;
        const matches = [...htmlData.matchAll(/"([^"]+)"\s*,\s*\[\s*"([^"]+)"\s*,\s*([0-9]+)\s*,\s*"([^"]+)"/g)];
        
        let fileId = "";

        if (!matches || matches.length === 0) {
            const fallbackMatches = [...htmlData.matchAll(/\/file\/d\/([a-zA-Z0-9_-]+)\/view/g)];
            if (fallbackMatches.length === 0) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage({ body: "📁 Couldn't find any file😒!" }, threadID, messageID);
            }
            fileId = fallbackMatches[Math.floor(Math.random() * fallbackMatches.length)][1];
        } else {
            const randomMatch = matches[Math.floor(Math.random() * matches.length)];
            fileId = randomMatch[1]; 
        }

        api.setMessageReaction("☃️", messageID, () => {}, true);
        const downloadUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;

        api.sendMessage({
            body: `ₕₑᵣₑ ᵢₛ ₐ ₚₒₒₖᵢₑ ᵥᵢdₑₒ Fᵣ₏ₘ 𝔐𝔯.𝔎ᵢ𝔫𝔤 🎀`,
            attachment: [await global.utils.getStreamFromURL(downloadUrl)]
        }, threadID, (err) => {
            if (!err) {
                api.setMessageReaction("🍃", messageID, () => {}, true);
            } else {
                api.setMessageReaction("❌", messageID, () => {}, true);
                api.sendMessage({ body: "❌ ভিডিওটি পাঠাতে সমস্যা হয়েছে (সাইজ অনেক বড় হতে পারে)!" }, threadID, messageID);
            }
        }, messageID);

    } catch (err) {
        console.error(err);
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage({ body: "❌ ড্রাইভ থেকে ভিডিও লোড করতে ব্যর্থ হয়েছে।" }, threadID, messageID);
    }
}

