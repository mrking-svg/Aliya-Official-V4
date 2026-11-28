// set bash title
process.stdout.write("\x1b]2;ALIYA OFFICIAL V4 - Made by 0xMr_King x ┃ Tanin Islam\x1b\x5c");
const defaultRequire = require;

function decode(text) {
	text = Buffer.from(text, 'hex').toString('utf-8');
	text = Buffer.from(text, 'hex').toString('utf-8');
	text = Buffer.from(text, 'base64').toString('utf-8');
	return text;
}

const gradient = defaultRequire("gradient-string");
const axios = defaultRequire("axios");
const path = defaultRequire("path");
const readline = defaultRequire("readline");
const fs = defaultRequire("fs-extra");
const toptp = defaultRequire("totp-generator");
const login = defaultRequire(`${process.cwd()}/fb-chat-api`);
const qr = new (defaultRequire("qrcode-reader"));
const Canvas = defaultRequire("canvas");
const https = defaultRequire("https");

async function getName(userID) {
	try {
		const user = await axios.post(`https://www.facebook.com/api/graphql/?q=${`node(${userID}){name}`}`);
		return user.data[userID].name;
	}
	catch (error) {
		return null;
	}
}


function compareVersion(version1, version2) {
	const v1 = version1.split(".");
	const v2 = version2.split(".");
	for (let i = 0; i < 3; i++) {
		if (parseInt(v1[i]) > parseInt(v2[i]))
			return 1; // version1 > version2
		if (parseInt(v1[i]) < parseInt(v2[i]))
			return -1; // version1 < version2
	}
	return 0; // version1 = version2
}

const { writeFileSync, readFileSync, existsSync, watch } = require("fs-extra");
const stateBackup = require("./stateBackup");
const handlerWhenListenHasError = require("./handlerWhenListenHasError.js");
const checkLiveCookie = require("./checkLiveCookie.js");

// Facebook puts the checkpoint URL deep inside error.res.jsmods, not in
// error.message ("Not logged in"). Read the whole error before deciding that
// a session is only temporarily down - otherwise a checkpointed account keeps
// "starting" forever while the listener retries every minute.
function errorTextOf(error) {
	try {
		if (typeof error === "string") return error;
		const parts = [error && error.message, error && error.error];
		if (error && error.res) parts.push(JSON.stringify(error.res));
		return parts.filter(Boolean).join(" ");
	}
	catch (_e) {
		return String(error || "");
	}
}
// A temporary cookie/MQTT failure must never rotate the account. Only a real
// Facebook checkpoint / suspension / disabled account is allowed to do that.
function isSuspendedSession(error) {
	return /checkpoint|suspended|disabled account|account.*disabled|blocked account|\/block\//i.test(errorTextOf(error));
}
// "Facebook blocked login" means the session/account is already flagged. Any
// further reconnects only dig the hole deeper, so we stop immediately.
function isFacebookBlocked(error) {
	return /blocked login|facebook blocked login|temporarily blocked|account.*blocked/i.test(errorTextOf(error));
}
const { callbackListenTime, storage5Message } = global.GoatBot;
const isDuplicateMessage = require("./messageDedupe.js").createMessageDedupe(storage5Message, { size: 50 });
const { log, logColor, getPrefix, createOraDots, jsonStringifyColor, getText, convertTime, colors, randomString } = global.utils;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const currentVersion = require(`${process.cwd()}/package.json`).version;

function centerText(text, length) {
	const width = process.stdout.columns;
	const leftPadding = Math.floor((width - (length || text.length)) / 2);
	const rightPadding = width - leftPadding - (length || text.length);
	// Build the padded string using the calculated padding values
	const paddedString = ' '.repeat(leftPadding > 0 ? leftPadding : 0) + text + ' '.repeat(rightPadding > 0 ? rightPadding : 0);
	// Print the padded string to the terminal
	console.log(paddedString);
}

// logo
const titles = [
	[
		"╔══════════════════════════════════════╗",
		"║   A L I Y A   O F F I C I A L   V 4   ║",
		"║      G O A T B O T   V 4  E N G I N E      ║",
		"╚══════════════════════════════════════╝"
	],
	[
		"ALIYA OFFICIAL V4",
		"GOATBOT V4"
	],
	[
		"G O A T B O T  V 4 @" + currentVersion
	],
	[
		"GOATBOT V4"
	]
];
const maxWidth = process.stdout.columns;
const title = maxWidth > 58 ?
	titles[0] :
	maxWidth > 36 ?
		titles[1] :
		maxWidth > 26 ?
			titles[2] :
			titles[3];

console.log(gradient("#f5af19", "#f12711")(createLine(null, true)));
console.log();
for (const text of title) {
	const textColor = gradient("#FA8BFF", "#2BD2FF", "#2BFF88")(text);
	centerText(textColor, text.length);
}
let subTitle = `GoatBot V4@${currentVersion} - Aliya Official Messenger Bot`;
const subTitleArray = [];
if (subTitle.length > maxWidth) {
	while (subTitle.length > maxWidth) {
		let lastSpace = subTitle.slice(0, maxWidth).lastIndexOf(' ');
		lastSpace = lastSpace == -1 ? maxWidth : lastSpace;
		subTitleArray.push(subTitle.slice(0, lastSpace).trim());
		subTitle = subTitle.slice(lastSpace).trim();
	}
	subTitle ? subTitleArray.push(subTitle) : '';
}
else {
	subTitleArray.push(subTitle);
}
const author = ("Made by 0xMr_King x ┃ Tanin Islam");
const srcUrl = ("Powered by Aliya.js V4");
const fakeRelease = ("ALL VERSIONS NOT RELEASED HERE ARE FAKE");
for (const t of subTitleArray) {
	const textColor2 = gradient("#9F98E8", "#AFF6CF")(t);
	centerText(textColor2, t.length);
}
centerText(gradient("#9F98E8", "#AFF6CF")(author), author.length);
centerText(gradient("#9F98E8", "#AFF6CF")(srcUrl), srcUrl.length);
centerText(gradient("#f5af19", "#f12711")(fakeRelease), fakeRelease.length);

let widthConsole = process.stdout.columns;
if (widthConsole > 50)
	widthConsole = 50;

function createLine(content, isMaxWidth = false) {
	if (!content)
		return Array(isMaxWidth ? process.stdout.columns : widthConsole).fill("─").join("");
	else {
		content = ` ${content.trim()} `;
		const lengthContent = content.length;
		const lengthLine = isMaxWidth ? process.stdout.columns - lengthContent : widthConsole - lengthContent;
		let left = Math.floor(lengthLine / 2);
		if (left < 0 || isNaN(left))
			left = 0;
		const lineOne = Array(left).fill("─").join("");
		return lineOne + content + lineOne;
	}
}

const character = createLine();

const clearLines = (n) => {
	for (let i = 0; i < n; i++) {
		const y = i === 0 ? null : -1;
		process.stdout.moveCursor(0, y);
		process.stdout.clearLine(1);
	}
	process.stdout.cursorTo(0);
	process.stdout.write('');
};

async function input(prompt, isPassword = false) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	if (isPassword)
		rl.input.on("keypress", function () {
			// get the number of characters entered so far:
			const len = rl.line.length;
			// move cursor back to the beginning of the input:
			readline.moveCursor(rl.output, -len, 0);
			// clear everything to the right of the cursor:
			readline.clearLine(rl.output, 1);
			// replace the original input with asterisks:
			for (let i = 0; i < len; i++) {
				rl.output.write("*");
			}
		});

	return new Promise(resolve => rl.question(prompt, ans => {
		rl.close();
		resolve(ans);
	}));
}

