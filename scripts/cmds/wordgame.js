const axios = require("axios");

const baseApiUrl = async () => require("./baseApiUrl.json").mahmud;

/**
* @author 0xMr_King x ┃ Tanin Islam
* @author: do not delete it
*/

module.exports = {
  config: {
    name: "wordgame",
    aliases: ["wordguss", "word-base"],
    version: "1.0",
    author: "0xMr_King x ┃ Tanin Islam",
    role: 0,
    reward: 100,
    category: "game",
    guide: {
      en: "{pn} Start the word guessing game"
    }
  },

  onStart: async function ({ message, event, commandName }) {
    try {
      const apiUrl = await baseApiUrl();  
      const response = await axios.get(`${apiUrl}/api/word/random`);
      const randomWord = response.data.word;
      const shuffledWord = shuffleWord(randomWord);

      message.reply({ body: `𝐆𝐮𝐞𝐬𝐬 𝐭𝐡𝐞 𝐰𝐨𝐫𝐝: "${shuffledWord}" ?`, effect: "love" }, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            answer: randomWord
          });
        }
      });
    } catch (err) {
      message.reply({ body: "Failed to fetch a word from the API.", effect: "love" });
    }
  },

  onReply: async function ({ message, Reply, event, usersData, commandName }) {
    const { author, answer, messageID } = Reply;

    if (event.senderID !== author)
      return message.reply({ body: "Not your turn baka 🐸🦎", effect: "love" });

    if (formatText(event.body) === formatText(answer)) {
      const reward = 100;
      await usersData.addMoney(event.senderID, reward);

      message.unsend(messageID);

      const rewardText = global.utils?.formatCompact ? global.utils.formatCompact(reward) : reward;
      message.reply({ body: `✅ | Correct baby.\nYou won $${rewardText}`, effect: "love" });
    } else {
      message.unsend(messageID);
      message.reply({ body: `❌ | Wrong Answer baby\nThe Correct answer was: ${answer}`, effect: "love" });
    }
  }
};

function shuffleWord(word) {
  const shuffled = word.split('').sort(() => 0.5 - Math.random()).join('');
  return shuffled === word ? shuffleWord(word) : shuffled;
}

function formatText(text) {
  return text.toLowerCase();
}
