// ══════════════════════════════════════════════
// Credit : 0xMr_King x ┃ Tanin Islam
// ══════════════════════════════════════════════
// Group approval gate.
// The bot joins every group, but nobody can use it until the group is approved.
// Approvals can be permanent (reply "1") or timed (reply "1 add 7" = 7 days).
// ══════════════════════════════════════════════
const fs = require("fs");
const path = require("path");

const CREDITS = "0xMr_King x ┃ Tanin Islam";
const FILE = process.env.APPROVAL_STATE_FILE ||
  path.join(__dirname, "..", "scripts", "cmds", "cache", "approvedThreads.json");
const CONFIG_FILE = path.join(__dirname, "..", "config.json");
const DAY_MS = 24 * 60 * 60 * 1000;

let state = { seeded: false, threads: {}, pending: {}, revoked: {} };

try {
  if (fs.existsSync(FILE)) {
    const s = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (s && typeof s.threads === "object") {
      state = {
        seeded: !!s.seeded,
        threads: s.threads,
        pending: (s.pending && typeof s.pending === "object") ? s.pending : {},
        revoked: (s.revoked && typeof s.revoked === "object") ? s.revoked : {}
      };
    }
  }
} catch (_) {}

function save() {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.log("[APPROVAL] save error:", e.message);
  }
}

function normalizeEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const expiresAt = Number(entry.expiresAt) || 0;
  if (expiresAt && Date.now() >= expiresAt) return null;
  return {
    by: entry.by ? String(entry.by) : null,
    at: entry.at || new Date().toISOString(),
    expiresAt: expiresAt || null,
    days: Number(entry.days) || 0
  };
}

// ── approval / pending ──
function isApproved(id) {
  const k = String(id);
  const entry = normalizeEntry(state.threads[k]);
  if (!entry) {
    if (state.threads[k]) { delete state.threads[k]; save(); }
    return false;
  }
  return true;
}

function isPending(id) {
  return !!state.pending[String(id)];
}

function approvalInfo(id) {
  const k = String(id);
  const entry = normalizeEntry(state.threads[k]);
  if (!entry) {
    if (state.threads[k]) { delete state.threads[k]; save(); }
    return null;
  }
  return entry;
}

function approve(id, by, days = 0, at = null, expiresAt = undefined) {
  const k = String(id);
  const n = Math.max(0, Math.floor(Number(days) || 0));
  state.threads[k] = {
    by: by ? String(by) : null,
    at: at || new Date().toISOString(),
    days: n,
    expiresAt: expiresAt === undefined ? (n > 0 ? Date.now() + n * DAY_MS : null) : (expiresAt || null)
  };
  delete state.pending[k];
  delete state.revoked[k];
  save();
  return state.threads[k];
}

// Mirror a DB/config approval without resetting its timer. A timed approval
// must keep its original expiry after a restart or a redeploy.
function approveFromExternal(id, entry) {
  return approve(
    id,
    entry && entry.by ? entry.by : "migrate",
    entry && entry.days ? entry.days : 0,
    entry && entry.at ? entry.at : null,
    entry && entry.expiresAt ? entry.expiresAt : null
  );
}

function isRevoked(id) {
  return !!state.revoked[String(id)];
}

function addPending(id, by) {
  const k = String(id);
  if (isApproved(k)) return;
  state.pending[k] = { by: by ? String(by) : null, at: new Date().toISOString() };
  save();
}

function remove(id) {
  const k = String(id);
  let changed = false;
  if (state.threads[k]) { delete state.threads[k]; changed = true; }
  if (state.pending[k]) { delete state.pending[k]; changed = true; }
  // Remember the refusal so threadsData/config cannot silently re-approve the
  // group when the bot is kicked and later added again.
  if (!state.revoked[k]) { state.revoked[k] = Date.now(); changed = true; }
  if (changed) save();
}

const list = () => Object.keys(state.threads).filter(isApproved);
const pendingList = () => Object.keys(state.pending);
const getPendingInfo = id => state.pending[String(id)] || null;

// Called from pending.js / approve.js — never sends anything to the group itself.
async function approveById(api, tid, by, days = 0) {
  approve(tid, by, days);
  return true;
}

// ── config / admin ──
function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch (_) {
    return global.config || {};
  }
}

function getAdminBots() {
  const cfg = readConfig();
  const g = global.GoatBot?.config || {};
  return [...new Set([...(cfg.adminBot || []), ...(g.adminBot || [])].map(String))];
}

function isAdmin(id) {
  const cfg = readConfig();
  const g = global.GoatBot?.config || {};
  const all = [
    ...(cfg.adminBot || []), ...(cfg.developer || []),
    ...(g.adminBot || []), ...(g.developer || [])
  ].map(String);
  return all.includes(String(id));
}

