const core = require("../../pairCore.js");

const STYLE = {
	width: 800,
	height: 400,
	background: "https://i.imgur.com/J8gy1tA.jpeg",
	from: "#ff9a9e",
	to: "#fecfef",
	drawAvatars(ctx, one, two, w) {
		core.drawAvatar(ctx, one, w - 210, 40, 150, "#ff80ab", "box", "A");
		core.drawAvatar(ctx, two, w - 210, 210, 150, "#ff80ab", "box", "B");
	},
	message(a, b, p) {
		return `MATCHMAKING COMPLETE\n\n${a}\n${b}\n\nDESTINY HAS BROUGHT YOU TOGETHER. MAY YOUR BOND LAST FOREVER.\n\nCOMPATIBILITY: ${p}%`;
	}
};

module.exports = {
	config: {
		name: "pair2",
		aliases: ["lovepair2", "match2"],
		author: "0xMr_King x ┃ Tanin Islam",
		version: "2.1",
		role: 0,
		category: "love",
		shortDescription: { en: "💘 Generate a love match with boxed profile pictures" },
		longDescription: { en: "Calculates a love match between group members with custom background and right-side boxed avatars." },
		guide: { en: "{p}{n} — Find a love match" }
	},
	onStart: ({ api, event, usersData }) => core.run({ api, event, usersData, style: STYLE })
};
