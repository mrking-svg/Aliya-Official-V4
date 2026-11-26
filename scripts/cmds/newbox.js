module.exports.config = {
    role: 2,
    countDown: 5,
    category: "Box Chat",
    shortDescription: "Create a new chat group with the tag",
    longDescription: "Create a new chat group with the tag",
    guide: "{pn} ",
    author: "0xMr_King x ┃ Tanin Islam",
  
	name: "newbox",	
	version: "1.0.0", 
	hasPermssion: 2,
	credits: "0xMr_King x ┃ Tanin Islam",
	description: "Create a new chat group with the tag", 
 commandCategory: "Box Chat",
	usages: '"{pn} [tag] | [New group name] or {pn} me [tag] | [New group name]"',
	cooldowns: 5, 
	dependencies: "",
};

module.exports.onStart = async function({ api, Users, args, event }) {
 if (args[0] == "me")
 var id = [event.senderID]
 else id = [];
 var main = event.body; 
 var groupTitle = main.slice(main.indexOf("|") +2)
 for (var i = 0; i < Object.keys(event.mentions).length; i++)
id.push(Object.keys(event.mentions)[i]);
 api.createNewGroup(id, groupTitle,() => {api.sendMessage({ body: `Has created a group ${groupTitle} success`, effect: "love" }, event.threadID)})
}