// cancelled/kicked groups must also disappear from the config whitelist,
// otherwise a re-add silently re-approves them from config.
function removeFromConfig(id) {
  try {
    const cfg = readConfig();
    let changed = false;
    for (const list of [
      cfg.threadApproval && cfg.threadApproval.approvedThreadIDs,
      cfg.whiteListMode && cfg.whiteListMode.whiteListIds
    ]) {
      if (!Array.isArray(list)) continue;
      const kept = list.filter(x => String(x) !== String(id));
      if (kept.length !== list.length) {
        list.length = 0;
        list.push(...kept);
        changed = true;
      }
    }
    if (changed) fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
  } catch (_) {}
}

function getPrefix() {
  const cfg = readConfig();
  const g = global.GoatBot?.config || {};
  return cfg.PREFIX || cfg.prefix || g.PREFIX || g.prefix || "(";
}

function contactLinks() {
  const cfg = readConfig();
  const g = global.GoatBot?.config || {};
  const ids = [...new Set([
    ...(cfg.adminBot || []), ...(cfg.developer || []),
    ...(g.adminBot || []), ...(g.developer || [])
  ].map(String))];
  const links = ids.filter(id => /^\d+$/.test(id)).map(id => `https://m.me/${id}`);
  return links.length ? links : ["https://m.me/0xmrking"];
}

function approvalRequiredText() {
  return (
    "🔒 This group is not approved to use the bot yet.\n" +
    "Contact admin for approval: " + contactLinks().join(" | ") + "\n" +
    "Bot has joined successfully. Approval is required only to use commands."
  );
}

// ── admin inbox notice (nothing is posted in the group) ──
async function notifyAdmins(api, tid, adderID) {
  try {
    let groupName = "Unnamed group";
    let members = "?";
    try {
      const info = await api.getThreadInfo(tid);
      groupName = info.threadName || info.name || groupName;
      members = (info.participantIDs || []).length || "?";
    } catch (_) {}

    let adderName = "Unknown";
    try {
      const u = await api.getUserInfo(adderID);
      adderName = (u && u[adderID] && u[adderID].name) || "Unknown";
    } catch (_) {}

    let time;
    try {
      time = require("moment-timezone").tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm:ss A");
    } catch (_) {
      time = new Date().toLocaleString();
    }

    const msg =
`🔔 The bot was added to a group, but the group is not approved

🏠 Group: ${groupName}
🆔 Group ID: ${tid}
👥 Members: ${members}

👤 Added by: ${adderName}
🆔 User ID: ${adderID}
🔗 Profile: https://www.facebook.com/${adderID}

🕒 Time: ${time}
📌 Status: ⏳ Pending (bot stays in the group)

👉 See the list: ${getPrefix()}pending`;

    for (const adminID of getAdminBots()) {
      try {
        await api.sendMessage(msg, adminID);
      } catch (_) {}
    }
  } catch (e) {
    console.log("[APPROVAL] notify error:", e.message);
  }
}

// First run: existing groups are already trusted, new groups go to pending.
function configApprovedIds() {
  try {
    const cfg = readConfig();
    return [
      ...((cfg.threadApproval && cfg.threadApproval.approvedThreadIDs) || []),
      ...((cfg.whiteListMode && cfg.whiteListMode.whiteListIds) || [])
    ].map(String);
  } catch (_) {
    return [];
  }
}

function seedOnce() {
  if (state.seeded) return true;
  const ids = [
    ...((global.data && global.data.allThreadID) || []),
    ...configApprovedIds()
  ];
  // Never seed an empty list too early: threads may still be loading. Otherwise
  // existing groups would wrongly become pending after a restart.
  if (ids.length === 0 && process.uptime() < 600) return false;
  ids.forEach(id => {
    if (!state.threads[String(id)]) state.threads[String(id)] = { by: "seed", at: new Date().toISOString(), days: 0, expiresAt: null };
  });
  state.seeded = true;
  save();
  return true;
}

