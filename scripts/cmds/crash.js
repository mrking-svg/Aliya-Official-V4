const compact = n => (global.utils && typeof global.utils.formatCompact === "function")
  ? global.utils.formatCompact(n)
  : String(Math.round(Number(n) || 0));
const parseBet = v => (global.utils && typeof global.utils.parseMoney === "function")
  ? global.utils.parseMoney(v)
  : parseInt(v, 10);

const multipliers = [
  1.10, 1.25, 1.50, 1.75, 2.00,
  2.50, 3.00, 4.00, 5.00, 7.00,
  10.00
];

module.exports = {
  config: {
    name: "crash",
    version: "1.0.1",
    author: "0xMr_King x ┃ Tanin Islam",
    countDown: 5,
    role: 0,
    shortDescription: "Crash Game",
    longDescription: "Bet coins and test your luck.",
    category: "game",
    guide: {
      en: "{pn} <bet>"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const bet = parseBet(args[0]);

    if (isNaN(bet) || bet < 100)
      return message.reply("❌ Minimum bet is 100 coins.");

    const userData = await usersData.get(event.senderID);

    if (!userData || (userData.money || 0) < bet)
      return message.reply("❌ You don't have enough coins.");

    const crashPoint = Number((Math.random() * 9 + 1).toFixed(2));
    const cashOut = multipliers[Math.floor(Math.random() * multipliers.length)];

    let money = userData.money || 0;

    if (cashOut <= crashPoint) {
      const reward = Math.floor(bet * cashOut);
      const profit = reward - bet;
      money += profit;

      await usersData.set(event.senderID, {
        ...userData,
        money
      });

      return message.reply(
`🚀 CRASH GAME

💸 Bet: ${compact(bet)} coins
📈 Cash Out: ${cashOut}x
💥 Crash: ${crashPoint}x

🎉 You won ${compact(reward)} coins!
💰 Profit: ${compact(profit)} coins`
      );
    } else {
      money -= bet;

      await usersData.set(event.senderID, {
        ...userData,
        money
      });

      return message.reply(
`🚀 CRASH GAME

💸 Bet: ${compact(bet)} coins
📈 Cash Out: ${cashOut}x
💥 Crash: ${crashPoint}x

💀 You lost ${compact(bet)} coins!`
      );
    }
  }
};
