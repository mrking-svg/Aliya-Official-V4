const compact = n => (global.utils && typeof global.utils.formatCompact === "function")
    ? global.utils.formatCompact(n)
    : String(Math.round(Number(n) || 0));
const parseBetValue = v => (global.utils && typeof global.utils.parseMoney === "function")
    ? global.utils.parseMoney(v)
    : Number(v);

module.exports.config = {
    role: 0,
    countDown: 0,
    category: "Games",
    shortDescription: "Collection of Gambling Games",
    longDescription: "Collection of Gambling Games",
    guide: "{pn} ",
  
    name: "casino",
    version: "0.0.1",
    hasPermssion: 0,
    credits: "0xMr_King x ┃ Tanin Islam",
    description: "Collection of Gambling Games",
    commandCategory: "Games",
    usages: "",
    cooldowns: 0
};

module.exports.onStart = async function({ api, event, args, Currencies, Users }) {
    const request = require('request');
    const { createReadStream, createWriteStream, existsSync } = require('fs-extra');
    const { threadID, messageID, senderID } = event;
    const dataMoney = await Currencies.getData(senderID);
    const moneyUser = dataMoney.money;
    const choose = args[0];
    const kqua = args[1];
    const betAmount = args[2];
    const wager = parseBetValue(kqua);
    const diffBet = parseBetValue(betAmount);

    if (!existsSync(__dirname + '/cache/casino.jpg')) {
        request('https://i.imgur.com/1Y9eup1.jpg').pipe(createWriteStream(__dirname + '/cache/casino.jpg'));
    }

    if (!choose) {
        const msg = {
            body: `🃏─── CASINO ───🃏\n\n❯ 1. Big/Small 🎲\n❯ 2. Even/Odd 🎴\n❯ 3. Lottery 💸\n❯ 4. Difference 🎫\n❯ 5. Slot 🎰\n❯ 6. Rock Paper Scissors ✌️\n\nReply with the number to see instructions for each game.\n\n🃏─── CASINO ───🃏`,
            attachment: [createReadStream(__dirname + "/cache/casino.jpg")]
        };
        return api.sendMessage(msg, threadID, (error, info) => {
            global.client.handleReply.push({
                type: "choosee",
                name: this.config.name,
                author: senderID,
                messageID: info.messageID
            });
        });
    }

    // Random values for games
    const z = Math.floor(Math.random() * 20);
    const y = Math.floor(Math.random() * 20);
    const difference = y - z;
    const x = Math.floor(Math.random() * 100);

    // Even/Odd
    const typeEO = ['even', 'odd'];
    const randomEO = typeEO[Math.floor(Math.random() * typeEO.length)];
    const even = [0, 2, 4, 6, 8];
    const odd = [1, 3, 5, 7, 9];
    const defNumberEO = randomEO === 'even' ? even[Math.floor(Math.random() * even.length)] : odd[Math.floor(Math.random() * odd.length)];

    // Big/Small
    const typeBS = ['big', 'small'];
    const randomBS = typeBS[Math.floor(Math.random() * typeBS.length)];
    const big = [4,5,6,7,8,9,10];
    const small = [11,12,13,14,15,16,17];
    const defNumberBS = randomBS === 'big' ? big[Math.floor(Math.random() * big.length)] : small[Math.floor(Math.random() * small.length)];

    // Big/Small game
    if (choose === 'big' || choose === 'small') {
        if (!Number.isFinite(wager) || wager < 50) return api.sendMessage({ body: "Your bet amount is invalid or below $50!" }, threadID, messageID);
        if (moneyUser < wager) return api.sendMessage({ body: `You don't have enough balance (${compact(wager)}$) to play` }, threadID, messageID);
        if (choose === randomBS) {
            await Currencies.increaseMoney(senderID, Math.floor(wager * 2));
            return api.sendMessage({ body: `You won! Bot rolled ${randomBS} (${defNumberBS}) and you received ${compact(wager * 2)}` }, threadID, messageID);
        } else {
            await Currencies.decreaseMoney(senderID, Math.floor(wager));
            return api.sendMessage({ body: `You lost. Bot rolled ${randomBS} (${defNumberBS}) and you lost ${compact(wager)}` }, threadID, messageID);
        }
    }

    // Even/Odd game
    if (choose === 'even' || choose === 'odd') {
        if (!Number.isFinite(wager) || wager < 50) return api.sendMessage({ body: "Your bet amount is invalid or below $50!" }, threadID, messageID);
        if (moneyUser < wager) return api.sendMessage({ body: `You don't have enough balance (${compact(wager)}$) to play` }, threadID, messageID);
        if (choose === randomEO) {
            await Currencies.increaseMoney(senderID, Math.floor(wager * 2));
            return api.sendMessage({ body: `You won! Bot rolled ${randomEO} (${defNumberEO}) and you received ${compact(wager * 2)}` }, threadID, messageID);
        } else {
            await Currencies.decreaseMoney(senderID, Math.floor(wager));
            return api.sendMessage({ body: `You lost. Bot rolled ${randomEO} (${defNumberEO}) and you lost ${compact(wager)}` }, threadID, messageID);
        }
    }

    // Lottery game
    if (choose === 'lottery') {
        if (!Number.isFinite(wager) || wager < 50) return api.sendMessage({ body: "Your bet amount is invalid or below $50!" }, threadID, messageID);
        if (moneyUser < wager) return api.sendMessage({ body: `You don't have enough balance (${compact(wager)}$) to play` }, threadID, messageID);
        api.sendMessage({ body: `Please wait a few minutes for the lottery result...` }, threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 120 * 1000));
            api.unsendMessage(info.messageID);
            if (kqua == x) {
                await Currencies.increaseMoney(senderID, Math.floor(wager * 2));
                return api.sendMessage({ body: `You won! Your chosen number ${args[1]} matched. Lottery result is ${x}. You received ${compact(wager * 2)}` }, threadID, messageID);
            } else {
                await Currencies.decreaseMoney(senderID, Math.floor(wager));
                return api.sendMessage({ body: `You lost. Your chosen number ${args[1]} did not match. Lottery result is ${x}. You lost ${compact(wager)}` }, threadID, messageID);
            }
        });
    }

    // Difference game
    if (choose === 'difference') {
        if (!Number.isFinite(Number(kqua))) return api.sendMessage({ body: "Invalid number" }, threadID, messageID);
        if (Number(kqua) == difference) {
            await Currencies.increaseMoney(senderID, Math.floor(diffBet * 2));
            return api.sendMessage({ body: `You won. Your choice: ${compact(kqua)}\nBot numbers: ${z}, ${y}\nDifference: ${difference}\nYou received ${compact(diffBet * 2)}` }, threadID, messageID);
        } else {
            await Currencies.decreaseMoney(senderID, Math.floor(diffBet));
            return api.sendMessage({ body: `You lost. Your choice: ${compact(kqua)}\nBot numbers: ${z}, ${y}\nDifference: ${difference}\nYou lost ${compact(diffBet)}` }, threadID, messageID);
        }
    }

    // Rock Paper Scissors game
    if (args[0] === 'rps') {
        function outMsg(data) { api.sendMessage(data, threadID, messageID); }
        if (!args[1]) return outMsg("Please enter 'scissors', 'rock', or 'paper'");
        const choices = ["scissors", "rock", "paper"];
        const botTurn = choices[Math.floor(Math.random() * choices.length)];
        const userTurn = args[1];

        if (choices.includes(userTurn)) {
            if (userTurn === botTurn) return outMsg(`Draw\nUser: ${userTurn}\nBot: ${botTurn}\nBalance unchanged`);
            if (userTurn === 'scissors') return outMsg(botTurn === 'rock' ? `YOU LOST\nUser: ${userTurn}\nBot: ${botTurn}` : `YOU WON\nUser: ${userTurn}\nBot: ${botTurn}`);
            if (userTurn === 'rock') return outMsg(botTurn === 'paper' ? `YOU LOST\nUser: ${userTurn}\nBot: ${botTurn}` : `YOU WON\nUser: ${userTurn}\nBot: ${botTurn}`);
            if (userTurn === 'paper') return outMsg(botTurn === 'scissors' ? `YOU LOST\nUser: ${userTurn}\nBot: ${botTurn}` : `YOU WON\nUser: ${userTurn}\nBot: ${botTurn}`);
        }
    }

    // Slot game
    if (choose === 'slot') {
        const slotItems = ["🍇","🍉","🍊","🍏","🥭","🍓","🍒","🍌","🥝","🥑","🌽"];
        const number = [];
        let win = false;
        for (let i = 0; i < 3; i++) number[i] = Math.floor(Math.random() * slotItems.length);
        if (number[0] === number[1] && number[1] === number[2]) win = true;
        else if (number[0] === number[1] || number[0] === number[2] || number[1] === number[2]) win = true;
        api.sendMessage({ body: `╭──────────╮\n🎰 » ${slotItems[number[0]]} | ${slotItems[number[1]]} | ${slotItems[number[2]]} 🎰╰──────────╯\n${win ? "🎉 Congratulations! You won!" : "😢 You lost!"}` }, threadID, messageID);
    }
};