const noticed = new Map();
function notifyOnceInGroup(api, tid) {
  const now = Date.now();
  if (now - (noticed.get(String(tid)) || 0) < 10 * 60 * 1000) return;
  noticed.set(String(tid), now);
  try {
    const p = api.sendMessage(approvalRequiredText(), tid);
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch (_) {}
}

// true = let the event continue, false = ignore it.
function allow(event, api) {
  const tid = String(event?.threadID || "");
  if (!tid) return true;
  if (!seedOnce()) return true;

  const actor = String(
    event.type === "message_reaction"
      ? event.userID
      : event.type === "event"
      ? event.author || event.senderID
      : event.senderID
  );

  // Private chats are never gated.
  const isGroup = event.isGroup === true || (event.isGroup === undefined && actor !== tid);
  if (!isGroup) return true;

  let botID = "";
  try { botID = String(api.getCurrentUserID()); } catch (_) {}

  // Bot kicked/left: forget the group.
  if (
    event.type === "event" &&
    event.logMessageType === "log:unsubscribe" &&
    String(event.logMessageData && event.logMessageData.leftParticipantFbId) === botID
  ) {
    remove(tid);
    removeFromConfig(tid);
    return false;
  }

  // Bot added to a group: the bot ALWAYS joins and posts the connected message.
  // Non-admin adders only make the group pending for command usage.
  if (event.type === "event" && event.logMessageType === "log:subscribe") {
    const d = event.logMessageData || {};
    const added = (d.addedParticipants || []).map(p => String(p.userFbId));
    if (added.includes(botID) && !isAdmin(actor)) {
      addPending(tid, actor);
      notifyAdmins(api, tid, actor);
    }
    return true;
  }

  if (isApproved(tid)) return true;

  // Bot owner/admins can use every command in every group, approved or not.
  // This also lets their bare approval replies (1 / 1 add 7 / c1) reach
  // pending.js instead of being blocked by the gate.
  const isMsg = event.type === "message" || event.type === "message_reply";
  if (isAdmin(actor)) return true;

  // Never answer to the bot's own messages.
  if (botID && String(actor) === botID) return true;

  if (!isPending(tid)) addPending(tid, null);
  if (isMsg) notifyOnceInGroup(api, tid);
  return false;
}

// Approval can live in more than one place. pending.js writes to this module's
// state file AND to threadsData/config; a restart or a redeploy can reset the
// local file, so the DB-backed sources must also be trusted.
async function approvedByAnySource(tid, threadsData, globalData) {
  const k = String(tid || "");
  if (!k) return true;
  if (isRevoked(k)) {
    try {
      if (threadsData && typeof threadsData.set === "function")
        await threadsData.set(k, false, "data.approved");
      if (threadsData && typeof threadsData.set === "function")
        await threadsData.set(k, null, "data.approvedExpiresAt");
    } catch (_) {}
    return false;
  }
  if (isApproved(k)) return true;

  // The DB may hold a timed approval. Honour its original expiry instead of
  // treating the boolean flag as a permanent approval.
  try {
    if (threadsData && typeof threadsData.get === "function") {
      const flag = await threadsData.get(k, "data.approved");
      if (flag === true || String(flag) === "true") {
        let expiresAt = 0;
        let at = null;
        let days = 0;
        try { expiresAt = Number(await threadsData.get(k, "data.approvedExpiresAt")) || 0; } catch (_) {}
        try { at = await threadsData.get(k, "data.approvedAt"); } catch (_) {}
        try { days = Number(await threadsData.get(k, "data.approvedDays")) || 0; } catch (_) {}
        if (expiresAt && Date.now() >= expiresAt) {
          try {
            if (typeof threadsData.set === "function") await threadsData.set(k, false, "data.approved");
          } catch (_) {}
          return false;
        }
        approveFromExternal(k, { by: "db", at, days, expiresAt });
        return true;
      }
    }
  } catch (_) {}

  // Legacy global list has no per-group expiry; it is a permanent approval.
  try {
    if (globalData && typeof globalData.get === "function") {
      const old = await globalData.get("approved", "data", {});
      const ids = (old && old.approved) || [];
      if (ids.map(String).includes(k)) {
        approveFromExternal(k, { by: "migrate", days: 0, expiresAt: null });
        return true;
      }
    }
  } catch (_) {}

  if (configApprovedIds().includes(k)) {
    approveFromExternal(k, { by: "config", days: 0, expiresAt: null });
    return true;
  }
  return false;
}

// handlerAction uses this so a group approved through pending keeps working
// after a bot restart, even if the local state file was reset.
async function allowWithData(event, api, threadsData, globalData) {
  const tid = String(event?.threadID || "");
  if (!tid) return true;
  // approvedByAnySource already mirrors external approvals with their real
  // expiry; never call approve() here or a 7-day pass becomes permanent.
  if (await approvedByAnySource(tid, threadsData, globalData)) return true;
  return allow(event, api);
}

module.exports = {
  allow, allowWithData, approvedByAnySource, approve, approveById, addPending, remove,
  isApproved, isPending, approvalInfo,
  list, pendingList, getPendingInfo,
  isAdmin, contactLinks, approvalRequiredText,
  DAY_MS, credits: CREDITS
};
