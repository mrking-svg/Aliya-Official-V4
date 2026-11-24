const OWNER_CREDIT = "0xMr_King x ┃ Tanin Islam";

function creditOk() {
  return module.exports.config.credits === OWNER_CREDIT;
}

module.exports.config = {
    role: 2,
    countDown: 30,
    category: "Admin",
    shortDescription: "গ্রুপের সাসপেন্ড/ডিসেবল আইডিগুলো কিক করুন",
    longDescription: "গ্রুপের সাসপেন্ড/ডিসেবল আইডিগুলো কিক করুন",
    guide: "{pn} fbkick",
  
  name: "fbkick",
  version: "1.1.0",
  hasPermssion: 2,
  credits: "0xMr_King x ┃ Tanin Islam",
  description: "গ্রুপের সাসপেন্ড/ডিসেবল আইডিগুলো কিক করুন",
  commandCategory: "Admin",
  usages: "fbkick",
  cooldowns: 30
};

module.exports.onLoad = function () {
  if (!creditOk()) console.log("❌ [fbkick] ক্রেডিট বদলানো হয়েছে, কমান্ড বন্ধ।");
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports.onStart = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // 🔒 ক্রেডিট লক
  if (!creditOk()) {
    return api.sendMessage("⛔ ক্রেডিট বদলানো হয়েছে! কমান্ড বন্ধ।", threadID, messageID);
  }

  // শুধু কনফিগারেশনের বট অ্যাডমিন
  const adminBot = ((global.config && global.config.adminBot) || []).map(String);
  if (!adminBot.includes(String(senderID))) {
    return api.sendMessage("❌ শুধু বট অ্যাডমিন ব্যবহার করতে পারবে।", threadID, messageID);
  }

  try {
    const botID = String(api.getCurrentUserID());

    // গ্রুপের তথ্য
    const threadInfo = await new Promise((resolve, reject) => {
      api.getThreadInfo(threadID, (err, data) => (err ? reject(err) : resolve(data)));
    });

    const groupAdmins = (threadInfo.adminIDs || []).map((a) => String(a.id));
    const botIsAdmin = groupAdmins.includes(botID);

    // 🤖 বট গ্রুপ অ্যাডমিন কিনা
    if (!botIsAdmin) {
      return api.sendMessage(
`╔════════════════════╗
   ⚠️ 𝗕𝗢𝗧 𝗡𝗢𝗧 𝗔𝗗𝗠𝗜𝗡
╚════════════════════╝

🤖 বট গ্রুপ অ্যাডমিন: ❌ নেই
আগে বটকে গ্রুপ অ্যাডমিন করুন।

━━━━━━━━━━━━━━━━━━`,
        threadID,
        messageID
      );
    }

    const members = (threadInfo.participantIDs || []).map(String);

    // সবার তথ্য আনা
    const usersInfo = await new Promise((resolve, reject) => {
      api.getUserInfo(members, (err, data) => (err ? reject(err) : resolve(data)));
    });

    // সাসপেন্ড/ডিসেবল আইডি বাছাই
    const targets = members.filter((uid) => {
      if (uid === botID) return false;
      if (adminBot.includes(uid)) return false;
      if (groupAdmins.includes(uid)) return false;

      const u = usersInfo[uid];
      const name = (u && u.name ? String(u.name) : "").trim().toLowerCase();
      return !u || name === "" || name === "facebook user";
    });

    if (targets.length === 0) {
      return api.sendMessage(
        "🤖 বট গ্রুপ অ্যাডমিন: ✅ আছে\n✅ কোনো সাসপেন্ড/ডিসেবল আইডি পাওয়া যায়নি।",
        threadID,
        messageID
      );
    }

    await api.sendMessage(
      `🤖 বট গ্রুপ অ্যাডমিন: ✅ আছে\n🔍 ${targets.length} টি আইডি পাওয়া গেছে, কিক হচ্ছে...`,
      threadID
    );

    let done = 0;
    let failed = 0;

    for (const uid of targets) {
      try {
        await new Promise((resolve, reject) => {
          api.removeUserFromGroup(uid, threadID, (err) => (err ? reject(err) : resolve()));
        });
        done++;
      } catch (e) {
        failed++;
      }
      await sleep(2000); // স্প্যাম ব্লক এড়াতে বিরতি
    }

    return api.sendMessage(
`╔════════════════════╗
   ✅ 𝗙𝗕 𝗞𝗜𝗖𝗞 𝗗𝗢𝗡𝗘
╚════════════════════╝

🤖 বট গ্রুপ অ্যাডমিন: ✅ আছে
🚫 কিক হয়েছে: ${done} টি
⚠️ ব্যর্থ: ${failed} টি

━━━━━━━━━━━━━━━━━━
👑 0xMr_King x ┃ Tanin Islam`,
      threadID
    );
  } catch (e) {
    console.log("fbkick error:", e);
    return api.sendMessage("❌ কিছু সমস্যা হয়েছে।", threadID, messageID);
  }
};
