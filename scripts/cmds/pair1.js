const core = require("../../pairCore.js");

const ODDS = ['21%', '67%', '19%', '37%', '17%', '96%', '52%', '62%', '76%', '83%', '100%', '99%', '0%', '48%'];

const STYLE = {
	width: 800,
	height: 450,
	background: "https://i.pinimg.com/736x/15/fa/9d/15fa9d71cdd07486bb6f728dae2fb264.jpg",
	from: "#ff9a9e",
	to: "#fecfef",
	percent: () => ODDS[Math.floor(Math.random() * ODDS.length)],
	drawAvatars(ctx, one, two) {
		core.drawAvatar(ctx, one, 355, 100, 85, "#ff80ab", "circle", "A");
		core.drawAvatar(ctx, two, 250, 140, 75, "#ff80ab", "circle", "B");
	},
	mentions(senderID, matchID, senderName, matchName) {
		return [
			{ id: senderID, tag: String(senderName || "") },
			{ id: matchID, tag: String(matchName || "") }
		];
	},
	message(a, b, p) {
		return `PAIRING COMPLETE\n\n${a}\n${b}\n\nPAIR ODDS: ${p}`;
	}
};

module.exports = {
	config: {
		role: 0,
		countDown: 5,
		category: "love",
		shortDescription: "Pair with people in the group",
		longDescription: "Pair with people in the group",
		guide: "{pn} ",
		author: "0xMr_King x ┃ Tanin Islam",
		name: "pair1",
		version: "1.0.2",
		hasPermssion: 0,
		credits: "0xMr_King x ┃ Tanin Islam",
		description: "Pair with people in the group",
		commandCategory: "love",
		cooldowns: 5
	},
	onStart: ({ api, event, usersData }) => core.run({ api, event, usersData, style: STYLE })
};
