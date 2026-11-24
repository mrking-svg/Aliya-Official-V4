const core = require("../../pairCore.js");

const STYLE = {
	width: 546,
	height: 373,
	background: "https://i.imgur.com/pUVpWbb.jpeg",
	from: "#fbc2eb",
	to: "#a6c1ee",
	drawAvatars(ctx, one, two) {
		core.drawAvatar(ctx, one, 35, 40, 95, "#ffffff", "circle", "A");
		core.drawAvatar(ctx, two, 35, 175, 95, "#ffffff", "circle", "B");
	},
	message(a, b, p) {
		return `ELEGANT LOVE MATCH\n\n${a}\n${b}\n\nTWO HEARTS BLOSSOM TOGETHER IN THE PUREST GARDEN OF DESTINY.\n\nCOMPATIBILITY: ${p}%`;
	}
};

module.exports = {
	config: {
		name: "pair9",
		aliases: ["lovepair9", "match9"],
		author: "0xMr_King x ┃ Tanin Islam",
		version: "1.0",
		role: 0,
		category: "love",
		shortDescription: { en: "💘 Generate an elegant love match with left side vertical circular avatars" },
		longDescription: { en: "Calculates an elegant love match between group members with custom background and left-side vertical circular avatars." },
		guide: { en: "{p}{n} — Find a love match" }
	},
	onStart: ({ api, event, usersData }) => core.run({ api, event, usersData, style: STYLE })
};
