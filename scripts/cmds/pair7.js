const core = require("../../pairCore.js");

const STYLE = {
	width: 736,
	height: 414,
	background: "https://i.imgur.com/jhg6u7K.jpeg",
	from: "#a8edea",
	to: "#fed6e3",
	drawAvatars(ctx, one, two) {
		core.drawAvatar(ctx, one, 180, 40, 100, "#81c784", "circle", "A");
		core.drawAvatar(ctx, two, 450, 40, 100, "#81c784", "circle", "B");
	},
	message(a, b, p) {
		return `SUNNY MATCHMAKING\n\n${a}\n${b}\n\nIN THE GREEN SHADE OF TIME, YOUR HEARTS FIND EACH OTHER PERFECTLY.\n\nCOMPATIBILITY: ${p}%`;
	}
};

module.exports = {
	config: {
		name: "pair7",
		aliases: ["lovepair7", "match7"],
		author: "0xMr_King x ┃ Tanin Islam",
		version: "1.0",
		role: 0,
		category: "love",
		shortDescription: { en: "💘 Generate a love match under sunny greenery with circular avatars" },
		longDescription: { en: "Calculates a love match between group members with custom background and perfectly aligned circular avatars." },
		guide: { en: "{p}{n} — Find a love match" }
	},
	onStart: ({ api, event, usersData }) => core.run({ api, event, usersData, style: STYLE })
};