qr.readQrCode = async function (filePath) {
	const image = await Canvas.loadImage(filePath);
	const canvas = Canvas.createCanvas(image.width, image.height);
	const ctx = canvas.getContext("2d");
	ctx.drawImage(image, 0, 0);
	const data = ctx.getImageData(0, 0, image.width, image.height);
	let value;
	qr.callback = function (error, result) {
		if (error)
			throw error;
		value = result;
	};
	qr.decode(data);
	return value.result;
};

const { dirAccount } = global.client;
// const { config, configCommands } = global.GoatBot;
const { facebookAccount } = global.GoatBot.config;

function responseUptimeSuccess(req, res) {
	res.type('json').send({
		status: "success",
		uptime: process.uptime(),
		unit: "seconds"
	});
}

function responseUptimeError(req, res) {
	res.status(500).type('json').send({
		status: "error",
		uptime: process.uptime(),
		statusAccountBot: global.statusAccountBot
	});
}

function checkAndTrimString(string) {
	if (typeof string == "string")
		return string.trim();
	return string;
}

function filterKeysAppState(appState) {
	if (!Array.isArray(appState)) return [];
	return appState.filter(item => item && item.key && item.value !== undefined);
}

global.responseUptimeCurrent = responseUptimeSuccess;
global.responseUptimeSuccess = responseUptimeSuccess;
global.responseUptimeError = responseUptimeError;

global.statusAccountBot = 'good';
let changeFbStateByCode = false;
let latestChangeContentAccount = fs.statSync(dirAccount).mtimeMs;
let lastWrittenStateRaw = "";
let selfWriteUntil = 0;
let dashBoardIsRunning = false;
let accountReloginTimer = null;

// Compare the actual cookies, not just mtime. Git deploys / editors can touch
// account.txt without changing the session; that must never cause a relogin.
function stateCookies(state) {
	const out = new Map();
	const cookies = Array.isArray(state) ? state : (state && state.cookies) || [];
	for (const c of cookies) {
		if (c && c.key != null) out.set(String(c.key), String(c.value == null ? "" : c.value));
	}
	return out;
}

function sameAppState(a, b) {
	try {
		const pa = typeof a === "string" ? JSON.parse(a || "[]") : a;
		const pb = typeof b === "string" ? JSON.parse(b || "[]") : b;
		const ca = stateCookies(pa);
		const cb = stateCookies(pb);
		if (ca.size !== cb.size) return false;
		for (const [k, v] of ca) if (cb.get(k) !== v) return false;
		return true;
	}
	catch (_) {
		return false;
	}
}

// Every write the bot itself makes to account.txt goes through here. We keep
// the exact raw content so the file watcher can recognise self-writes even if
// mtime was changed later by a deploy/sync.
function writeOwnAppState(state, why) {
	const clean = filterKeysAppState(state);
	if (!clean.length) return false;
	const raw = JSON.stringify(clean, null, 2);
	changeFbStateByCode = true;
	selfWriteUntil = Date.now() + 5000;
	try {
		writeFileSync(dirAccount, raw);
		lastWrittenStateRaw = raw;
		stateBackup.save(clean);
		latestChangeContentAccount = fs.statSync(dirAccount).mtimeMs;
		return true;
	}
	finally {
		setTimeout(() => { changeFbStateByCode = false; }, 5000);
	}
}

function scheduleAccountRelogin(reason) {
	if (accountReloginTimer || global.__aliyaReloginBusy) return;
	global.__aliyaReloginBusy = true;
	// A pasted state must REPLACE the process, not add a second login inside
	// it. Two live MQTT sessions with the same cookies are the fastest way to
	// get the account checkpointed or suspended. Code 7 asks the supervisor
	// for one clean restart that reads the new account.txt from scratch.
	global.__aliyaOutsideStatePending = true;
	accountReloginTimer = setTimeout(async () => {
		accountReloginTimer = null;
		log.info("LOGIN FACEBOOK", `${reason}. Restarting the bot with the new account.txt state.`);
		try {
			await Promise.race([
				stopListening(),
				new Promise(resolve => setTimeout(resolve, 2000))
			]);
		}
		catch (_e) { /* the listener is best-effort; the process exit is not */ }
		process.exit(7);
	}, 1500);
}


async function getAppStateFromEmail(spin = { _start: () => { }, _stop: () => { } }, facebookAccount) {
	const { email, password, userAgent, proxy } = facebookAccount;
	const getFbstate = require(process.env.NODE_ENV === 'development' ? "./getFbstate1.dev.js" : "./getFbstate1.js");
	let code2FATemp;
	let appState;
	try {
		try {
			appState = await getFbstate(checkAndTrimString(email), checkAndTrimString(password), userAgent, proxy);
			spin._stop();
		}
		catch (err) {
			if (err.continue) {
				let tryNumber = 0;
				let isExit = false;

				await (async function submitCode(message) {
					if (message && isExit) {
						spin._stop();
						log.error("LOGIN FACEBOOK", message);
						process.exit();
					}

					if (message) {
						spin._stop();
						log.warn("LOGIN FACEBOOK", message);
					}

					if (facebookAccount["2FASecret"] && tryNumber == 0) {
						switch (['.png', '.jpg', '.jpeg'].some(i => facebookAccount["2FASecret"].endsWith(i))) {
							case true:
								code2FATemp = (await qr.readQrCode(`${process.cwd()}/${facebookAccount["2FASecret"]}`)).replace(/.*secret=(.*)&digits.*/g, '$1');
								break;
							case false:
								code2FATemp = facebookAccount["2FASecret"];
								break;
						}
					}
					else {
						spin._stop();
						code2FATemp = await input("> Enter 2FA code or secret: ");
						readline.moveCursor(process.stderr, 0, -1);
						readline.clearScreenDown(process.stderr);
					}

					const code2FA = isNaN(code2FATemp) ?
						toptp(
							code2FATemp.normalize("NFD")
								.toLowerCase()
								.replace(/[\u0300-\u036f]/g, "")
								.replace(/[đ|Đ]/g, (x) => x == "đ" ? "d" : "D")
								.replace(/\(|\)|\,/g, "")
								.replace(/ /g, "")
						) :
						code2FATemp;
					spin._start();
					try {
						appState = JSON.parse(JSON.stringify(await err.continue(code2FA)));
						appState = appState.map(item => ({
							key: item.key,
							value: item.value,
							domain: item.domain,
							path: item.path,
							hostOnly: item.hostOnly,
							creation: item.creation,
							lastAccessed: item.lastAccessed
						})).filter(item => item.key);
						spin._stop();
					}
					catch (err) {
						tryNumber++;
						if (!err.continue)
							isExit = true;
						await submitCode(err.message);
					}
				})(err.message);
			}
			else
				throw err;
		}
	}
	catch (err) {
		const loginMbasic = require(process.env.NODE_ENV === 'development' ? "./loginMbasic.dev.js" : "./loginMbasic.js");
		if (facebookAccount["2FASecret"]) {
			switch (['.png', '.jpg', '.jpeg'].some(i => facebookAccount["2FASecret"].endsWith(i))) {
				case true:
					code2FATemp = (await qr.readQrCode(`${process.cwd()}/${facebookAccount["2FASecret"]}`)).replace(/.*secret=(.*)&digits.*/g, '$1');
					break;
				case false:
					code2FATemp = facebookAccount["2FASecret"];
					break;
			}
		}

		appState = await loginMbasic({
			email,
			pass: password,
			twoFactorSecretOrCode: code2FATemp,
			userAgent,
			proxy
		});

		appState = appState.map(item => {
			item.key = item.name;
			delete item.name;
			return item;
		});
		appState = filterKeysAppState(appState);
	}

	global.GoatBot.config.facebookAccount['2FASecret'] = code2FATemp || "";
	writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
	return appState;
}

