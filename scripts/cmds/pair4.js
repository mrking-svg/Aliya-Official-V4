const core = require("../../pairCore.js");

const STYLE = {
	width: 800,
	height: 450,
	background: "https://i.imgur.com/cuwycjP.jpeg",
	from: "#a18cd1",
	to: "#fbc2eb",
	drawAvatars(ctx, one, two, w) {
		core.drawAvatar(ctx, one, 40, 150, 130, "#9c27b0", "circle", "A");
		core.drawAvatar(ctx, two, w - 170, 150, 130, "#9c27b0", "circle", "B");
	},
	message(a, b, p) {
		return `LOVE CONNECTION FOUND\n\n${a}\n${b}\n\nUNDER THE STARRY NIGHT, YOUR HEARTS BEAT AS ONE.\n\nCOMPATIBILITY: ${p}%`;
	}
};

module.exports = {
	config: {
		name: "pair4",
		aliases: ["lovepair4", "match4"],
		author: "0xMr_King x ┃ Tanin Islam",
		version: "1.0",
		role: 0,
		category: "love",
		shortDescription: { en: "💘 Generate a love match with purple circle avatars on edges" },
		longDescription: { en: "Calculates a love match between group members with custom background and edge purple-bordered circular avatars." },
		guide: { en: "{p}{n} — Find a love match" }
	},
	onStart: ({ api, event, usersData }) => core.run({ api, event, usersData, style: STYLE })
};
