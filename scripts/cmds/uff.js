const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Author check disabled for this build
async function checkAuthor() {
  return true;
}

module.exports = {
  config: {
    name: "uff",
    aliases: [],
    author: "0xMr_King x ┃ Tanin Islam",
    version: "1.0",
    cooldowns: 5,
    role: 2,
    shortDescription: "18+ tiktok video",
    longDescription: "18+ tiktok video",
    category: "18+",
    guide: "{p}onlytik"
  },

  onStart: async function ({ api, event, args, message }) {
    
    const isAuthorValid = await checkAuthor(module.exports.config.author);
    if (!isAuthorValid) {
      await message.reply({ body: "Author changer alert! This command belongs to the bot owner.", effect: "love" });
      return;
    }

    const apiUrl = "https://only-tik.vercel.app/kshitiz";

    try {
      const response = await axios.get(apiUrl, { timeout: 10000 });
      const { videoUrl } = response.data;

      if (!videoUrl)
        throw new Error("No video returned by the API");

      const tempVideoPath = path.join(__dirname, "cache", `${Date.now()}.mp4`);
      const writer = fs.createWriteStream(tempVideoPath);
      const videoResponse = await axios.get(videoUrl, { responseType: "stream", timeout: 15000 });
      videoResponse.data.pipe(writer);

      writer.on("finish", () => {
        const stream = fs.createReadStream(tempVideoPath);

        message.reply({
          body: ``,
          attachment: stream,
        });
      });

    } catch (error) {
      if (process.env.DEBUG_API)
        console.error("Error fetching OnlyTik video:", error.message);
      message.reply({ body: " video paowa jayni, slightly por try koro.", effect: "love" });
    }
  }
};
