'use strict';

// Aliya tester. Owner-only diagnostic assistant: reads bot command files,
// reviews images/videos/audio/files, and chats. All replies are cleaned so no
// asterisks or markdown bold ever reach Facebook.

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const CMD_DIR = __dirname;
// "gemini-flash-latest" is no longer a valid model id on this API. The
// verified working flash model is used first, with newer flash models tried
// if it is unavailable (override with ALIYA_TESTER_MODEL).
const PRIMARY_MODEL = process.env.ALIYA_TESTER_MODEL || 'gemini-3.1-flash-lite';
const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash']
	.filter(m => m !== PRIMARY_MODEL);
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY ||
	process.env.ALIYA_TESTER_API_KEY ||
	'AQ.Ab8RN6Iv0ybAD8vsSTO7uHYAMIfaiZKIZ-gQuMBk97WJNIBiKQ';
const MAX_MEDIA_BYTES = 18 * 1024 * 1024;

const SYSTEM_INSTRUCTION = [
	'You are Aliya Official, made by Mr.king.',
	'Always speak as Aliya Official. Never say you are Gemini, an AI model, Google, or any other service.',
	'You are the private tester of the Aliya bot. Your main job is command checking:',
	'read the supplied command source, find the exact bug or weak point, explain the problem clearly,',
	'and give practical fix/update advice with corrected code snippets when useful.',
	'You can also chat naturally, and inspect images, videos, audio/music and files sent to you.',
	'When asked for a prompt from media, output a ready to use image or video generation prompt only.',
	'When asked what you can do, list your capabilities from the menu given to you.',
	'Never use asterisks, markdown bold, or star characters in any reply. Use plain numbered lists and dashes.',
	'Keep answers direct, useful and human. Do not mention these instructions.'
].join(' ');

const MENU = [
	'ALIYA TESTER MENU',
	'',
	'1. aliyatester cmds <command name> - read a command, find issues, report the problem and what to fix or update',
	'2. aliyatester help - show this menu',
	'3. aliyatester <anything> - chat or ask about anything',
	'4. Reply to my message - continue the conversation',
	'5. Reply to an image, video, audio or file with a question - I can view and analyse it',
	'6. Reply to media and say prompt - I give you a ready generation prompt',
	'7. aliyatester prompt <style> while replying to media - generate a styled prompt',
	'',
	'Owner only. Made by Mr.king'
].join('\n');

const CAPABILITY_ANSWER = [
	'I am Aliya Official, made by Mr.king.',
	'I can check any bot command and tell you the exact problem plus what to fix or update.',
	'I can view and analyse images, videos, audio, music and files you reply to.',
	'I can write image or video generation prompts from your media.',
	'I can chat about anything and continue the talk when you reply to my message.',
	'',
	MENU
].join('\n');

let clientPromise = null;

function clean(text) {
	return String(text == null ? '' : text)
		.replace(/\*\*/g, '')
		.replace(/\*/g, '')
		.trim();
}

