const core = require("../../pairCore.js");

const STYLE = {
	width: 586,
	height: 330,
	background: "https://i.imgur.com/6BF4EVq.jpeg",
	from: "#c2e9fb",
	to: "#abf1e4",
	drawAvatars(ctx, one, two) {
		core.drawAvatar(ctx, one, 30, 40, 95, "#c8e6c9", "circle", "A");
		core.drawAvatar(ctx, two, 30, 160, 95, "#c8e6c9", "circle", "B");
	},
	message(a, b, p) {
		return `ETERNAL LOVE FOUND\n\n${a}\n${b}\n\nIN THE QUIET WHISPERS OF THE WIND, YOUR SOULS ARE WOVEN TOGETHER FOREVER.\n\nCOMPATIBILITY LEVEL: ${p}%`;
	}
};

module.exports = {
	config: {
		name: "pair8",
		aliases: ["lovepair8", "match8"],
		author: "0xMr_King x ┃ Tanin Islam",
		version: "2.0",
		role: 0,
		category: "love",
		shortDescription: { en: "💘 Generate an upgraded love match with left side vertical circular avatars" },
		longDescription: { en: "Calculates an upgraded love match between group members with custom background and left-side vertical circular avatars." },
		guide: { en: "{p}{n} — Find an upgraded love match" }
	},
	onStart: ({ api, event, usersData }) => core.run({ api, event, usersData, style: STYLE })
};
