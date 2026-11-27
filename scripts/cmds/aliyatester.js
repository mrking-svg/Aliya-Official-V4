'use strict';

// Aliya tester. Owner-only diagnostic assistant: reads bot command files,
// reviews images/videos/audio/files, and chats. All replies are cleaned so no
// asterisks or markdown bold ever reach Facebook.

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const CMD_DIR = __dirname;
// "gemini-flash-latest" is no longer a valid model id on this API. Measured:
// 3.5 and 3.6 flash answer in about one second; 3.1 lite often stalls for
// tens of seconds, so it stays last. Override with ALIYA_TESTER_MODEL.
const PRIMARY_MODEL = process.env.ALIYA_TESTER_MODEL || 'gemini-3.5-flash';
const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.7-flash']
	.filter(m => m !== PRIMARY_MODEL);
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY ||
	process.env.ALIYA_TESTER_API_KEY ||
	'AQ.Ab8RN6Iv0ybAD8vsSTO7uHYAMIfaiZKIZ-gQuMBk97WJNIBiKQ';
const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
const MAX_SOURCE_CHARS = 24000;
const MAX_OUTPUT_TOKENS = Math.max(400, Number(process.env.ALIYA_TESTER_MAX_TOKENS) || 1000);
const MODEL_COOLDOWN_MS = 5 * 60 * 1000;
// Hard budgets: a stalled backend must never leave the owner staring at a
// blank chat. The request is aborted client-side and a friendly reply is sent.
const REQUEST_TIMEOUT_MS = Math.max(2500, Number(process.env.ALIYA_TESTER_TIMEOUT_MS) || 9000);
const MODEL_TIMEOUT_MS = Math.max(2000, Number(process.env.ALIYA_TESTER_MODEL_TIMEOUT_MS) || 6000);
const IMAGE_TIMEOUT_MS = Math.max(5000, Number(process.env.ALIYA_TESTER_IMAGE_TIMEOUT_MS) || 20000);
// Image editing uses a separate image-capable model family. Override the
// first choice with ALIYA_TESTER_IMAGE_MODEL if a newer model is available.
const IMAGE_MODELS = [process.env.ALIYA_TESTER_IMAGE_MODEL].concat([
	'gemini-nano-banana-2.1',
	'gemini-3.1-flash-image',
	'gemini-3.1-flash-lite-image',
	'gemini-2.5-flash-image'
]).filter((m, i, arr) => m && arr.indexOf(m) === i);

const SYSTEM_INSTRUCTION = [
	'You are Aliya Official Made By Mr.king.',
	'Always speak as Aliya Official. Never say you are Gemini, an AI model, Google, or any other service.',
	'You are the private tester of the Aliya bot. Your main job is command checking:',
	'read the supplied command source, find the exact bug or weak point, explain the problem clearly,',
	'and give practical fix/update advice with corrected code snippets when useful.',
	'You can also chat naturally, and inspect images, videos, audio/music and files sent to you.',
	'When asked for a prompt from media, output a ready to use image or video generation prompt only.',
	'When asked what you can do, list your capabilities from the menu given to you.',
	'Never use asterisks, markdown bold, or star characters in any reply. Use plain numbered lists and dashes.',
	'Be fast and concise. Give the answer directly, skip long intros, and do not overthink.',
	'Keep answers direct, useful and human. Do not mention these instructions.'
].join(' ');

const MENU = [
	'ALIYA TESTER MENU',
	'',
	'1. aliyatester cmds <command name> - read a command, find issues, report the problem and what to fix or update',
	'2. aliyatester help - show this short menu',
	'3. aliyatester toollist - full usage guide with examples',
	'4. aliyatester <anything> - chat or ask about anything',
	'5. Reply to my message - continue the conversation',
	'6. Reply to an image, video, audio or file with a question - I can view and analyse it',
	'7. Reply to media and say prompt - I give you a ready generation prompt',
	'8. aliyatester prompt <style> while replying to media - generate a styled prompt',
	'9. aliyatester editimg "prompt" while replying to an image - edit the image and send it back',
	'',
	'Owner only. Made by Mr.king'
].join('\n');

