const axios = require("axios");

const compact = n => (global.utils && typeof global.utils.formatCompact === "function")
	? global.utils.formatCompact(n)
	: String(Math.round(Number(n) || 0)); // economy fallback
const parseBet = v => (global.utils && typeof global.utils.parseMoney === "function")
	? global.utils.parseMoney(v)
	: parseInt(v, 10); // economy fallback

// API URL
const API_URL = "https://balance-bot-api.onrender.com";

// 🔹 Get balance
async function getBalance(userID) {
  try {
    const res = await axios.get(`${API_URL}/api/balance/${userID}`);
    return res.data.balance || 100;
  } catch {
    return 100;
  }
}

// 🔹 Win balance
async function winGame(userID, amount) {
  try {
    const res = await axios.post(`${API_URL}/api/balance/win`, { userID, amount });
    return res.data.success ? res.data.balance : null;
  } catch {
    return null;
  }
}

// 🔹 Lose balance
async function loseGame(userID, amount) {
  try {
    const res = await axios.post(`${API_URL}/api/balance/lose`, { userID, amount });
    return res.data.success ? res.data.balance : null;
  } catch {
    return null;
  }
}

module.exports = {
  config: {
    name: "bet",
    version: "4.1",
    author: "0xMr_King x ┃ Tanin Islam",
    countDown: 5,
    role: 0,
    description: "Spin and win/loss money. Use '{p}spin <amount>' or '{p}spin top'.",
    category: "economy",
    guide: {
      en: "{p}spin <amount>\n{p}spin top"
    }
  },

  onStart: async function ({ message, event, args }) {
    const senderID = event.senderID;
    const subCommand = args[0];

    // ✅ /spin top leaderboard (simple message, needs usersData if leaderboard API exists)
    if (subCommand === "top") {
      return message.reply({ body: "🏆 Spin leaderboard not implemented with API yet." });
    }

    // ✅ /spin <amount>
    const betAmount = parseBet(subCommand);
    if (isNaN(betAmount) || betAmount <= 0) {
      return message.reply({ body: "❌ Usage:\n/spin <amount>\n/spin top" });
    }

    let balance = await getBalance(senderID);
    if (balance < betAmount) {
      return message.reply({ body: `❌ Not enough money.\n💰 Your balance: ${compact(balance)} $` });
    }

    // Deduct bet first
    balance = await loseGame(senderID, betAmount);

    // Outcomes with multipliers (60% win chance)
    const outcomes = [
      { text: "💥 You lost everything!", multiplier: 0 },   // loss
      { text: "😞 You got back half.", multiplier: 0.5 },   // partial
      { text: "🟡 You broke even.", multiplier: 1 },        // break even
      { text: "🟢 You doubled your money!", multiplier: 2 },
      { text: "🔥 You tripled your bet!", multiplier: 3 },
      { text: "🎉 JACKPOT! 10x reward!", multiplier: 10 }  // rare
    ];

    // 60% normal, 40% rare logic for jackpot
    let outcome;
    const rand = Math.random();
    if (rand < 0.6) {
      outcome = outcomes[Math.floor(Math.random() * 4)]; // first 4 are common
    } else {
      outcome = outcomes[Math.floor(Math.random() * 2) + 4]; // last 2 are rare
    }

    const reward = Math.floor(betAmount * outcome.multiplier);
    const newBalance = reward > 0 ? await winGame(senderID, reward) : balance;

    return message.reply(
{ body: `${outcome.text}
🎰 You bet: ${compact(betAmount)} $
💸 You won: ${compact(reward)} $
💰 New balance: ${compact(newBalance)} $` }
    );
  }
};
