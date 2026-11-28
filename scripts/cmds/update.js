const path = require("path");

const updaterPath = path.resolve(__dirname, "../../updater.js");

module.exports = {
  config: {
    name: "update",
    version: "4.1.0",
    author: "0xMr_King x ┃ Tanin Islam",
    countDown: 5,
    role: 0,
    shortDescription: "Check Aliya Official V4 for updates (read-only)",
    category: "info",
    guide: { en: "{p}update" }
  },

  onStart: async function ({ message, api, event }) {
    const react = emoji => {
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction(emoji, event.messageID, () => {}, true);
      }
    };

    react("⌛️");

    try {
      delete require.cache[updaterPath];
      const { checkForUpdates, formatResult } = require(updaterPath);
      const result = await checkForUpdates();
      react("✅️");
      return message.reply({ body: formatResult(result) });
    }
    catch (err) {
      react("❌️");
      return message.reply({ body: formatResult({ ok: false, error: err.message || String(err) }) });
    }
  }
};
