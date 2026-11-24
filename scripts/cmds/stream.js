"use strict";

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { spawn } = require("child_process");

const SUPPORTED_FORMATS = ["jpg", "jpeg", "png", "gif", "mp4", "mp3"];
const MAX_FILE_BYTES = 35 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 20000;
const FFMPEG_TIMEOUT_MS = 30000;

function hasFFmpeg() {
	return new Promise((resolve) => {
		const proc = spawn("ffmpeg", ["-version"]);
		proc.on("error", () => resolve(false));
		proc.on("close", (code) => resolve(code === 0));
	});
}

function runFFmpeg(args, timeoutMs = FFMPEG_TIMEOUT_MS) {
	return new Promise((resolve, reject) => {
		const proc = spawn("ffmpeg", args, {
			stdio: ["ignore", "ignore", "pipe"]
		});

		let stderr = "";
		let settled = false;

		const timer = setTimeout(() => {
			if (!settled) {
				settled = true;
				proc.kill("SIGKILL");
				reject(new Error("FFmpeg processing timed out"));
			}
		}, timeoutMs);

		proc.stderr.on("data", (chunk) => {
			if (stderr.length < 4000) {
				stderr += chunk.toString();
			}
		});

		proc.on("error", (err) => {
			if (!settled) {
				settled = true;
				clearTimeout(timer);
				reject(err);
			}
		});

		proc.on("close", (code) => {
			if (!settled) {
				settled = true;
				clearTimeout(timer);
				if (code === 0) {
					resolve();
				} else {
					reject(new Error(stderr.trim().split("\n").pop() || `FFmpeg exited with code ${code}`));
				}
			}
		});
	});
}

function buildFFmpegArgs(inputPath, outputPath, format) {
	if (format === "jpg" || format === "jpeg") {
		return ["-y", "-i", inputPath, "-frames:v", "1", "-q:v", "3", outputPath];
	}
	if (format === "png") {
		return ["-y", "-i", inputPath, "-frames:v", "1", "-compression_level", "6", outputPath];
	}
	if (format === "gif") {
		return [
			"-y",
			"-i",
			inputPath,
			"-vf",
			"fps=12,scale=480:-1:flags=lanczos",
			"-loop",
			"0",
			outputPath
		];
	}
	if (format === "mp3") {
		return ["-y", "-i", inputPath, "-vn", "-ac", "1", "-ar", "44100", "-b:a", "128k", outputPath];
	}
	return [
		"-y",
		"-i",
		inputPath,
		"-c:v",
		"libx264",
		"-preset",
		"veryfast",
		"-crf",
		"26",
		"-maxrate",
		"1500k",
		"-bufsize",
		"3000k",
		"-vf",
		"scale='min(1280,iw)':-2",
		"-c:a",
		"aac",
		"-b:a",
		"128k",
		"-movflags",
		"+faststart",
		outputPath
	];
}

module.exports = {
	config: {
		name: "stream",
		version: "1.1.0",
		author: "0xMr_King x ┃ Tanin Islam",
		countDown: 5,
		role: 0,
		description: {
			en: "Lightweight media converter and streamer (jpg, png, gif, mp4, mp3)"
		},
		category: "media",
		guide: {
			en: "   {pn} <format> (Reply to any video/gif/sticker/image)\n   Example: {pn} jpg\n   Example: {pn} gif\n   Example: {pn} mp3\n   Example: {pn} mp4"
		}
	},

	onStart: async ({ api, event, args, message, prefix }) => {
		const { messageReply, attachments, messageID } = event;
		const p = prefix || (global.GoatBot && global.GoatBot.config && global.GoatBot.config.prefix) || "";

		let targetFormat = (args[0] || "").toLowerCase().replace(/^\./, "");
		if (!targetFormat) {
			return message.reply(`⚠️ | Format din! Example: ${p}stream jpg, ${p}stream gif, ${p}stream mp3, ${p}stream mp4`);
		}
		if (targetFormat === "jpeg") targetFormat = "jpg";

		if (!SUPPORTED_FORMATS.includes(targetFormat)) {
			return message.reply(`⚠️ | Unsupported format "${targetFormat}". Use: jpg, png, gif, mp4, mp3`);
		}

		let targetAttachment = null;
		if (messageReply && Array.isArray(messageReply.attachments) && messageReply.attachments.length > 0) {
			targetAttachment = messageReply.attachments[0];
		} else if (Array.isArray(attachments) && attachments.length > 0) {
			targetAttachment = attachments[0];
		}

		if (!targetAttachment || !targetAttachment.url) {
			return message.reply("⚠️ | Kono video, gif, sticker ba photo te reply kore command ti use korun!");
		}

		api.setMessageReaction("🛜", messageID, () => {}, true);

		const cacheDir = path.join(__dirname, "cache");
		const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
		const rawPath = path.join(cacheDir, `in_${stamp}`);
		const outPath = path.join(cacheDir, `out_${stamp}.${targetFormat}`);

		try {
			await fs.ensureDir(cacheDir);

			const response = await axios({
				method: "GET",
				url: targetAttachment.url,
				responseType: "stream",
				timeout: REQUEST_TIMEOUT_MS,
				maxContentLength: MAX_FILE_BYTES,
				maxBodyLength: MAX_FILE_BYTES
			});

			const contentLength = Number(response.headers["content-length"] || 0);
			if (contentLength > MAX_FILE_BYTES) {
				response.data.destroy();
				throw new Error("File size exceeds 35MB limit");
			}

			let downloadedBytes = 0;
			const writer = fs.createWriteStream(rawPath);

			response.data.on("data", (chunk) => {
				downloadedBytes += chunk.length;
				if (downloadedBytes > MAX_FILE_BYTES) {
					response.data.destroy();
					writer.destroy();
				}
			});

			response.data.pipe(writer);

			await new Promise((resolve, reject) => {
				writer.on("finish", resolve);
				writer.on("error", reject);
				response.data.on("error", reject);
			});

			if (downloadedBytes > MAX_FILE_BYTES) {
				throw new Error("File size exceeds 35MB limit");
			}

			let sendPath = rawPath;
			const ffmpegAvailable = await hasFFmpeg();

			if (ffmpegAvailable) {
				await runFFmpeg(buildFFmpegArgs(rawPath, outPath, targetFormat));
				if (await fs.pathExists(outPath)) {
					sendPath = outPath;
				}
			}

			const stat = await fs.stat(sendPath);
			if (stat.size <= 0 || stat.size > MAX_FILE_BYTES) {
				throw new Error("Output file is empty or too large");
			}

			api.setMessageReaction("🦢", messageID, () => {}, true);

			await message.reply({
				body: `🐇 | Stream ready (.${targetFormat})`,
				attachment: fs.createReadStream(sendPath)
			});

			api.setMessageReaction("🫈", messageID, () => {}, true);
		} catch (error) {
			console.error("Stream Command Error:", error);
			api.setMessageReaction("❌", messageID, () => {}, true);
			return message.reply(`❌ | Stream process korte somossha hoyeche: ${error.message}`);
		} finally {
			await fs.remove(rawPath).catch(() => {});
			if (outPath !== rawPath) {
				await fs.remove(outPath).catch(() => {});
			}
		}
	}
};
