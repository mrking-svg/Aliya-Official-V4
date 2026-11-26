const axios = require('axios');

module.exports.config = {
  name: "meta",
  version: "0.0.1",
  role: 0,
  author: "0xMr_King x ┃ Tanin Islam",
  description: "Meta AI",
  category: "ai",
  cooldowns: 2,
  hasPrefix: false,
};

const API_SERVER_URL = 'https://aryan-meta-ai.vercel.app/meta-ai?prompt=';

module.exports.onStart = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const question = args.join(' ').trim();

  if (!question) {
    return api.sendMessage({ body: "⚠️ Please provide your question.", effect: "love" }, threadID, messageID);
  }

  try {
    const response = await axios.get(`${API_SERVER_URL}${encodeURIComponent(question)}`);

    if (response.data.error) {
      return api.sendMessage({ body: `❌ Error: ${response.data.error}`, effect: "love" }, threadID, messageID);
    }

    const geminiAnswer = response.data.response;

    if (geminiAnswer) {
      return api.sendMessage(geminiAnswer, threadID, messageID);
    } else {
      return api.sendMessage({ body: "[⚜️]➜ Something went wrong. Please try again.", effect: "love" }, threadID, messageID);
    }
  } catch (error) {
    console.error('Meta API Error:', error.response ? error.response.data : error.message);
    return api.sendMessage({ body: "[⚜️]➜ Failed to get a response from Meta AI.", effect: "love" }, threadID, messageID);
  }
};
