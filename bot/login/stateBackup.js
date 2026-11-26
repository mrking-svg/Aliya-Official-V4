// Keeps a last-known-good copy of account.txt so a corrupted or emptied state
// file never forces the owner to paste a fresh FB state again.
const fs = require("fs-extra");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const FILE = process.env.FBSTATE_FILE || path.join(ROOT, "account.txt");
const BACKUP = process.env.FBSTATE_BACKUP_FILE || path.join(ROOT, "account.backup.txt");

function isValidState(raw) {
  try {
    const state = JSON.parse(String(raw || "").trim());
    return Array.isArray(state) && state.some(item => item && item.key && item.value !== undefined);
  } catch (_) {
    return false;
  }
}

function save(state) {
  try {
    const clean = (Array.isArray(state) ? state : []).filter(item => item && item.key && item.value !== undefined);
    if (!clean.length) return false;
    fs.writeFileSync(BACKUP, JSON.stringify(clean, null, 2));
    return true;
  } catch (_) {
    return false;
  }
}

function saveFromFile() {
  try {
    if (!fs.existsSync(FILE)) return false;
    return save(JSON.parse(fs.readFileSync(FILE, "utf8")));
  } catch (_) {
    return false;
  }
}

function restoreIfNeeded() {
  try {
    if (fs.existsSync(FILE) && isValidState(fs.readFileSync(FILE, "utf8"))) return false;
    if (!fs.existsSync(BACKUP)) return false;
    const backup = fs.readFileSync(BACKUP, "utf8");
    if (!isValidState(backup)) return false;
    fs.writeFileSync(FILE, backup);
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = { save, saveFromFile, restoreIfNeeded, FILE, BACKUP, isValidState };
