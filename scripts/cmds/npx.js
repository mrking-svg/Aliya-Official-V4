module.exports = {
  config: {
    name: "npx",
    aliases: ["noprefix"],
    version: "4.1.0",
    author: "0xMr_King x ┃ Tanin Islam",
    countDown: 2,
    role: 1,
    shortDescription: "Manage prefixless command system in v4",
    category: "system",
    guide: "{pn} all | {pn} <cmd_name> | {pn} role <0-4> | {pn} off"
  },

  onStart: async function ({ message, args, event, threadsData }) {
    const threadID = String(event.threadID);

    const readConfig = async () => {
      const raw = (await threadsData.get(threadID, "data.npxConfig")) || {};
      return {
        all: raw.all === true,
        commands: Array.isArray(raw.commands) ? [...new Set(raw.commands.map(String))] : [],
        roles: Array.isArray(raw.roles)
          ? [...new Set(raw.roles.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 4))]
          : []
      };
    };

    const saveConfig = cfg => threadsData.set(threadID, cfg, "data.npxConfig");

    let npxConfig = await readConfig();
    const action = String(args[0] || "").toLowerCase();

    if (!action) {
      return message.reply(
{ body: `𓍢ִ໋🌸✧ ── ͟͟͞͞Aʟɪʏᴀ v4 NPX Sᴇᴛᴛɪɴɢs ── ✧🌸𓍢ִ໋🌷͙֒

ᥫ᭡ Aʟʟ Cᴏᴍᴍᴀɴᴅs : ${npxConfig.all ? "🟢 Enabled" : "🔴 Disabled"}
ᥫ᭡ Pʀᴇғɪxʟᴇss Cᴍᴅs : ${npxConfig.commands.length > 0 ? npxConfig.commands.join(", ") : "None"}
ᥫ᭡ Aʟʟᴏᴡᴇᴅ Rᴏʟᴇs : ${npxConfig.roles.length > 0 ? npxConfig.roles.join(", ") : "None"}

𓍢ִ໋🌷 Sʏɴᴛᴀx U sᴀɢᴇ:
 ᥫ᭡ {pn} all ── Tᴏɢɢʟᴇ ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅs
 ᥫ᭡ {pn} <cmd> ── Tᴏɢɢʟᴇ sᴘᴇᴄɪғɪᴄ ᴄᴏᴍᴍᴀɴᴅ
 ᥫ᭡ {pn} role <0-4> ── Set role access
 ᥫ᭡ {pn} off ── Rᴇsᴇᴛ ᴀʟʟ NPX sᴇᴛᴛɪɴɢs` }
      );
    }

    if (action === "all") {
      npxConfig.all = !npxConfig.all;
      await saveConfig(npxConfig);
      return message.reply(
        { body: `𓍢ִ໋🌸✧ NPX All-Commands Mode is now ${npxConfig.all ? "🟢 ENABLED" : "🔴 DISABLED"}!` }
      );
    }

    if (action === "off" || action === "reset") {
      await saveConfig({ all: false, commands: [], roles: [] });
      return message.reply({ body: "𓍢ִ໋🌸✧ All NPX prefixless settings have been reset!" });
    }

    if (action === "role") {
      const targetRole = Number(args[1]);
      if (!Number.isInteger(targetRole) || targetRole < 0 || targetRole > 4) {
        return message.reply({ body: "⚠️ Invalid role! Allowed values: 0 (All), 1 (Admin), 2 (VIP), 3 (Bot Admin), 4 (Dev)" });
      }

      if (npxConfig.roles.includes(targetRole)) {
        npxConfig.roles = npxConfig.roles.filter(r => r !== targetRole);
        await saveConfig(npxConfig);
        return message.reply({ body: `𓍢ִ໋🌸✧ Role level [ ${targetRole} ] removed from NPX mode.` });
      }

      npxConfig.roles.push(targetRole);
      await saveConfig(npxConfig);
      return message.reply({ body: `𓍢ִ໋🌸✧ Role level [ ${targetRole} ] granted prefixless access!` });
    }

    const targetCmd = action;
    const registry = global.GoatBot && global.GoatBot.commands;
    const aliasRegistry = global.GoatBot && global.GoatBot.aliases;

    if (!registry || typeof registry.get !== "function") {
      return message.reply({ body: "❌ Command registry is not ready yet. Try again in a moment." });
    }

    const aliasName = aliasRegistry && typeof aliasRegistry.get === "function"
      ? aliasRegistry.get(targetCmd)
      : undefined;
    const commandExists = registry.get(targetCmd) || (aliasName ? registry.get(aliasName) : undefined);

    if (!commandExists || !commandExists.config) {
      return message.reply({ body: `❌ Command or alias "${targetCmd}" does not exist in bot registry!` });
    }

    const realCmdName = String(commandExists.config.name || targetCmd);

    if (npxConfig.commands.includes(realCmdName)) {
      npxConfig.commands = npxConfig.commands.filter(c => c !== realCmdName);
      await saveConfig(npxConfig);
      return message.reply({ body: `𓍢ִ໋🌸✧ Prefixless mode disabled for command: "${realCmdName}"` });
    }

    npxConfig.commands.push(realCmdName);
    await saveConfig(npxConfig);
    return message.reply({ body: `𓍢ִ໋🌸✧ Prefixless mode enabled for command: "${realCmdName}"` });
  }
};
