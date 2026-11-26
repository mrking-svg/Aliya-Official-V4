module.exports = {
  config: {
    name: "kickall",
    version: "1.0",
    author: "0xMr_King x ┃ Tanin Islam",
    role: 2,
    shortDescription: {
      en: "Kick everyone from the group"
    },
    category: "owner",
    guide: {
      en: "{prefix}kickall"
    }
  },

  onStart: async function ({ api, event }) {
    const threadID = event.threadID;
    const senderID = event.senderID;

    try {
      const threadInfo = await api.getThreadInfo(threadID);

      if (!threadInfo.adminIDs.some(item => item.id === api.getCurrentUserID())) {
        return api.sendMessage({ body: "❌ Bot must be an admin to kick members.", effect: "love" }, threadID);
      }

      const membersToKick = threadInfo.participantIDs.filter(id => id !== senderID && id !== api.getCurrentUserID());

      if (membersToKick.length === 0) {
        return api.sendMessage({ body: "❌ No members to kick.", effect: "love" }, threadID);
      }

      api.sendMessage({ body: `⚠️ Kicking ${membersToKick.length} members...`, effect: "love" }, threadID, async () => {
        for (const userID of membersToKick) {
          try {
            await api.removeUserFromGroup(userID, threadID);
          } catch (e) {
            console.log(`❌ Failed to kick ${userID}: ${e.message}`);
          }
        }
      });
    } catch (e) {
      console.error(e);
      api.sendMessage({ body: "❌ An error occurred while trying to kick members.", effect: "love" }, threadID);
    }

  }
};