function isNetScapeCookie(cookie) {
	if (typeof cookie !== 'string')
		return false;
	return /(.+)\t(1|TRUE|true)\t([\w\/.-]*)\t(1|TRUE|true)\t\d+\t([\w-]+)\t(.+)/i.test(cookie);
	// match
}

function netScapeToCookies(cookieData) {
	const cookies = [];
	const lines = cookieData.split('\n');
	lines.forEach((line) => {
		if (line.trim().startsWith('#')) {
			return;
		}
		const fields = line.split('\t').map((field) => field.trim()).filter((field) => field.length > 0);
		if (fields.length < 7) {
			return;
		}
		const cookie = {
			key: fields[5],
			value: fields[6],
			domain: fields[0],
			path: fields[2],
			hostOnly: fields[1] === 'TRUE',
			creation: new Date(fields[4] * 1000).toISOString(),
			lastAccessed: new Date().toISOString()
		};
		cookies.push(cookie);
	});
	return cookies;
}

function pushI_user(appState, value) {
	appState.push({
		key: "i_user",
		value: value || facebookAccount.i_user,
		domain: "facebook.com",
		path: "/",
		hostOnly: false,
		creation: new Date().toISOString(),
		lastAccessed: new Date().toISOString()
	});
	return appState;
}

let spin;
async function getAppStateToLogin(loginWithEmail) {
	let appState = [];
	if (loginWithEmail)
		return await getAppStateFromEmail(undefined, facebookAccount);
	if (!existsSync(dirAccount))
		return log.error("LOGIN FACEBOOK", getText('login', 'notFoundDirAccount', colors.green(dirAccount)));
	const accountText = readFileSync(dirAccount, "utf8");

	try {
		const splitAccountText = accountText.replace(/\|/g, '\n').split('\n').map(i => i.trim()).filter(i => i);
		// is token full permission
		if (accountText.startsWith('EAAAA')) {
			try {
				spin = createOraDots(getText('login', 'loginToken'));
				spin._start();
				appState = await require('./getFbstate.js')(accountText);
			}
			catch (err) {
				err.name = "TOKEN_ERROR";
				throw err;
			}
		}
		// is cookie string
		else {
			if (accountText.match(/^(?:\s*\w+\s*=\s*[^;]*;?)+/)) {
				spin = createOraDots(getText('login', 'loginCookieString'));
				spin._start();
				appState = accountText.split(';')
					.map(i => {
						const [key, value] = i.split('=');
						return {
							key: (key || "").trim(),
							value: (value || "").trim(),
							domain: "facebook.com",
							path: "/",
							hostOnly: true,
							creation: new Date().toISOString(),
							lastAccessed: new Date().toISOString()
						};
					})
					.filter(i => i.key && i.value && i.key != "x-referer");
			}
			// is netscape cookie
			else if (isNetScapeCookie(accountText)) {
				spin = createOraDots(getText('login', 'loginCookieNetscape'));
				spin._start();
				appState = netScapeToCookies(accountText);
			}
			else if (
				(splitAccountText.length == 2 || splitAccountText.length == 3) &&
				!splitAccountText.slice(0, 2).map(i => i.trim()).some(i => i.includes(' '))
			) {
				// bug if account.txt is "[]"
				global.GoatBot.config.facebookAccount.email = splitAccountText[0]; // bug here=> email is "["
				global.GoatBot.config.facebookAccount.password = splitAccountText[1]; // bug here=> password is "]"
				if (splitAccountText[2]) {
					const code2FATemp = splitAccountText[2].replace(/ /g, "");
					global.GoatBot.config.facebookAccount['2FASecret'] = code2FATemp;
				}
				writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			}
			// is json (cookies or appstate)
			else {
				try {
					spin = createOraDots(getText('login', 'loginCookieArray'));
					spin._start();
					appState = JSON.parse(accountText);
				}
				catch (err) {
					const error = new Error(`${path.basename(dirAccount)} is invalid`);
					error.name = "ACCOUNT_ERROR";
					throw error;
				}
				if (appState.some(i => i.name))
					appState = appState.map(i => {
						i.key = i.name;
						delete i.name;
						return i;
					});
				else if (!appState.some(i => i.key)) {
					const error = new Error(`${path.basename(dirAccount)} is invalid`);
					error.name = "ACCOUNT_ERROR";
					throw error;
				}
				appState = appState
					.map(item => ({
						...item,
						domain: "facebook.com",
						path: "/",
						hostOnly: false,
						creation: new Date().toISOString(),
						lastAccessed: new Date().toISOString()
					}))
					.filter(i => i.key && i.value && i.key != "x-referer");
			}
			/*if (!await checkLiveCookie(appState.map(i => i.key + "=" + i.value).join("; "), facebookAccount.userAgent)) {
				const error = new Error("Cookie is invalid");
				error.name = "COOKIE_INVALID";
				throw error;
			}*/
		}
	}
	catch (err) {
		spin && spin._stop();
		let {
			email,
			password
		} = facebookAccount;
		if (err.name === "TOKEN_ERROR")
			log.err("LOGIN FACEBOOK", getText('login', 'tokenError', colors.green("EAAAA..."), colors.green(dirAccount)));
		else if (err.name === "COOKIE_INVALID")
			log.err("LOGIN FACEBOOK", getText('login', 'cookieError'));

		if (!email || !password) {
			log.warn("LOGIN FACEBOOK", getText('login', 'cannotFindAccount'));
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout
			});
			const options = [
				getText('login', 'chooseAccount'),
				getText('login', 'chooseToken'),
				getText('login', 'chooseCookieString'),
				getText('login', 'chooseCookieArray')
			];
			let currentOption = 0;
			await new Promise((resolve) => {
				const character = '>';
				function showOptions() {
					rl.output.write(`\r${options.map((option, index) => index === currentOption ? colors.blueBright(`${character} (${index + 1}) ${option}`) : `  (${index + 1}) ${option}`).join('\n')}\u001B`);
					rl.write('\u001B[?25l'); // hides cursor
				}
				rl.input.on('keypress', (_, key) => {
					if (key.name === 'up') {
						currentOption = (currentOption - 1 + options.length) % options.length;
					}
					else if (key.name === 'down') {
						currentOption = (currentOption + 1) % options.length;
					}
					else if (!isNaN(key.name)) {
						const number = parseInt(key.name);
						if (number >= 0 && number <= options.length)
							currentOption = number - 1;
						process.stdout.write('\033[1D'); // delete the character
					}
					else if (key.name === 'enter' || key.name === 'return') {
						rl.input.removeAllListeners('keypress');
						rl.close();
						clearLines(options.length + 1);
						showOptions();
						resolve();
					}
					else {
						process.stdout.write('\033[1D'); // delete the character
					}

					clearLines(options.length);
					showOptions();
				});
				showOptions();
			});

			rl.write('\u001B[?25h\n'); // show cursor 
			clearLines(options.length + 1);
			log.info("LOGIN FACEBOOK", getText('login', 'loginWith', options[currentOption]));

			if (currentOption == 0) {
				email = await input(`${getText('login', 'inputEmail')} `);
				password = await input(`${getText('login', 'inputPassword')} `, true);
				const twoFactorAuth = await input(`${getText('login', 'input2FA')} `);
				facebookAccount.email = email || '';
				facebookAccount.password = password || '';
				facebookAccount['2FASecret'] = twoFactorAuth || '';
				writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			}
			else if (currentOption == 1) {
				const token = await input(getText('login', 'inputToken') + " ");
				writeFileSync(global.client.dirAccount, token);
			}
			else if (currentOption == 2) {
				const cookie = await input(getText('login', 'inputCookieString') + " ");
				writeFileSync(global.client.dirAccount, cookie);
			}
			else {
				const cookie = await input(getText('login', 'inputCookieArray') + " ");
				writeFileSync(global.client.dirAccount, JSON.stringify(JSON.parse(cookie), null, 2));
			}
			return await getAppStateToLogin();
		}

		log.info("LOGIN FACEBOOK", getText('login', 'loginPassword'));
		log.info("ACCOUNT INFO", `Email: ${facebookAccount.email}, I_User: ${facebookAccount.i_user || "(empty)"}`);
		spin = createOraDots(getText('login', 'loginPassword'));
		spin._start();

		try {
			appState = await getAppStateFromEmail(spin, facebookAccount);
			spin._stop();
		}
		catch (err) {
			spin._stop();
			log.err("LOGIN FACEBOOK", getText('login', 'loginError'), err.message, err);
			process.exit();
		}
	}
	return appState;
}

