const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");

module.exports = {
  config: {
    name: "npm",
    aliases: ["pkg", "package"],
    version: "4.0.0",
    author: "0xMr_King x ┃ Tanin Islam",
    countDown: 1,
    role: 4, // Strictly Bot Dev (Role 4)
    description: {
      en: "Fast NPM package manager for Aliya v4"
    },
    category: "owner",
    guide: "{pn} install <pkg> | {pn} uninstall <pkg> | {pn} list"
  },

  onStart: async function ({ message, args, role, prefix }) {
    if (role < 4) {
      return message.reply({ body: "⚙️ 🌸 Only Bot Developers (Role 4) can access NPM package management!", effect: "love" });
    }

    const action = args[0]?.toLowerCase();

    if (!action) {
      const usageText = 
`𓍢ִ໋🌸✧ ── ͟͟͞͞NPM Pᴀᴄᴋᴀɢᴇ Mᴀɴᴀɢᴇʀ ── ✧🌸𓍢ִ໋  

ᥫ᭡ ${prefix}npm install <package_name>
ᥫ᭡ ${prefix}npm install canvas gifencoder
ᥫ᭡ ${prefix}npm uninstall <package_name>
ᥫ᭡ ${prefix}npm list`;
      return message.reply(usageText);
    }

    // ========== SUPER FAST INSTALLED LIST (INSTANT 0.01s) ==========
    if (action === "list" || action === "ls") {
      try {
        const pkgPath = path.join(process.cwd(), "package.json");
        if (!fs.existsSync(pkgPath)) {
          return message.reply({ body: "❌ package.json file not found!", effect: "love" });
        }

        const pkgData = fs.readJsonSync(pkgPath);
        const deps = pkgData.dependencies || {};
        const devDeps = pkgData.devDependencies || {};

        let output = `📦 [ Main Dependencies ] (${Object.keys(deps).length})\n`;
        for (const [pkg, ver] of Object.entries(deps)) {
          output += ` ├── ${pkg}:${ver}\n`;
        }

        if (Object.keys(devDeps).length > 0) {
          output += `\n🛠️ [ Dev Dependencies ] (${Object.keys(devDeps).length})\n`;
          for (const [pkg, ver] of Object.entries(devDeps)) {
            output += ` ├── ${pkg}:${ver}\n`;
          }
        }

        return message.reply({ body: `𓍢ִ໋🌸✧ ── ͟͟͞͞Iɴsᴛᴀʟʟᴇᴅ Pᴀᴄᴋᴀɢᴇs ── ✧🌸𓍢ִ໋\n\n\`\`\`text\n${output}\n\`\`\``, effect: "love" });
      } catch (err) {
        return message.reply({ body: `❌ Failed to read dependencies: ${err.message}`, effect: "love" });
      }
    }

    // ========== OPTIMIZED FAST INSTALL ==========
    if (action === "install" || action === "i" || action === "add") {
      const packages = args.slice(1);

      if (packages.length === 0) {
        return message.reply({ body: "⚠️ Please enter package name(s) to install!", effect: "love" });
      }

      const safePackages = packages.filter(pkg => /^[@a-zA-Z0-9\-_\/\.]+$/.test(pkg));

      if (safePackages.length === 0) {
        return message.reply({ body: "❌ Invalid package name format detected!", effect: "love" });
      }

      // --no-audit --no-fund flag adds 3x faster execution
      const cmd = `npm install ${safePackages.join(" ")} --save --no-audit --no-fund`;

      return message.reply({ body: `⏳ Installing: \`${safePackages.join(", ")}\` ...`, effect: "love" }, () => {
        exec(cmd, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout) => {
          if (error) {
            return message.reply({ body: `❌ [ Install Error ]\n\n\`\`\`text\n${error.message}\n\`\`\``, effect: "love" });
          }

          return message.reply({ body: `𓍢ִ໋🌸✧ ── ͟͟͞͞Iɴsᴛᴀʟʟ Sᴜᴄᴄᴇss ── ✧🌸𓍢ִ໋\n\n✅ Successfully installed \`${safePackages.join(", ")}\`!`, effect: "love" });
        });
      });
    }

    // ========== OPTIMIZED UNINSTALL ==========
    if (action === "uninstall" || action === "remove" || action === "rm") {
      const packages = args.slice(1);

      if (packages.length === 0) {
        return message.reply({ body: "⚠️ Please enter package name(s) to uninstall!", effect: "love" });
      }

      const safePackages = packages.filter(pkg => /^[@a-zA-Z0-9\-_\/\.]+$/.test(pkg));

      if (safePackages.length === 0) {
        return message.reply({ body: "❌ Invalid package name format detected!", effect: "love" });
      }

      const cmd = `npm uninstall ${safePackages.join(" ")} --no-audit --no-fund`;

      return message.reply({ body: `⏳ Uninstalling: \`${safePackages.join(", ")}\` ...`, effect: "love" }, () => {
        exec(cmd, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error) => {
          if (error) {
            return message.reply({ body: `❌ [ Uninstall Error ]\n\n\`\`\`text\n${error.message}\n\`\`\``, effect: "love" });
          }

          return message.reply({ body: `𓍢ִ໋🌸✧ ── ͟͟͞͞Uɴɪɴsᴛᴀʟʟ Sᴜᴄᴄᴇss ── ✧🌸𓍢ִ໋\n\n🗑️ Successfully uninstalled \`${safePackages.join(", ")}\`!`, effect: "love" });
        });
      });
    }

    return message.reply({ body: "❌ Invalid syntax! Use: install, uninstall, or list", effect: "love" });
  }
};