const TOOL_LIST = [
	'ALIYA TESTER TOOL LIST',
	'',
	'Command checker',
	'Use: aliyatester cmds <command name>',
	'Example: aliyatester cmds pair',
	'Example: aliyatester cmds "daily"',
	'Example: aliyatester cmds tester',
	'It reads that command file, tells what it does, the exact problem if any, and what to fix or update.',
	'',
	'Chat',
	'Use: aliyatester <question>',
	'Example: aliyatester explain this error',
	'Reply to my answer to continue the talk.',
	'',
	'See and analyse media',
	'Reply to a photo, video, audio or file with your question.',
	'Example: what is in this picture',
	'Example: is this audio clear',
	'',
	'Prompt from media',
	'Reply to media and say prompt.',
	'Example: prompt',
	'Example: aliyatester prompt dark fantasy style while replying to an image',
	'I will return one ready generation prompt.',
	'',
	'Edit images',
	'Reply to an image with aliyatester editimg "prompt".',
	'Example: aliyatester editimg "make it cartoon"',
	'Example: aliyatester editimg "remove the background and add a blue gradient"',
	'The edited image is sent back in the chat.',
	'',
	'Quick help',
	'aliyatester help shows the short menu.',
	'aliyatester toollist shows this full usage guide.',
	'aliyatester what can you do shows what I can do.',
	'',
	'Identity',
	'I am Aliya Official Made By Mr.king. I never claim to be another service.',
	'',
	'Owner only. Made by Mr.king'
].join('\n');

const CAPABILITY_ANSWER = [
	'I am Aliya Official Made By Mr.king',
	'I can check any bot command and tell you the exact problem plus what to fix or update.',
	'I can view and analyse images, videos, audio, music and files you reply to.',
	'I can write image or video generation prompts from your media.',
	'I can edit images you reply to and send back the result.',
	'I can chat about anything and continue the talk when you reply to my message.',
	'Use aliyatester toollist for the full usage guide with examples.',
	'',
	MENU
].join('\n');

let clientPromise = null;
let preferredModel = null;
const modelCooldown = new Map();