function stopListening(keyListen) {
	keyListen = keyListen || Object.keys(callbackListenTime).pop();
	return new Promise((resolve) => {
		global.GoatBot.fcaApi.stopListening?.(() => {
			if (callbackListenTime[keyListen]) {
				// callbackListenTime[keyListen || Object.keys(callbackListenTime).pop()]("Connection closed by user.");
				callbackListenTime[keyListen] = () => { };
			}
			resolve();
		}) || resolve();
	});
}

// function removeListener(keyListen) {
// 	keyListen = keyListen || Object.keys(callbackListenTime).pop();
// 	if (callbackListenTime[keyListen])
// 		callbackListenTime[keyListen] = () => { };
// }

async function startBot(loginWithEmail) {
	// Never build a second login on top of a live one. A duplicate session is
	// what turns a fresh account into a checkpoint/suspension on the spot.
	if (global.__aliyaStartBusy) {
		log.warn("LOGIN FACEBOOK", "Login already in progress; ignoring a duplicate start.");
		return;
	}
	global.__aliyaStartBusy = true;
	// A new login owns the listener now. Drop any retry from the old session so
	// it cannot open a second socket with stale cookies.
	if (global.__aliyaListenerRetryTimer) {
		clearTimeout(global.__aliyaListenerRetryTimer);
		global.__aliyaListenerRetryTimer = null;
	}
	if (global.__aliyaReadyResetTimer) {
		clearTimeout(global.__aliyaReadyResetTimer);
		global.__aliyaReadyResetTimer = null;
	}
	console.log(colors.hex("#f5ab00")(createLine("START LOGGING IN", true)));
	const currentVersion = require("../../package.json").version;
	const tooOldVersion = (await axios.get("https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2-Storage/main/tooOldVersions.txt")).data || "0.0.0";
	// nếu version cũ hơn
	if ([-1, 0].includes(compareVersion(currentVersion, tooOldVersion))) {
		log.err("VERSION", getText('version', 'tooOldVersion', colors.yellowBright('node update')));
		process.exit();
	}
	/* { CHECK ORIGIN CODE } */

	if (global.GoatBot.Listening)
		await stopListening();

	log.info("LOGIN FACEBOOK", getText('login', 'currentlyLogged'));

	let appState = await getAppStateToLogin(loginWithEmail);
	appState = filterKeysAppState(appState);
	// Do NOT write account.txt on startup or exit: rewriting the pasted state
	// can rotate xs. The single-account state is kept exactly as provided.
	// ——————————————————— LOGIN ———————————————————— //
	(function loginBot(appState) {
		global.GoatBot.commands = new Map();
		global.GoatBot.eventCommands = new Map();
		global.GoatBot.aliases = new Map();
		global.GoatBot.onChat = [];
		global.GoatBot.onEvent = [];
		global.GoatBot.onReply = new Map();
		global.GoatBot.onReaction = new Map();
		clearInterval(global.intervalRestartListenMqtt);
		delete global.intervalRestartListenMqtt;

		if (facebookAccount.i_user)
			pushI_user(appState, facebookAccount.i_user);

		let isSendNotiErrorMessage = false;

		// Use ONE user agent for the whole session. Fresh appState cookies come
		// from the browser configured in facebookAccount.userAgent (mobile in
		// our setup). Mixing that session with the fca default desktop UA is a
		// common reason Facebook checkpoints a new ID immediately. Keep the
		// override in memory only so config.json is never rewritten.
		const fcaOptions = { ...global.GoatBot.config.optionsFca };
		if (!fcaOptions.userAgent && facebookAccount.userAgent)
			fcaOptions.userAgent = facebookAccount.userAgent;
		login({ appState }, fcaOptions, async function (error, api) {
			if (!isNaN(facebookAccount.intervalGetNewCookie) && facebookAccount.intervalGetNewCookie > 0)
				if (facebookAccount.email && facebookAccount.password) {
					spin?._stop();
					log.info("REFRESH COOKIE", getText('login', 'refreshCookieAfter', convertTime(facebookAccount.intervalGetNewCookie * 60 * 1000, true)));
					setTimeout(async function refreshCookie() {
						try {
							log.info("REFRESH COOKIE", getText('login', 'refreshCookie'));
							const appState = await getAppStateFromEmail(undefined, facebookAccount);
							if (facebookAccount.i_user)
								pushI_user(appState, facebookAccount.i_user);
							writeOwnAppState(appState, "cookie refresh");
							log.info("REFRESH COOKIE", getText('login', 'refreshCookieSuccess'));
							global.__aliyaStartBusy = false;
							return startBot(appState);
						}
						catch (err) {
							log.err("REFRESH COOKIE", getText('login', 'refreshCookieError'), err.message, err);
							setTimeout(refreshCookie, facebookAccount.intervalGetNewCookie * 60 * 1000);
						}
					}, facebookAccount.intervalGetNewCookie * 60 * 1000);
				}
				else {
					spin?._stop();
					log.warn("REFRESH COOKIE", getText('login', 'refreshCookieWarning'));
				}
			spin ? spin._stop() : null;

			// Handle error
			if (error) {
				log.err("LOGIN FACEBOOK", getText('login', 'loginError'), error);
				global.statusAccountBot = 'can\'t login';
				// Only a real checkpoint/suspension is allowed to switch accounts.
				if (isSuspendedSession(error)) {
					log.err("LOGIN FACEBOOK", "Facebook account is checkpointed or suspended. Stopping the bot process.");
					return process.exit(3);
				}
				if (facebookAccount.email && facebookAccount.password) {
					global.__aliyaStartBusy = false;
					return startBot(true);
				}
				// A rejected cookie session must never leave a half-started
				// process that looks "online" but cannot reply to anything.
				// Try the last-known-good state exactly once, otherwise hand a
				// clean exit to the supervisor (it backs off and waits for a
				// freshly pasted state instead of spinning).
				if (!global.__aliyaLoginRecoveryTried) {
					global.__aliyaLoginRecoveryTried = true;
					try {
						const backup = require("./stateBackup");
						const currentRaw = fs.readFileSync(dirAccount, "utf8");
						const backupRaw = fs.existsSync(backup.BACKUP) ? fs.readFileSync(backup.BACKUP, "utf8") : "";
						// Only restore the backup when it belongs to the SAME
						// Facebook account. Restoring another account's cookies
						// would silently rotate accounts, which is forbidden.
						const userId = raw => {
							try {
								const hit = JSON.parse(raw).find(x => x && x.key === "c_user");
								return hit ? String(hit.value) : "";
							}
							catch (_) { return ""; }
						};
						const sameAccount = userId(currentRaw) && userId(currentRaw) === userId(backupRaw);
						if (backupRaw && backupRaw !== currentRaw && backup.isValidState(backupRaw) && sameAccount) {
							writeFileSync(dirAccount, backupRaw);
							latestChangeContentAccount = fs.statSync(dirAccount).mtimeMs;
							log.warn("LOGIN FACEBOOK", "Restored last-known-good FB state. Restarting.");
							return process.exit(2);
						}
					}
					catch (_e) { /* recovery is best effort */ }
				}
				log.err("LOGIN FACEBOOK", "Saved FB state is rejected by Facebook. Waiting for a fresh state.");
				return process.exit(3);
			}

			global.GoatBot.fcaApi = api;
			global.__aliyaStartBusy = false;
			// Every outgoing message (text/image/video/audio/file) keeps the typing
			// indicator on until Facebook confirms delivery.
			require("../handler/typingSend.js").wrap(api);
			// fb-chat-api calls ws3.relogin() on ANY MQTT socket error. A full
			// Facebook login there is destructive: it reuses the same cookies,
			// Facebook rejects them ("deleted c_user/xs"), and the bot ends up
			// half-started and silent. Transient drops are handled by the
			// listener retry below, so keep this a deliberate no-op.
			api.ws3 = Object.assign({}, api.ws3 || {}, {
				relogin: () => {
					log.warn("MQTT", "Facebook requested a full relogin; ignored to protect the saved session.");
				}
			});
			global.GoatBot.botID = api.getCurrentUserID();
			log.info("LOGIN FACEBOOK", getText('login', 'loginSuccess'));
			let hasBanned = false;
			global.botID = api.getCurrentUserID();
			logColor("#f5ab00", createLine("BOT INFO"));
			log.info("NODE VERSION", process.version);
			log.info("PROJECT VERSION", currentVersion);
			log.info("BOT ID", `${global.botID} - ${await getName(global.botID)}`);
			log.info("PREFIX", global.GoatBot.config.prefix);
			log.info("LANGUAGE", global.GoatBot.config.language);
			log.info("BOT NICK NAME", global.GoatBot.config.nickNameBot || "GOAT BOT");
			// ———————————————————— GBAN ————————————————————— //
			let dataGban;

			try {
				// convert to promise
				const item = await axios.get("https://raw.githubusercontent.com/Savage-Army/gban/refs/heads/main/gban.json");
				dataGban = item.data;

				// ————————————————— CHECK BOT ————————————————— //
				const botID = api.getCurrentUserID();
				if (dataGban.hasOwnProperty(botID)) {
					if (!dataGban[botID].toDate) {
						log.err('GBAN', getText('login', 'gbanMessage', dataGban[botID].date, dataGban[botID].reason, dataGban[botID].date));
						hasBanned = true;
					}
					else {
						const currentDate = (new Date((await axios.get("http://worldtimeapi.org/api/timezone/UTC")).data.utc_datetime)).getTime();
						if (currentDate < (new Date(dataGban[botID].date)).getTime()) {
							log.err('GBAN', getText('login', 'gbanMessage', dataGban[botID].date, dataGban[botID].reason, dataGban[botID].date, dataGban[botID].toDate));
							hasBanned = true;
						}
					}
				}
				// ———————————————— CHECK ADMIN ———————————————— //
				for (const idad of global.GoatBot.config.adminBot) {
					if (dataGban.hasOwnProperty(idad)) {
						if (!dataGban[idad].toDate) {
							log.err('GBAN', getText('login', 'gbanMessage', dataGban[idad].date, dataGban[idad].reason, dataGban[idad].date));
							hasBanned = true;
						}
						else {
							const currentDate = (new Date((await axios.get("http://worldtimeapi.org/api/timezone/UTC")).data.utc_datetime)).getTime();
							if (currentDate < (new Date(dataGban[idad].date)).getTime()) {
								log.err('GBAN', getText('login', 'gbanMessage', dataGban[idad].date, dataGban[idad].reason, dataGban[idad].date, dataGban[idad].toDate));
								hasBanned = true;
							}
						}
					}
				}
				if (hasBanned == true)
					process.exit();
			}
			catch (e) {
				console.log(e);
				log.err('GBAN', getText('login', 'checkGbanError'));
				process.exit();
			}
			// ———————————————— NOTIFICATIONS ———————————————— //
			let notification;
			try {
				const getNoti = await axios.get("https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2-Gban/master/notification.txt");
				notification = getNoti.data;
			}
			catch (err) {
				log.err("ERROR", "Can't get notifications data");
				process.exit();
			}
			// No account.txt writes by the bot itself. The pasted single-account
			// state is kept exactly as provided, including across restarts.
			if (global.intervalRefreshFbstate) clearInterval(global.intervalRefreshFbstate);
			if (global.GoatBot.config.autoRefreshFbstate == true) {
				log.info("REFRESH FBSTATE", "Periodic writes disabled; state is kept as pasted.");
			}
			if (hasBanned == true) {
				log.err('GBAN', getText('login', 'youAreBanned'));
				process.exit();
			}
			// ——————————————————— LOAD DATA ——————————————————— //
			const { threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, sequelize } = await require(process.env.NODE_ENV === 'development' ? "./loadData.dev.js" : "./loadData.js")(api, createLine);
			// ————————————————— CUSTOM SCRIPTS ————————————————— //
			await require("../custom.js")({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getText });
			// —————————————————— LOAD SCRIPTS —————————————————— //
			await require(process.env.NODE_ENV === 'development' ? "./loadScripts.dev.js" : "./loadScripts.js")(api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, createLine);
			// ———————————— CHECK AUTO LOAD SCRIPTS ———————————— //
			if (global.GoatBot.config.autoLoadScripts?.enable == true) {
				const ignoreCmds = global.GoatBot.config.autoLoadScripts.ignoreCmds?.replace(/[ ,]+/g, ' ').trim().split(' ') || [];
				const ignoreEvents = global.GoatBot.config.autoLoadScripts.ignoreEvents?.replace(/[ ,]+/g, ' ').trim().split(' ') || [];

				watch(`${process.cwd()}/scripts/cmds`, async (event, filename) => {
					if (filename.endsWith('.js')) {
						if (ignoreCmds.includes(filename) || filename.endsWith('.eg.js'))
							return;
						if ((event == 'change' || event == 'rename') && existsSync(`${process.cwd()}/scripts/cmds/${filename}`)) {
							try {
								const contentCommand = global.temp.contentScripts.cmds[filename] || "";
								const currentContent = readFileSync(`${process.cwd()}/scripts/cmds/${filename}`, 'utf-8');
								if (contentCommand == currentContent)
									return;
								global.temp.contentScripts.cmds[filename] = currentContent;
								filename = filename.replace('.js', '');

								const infoLoad = global.utils.loadScripts("cmds", filename, log, global.GoatBot.configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData);
								if (infoLoad.status == "success")
									log.master("AUTO LOAD SCRIPTS", `Command ${filename}.js (${infoLoad.command.config.name}) has been reloaded`);
								else
									log.err("AUTO LOAD SCRIPTS", `Error when reload command ${filename}.js`, infoLoad.error);
							}
							catch (err) {
								log.err("AUTO LOAD SCRIPTS", `Error when reload command ${filename}.js`, err);
							}
						}
					}
				});

				watch(`${process.cwd()}/scripts/events`, async (event, filename) => {
					if (filename.endsWith('.js')) {
						if (ignoreEvents.includes(filename) || filename.endsWith('.eg.js'))
							return;
						if ((event == 'change' || event == 'rename') && existsSync(`${process.cwd()}/scripts/events/${filename}`)) {
							try {
								const contentEvent = global.temp.contentScripts.events[filename] || "";
								const currentContent = readFileSync(`${process.cwd()}/scripts/events/${filename}`, 'utf-8');
								if (contentEvent == currentContent)
									return;
								global.temp.contentScripts.events[filename] = currentContent;
								filename = filename.replace('.js', '');

								const infoLoad = global.utils.loadScripts("events", filename, log, global.GoatBot.configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData);
								if (infoLoad.status == "success")
									log.master("AUTO LOAD SCRIPTS", `Event ${filename}.js (${infoLoad.command.config.name}) has been reloaded`);
								else
									log.err("AUTO LOAD SCRIPTS", `Error when reload event ${filename}.js`, infoLoad.error);
							}
							catch (err) {
								log.err("AUTO LOAD SCRIPTS", `Error when reload event ${filename}.js`, err);
							}
						}
					}
				});
			}
			// ——————————————————— DASHBOARD ——————————————————— //
			if (global.GoatBot.config.dashBoard?.enable == true && dashBoardIsRunning == false) {
				logColor('#f5ab00', createLine('DASHBOARD'));
				try {
					await require("../../dashboard/app.js")(api);
					log.info("DASHBOARD", getText('login', 'openDashboardSuccess'));
					dashBoardIsRunning = true;
				}
				catch (err) {
					log.err("DASHBOARD", getText('login', 'openDashboardError'), err);
				}
			}
			// ———————————————————— ADMIN BOT ———————————————————— //
			logColor('#f5ab00', character);
			let i = 0;
			const adminBot = global.GoatBot.config.adminBot
				.filter(item => !isNaN(item))
				.map(item => item = item.toString());
			for (const uid of adminBot) {
				try {
					const userName = await usersData.getName(uid);
					log.master("ADMINBOT", `[${++i}] ${uid} | ${userName}`);
				}
				catch (e) {
					log.master("ADMINBOT", `[${++i}] ${uid}`);
				}
			}
			log.master("NOTIFICATION", (notification || "").trim());
			log.master("SUCCESS", getText('login', 'runBot'));
			log.master("LOAD TIME", `${convertTime(Date.now() - global.GoatBot.startTime)}`);
			logColor("#f5ab00", createLine("COPYRIGHT"));
			// —————————————————— COPYRIGHT INFO —————————————————— //
			console.log(`\x1b[1m\x1b[33m${("COPYRIGHT:")}\x1b[0m\x1b[1m\x1b[37m \x1b[0m\x1b[1m\x1b[36m${("ALIYA OFFICIAL V4 | Made by 0xMr_King x ┃ Tanin Islam")}\x1b[0m`);
			logColor("#f5ab00", character);
			global.GoatBot.config.adminBot = adminBot;
			// Hard-lock the session-protection flags. Even if a runtime setting
			// command or an old config tried to turn them on, config.json on
			// disk can never re-enable hourly restarts or periodic state writes.
			{
				const cfg = global.GoatBot.config;
				if (cfg.restartListenMqtt) cfg.restartListenMqtt.enable = false;
				cfg.autoRefreshFbstate = false;
				cfg.fbstateRefreshMs = 0;
				if (cfg.database) cfg.database.autoSyncWhenStart = false;
				if (cfg.optionsFca) cfg.optionsFca.autoReconnect = false;
			}
			writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			writeFileSync(global.client.dirConfigCommands, JSON.stringify(global.GoatBot.configCommands, null, 2));

			// Facebook can log the account out while MQTT still looks connected.
			// Ask Facebook for the bot's own profile every 5 minutes through the
			// same session the bot uses. Two consecutive failures stop the child
			// process, so /health reports offline instead of showing a "live"
			// bot that can neither receive nor send anything.
			let sessionCheckBusy = false;
			let sessionMisses = 0;
			let sessionRecheckTimer = null;
			async function checkSessionLive(stopWatchdog) {
				if (sessionCheckBusy) return;
				sessionCheckBusy = true;
				let dead = false;
				let detail = "";
				try {
					const botID = api.getCurrentUserID && api.getCurrentUserID();
					const info = botID && await api.getUserInfo(botID);
					if (!info || !info[botID] || !info[botID].name) {
						dead = true;
						detail = "empty profile response";
					}
				}
				catch (err) {
					dead = true;
					detail = String((err && (err.message || err.error)) || err || "").slice(0, 160);
				}
				finally { sessionCheckBusy = false; }

				if (!dead) {
					sessionMisses = 0;
					if (sessionRecheckTimer) { clearTimeout(sessionRecheckTimer); sessionRecheckTimer = null; }
					return;
				}
				sessionMisses++;
				log.warn("SESSION", `Session check failed (${sessionMisses}/2): ${detail}`);
				if (sessionMisses < 2) {
					if (sessionRecheckTimer) clearTimeout(sessionRecheckTimer);
					sessionRecheckTimer = setTimeout(() => checkSessionLive(true), 60 * 1000);
					if (sessionRecheckTimer.unref) sessionRecheckTimer.unref();
					return;
				}
				if (stopWatchdog) clearInterval(sessionWatchdog);
				log.err("SESSION", "Facebook session is logged out/invalidated. Stopping the bot process.");
				process.exit(3);
			}
			const sessionWatchdog = setInterval(() => checkSessionLive(false), 5 * 60 * 1000);
			if (sessionWatchdog.unref) sessionWatchdog.unref();

			// ——————————————————————————————————————————————————— //
			const { restartListenMqtt } = global.GoatBot.config;
			let intervalCheckLiveCookieAndRelogin = false;
			// —————— REAL READY CHECK (READY is sent only after Facebook MQTT really answers) —————— //
			// A quiet MQTT stream is normal. The old 5-minute watchdog exited the
			// process whenever no callback arrived, which killed healthy bots.
			// Only a real checkpoint/suspension may switch accounts (handled below).
			let mqttReadyOnce = false;
			let listenerRetryAttempt = 0;
			function cancelListenerRetry() {
				if (global.__aliyaListenerRetryTimer) {
					clearTimeout(global.__aliyaListenerRetryTimer);
					global.__aliyaListenerRetryTimer = null;
				}
			}
			// Reconnect with backoff. Hammering the MQTT endpoint every 15s keeps
			// Facebook's rate limiter hot and the bot never recovers.
			function scheduleListenerRetry(reason, hard = false) {
				if (global.__aliyaListenerRetryTimer) return;
				// A CONNACK "Server unavailable" / "Connection refused" is
				// Facebook refusing the session. Retrying it every few seconds
				// turns a temporary refusal into a real account block.
				const base = hard ? 120000 : 60000; // 2 min / 1 min
				const cap = hard ? 900000 : 900000; // 15 min max, never hammer
				const delay = Math.min(base * Math.pow(2, listenerRetryAttempt), cap);
				listenerRetryAttempt++;
				log.warn("LISTEN_MQTT", `Listener retry #${listenerRetryAttempt} in ${Math.round(delay / 1000)}s (${reason}).`);
				global.__aliyaListenerRetryTimer = setTimeout(() => {
					global.__aliyaListenerRetryTimer = null;
					try { api.stopListening?.(); } catch (_e) { /* best effort */ }
					try {
						global.GoatBot.Listening = api.listenMqtt(createCallBackListen());
						log.master("LISTEN_MQTT", "Listener restart requested with the existing session");
					}
					catch (err) {
						log.err("LISTEN_MQTT", "Failed to restart listener", err);
						scheduleListenerRetry("restart failed");
					}
				}, delay);
				if (typeof global.__aliyaListenerRetryTimer.unref === "function")
					global.__aliyaListenerRetryTimer.unref();
			}
			function markMqttReady() {
				cancelListenerRetry();
				if (mqttReadyOnce) return;
				mqttReadyOnce = true;
				log.info("MQTT", "Facebook listener is connected. Bot can receive messages.");
				if (process.send) { try { process.send({ type: "READY" }); } catch (e) { /* no supervisor */ } }
			}
			// Only REAL traffic (not a bare "ready" event) may clear the backoff.
			// A connect-then-drop loop used to reset the timer and hammer Facebook.
			function markMqttTraffic() {
				if (global.__aliyaReadyResetTimer) clearTimeout(global.__aliyaReadyResetTimer);
				global.__aliyaReadyResetTimer = setTimeout(() => {
					global.__aliyaReadyResetTimer = null;
					listenerRetryAttempt = 0;
				}, 60000);
				if (typeof global.__aliyaReadyResetTimer.unref === "function")
					global.__aliyaReadyResetTimer.unref();
			}
			function markMqttDown() {
				// Temporary listener drops must NOT restart or rotate the bot.
				// Facebook reconnects on its own in most cases.
				log.warn("MQTT", "Listener temporarily down; waiting for Facebook to recover.");
			}
			// —————————————————— CALLBACK LISTEN —————————————————— //
			async function callBackListen(error, event) {
				if (error) {
					// A hard Facebook block must stop ALL reconnects immediately.
					// Every extra attempt can extend the restriction.
					if (isFacebookBlocked(error)) {
						log.err("LOGIN FACEBOOK", "Facebook blocked the session. Stopping retries to protect the account.");
						return process.exit(3);
					}
					// Checkpoint/suspension means the session is dead. Stop the
					// process instead of restarting with the same cookies - extra
					// attempts only extend the restriction.
					if (isSuspendedSession(error)) {
						log.err("LOGIN FACEBOOK", "Facebook account is checkpointed or suspended. Stopping the bot process.");
						return process.exit(3);
					}
					global.responseUptimeCurrent = responseUptimeError;
					if (error != "Connection closed." && error != "Connection closed by user.") markMqttDown();
					// Every MQTT/socket failure is a transport problem, not proof
					// that the account is dead. Retry the listener with the SAME
					// cookies; only a real checkpoint/suspension switches accounts.
					const listenErrorText = errorTextOf(error);
					const isTransientListenError =
						error.error == "Not logged in" ||
						error.error == "Not logged in." ||
						error.error == "Connection refused: Server unavailable" ||
						/blocked login|server unavailable|temporar|timeout|timed out|ECONN|ETIMEDOUT|socket hang up| MQTT/i.test(listenErrorText);
					if (isTransientListenError) {
						const authLost = /not logged in/i.test(listenErrorText);
						if (authLost)
							log.err("NOT LOGGEG IN", getText('login', 'notLoggedIn'), error);
						else
							log.warn("MQTT", "Connection dropped; retrying listener with the existing session.");
						global.responseUptimeCurrent = responseUptimeError;
						global.statusAccountBot = authLost ? 'can\'t login' : 'reconnecting';
						if (!isSendNotiErrorMessage && authLost) {
							await handlerWhenListenHasError({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, error });
							isSendNotiErrorMessage = true;
						}

						if (global.GoatBot.config.autoRestartWhenListenMqttError)
							process.exit(2);
						else {
							// Neutralize the old callback so a late socket event from
							// the dead listener cannot start a second retry loop.
							const keyListen = Object.keys(callbackListenTime).pop();
							if (callbackListenTime[keyListen])
								callbackListenTime[keyListen] = () => { };
							const serverRefused = /server unavailable|connection refused/i.test(listenErrorText);
							scheduleListenerRetry(
								serverRefused ? "server-unavailable" : (authLost ? "auth" : "transport"),
								serverRefused
							);
						}
						return;
					}
					else if (error == "Connection closed." || error == "Connection closed by user.") /* by stopListening; */ {
						return;
					}
					else {
						await handlerWhenListenHasError({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, error });
						return log.err("LISTEN_MQTT", getText('login', 'callBackError'), error);
					}
				}
				global.responseUptimeCurrent = responseUptimeSuccess;
				global.statusAccountBot = 'good';
				markMqttReady();
				if (event && event.type == "ready") return;
				markMqttTraffic();
				const configLog = global.GoatBot.config.logEvents;
				if (isSendNotiErrorMessage == true)
					isSendNotiErrorMessage = false;

				// "whiteListMode": {
				// 	"enable": false,
				// 	"whiteListIds": [],
				// 	"notes": "if you enable this feature, only the ids in the whiteListIds list can use the bot"
				// },
				// "whiteListModeThread": {
				// 	"enable": false,
				// 	"whiteListThreadIds": [],
				// 	"notes": "if you enable this feature, only the thread in the whiteListThreadIds list can use the bot",
				// 	"how_it_work": "if you enable both whiteListMode and whiteListModeThread, the system will check if the user is in whiteListIds, then check if the thread is in whiteListThreadIds, if one of the conditions is true, the user can use the bot"
				// },

				// "if you enable both whiteListMode and whiteListModeThread, the system will check if the user is in whiteListIds, then check if the thread is in whiteListThreadIds, if one of the conditions is true, the user can use the bot"
				// const whitelistMode = config.whiteListMode?.enable === true;
				// const whitelistModeThread = config.whiteListModeThread?.enable === true;
				// const isWhitelistedSender = config.whiteListMode?.whiteListIds.includes(event.senderID);
				// const isWhitelistedThread = config.whiteListModeThread?.whiteListThreadIds.includes(event.threadID);

				// if (
				// 	(whitelistMode && whitelistModeThread && !isWhitelistedSender && !isWhitelistedThread) ||
				// 	(whitelistMode && !isWhitelistedSender) ||
				// 	(whitelistModeThread && !isWhitelistedThread)
				// ) {
				// 	return;
				// }

				if (
					global.GoatBot.config.whiteListMode?.enable == true
					&& global.GoatBot.config.whiteListModeThread?.enable == true
					// admin
					&& !global.GoatBot.config.adminBot.includes(event.senderID)
				) {
					if (
						!global.GoatBot.config.whiteListMode.whiteListIds.includes(event.senderID)
						&& !global.GoatBot.config.whiteListModeThread.whiteListThreadIds.includes(event.threadID)
						// admin
						&& !global.GoatBot.config.adminBot.includes(event.senderID)
					)
						return;
				}
				else if (
					global.GoatBot.config.whiteListMode?.enable == true
					&& !global.GoatBot.config.whiteListMode.whiteListIds.includes(event.senderID)
					// admin
					&& !global.GoatBot.config.adminBot.includes(event.senderID)
				)
					return;
				else if (
					global.GoatBot.config.whiteListModeThread?.enable == true
					&& !global.GoatBot.config.whiteListModeThread.whiteListThreadIds.includes(event.threadID)
					// admin
					&& !global.GoatBot.config.adminBot.includes(event.senderID)
				)
					return;

				// check if listenMqtt loop
				// A duplicate messageID means another listener already handled it.
				// Skip it here; otherwise the command runs once and the duplicate
				// only produces the global "wait N seconds" spam-guard reply.
				if (isDuplicateMessage(event)) {
					Object.keys(callbackListenTime).slice(0, -1).forEach(key => {
						callbackListenTime[key] = () => { };
					});
					return;
				}

				if (configLog.disableAll === false && configLog[event.type] !== false) {
					// hide participantIDs (it is array too long)
					const participantIDs_ = [...event.participantIDs || []];
					if (event.participantIDs)
						event.participantIDs = 'Array(' + event.participantIDs.length + ')';

					console.log(colors.green((event.type || "").toUpperCase() + ":"), jsonStringifyColor(event, null, 2));

					if (event.participantIDs)
						event.participantIDs = participantIDs_;
				}

				if ((event.senderID && dataGban[event.senderID] || event.userID && dataGban[event.userID])) {
					if (event.body && event.threadID) {
						const prefix = getPrefix(event.threadID);
						if (event.body.startsWith(prefix))
							return api.sendMessage(getText('login', 'userBanned'), event.threadID);
						return;
					}
					else
						return;
				}

				const handlerAction = require("../handler/handlerAction.js")(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

				if (hasBanned === false)
					handlerAction(event);
				else
					return log.err('GBAN', getText('login', 'youAreBanned'));
			}
			// ————————————————— CREATE CALLBACK ————————————————— //
			function createCallBackListen(key) {
				key = randomString(10) + (key || Date.now());
				callbackListenTime[key] = callBackListen;
				return function (error, event) {
					callbackListenTime[key](error, event);
				};
			}
			// ———————————————————— START BOT ———————————————————— //
			await stopListening();
			try { if (typeof api.setOptions == "function") api.setOptions({ emitReady: true }); } catch (e) { /* ignore */ }
			global.GoatBot.Listening = api.listenMqtt(createCallBackListen());
			global.GoatBot.callBackListen = callBackListen;
			// No startup timer here. A slow/quiet MQTT connect must never kill a
			// healthy bot; the handle-uptime supervisor already watches the process.
			// ——————————————————— UPTIME ——————————————————— //
			if (global.GoatBot.config.serverUptime.enable == true && !global.GoatBot.config.dashBoard?.enable && !global.serverUptimeRunning) {
				const http = require('http');
				const express = require('express');
				const app = express();
				const server = http.createServer(app);
				const { data: html } = await axios.get("https://raw.githubusercontent.com/ntkhang03/resources-goat-bot/master/homepage/home.html");
				const PORT = global.GoatBot.config.dashBoard?.port || (!isNaN(global.GoatBot.config.serverUptime.port) && global.GoatBot.config.serverUptime.port) || 3001;
				app.get('/', (req, res) => res.send(html));
				app.get('/uptime', global.responseUptimeCurrent);
				let nameUpTime;
				try {
					nameUpTime = `https://${process.env.REPL_OWNER ?
						`${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` :
						process.env.API_SERVER_EXTERNAL == "https://api.glitch.com" ?
							`${process.env.PROJECT_DOMAIN}.glitch.me` :
							`localhost:${PORT}`}`;
					nameUpTime.includes('localhost') && (nameUpTime = nameUpTime.replace('https', 'http'));
					await server.listen(PORT);
					log.info("UPTIME", getText('login', 'openServerUptimeSuccess', nameUpTime));
					if (global.GoatBot.config.serverUptime.socket?.enable == true)
						require('./socketIO.js')(server);
					global.serverUptimeRunning = true;
				}
				catch (err) {
					log.err("UPTIME", getText('login', 'openServerUptimeError'), err);
				}
			}


			// ———————————————————— RESTART LISTEN ———————————————————— //
			if (restartListenMqtt.enable == true) {
				if (restartListenMqtt.logNoti == true) {
					log.info("LISTEN_MQTT", getText('login', 'restartListenMessage', convertTime(restartListenMqtt.timeRestart, true)));
					log.info("BOT_STARTED", getText('login', 'startBotSuccess'));

					logColor("#f5ab00", character);
				}
				const restart = setInterval(async function () {
					if (restartListenMqtt.enable == false) {
						clearInterval(restart);
						return log.warn("LISTEN_MQTT", getText('login', 'stopRestartListenMessage'));
					}
					try {
						// A pending error retry would open a second listener right
						// after this controlled restart. Cancel it first.
						cancelListenerRetry();
						listenerRetryAttempt = 0;
						await stopListening();
						await sleep(1000);
						global.GoatBot.Listening = api.listenMqtt(createCallBackListen());
						log.info("LISTEN_MQTT", getText('login', 'restartListenMessage2'));
					}
					catch (e) {
						log.err("LISTEN_MQTT", getText('login', 'restartListenMessageError'), e);
					}
				}, restartListenMqtt.timeRestart);
				global.intervalRestartListenMqtt = restart;
			}
			require('../autoUptime.js');
		});
	})(appState);

	// Always watch account.txt for an externally pasted state (e.g. a new
	// account after the old bot ID was suspended). This must not depend on
	// autoReloginWhenChangeAccount, which is off in the deployed config.
	// Registered once only: a new state now exits with code 7 so the supervisor
	// creates a fresh process instead of stacking a second session here.
	if (!global.__aliyaAccountWatcher) {
		global.__aliyaAccountWatcher = true;
		setTimeout(function () {
			try {
				watch(dirAccount, async (type) => {
					// Editors and git deployments can replace the file via
					// rename instead of firing a plain change event.
					if (type !== 'change' && type !== 'rename') return;
					try {
						const currentMtime = fs.statSync(dirAccount).mtimeMs;
						// Ignore the bot's own write window and unchanged mtime.
						if (currentMtime === latestChangeContentAccount ||
							changeFbStateByCode || Date.now() < selfWriteUntil) return;

						const currentRaw = fs.readFileSync(dirAccount, "utf8");
						// A deploy/sync can rewrite the same cookies with a new
						// mtime. That is not a new account - do not relogin.
						if (currentRaw === lastWrittenStateRaw ||
							sameAppState(lastWrittenStateRaw, currentRaw)) {
							lastWrittenStateRaw = currentRaw;
							latestChangeContentAccount = currentMtime;
							return;
						}

						lastWrittenStateRaw = currentRaw;
						latestChangeContentAccount = currentMtime;
						log.warn("LOGIN FACEBOOK", "New account.txt state detected. Switching to the new state.");
						scheduleAccountRelogin("New FB state detected");
					}
					catch (err) {
						log.err("LOGIN FACEBOOK", "Could not read account.txt change", err);
					}
				});
			}
			catch (err) {
				log.err("LOGIN FACEBOOK", "Could not watch account.txt", err);
			}
		}, 3000);
	}
}

global.GoatBot.reLoginBot = startBot;
startBot();
