const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const AUTODL_API = "https://xsaim8x-xxx-api.onrender.com/api/auto";
const SUPPORTED_AUTODL_DOMAINS = [
  "facebook.com", "fb.watch", "youtube.com", "youtu.be", "tiktok.com",
  "instagram.com", "instagr.am", "likee.com", "likee.video", "capcut.com",
  "spotify.com", "terabox.com", "twitter.com", "x.com", "drive.google.com",
  "soundcloud.com", "ndown.app", "pinterest.com", "pin.it"
];

function isAutoDlSupported(url = "") {
  return SUPPORTED_AUTODL_DOMAINS.some(domain => url.includes(domain));
}

async function getDownloadUrl(url, baseUrl) {
  if (!url) return null;
  let finalUrl = url;
  if (finalUrl.startsWith("/")) finalUrl = `${baseUrl}${finalUrl}`;

  // If it's a supported social/source URL, try autodl API first
  if (isAutoDlSupported(finalUrl)) {
    try {
      const res = await axios.get(AUTODL_API, {
        params: { url: finalUrl },
        timeout: 60000
      });
      const mediaURL = res.data?.high_quality || res.data?.low_quality || res.data?.data?.high_quality || res.data?.data?.low_quality;
      if (mediaURL) return mediaURL;
    } catch (e) {
      // fallback to direct URL below
    }
  }

  return finalUrl;
}

async function downloadBuffer(url) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 120000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: { "user-agent": "Mozilla/5.0" }
  });
  return Buffer.from(res.data);
}

const defaultQueries = [
  "anime 4k edit",
  "anime 4k edits",
  "anime x phonk",
  "goku aura",
  "anime aliya 4k editz",
  "anime amv 4k",
  "best anime edit"
];

module.exports = {
  config: {
    name: "amv",
    version: "2.1.0",
    author: "0xMr_King x ┃ Tanin Islam",
    countDown: 5,
    role: 0,
    shortDescription: "High quality anime 4K edits and AMV videos",
    longDescription: "Sends random or searched high quality 4K anime edits, phonk edits, and AMV videos.",
    category: "anime",
    guide: "{pn} [optional query]"
  },

  onStart: async function ({ api, message, event, args }) {
    let query = args.join(" ").trim();

    if (!query) {
      query = defaultQueries[Math.floor(Math.random() * defaultQueries.length)];
    } else if (!query.toLowerCase().includes("anime")) {
      query = `anime ${query}`;
    }

    api.setMessageReaction("🏯", event.messageID, () => {}, true);

    // Render-e API deploy kore env API_BASE_URL set koro; na hole purono default chalbe.
    const baseUrl = String(process.env.API_BASE_URL || "https://0x-mr-king-api-server-i73g.vercel.app").replace(/\/+$/, "");

    try {
      const res = await axios.get(`${baseUrl}/api/amv`, {
        params: { query: query }
      });

      const payload = res.data && res.data.data ? res.data.data : null;
      const candidate = Array.isArray(payload)
        ? payload[Math.floor(Math.random() * payload.length)]
        : payload;

      const rawVideoUrl = candidate
        ? (candidate.download_api_url
            ? `${baseUrl}${candidate.download_api_url}`
            : candidate.download_url || candidate.video_url || candidate.url)
        : null;

      if (!res.data || !res.data.success || !rawVideoUrl) {
        throw new Error("No anime videos found!");
      }

      const videoUrl = await getDownloadUrl(rawVideoUrl, baseUrl);
      if (!videoUrl) throw new Error("No downloadable video URL found!");

      const buffer = await downloadBuffer(videoUrl);
      const filePath = path.join(__dirname, "cache", `amv_${Date.now()}.mp4`);

      await fs.ensureDir(path.dirname(filePath));
      fs.writeFileSync(filePath, Buffer.from(buffer));

      api.setMessageReaction("🐇", event.messageID, () => {}, true);

      const infoCard =
        `╭─────────────────────────────────⬣\n` +
        `│ Made by 0xMr_King x ┃ Tanin Islam\n` +
        `╰─────────────────────────────────⬣`;

      return message.reply(
        { body: infoCard, attachment: fs.createReadStream(filePath) },
        () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      );
    } catch (error) {
      console.error("AMV Error:", error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("Failed to fetch anime video, please try again!");
    }
  }
};
