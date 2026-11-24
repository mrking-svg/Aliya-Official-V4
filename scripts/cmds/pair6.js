const core = require("../../pairCore.js");

const STYLE = {
	width: 736,
	height: 414,
	background: "https://i.imgur.com/4r1eplj.jpeg",
	from: "#ffdde1",
	to: "#ee9ca7",
	drawAvatars(ctx, one, two) {
		core.drawAvatar(ctx, one, 180, 50, 100, "#ffb7c5", "circle", "A");
		core.drawAvatar(ctx, two, 450, 50, 100, "#ffb7c5", "circle", "B");
	},
	message(a, b, p) {
		return `CHERRY BLOSSOM LOVE\n\n${a}\n${b}\n\nUNDER THE BLOSSOMING BRANCHES, YOUR SOULS ARE BOUND TOGETHER.\n\nCOMPATIBILITY: ${p}%`;
	}
};

module.exports = {
	config: {
		name: "pair6",
		aliases: ["lovepair6", "match6"],
		author: "0xMr_King x ┃ Tanin Islam",
		version: "1.0",
		role: 0,
		category: "love",
		shortDescription: { en: "💘 Generate a love match under cherry blossoms with circular avatars" },
		longDescription: { en: "Calculates a love match between group members with custom cherry blossom background and elegantly positioned circular avatars." },
		guide: { en: "{p}{n} — Find a love match" }
	},
	onStart: ({ api, event, usersData }) => core.run({ api, event, usersData, style: STYLE })
};
