const core = require("../../pairCore.js");

const STYLE = {
	width: 800,
	height: 400,
	background: "https://files.catbox.moe/29jl5s.jpg",
	from: "#ffd1ff",
	to: "#ffe9d6",
	drawAvatars(ctx, one, two, w) {
		core.drawAvatar(ctx, one, 385, 40, 170, "#ff80ab", "circle", "A");
		core.drawAvatar(ctx, two, w - 213, 190, 170, "#ff80ab", "circle", "B");
	},
	message(a, b, p) {
		return `MATCHMAKING COMPLETE\n\n${a} matches with ${b}\n\nDESTINY HAS WRITTEN YOUR NAMES TONIGHT. MAY YOUR BOND LAST FOREVER.\n\nCOMPATIBILITY: ${p}%`;
	}
};

module.exports = {
	config: {
		name: "pair",
		aliases: ["lovepair", "match"],
		author: "0xMr_King x ┃ Tanin Islam",
		version: "1.0",
		role: 0,
		category: "love",
		shortDescription: { en: "💘 Generate a love match between you and another group member" },
		longDescription: { en: "Calculates a love match between group members. Shows circular avatars, background and love percentage." },
		guide: { en: "{p}{n} — Use this command in a group to find a love match" }
	},
	onStart: ({ api, event, usersData }) => core.run({ api, event, usersData, style: STYLE })
};