function clean(text) {
	return String(text == null ? '' : text)
		.replace(/\*\*/g, '')
		.replace(/\*/g, '')
		// Never leak the backend name in a user-facing answer.
		.replace(/\b(?:gemini|google|bard|chatgpt|openai|claude)[-\w.]*/gi, '')
		.replace(/[ \t]{2,}/g, ' ')
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

// Reading and regex-scanning 570+ files on every request was a large part of
// the perceived slowness. Build the index once and refresh it at most once a
// minute; direct filename hits are still instant.
let commandIndex = null;
let commandIndexedAt = 0;

function getCommandIndex() {
	const now = Date.now();
	if (commandIndex && now - commandIndexedAt < 60 * 1000) return commandIndex;
	const entries = [];
	for (const file of fs.readdirSync(CMD_DIR)) {
		if (!file.endsWith('.js')) continue;
		let source = '';
		try { source = fs.readFileSync(path.join(CMD_DIR, file), 'utf8'); }
		catch (_e) { continue; }
		entries.push({ file, base: path.basename(file, '.js').toLowerCase(), source });
	}
	commandIndex = entries;
	commandIndexedAt = now;
	return entries;
}

function findCommandFile(rawName) {
	const name = normalizeName(rawName);
	if (!name) return null;
	const entries = getCommandIndex();
	const direct = entries.find(e => e.base === name);
	const nameRe = new RegExp(`\\bname\\s*:\\s*['"\`]${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'i');
	const aliasRe = new RegExp(`\\baliases\\s*:\\s*\\[[^\\]]*['"\`]${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'i');
	const found = direct || entries.find(e => nameRe.test(e.source) || aliasRe.test(e.source));
	if (!found) return null;
	return { file: found.file, content: found.source };
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

function isQuickChat(text) {
	return /^\s*(hi|hello|hey|yo|hola|thanks|thank you|dhonnobad|assalamu alaikum|salam)\s*[!.]*\s*$/i.test(String(text || ''));
}

function isPromptRequest(text) {
	return /\b(prompt|caption idea|generate prompt|pro mp t)\b/i.test(String(text || ''));
}

function isEditRequest(text) {
	return /^\s*(editimg|edit\s+image|imgedit)\b/i.test(String(text || ''));
}

function editPromptFrom(text) {
	return clean(String(text || ''))
		.replace(/^\s*(editimg|edit\s+image|imgedit)\b/i, '')
		.trim()
		.replace(/^["'`]\s*|\s*["'`]$/g, '')
		.trim();
}

function isImageAttachment(att) {
	const type = String((att && att.type) || '').toLowerCase();
	const url = String((att && att.url) || '');
	return /image|photo|animatedgif/.test(type) || /\.(png|jpe?g|gif|webp|bmp)(?:\?|$)/i.test(url);
}

function compactSource(src) {
	return String(src || '')
		.split('\n')
		.filter(line => {
			const t = line.trim();
			return t && !t.startsWith('//') && !t.startsWith('/*') && t !== '*' && t !== '*/';
		})
		.join('\n')
		.slice(0, MAX_SOURCE_CHARS);
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

function collectAttachments(event) {
	const list = [];
	for (const a of (event && event.attachments) || []) if (a && a.url) list.push(a);
	const replyAtt = event && event.messageReply && event.messageReply.attachments;
	for (const a of replyAtt || []) if (a && a.url) list.push(a);
	return list;
}

function mimeFromAttachment(att, contentType) {
	if (contentType && /^image\//i.test(contentType)) return contentType;
	const type = String((att && att.type) || '').toLowerCase();
	if (/image|photo|animatedgif/.test(type)) return 'image/jpeg';
	if (/video/.test(type)) return 'video/mp4';
	if (/audio|voice/.test(type)) return 'audio/mpeg';
	if (contentType && /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(contentType)) return contentType;
	return 'application/octet-stream';
}

async function downloadParts(event, imageOnly) {
	const parts = [];
	let attachments = collectAttachments(event);
	if (imageOnly) attachments = attachments.filter(isImageAttachment);
	for (const att of attachments.slice(0, 1)) {
		try {
			const res = await axios.get(att.url, {
				responseType: 'arraybuffer',
				timeout: 12000,
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

function mediaParts(event) {
	return downloadParts(event, false);
}

function imageParts(event) {
	return downloadParts(event, true);
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

async function generateWithTimeout(ai, params, timeoutMs) {
	const controller = typeof AbortController === 'function' ? new AbortController() : null;
	const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
	try {
		const config = Object.assign({}, params.config || {});
		if (controller) config.abortSignal = controller.signal;
		return await ai.models.generateContent({
			model: params.model,
			contents: params.contents,
			config
		});
	}
	finally {
		if (timer) clearTimeout(timer);
	}
}

async function askGemini(text, parts, context) {
	const ai = await getClient();
	const startedAt = Date.now();
	const remaining = () => Math.max(0, REQUEST_TIMEOUT_MS - (Date.now() - startedAt));
	const contents = [];
	for (const turn of (Array.isArray(context) ? context.slice(-4) : [])) {
		contents.push({ role: 'user', parts: [{ text: clean(turn.q) }] });
		contents.push({ role: 'model', parts: [{ text: clean(turn.a) }] });
	}
	const userParts = (parts || []).slice();
	userParts.push({ text: clean(text) || 'Describe this.' });
	contents.push({ role: 'user', parts: userParts });

	const allModels = [PRIMARY_MODEL].concat(FALLBACK_MODELS);
	const now = Date.now();
	const modelOrder = [];
	if (preferredModel) modelOrder.push(preferredModel);
	for (const model of allModels) {
		if (!modelOrder.includes(model) && (modelCooldown.get(model) || 0) <= now) modelOrder.push(model);
	}
	if (!modelOrder.length) modelOrder.push(...allModels);

	async function tryModel(model) {
		if (remaining() <= 0) throw new Error('Tester is busy. Try again in a moment.');
		try {
			const response = await generateWithTimeout(ai, {
				model,
				contents,
				config: {
					systemInstruction: SYSTEM_INSTRUCTION,
					temperature: 0.3,
					maxOutputTokens: MAX_OUTPUT_TOKENS,
					thinkingConfig: { thinkingBudget: 0 }
				}
			}, Math.min(MODEL_TIMEOUT_MS, remaining()));
			let out = '';
			try { out = typeof response.text === 'function' ? response.text() : response.text; }
			catch (_e) { /* fall through to candidates */ }
			if (!out && response && response.candidates && response.candidates[0] && response.candidates[0].content) {
				out = (response.candidates[0].content.parts || []).map(p => p.text || '').join('\n');
			}
			const answer = clean(out);
			if (!answer) throw new Error(`Empty response from ${model}`);
			preferredModel = model;
			return { model, answer };
		}
		catch (err) {
			const raw = String((err && (err.message || (err.error && err.error.message))) || '');
			const match = raw.match(/\b(404|429|503)\b/);
			const status = Number((err && (err.status || (err.error && err.error.code))) || (match && match[1]) || 0);
			if ([404, 429, 503].includes(status) || /abort|timeout|timed out/i.test(raw))
				modelCooldown.set(model, Date.now() + MODEL_COOLDOWN_MS);
			throw err;
		}
	}

	// Race the two best models so one overloaded model cannot stall the reply.
	// If both fail, the remaining models are tried one by one.
	let lastError = null;
	let winner = null;
	try {
		winner = await Promise.any(modelOrder.slice(0, 2).map(tryModel));
	}
	catch (err) {
		lastError = err;
		for (const model of modelOrder.slice(2)) {
			try { winner = await tryModel(model); break; }
			catch (e) { lastError = e; }
		}
	}
	if (!winner) throw new Error('Tester is busy. Try again in a moment.');
	return winner.answer;
}

async function askImageEdit(prompt, parts) {
	if (!parts || !parts.length) throw new Error('No image was attached.');
	const ai = await getClient();
	const contents = [{
		role: 'user',
		parts: parts.concat([{ text: clean(prompt) }])
	}];

	let lastError = null;
	const startedAt = Date.now();
	for (const model of IMAGE_MODELS) {
		const remaining = IMAGE_TIMEOUT_MS - (Date.now() - startedAt);
		if (remaining <= 0) break;
		try {
			const response = await generateWithTimeout(ai, {
				model,
				contents,
				config: { responseModalities: ['TEXT', 'IMAGE'] }
			}, Math.min(IMAGE_TIMEOUT_MS, remaining));
			const responseParts = (response && response.candidates && response.candidates[0] &&
				response.candidates[0].content && response.candidates[0].content.parts) || [];
			const image = responseParts.find(p => p && p.inlineData && p.inlineData.data);
			if (!image) throw new Error('No image data was returned.');
			const buffer = typeof image.inlineData.data === 'string'
				? Buffer.from(image.inlineData.data, 'base64')
				: Buffer.from(image.inlineData.data);
			if (!buffer.length) throw new Error('Empty image data was returned.');
			return { buffer, mimeType: String(image.inlineData.mimeType || 'image/png') };
		}
		catch (err) {
			lastError = err;
		}
	}
	throw lastError || new Error('No image model available.');
}

function friendlyTestError(err) {
	const raw = String((err && (err.message || err.name)) || err || '');
	if (/abort|timeout|timed out|busy/i.test(raw))
		return 'Tester is busy right now. Try again in a moment.';
	if (/429|quota|billing|rate limit/i.test(raw))
		return 'Tester is out of quota right now. Try again later.';
	if (/404|not found|not supported|invalid model/i.test(raw))
		return 'Tester is not available on this setup.';
	return 'Tester could not answer that right now. Try again with a shorter request.';
}

function friendlyImageError(err) {
	const raw = String((err && (err.message || (err.error && err.error.message))) || err || 'unknown error');
	if (/429|quota|billing|rate limit/i.test(raw)) {
		return 'Image editing is unavailable right now because the image quota or billing limit is reached.';
	}
	if (/404|not found|not supported|invalid model/i.test(raw)) {
		return 'Image editing is not available on this setup.';
	}
	return 'Image edit failed. Try a shorter prompt or a different image.';
}

async function sendEditedImage(env, result) {
	const { api, event, message } = env;
	const dir = path.join(__dirname, 'cache');
	await fs.ensureDir(dir);
	const mime = String((result && result.mimeType) || 'image/png');
	const ext = /jpeg|jpg/i.test(mime) ? 'jpg' : /webp/i.test(mime) ? 'webp' : /gif/i.test(mime) ? 'gif' : 'png';
	const file = path.join(dir, `aliyatester_edit_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
	await fs.writeFile(file, result.buffer);
	const cleanup = () => { try { fs.unlinkSync(file); } catch (_e) { /* already removed */ } };
	const stream = fs.createReadStream(file);
	stream.on('error', () => { /* send failure is reported through the callback */ });
	const payload = { body: 'Edited image ready.', attachment: stream };

	return new Promise(resolve => {
		try {
			if (typeof message.reply === 'function') message.reply(payload, () => { cleanup(); resolve(); });
			else api.sendMessage(payload, event.threadID, event.messageID, () => { cleanup(); resolve(); });
		}
		catch (_e) { cleanup(); resolve(); }
	});
}

async function sendAnswer(env, answer, context) {
	const { api, event, message, commandName } = env;
	const author = event.senderID;
	const chunks = splitText(clean(answer));
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
	const { event, message } = env;
	if (!isBotOwner(event.senderID)) return message.reply(clean('Owner only command.'));

	const text = clean(rawText);
	const lower = text.toLowerCase();
	const isCmdMode = /^\s*cmds\b/.test(lower);
	const isEditMode = isEditRequest(text);
	const attachments = collectAttachments(event);
	const hasMedia = attachments.length > 0;
	const hasImage = attachments.some(isImageAttachment);

	// Short answers and menu/identity never call the model, so they are instant.
	if (!text && !hasMedia) return sendAnswer(env, MENU, []);
	if (isCapabilityQuestion(text) && !hasMedia) return sendAnswer(env, CAPABILITY_ANSWER, []);
	if (isQuickChat(text) && !hasMedia) {
		return sendAnswer(env, 'I am Aliya Official Made By Mr.king. Tell me what to check or ask me anything.', []);
	}

	if (isEditMode) {
		if (!hasImage) return message.reply(clean('Reply to an image with: aliyatester editimg "your edit prompt"'));
		const prompt = editPromptFrom(text);
		if (!prompt) return message.reply(clean('Give an edit prompt. Example: aliyatester editimg "make it cartoon" while replying to an image.'));
		let parts = [];
		try { parts = await imageParts(event); }
		catch (_e) { parts = []; }
		if (!parts.length) return message.reply(clean('I could not download that image. Try replying to the image again.'));
		try {
			const result = await askImageEdit(prompt, parts);
			return await sendEditedImage(env, result);
		}
		catch (err) {
			return message.reply(clean(friendlyImageError(err)));
		}
	}

	let question = text;
	let parts = [];
	// Command checking never needs a media download that would slow it down.
	if (hasMedia && !isCmdMode) {
		try { parts = await mediaParts(event); }
		catch (_e) { parts = []; }
	}

	const wantsPrompt = isPromptRequest(text);

	if (isCmdMode) {
		const rawName = clean(text.replace(/^\s*cmds\b/i, ''));
		const found = findCommandFile(rawName);
		if (!found) {
			return message.reply(clean(`Command not found: ${rawName || 'empty'}. Use aliyatester help for the menu.`));
		}
		const source = compactSource(found.content);
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
		return await sendAnswer(env, answer, context);
	}
	catch (err) {
		return message.reply(clean(`${friendlyTestError(err)} Use aliyatester help for the menu.`));
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
			en: 'Reads any bot command and reports problems with fix advice. Can view media, write prompts, edit images and chat.'
		},
		category: 'tools',
		guide: {
			en: [
				'{pn} help',
				'{pn} toollist',
				'{pn} cmds <command name>',
				'{pn} editimg "prompt" (reply to an image)',
				'{pn} <anything>',
				'Reply to my message to continue chatting, or reply to media with a question or prompt'
			].join('\n')
		}
	},

	onStart: async function (env) {
		const { event, args, message } = env;
		if (!isBotOwner(event.senderID)) return message.reply(clean('Owner only command.'));
		const text = (args || []).join(' ').trim();
		if (/^help\b/i.test(text)) return sendAnswer(env, MENU, []);
		if (/^toollist\b/i.test(text)) return sendAnswer(env, TOOL_LIST, []);
		return handle(env, text, []);
	},

	onReply: async function (env) {
		const { event, Reply, message } = env;
		if (!isBotOwner(event.senderID)) return message.reply(clean('Owner only command.'));
		if (Reply && Reply.author && String(Reply.author) !== String(event.senderID)) return;
		const text = clean(event.body || '');
		if (/^help\b/i.test(text)) return sendAnswer(env, MENU, []);
		if (/^toollist\b/i.test(text)) return sendAnswer(env, TOOL_LIST, []);
		return handle(env, text, (Reply && Reply.context) || []);
	},

	_test: { clean, normalizeName, findCommandFile, isBotOwner, isCapabilityQuestion, isQuickChat, isPromptRequest, isEditRequest, editPromptFrom, isImageAttachment, compactSource, collectAttachments, splitText, generateWithTimeout, askGemini, askImageEdit, friendlyTestError, friendlyImageError, sendEditedImage, MENU, TOOL_LIST, CAPABILITY_ANSWER }
};
