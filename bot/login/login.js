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

// A temporary cookie/MQTT failure must never rotate the account. Only a real
// Facebook checkpoint / suspension / disabled account is allowed to do that.
function isSuspendedSession(error) {
	const text = String((error && (error.message || error.error)) || error || "").toLowerCase();
	return /checkpoint|suspended|disabled account|account.*disabled|blocked account|\/block\//i.test(text);
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
	// While a switch is pending, no timer may write the OLD session back into
	// account.txt - that would destroy the state we are trying to switch to.
	global.__aliyaOutsideStatePending = true;
	accountReloginTimer = setTimeout(async () => {
		accountReloginTimer = null;
		try {
			log.info("LOGIN FACEBOOK", `${reason}. Logging in again with the new account.txt state.`);
			await startBot();
		}
		catch (err) {
			log.err("LOGIN FACEBOOK", "Could not relogin with the new state", err);
		}
		finally {
			global.__aliyaOutsideStatePending = false;
			global.__aliyaReloginBusy = false;
		}
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
	writeOwnAppState(appState, "login");
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

		login({ appState }, global.GoatBot.config.optionsFca, async function (error, api) {
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
					log.err("LOGIN FACEBOOK", "Facebook account is checkpointed or suspended. Switching accounts.");
					return process.exit(5);
				}
				if (facebookAccount.email && facebookAccount.password) {
					return startBot(true);
				}
				// —————————— CHECK DASHBOARD —————————— //
				if (global.GoatBot.config.dashBoard?.enable == true) {
					try {
						await require("../../dashboard/app.js")(null);
						log.info("DASHBOARD", getText('login', 'openDashboardSuccess'));
					}
					catch (err) {
						log.err("DASHBOARD", getText('login', 'openDashboardError'), err);
					}
					return;
				}
				else {
					process.exit();
				}
			}

			global.GoatBot.fcaApi = api;
			// Every outgoing message (text/image/video/audio/file) keeps the typing
			// indicator on until Facebook confirms delivery.
			require("../handler/typingSend.js").wrap(api);
			if (!api.ws3 || typeof api.ws3.relogin !== "function") {
				api.ws3 = Object.assign({}, api.ws3 || {}, {
					relogin: () => {
						try { if (typeof global.GoatBot.reLoginBot === "function") global.GoatBot.reLoginBot(); }
						catch (_) {}
					}
				});
			}
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
			// Save the live appState back to account.txt, then keep refreshing it.
			// A cookie pasted once should stay usable for days instead of dying
			// after the first MQTT reconnect (the old code refreshed only at boot).
			global.__aliyaCurrentApi = api;
			function saveFreshAppState(why) {
				if (!api || typeof api.getAppState !== "function") return;
				// A new-state switch is queued: never write the old session now.
				if (global.__aliyaOutsideStatePending) {
					log.warn("REFRESH FBSTATE", "A new account.txt state is pending. Skipping refresh with the old session.");
					return;
				}
				// If the user pasted a new state (e.g. a new bot account after a
				// suspension), keep it and switch to it instead of overwriting it
				// with the old session cookies.
				try {
					const currentMtime = fs.statSync(dirAccount).mtimeMs;
					if (currentMtime !== latestChangeContentAccount) {
						log.warn("REFRESH FBSTATE", "account.txt was changed outside the bot. Keeping the new state and switching to it.");
						latestChangeContentAccount = currentMtime;
						scheduleAccountRelogin("New FB state detected");
						return;
					}
				}
				catch (_e) { /* account.txt check is best effort */ }

				const fresh = filterKeysAppState(api.getAppState());
				if (!fresh.length) return;
				try {
					writeOwnAppState(fresh, why);
					log.info("REFRESH FBSTATE", `${getText('login', 'refreshFbstateSuccess', path.basename(dirAccount))}${why === 'auto' ? ' (auto)' : ''}`);
				}
				catch (err) {
					log.warn("REFRESH FBSTATE", getText('login', 'refreshFbstateError', path.basename(dirAccount)), err);
				}
			}

			// Preserve the newest cookies on planned restarts too, but never
			// overwrite a state the user pasted manually while the bot was up.
			if (!global.__aliyaStateExitHook) {
				global.__aliyaStateExitHook = true;
				process.on("exit", () => {
					try {
						if (fs.statSync(dirAccount).mtimeMs !== latestChangeContentAccount) return;
						const currentApi = global.__aliyaCurrentApi;
						if (!currentApi || typeof currentApi.getAppState !== "function") return;
						const fresh = filterKeysAppState(currentApi.getAppState());
						if (fresh.length) {
							const raw = JSON.stringify(fresh, null, 2);
							writeFileSync(dirAccount, raw);
							lastWrittenStateRaw = raw;
							selfWriteUntil = Date.now() + 5000;
							stateBackup.save(fresh);
						}
					}
					catch (_e) { /* best effort only */ }
				});
			}

			// No periodic account.txt writes. Rewriting the state every few minutes
			// made hosts/git sync look like "new state pasted", which killed uptime.
			// Fresh cookies are still persisted once on graceful exit (hook above),
			// so a valid state normally stays good for weeks without any input.
			if (global.intervalRefreshFbstate) clearInterval(global.intervalRefreshFbstate);
			if (global.GoatBot.config.autoRefreshFbstate == true) {
				log.info("REFRESH FBSTATE", "Periodic writes disabled; state is kept until restart.");
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
			writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			writeFileSync(global.client.dirConfigCommands, JSON.stringify(global.GoatBot.configCommands, null, 2));

			// ——————————————————————————————————————————————————— //
			const { restartListenMqtt } = global.GoatBot.config;
			let intervalCheckLiveCookieAndRelogin = false;
			// —————— REAL READY CHECK (READY is sent only after Facebook MQTT really answers) —————— //
			// A quiet MQTT stream is normal. The old 5-minute watchdog exited the
			// process whenever no callback arrived, which killed healthy bots.
			// Only a real checkpoint/suspension may switch accounts (handled below).
			let mqttReadyOnce = false;
			function markMqttReady() {
				if (mqttReadyOnce) return;
				mqttReadyOnce = true;
				log.info("MQTT", "Facebook listener is connected. Bot can receive messages.");
				if (process.send) { try { process.send({ type: "READY" }); } catch (e) { /* no supervisor */ } }
			}
			function markMqttDown() {
				// Temporary listener drops must NOT restart or rotate the bot.
				// Facebook reconnects on its own in most cases.
				log.warn("MQTT", "Listener temporarily down; waiting for Facebook to recover.");
			}
			// —————————————————— CALLBACK LISTEN —————————————————— //
			async function callBackListen(error, event) {
				if (error) {
					// Checkpoint/suspension is the only reason to rotate accounts.
					if (isSuspendedSession(error)) {
						log.err("LOGIN FACEBOOK", "Facebook account is checkpointed or suspended. Switching accounts.");
						return process.exit(5);
					}
					global.responseUptimeCurrent = responseUptimeError;
					if (error != "Connection closed." && error != "Connection closed by user.") markMqttDown();
					if (
						error.error == "Not logged in" ||
						error.error == "Not logged in." ||
						error.error == "Connection refused: Server unavailable"
					) {
						log.err("NOT LOGGEG IN", getText('login', 'notLoggedIn'), error);
						global.responseUptimeCurrent = responseUptimeError;
						global.statusAccountBot = 'can\'t login';
						if (!isSendNotiErrorMessage) {
							await handlerWhenListenHasError({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, error });
							isSendNotiErrorMessage = true;
						}

						if (global.GoatBot.config.autoRestartWhenListenMqttError)
							process.exit(2);
						else {
							// log.dev("ACCOUNT LOCKED, start relogin...");
							// await stopListening();
							// log.dev("STOP LISTENING SUCCESS");
							const keyListen = Object.keys(callbackListenTime).pop();
							if (callbackListenTime[keyListen])
								callbackListenTime[keyListen] = () => { };
							const cookieString = appState.map(i => i.key + "=" + i.value).join("; ");
							// log.dev("GET COOKIE SUCCESS");
							// log.dev(cookieString);

							let times = 5;

							const spin = createOraDots(getText('login', 'retryCheckLiveCookie', times));
							const countTimes = setInterval(() => {
								times--;
								if (times == 0)
									times = 5;
								spin.text = getText('login', 'retryCheckLiveCookie', times);
							}, 1000);

							if (intervalCheckLiveCookieAndRelogin == false) {
								intervalCheckLiveCookieAndRelogin = true;
								let checks = 0;
								const interval = setInterval(async () => {
									checks++;
									let cookieIsLive = false;
									try { cookieIsLive = await checkLiveCookie(cookieString, facebookAccount.userAgent); }
									catch (e) { cookieIsLive = false; }

									// A dropped MQTT stream usually does NOT mean the cookie is dead.
									// Facebook also changes the mbasic HTML, so checkLiveCookie can lie.
									// Retry the listener directly after a few failed checks.
									if (!cookieIsLive && checks < 3) return;

									clearInterval(interval);
									clearInterval(countTimes);
									intervalCheckLiveCookieAndRelogin = false;
									const keyListen = Date.now();
									isSendNotiErrorMessage = false;
									try {
										global.GoatBot.Listening = api.listenMqtt(createCallBackListen(keyListen));
										log.master("LISTEN_MQTT", cookieIsLive
											? "Cookie live - restarting listener"
											: "MQTT dropped - retrying listener with existing cookies");
									}
									catch (err) {
										log.err("LISTEN_MQTT", "Failed to restart listener", err);
									}
								}, 5000);
							}
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
	// Registered once only: startBot() is called again on every relogin.
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
