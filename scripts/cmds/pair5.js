const core = require("../../pairCore.js");

const STYLE = {
	width: 800,
	height: 450,
	background: "https://i.imgur.com/foStrgV.jpeg",
	from: "#d3cce3",
	to: "#e9e4f0",
	drawAvatars(ctx, one, two, w) {
		core.drawAvatar(ctx, one, w - 180, 50, 130, "#d7ccc8", "circle", "A");
		core.drawAvatar(ctx, two, w - 180, 220, 130, "#d7ccc8", "circle", "B");
	},
	message(a, b, p) {
		return `LOVE CONNECTION FOUND\n\n${a}\n${b}\n\nRESTING BY YOUR SIDE, FOREVER AND ALWAYS.\n\nCOMPATIBILITY: ${p}%`;
	}
};

module.exports = {
	config: {
		name: "pair5",
		aliases: ["lovepair5", "match5"],
		author: "0xMr_King x ┃ Tanin Islam",
		version: "1.0",
		role: 0,
		category: "love",
		shortDescription: { en: "💘 Generate a love match with right side circular avatars" },
		longDescription: { en: "Calculates a love match between group members with custom background and right-side circular avatars." },
		guide: { en: "{p}{n} — Find a love match" }
	},
	onStart: ({ api, event, usersData }) => core.run({ api, event, usersData, style: STYLE })
};
