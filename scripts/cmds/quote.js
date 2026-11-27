const axios = require("axios");

const mahmud = async () => require("./baseApiUrl.json").mahmud;

module.exports = {
  config: {
    name: "quote",
    aliases: ["quotes", "q"],
    version: "1.7",
    author: "0xMr_King x ┃ Tanin Islam",
    countDown: 5,
    role: 0,
    category: "fun",
    shortDescription: {
      en: "Get a random Mahmud quote"
    },
    longDescription: {
      en: "Fetches a deep or inspiring quote from Mahmud's global API"
    },
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message, api, event }) {
    const obfuscatedAuthor = "0xMr_King x ┃ Tanin Islam"; 
    if (module.exports.config.author !== obfuscatedAuthor) {
      return api.sendMessage(
        { body: "You are not authorized to change the author name.\n" },
        event.threadID,
        event.messageID
      );
    }

    try {
      const apiUrl = `${await mahmud()}/api/quote`;
      const res = await axios.get(apiUrl);
      const { quote, message: msg } = res.data;

      message.reply({ body: `${msg}\n\n ${quote}` });
    } catch (err) {
      message.reply({ body: "🥹error, contact 0xMr_King x ┃ Tanin Islam." });
    }
  }
};