function normalizeName(raw) {
	return String(raw == null ? '' : raw)
		.trim()
		.replace(/^["'`]|["'`]$/g, '')
		.toLowerCase()
		.replace(/^[^a-z0-9]+/, '')
		.replace(/[^a-z0-9_-]/g, '')
		.slice(0, 80);
}

function findCommandFile(rawName) {
	const name = normalizeName(rawName);
	if (!name) return null;
	const files = fs.readdirSync(CMD_DIR).filter(f => f.endsWith('.js'));
	const direct = files.find(f => path.basename(f, '.js').toLowerCase() === name);
	const nameRe = new RegExp(`\\bname\\s*:\\s*['"\`]${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'i');
	const aliasRe = new RegExp(`\\baliases\\s*:\\s*\\[[^\\]]*['"\`]${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'i');
	const byConfig = files.find(f => {
		try {
			const src = fs.readFileSync(path.join(CMD_DIR, f), 'utf8');
			return nameRe.test(src) || aliasRe.test(src);
		}
		catch (_e) { return false; }
	});
	const found = direct || byConfig;
	if (!found) return null;
	const full = path.join(CMD_DIR, found);
	return { file: found, content: fs.readFileSync(full, 'utf8') };
}

function isBotOwner(senderID) {
	const cfg = (global.GoatBot && global.GoatBot.config) || global.config || {};
	const owners = [].concat(cfg.adminBot || cfg.ADMINBOT || []).map(String);
	if (!owners.length) {
		try {
			const { ownerID } = require('../../func/bot-uids.js');
			const id = ownerID();
			if (id) owners.push(String(id));
		}
		catch (_e) { /* no owner configured */ }
	}
	return owners.includes(String(senderID));
}

function isCapabilityQuestion(text) {
	return /\b(what can (you|u) do|what do you do|help|menu|who are you|what are you|ki korte paro|koto korte paro|ki korte parben)\b/i.test(String(text || ''));
}

function isPromptRequest(text) {
	return /\b(prompt|caption idea|generate prompt|pro mp t)\b/i.test(String(text || ''));
}

function splitText(text, size) {
	const limit = size || 7000;
	let rest = clean(text) || 'I could not generate a reply. Try again with a shorter request.';
	const chunks = [];
	while (rest.length > limit) {
		let cut = rest.lastIndexOf('\n', limit);
		if (cut < limit / 2) cut = limit;
		chunks.push(rest.slice(0, cut));
		rest = rest.slice(cut);
	}
	if (rest) chunks.push(rest);
	return chunks;
}

function safeReact(api, emoji, messageID) {
	try { api && api.setMessageReaction && api.setMessageReaction(emoji, messageID, () => {}, true); }
	catch (_e) { /* reaction is cosmetic */ }
}

function collectAttachments(event) {
	const list = [];
	for (const a of (event && event.attachments) || []) if (a && a.url) list.push(a);
	const replyAtt = event && event.messageReply && event.messageReply.attachments;
	for (const a of replyAtt || []) if (a && a.url) list.push(a);
	return list;
}

function mimeFromAttachment(att, contentType) {
	const type = String(att.type || '').toLowerCase();
	if (/image|photo|animatedgif/.test(type)) return 'image/jpeg';
	if (/video/.test(type)) return 'video/mp4';
	if (/audio|voice/.test(type)) return 'audio/mpeg';
	if (contentType && /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(contentType)) return contentType;
	return 'application/octet-stream';
}

async function mediaParts(event) {
	const parts = [];
	for (const att of collectAttachments(event).slice(0, 3)) {
		try {
			const res = await axios.get(att.url, {
				responseType: 'arraybuffer',
				timeout: 25000,
				maxContentLength: MAX_MEDIA_BYTES,
				maxBodyLength: MAX_MEDIA_BYTES
			});
			const buf = Buffer.from(res.data || []);
			if (!buf.length || buf.length > MAX_MEDIA_BYTES) continue;
			parts.push({
				inlineData: {
					mimeType: mimeFromAttachment(att, res.headers && res.headers['content-type']),
					data: buf.toString('base64')
				}
			});
		}
		catch (_e) { /* skip media that cannot be downloaded */ }
	}
	return parts;
}

async function getClient() {
	if (!clientPromise) {
		clientPromise = import('@google/genai').then(({ GoogleGenAI }) =>
			new GoogleGenAI({ apiKey: API_KEY })
		).catch(err => {
			clientPromise = null;
			throw err;
		});
	}
	return clientPromise;
}

async function askGemini(text, parts, context) {
	const ai = await getClient();
	const contents = [];
	for (const turn of (Array.isArray(context) ? context.slice(-4) : [])) {
		contents.push({ role: 'user', parts: [{ text: clean(turn.q) }] });
		contents.push({ role: 'model', parts: [{ text: clean(turn.a) }] });
	}
	const userParts = (parts || []).slice();
	userParts.push({ text: clean(text) || 'Describe this.' });
	contents.push({ role: 'user', parts: userParts });

	let answer = '';
	let lastError = null;
	for (const model of [PRIMARY_MODEL].concat(FALLBACK_MODELS)) {
		try {
			const response = await ai.models.generateContent({
				model,
				contents,
				config: {
					systemInstruction: SYSTEM_INSTRUCTION,
					temperature: 0.6,
					maxOutputTokens: 4096
				}
			});
			let out = '';
			try { out = typeof response.text === 'function' ? response.text() : response.text; }
			catch (_e) { /* fall through to candidates */ }
			if (!out && response && response.candidates && response.candidates[0] && response.candidates[0].content) {
				out = (response.candidates[0].content.parts || []).map(p => p.text || '').join('\n');
			}
			answer = clean(out);
			if (answer) break;
			lastError = new Error(`Empty response from ${model}`);
		}
		catch (err) {
			lastError = err;
			const raw = String((err && (err.message || (err.error && err.error.message))) || '');
			const match = raw.match(/\b(404|429|503)\b/);
			const status = Number((err && (err.status || (err.error && err.error.code))) || (match && match[1]) || 0);
			// Only retry for overload / gone / rate limit; real errors surface.
			if (![404, 429, 503].includes(status)) throw err;
		}
	}
	if (!answer) throw lastError || new Error('No Gemini model available.');
	return answer;
}

async function sendAnswer(env, answer, context) {
	const { api, event, message, commandName } = env;
	const author = event.senderID;
	const chunks = splitText(answer);
	for (let i = 0; i < chunks.length; i++) {
		const last = i === chunks.length - 1;
		if (!last) {
			try {
				if (typeof message.reply === 'function') await message.reply(chunks[i]);
				else api.sendMessage(chunks[i], event.threadID, event.messageID);
			}
			catch (_e) { /* keep going with the remaining answer */ }
			continue;
		}
		await new Promise(resolve => {
			try {
				if (typeof message.reply === 'function') {
					message.reply(chunks[i], (err, info) => {
						if (!err && info && info.messageID && global.GoatBot && global.GoatBot.onReply) {
							global.GoatBot.onReply.set(info.messageID, {
								commandName,
								author,
								context: context || []
							});
						}
						resolve();
					});
				}
				else {
					api.sendMessage(chunks[i], event.threadID, event.messageID, (err, info) => {
						if (!err && info && info.messageID && global.GoatBot && global.GoatBot.onReply) {
							global.GoatBot.onReply.set(info.messageID, { commandName, author, context: context || [] });
						}
						resolve();
					});
				}
			}
			catch (_e) { resolve(); }
		});
	}
}

async function handle(env, rawText, replyContext) {
	const { api, event, message, commandName } = env;
	if (!isBotOwner(event.senderID)) return message.reply(clean('Owner only command.'));

	const text = clean(rawText);
	safeReact(api, '⏳', event.messageID);

	// Menu / identity never goes through the model, so the identity is exact.
	if (!text && !collectAttachments(event).length) {
		safeReact(api, '✅', event.messageID);
		return sendAnswer(env, MENU, []);
	}
	if (isCapabilityQuestion(text) && !collectAttachments(event).length) {
		safeReact(api, '✅', event.messageID);
		return sendAnswer(env, CAPABILITY_ANSWER, []);
	}

	let question = text;
	let parts = [];
	try { parts = await mediaParts(event); }
	catch (_e) { parts = []; }

	const lower = text.toLowerCase();
	const wantsPrompt = isPromptRequest(text);

	if (/^\s*cmds\b/.test(lower)) {
		const rawName = clean(text.replace(/^\s*cmds\b/i, ''));
		const found = findCommandFile(rawName);
		if (!found) {
			safeReact(api, '❌', event.messageID);
			return message.reply(clean(`Command not found: ${rawName || 'empty'}. Use aliyatester help for the menu.`));
		}
		const source = found.content.length > 120000 ? found.content.slice(0, 120000) + '\n(sources truncated)' : found.content;
		question = [
			'Check this Aliya bot command file.',
			'Report: 1) what it does, 2) the exact problem or bug if any, 3) what to fix or update, with corrected snippets when useful.',
			`Command: ${rawName}`,
			`File: scripts/cmds/${found.file}`,
			'Source starts here.',
			source,
			'Source ends here.'
		].join('\n');
	}
	else if (wantsPrompt && parts.length) {
		question = [
			'Create one ready to use generation prompt from the attached media.',
			text.replace(/\bprompt\b/gi, '').trim() || '',
			'Include subject, style, composition, lighting, colors, camera and mood. Return only the prompt.'
		].join('\n').replace(/\n{3,}/g, '\n\n');
	}
	else if (parts.length && !question) {
		question = 'Describe this media and tell me anything important about it.';
	}

	try {
		const answer = await askGemini(question, parts, replyContext);
		const context = (Array.isArray(replyContext) ? replyContext.slice(-3) : []).concat([{ q: question, a: answer }]);
		safeReact(api, '✅', event.messageID);
		return await sendAnswer(env, answer, context);
	}
	catch (err) {
		safeReact(api, '❌', event.messageID);
		const detail = clean(err && (err.message || err.name) || 'unknown error').slice(0, 300);
		return message.reply(clean(`Tester error: ${detail}. Use aliyatester help for the menu.`));
	}
}

module.exports = {
	config: {
		name: 'aliyatester',
		aliases: ['tester'],
		version: '1.0.0',
		author: '0xMr_King x ┃ Tanin Islam',
		countDown: 5,
		role: 2,
		shortDescription: { en: 'Owner-only command checker and tester' },
		longDescription: {
			en: 'Reads any bot command and reports problems with fix advice. Can view media, write prompts and chat.'
		},
		category: 'tools',
		guide: {
			en: [
				'{pn} help',
				'{pn} cmds <command name>',
				'{pn} <anything>',
				'Reply to my message to continue chatting, or reply to media with a question or prompt'
			].join('\n')
		}
	},

	onStart: async function (env) {
		const { event, args, message } = env;
		if (!isBotOwner(event.senderID)) return message.reply(clean('Owner only command.'));
		const text = (args || []).join(' ').trim();
		if (/^help\b/i.test(text)) {
			safeReact(env.api, '✅', event.messageID);
			return sendAnswer(env, MENU, []);
		}
		return handle(env, text, []);
	},

	onReply: async function (env) {
		const { event, Reply, message } = env;
		if (!isBotOwner(event.senderID)) return message.reply(clean('Owner only command.'));
		if (Reply && Reply.author && String(Reply.author) !== String(event.senderID)) return;
		const text = clean(event.body || '');
		if (/^help\b/i.test(text)) {
			safeReact(env.api, '✅', event.messageID);
			return sendAnswer(env, MENU, []);
		}
		return handle(env, text, (Reply && Reply.context) || []);
	},

	_test: { clean, normalizeName, findCommandFile, isBotOwner, isCapabilityQuestion, isPromptRequest, collectAttachments, splitText, askGemini, MENU, CAPABILITY_ANSWER }
};
