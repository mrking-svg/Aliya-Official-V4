const core = require("../../pairCore.js");

const STYLE = {
	width: 800,
	height: 800,
	background: "https://i.imgur.com/fLcxkVF.jpeg",
	from: "#ff9a9e",
	to: "#fad0c4",
	drawAvatars(ctx, one, two) {
		core.drawAvatar(ctx, one, 220, 620, 140, "#ff80ab", "circle", "A");
		core.drawAvatar(ctx, two, 440, 620, 140, "#ff80ab", "circle", "B");
	},
	message(a, b, p) {
		return `MATCHMAKING COMPLETE\n\n${a}\n${b}\n\nDESTINY HAS WRITTEN YOUR NAMES TOGETHER. MAY YOUR BOND LAST FOREVER.\n\nCOMPATIBILITY: ${p}%`;
	}
};

module.exports = {
	config: {
		name: "pair3",
		aliases: ["lovepair3", "match3"],
		author: "0xMr_King x ┃ Tanin Islam",
		version: "1.0",
		role: 0,
		category: "love",
		shortDescription: { en: "💘 Generate a love match with bottom pink circle avatars" },
		longDescription: { en: "Calculates a love match between group members with custom background and bottom pink-bordered circular avatars." },
		guide: { en: "{p}{n} — Find a love match" }
	},
	onStart: ({ api, event, usersData }) => core.run({ api, event, usersData, style: STYLE })
};