module.exports.handleReply = async function({ args, event, Users, api, handleReply, Currencies }) {
    const { threadID, messageID } = event;
    const { author } = handleReply;
    if (event.senderID != author) return api.sendMessage({ body: "You cannot respond to this menu." }, threadID, messageID);

    switch (handleReply.type) {
        case "choosee": {
            switch (event.body) {
                case "1": {
                    return api.sendMessage({ body: `Please enter command: ${global.config.PREFIX}casino [big or small] [amount]` }, threadID, messageID);
                }
                case "2": {
                    return api.sendMessage({ body: `Please enter command: ${global.config.PREFIX}casino [even or odd] [amount]` }, threadID, messageID);
                }
                case "3": {
                    return api.sendMessage({ body: `Please enter command: ${global.config.PREFIX}casino lottery [your number] [amount]` }, threadID, messageID);
                }
                case "4": {
                    return api.sendMessage({ body: `Please enter command: ${global.config.PREFIX}casino difference [your number] [amount]` }, threadID, messageID);
                }
                case "5": {
                    return api.sendMessage({ body: `Please enter command: ${global.config.PREFIX}casino slot [amount]` }, threadID, messageID);
                }
                case "6": {
                    return api.sendMessage({ body: `Please enter command: ${global.config.PREFIX}casino rps ["scissors", "rock", "paper"]` }, threadID, messageID);
                }
                default: {
                    return api.sendMessage({ body: "Invalid option selected." }, threadID, messageID);
                }
            }
        }
    }
};
