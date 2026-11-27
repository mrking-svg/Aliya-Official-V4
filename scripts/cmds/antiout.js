// AntiOut — re-adds a member who leaves, only while antiout is ON for that group.
module.exports = {
  config: {
    name: "antiout",
    aliases: ["anti", "antileave"],
    version: "3.1.0",
    author: "0xMr_King x ┃ Tanin Islam",
    role: 1,
    category: "group",
    shortDescription: "Re-add members who leave the group",
    longDescription: "When enabled, a member who leaves the group is added back. Off by default.",
    guide: "{pn} on | {pn} off"
  },

  onStart: async function ({ api, event, args, threadsData }) {
    const threadID = event.threadID;
    const mode = String(args[0] || "").toLowerCase();

    if (mode !== "on" && mode !== "off") {
      return api.sendMessage({ body: "Usage: antiout on | antiout off" }, threadID, event.messageID);
    }

    try {
      const threadData = await threadsData.get(threadID) || {};
      const data = { ...(threadData.data || {}), antiout: mode === "on" };
      await threadsData.set(threadID, { data });
      return api.sendMessage({ body: `AntiOut ${mode === "on" ? "enabled" : "disabled"} successfully.` }, threadID, event.messageID);
    }
    catch (error) {
      console.error("ANTIOUT", error);
      return api.sendMessage({ body: "AntiOut could not be updated. Please try again." }, threadID, event.messageID);
    }
  },

  onEvent: async function ({ api, event, threadsData }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    const threadID = event.threadID;
    const logData = event.logMessageData || {};
    let userID = logData.leftParticipantFbId || logData.leftParticipantsFbId;

    if (!userID && Array.isArray(logData.leftParticipantsFbIds)) {
      userID = logData.leftParticipantsFbIds[0];
    }
    if (!userID && Array.isArray(logData.leftParticipants)) {
      const first = logData.leftParticipants[0];
      userID = typeof first === "object" ? (first.userFbId || first.id) : first;
    }
    if (!userID) return;

    try {
      const botID = typeof api.getCurrentUserID === "function" ? String(api.getCurrentUserID()) : "";
      if (botID && String(userID) === botID) return;

      const threadData = await threadsData.get(threadID) || {};
      // Only an explicit "on" may trigger a re-add. Anything else means OFF.
      if (threadData?.data?.antiout !== true) return;
      if (typeof api.addUserToGroup !== "function") return;

      let name = "Member";
      try {
        const info = await api.getUserInfo(userID);
        name = info?.[userID]?.name || name;
      }
      catch (e) { /* keep the default name */ }

      await api.addUserToGroup(userID, threadID);
      return api.sendMessage({ body: `AntiOut: ${name} has been added back to the group.` }, threadID);
    }
    catch (error) {
      // A failed re-add must never break the other leave handlers.
      console.error("ANTIOUT", error?.message || error);
    }
  }
};
