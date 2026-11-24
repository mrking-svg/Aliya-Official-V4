const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "cmds");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".js") && !f.endsWith("eg.js") && !f.endsWith(".dev.js")).sort();
const commands = [];
const names = new Map();
const aliases = new Map();
const errors = [];

function configBlock(src) {
  const indexes = [src.indexOf("config:"), src.indexOf("exports.config")].filter(i => i >= 0);
  const idx = indexes.length ? Math.min(...indexes) : -1;
  return idx < 0 ? "" : src.slice(idx, idx + 3000);
}

function literalFor(src, identifier) {
  const escaped = identifier.replace(/[$]/g, "\\$&");
  const match = src.match(new RegExp("(?:const|let|var)\\s+" + escaped + "\\s*=\\s*[\"'`]([^\"'`]+)[\"'`]"));
  return match ? match[1] : null;
}

function parseAliases(src, block) {
  const match = block.match(/\baliases\s*:\s*\[([^\]]*)\]/);
  if (!match) return [];
  let list = [...match[1].matchAll(/["'`]([^"'`]+)["'`]/g)].map(x => x[1]);
  if (!list.length) {
    const id = match[1].trim().match(/^[A-Za-z_$][\w$]*$/);
    if (id) {
      const arrayMatch = src.match(new RegExp("(?:const|let|var)\\s+" + id[0] + "\\s*=\\s*\\[([^\\]]*)\\]"));
      if (arrayMatch) list = [...arrayMatch[1].matchAll(/["'`]([^"'`]+)["'`]/g)].map(x => x[1]);
    }
  }
  return list;
}

for (const file of files) {
  const src = fs.readFileSync(path.join(dir, file), "utf8");
  const block = configBlock(src);
  const nameMatch = block.match(/\bname\s*:\s*["'`]([^"'`]+)["'`]/);
  let name = nameMatch ? nameMatch[1] : null;
  if (!name) {
    const constMatch = block.match(/\bname\s*:\s*([A-Za-z_$][\w$]*)/);
    if (constMatch) name = literalFor(src, constMatch[1]) || constMatch[1];
  }
  if (!name) name = file.replace(/\.js$/, "");
  commands.push({ file, name, aliases: parseAliases(src, block) });
}

for (const { file, name } of commands) {
  if (names.has(name)) errors.push(`duplicate command name: ${name} (${names.get(name)}, ${file})`);
  else names.set(name, file);
}

for (const { file, name, aliases: list } of commands) {
  for (const alias of list) {
    const key = String(alias).toLowerCase();
    if (!String(alias).trim()) errors.push(`empty alias in ${name} (${file})`);
    if (/[\s()]/.test(alias)) errors.push(`invalid alias characters: ${alias} (${file})`);
    if (alias !== key) errors.push(`uppercase alias: ${alias} (${file})`);
    if (names.has(alias)) errors.push(`alias shadows command: ${alias} (${names.get(alias)}, ${file})`);
    if (aliases.has(key)) errors.push(`duplicate alias: ${alias} (${aliases.get(key)}, ${file})`);
    else aliases.set(key, `${name} (${file})`);
  }
}

console.log(JSON.stringify({ commands: files.length, uniqueNames: names.size, aliases: aliases.size, errors }, null, 2));
process.exit(errors.length ? 1 : 0);
