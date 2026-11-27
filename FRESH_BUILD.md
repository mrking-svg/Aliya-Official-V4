# Aliya Official V4 — Fresh A–Z build

Reference-only sources: `Bot1` (current, deployed), `Bot2` (old baseline), `SakuraBot_V2` (old baseline).
This directory is a clean copy of the audited Bot1 tree (no git history, no `node_modules`, no backup state) with the remaining requirement gaps fixed.

## Locked stability rules

- `config.json`
  - `restartListenMqtt.enable = false`
  - `autoRefreshFbstate = false`, `fbstateRefreshMs = 0`
  - `database.autoSyncWhenStart = false`
  - `optionsFca.autoReconnect = false`
- `bot/login/login.js`
  - config flags are forcibly re-asserted before every config write, so a runtime setting command cannot re-enable hourly restarts or state refresh.
  - `account.txt` is never rewritten by the bot: no startup write, no exit write, no periodic refresh.
  - listener reconnect backoff: 2 min → 4 min → … → 15 min cap (no 10/20/40 s hammering).
  - `Facebook blocked login` → immediate `exit(3)`.
- `fb-chat-api/src/listenMqtt.js`
  - **removed the old 3-second self-reconnect timer** (opened a brand-new MQTT socket every 3 s; this caused `Server unavailable` → blocked login).
  - `reconnectPeriod = 0` (MQTT.js no longer silently reconnects every second).
  - socket errors force-close the old client; no `ws3.relogin()` ever.
- `Aliya.js`
  - `unhandledRejection`, `uncaughtException` and the `aliyaFacebookBlocked` event all stop on a real Facebook block.
- `index.js`
  - single account only: `account.txt` is the one state file; no account rotation, no multi-account pool, no fallback engine.
  - offline delays: 1800, 3600, 7200, 21600 s; instant retry when `account.txt` changes.

## Requirement fixes applied here

- Approval system removed: `includes/approve.js`, `scripts/cmds/approve.js` and the approval gate in `bot/handler/handlerAction.js` are gone.
- `scripts/cmds/pending.js`
  - SakuraBot_V2-style pending list, accept/refuse by reply, and text-to-image connect card from `xsaim8x-xxx-api.onrender.com/api/botconnect`.
  - no approval persistence, no `handleMessageRequest()`, no config whitelist writes, no DB approval metadata.
  - Imgur fallback image is downloaded and sent as a real attachment.
- `scripts/cmds/aliyatester.js`
  - exact identity: `I am Aliya Official Made By Mr.king`.
  - all replies are sanitised: no stars, no Gemini/Google/other-service names.
  - owner-only, alias `tester`, short `help`, full `toollist`, chat + media + `editimg` preserved.
- `scripts/cmds/baby.js`
  - all hardcoded sans-serif-bold glyphs converted to serif-bold; `makeBold()` was already serif-bold.
  - teach multi/single, silent reply-save loop, 2-min timeout, one final `+2K` summary, no signature — preserved.
- `scripts/cmds/setting.js`
  - `autoRefreshFbstate` and `restartListenMqtt.enable` toggles are locked off.

## Preserved on purpose

- 570+ commands/aliases, economy `k/m/b/t`, `word.js` 2k, daily full clear 20M, bold balance, real bank + `bank top`, quiz games.
- Messenger effects removed from `fb-chat-api` (`lib/effects.js`, `lib/messageMetadata.js`, `sendMessage.js`, parsed effect fields in `utils.js`) and all `effect: "love"/"fire"` fields stripped from commands.
- Removed Render-incompatible commands: `avatar.js`, `song.js`, `music.js`, `audio.js`. `songfinder.js` is kept for song-name lookup.
- Typing indicator is response-time only: it starts when `api.sendMessage()` sends any text/image/video/audio/file response and stops when delivery finishes. No command/reply/reaction typing loops.
- All pair commands share `pairCore.js`; avatars come from `profileMedia.js`, the same stalk API used by `pfp.js`, with the old Graph URL as fallback.
- Islamic commands and non-working image commands stay deleted.
- pre-existing duplicate `pp` is left unchanged.
- `config.json`, `account.txt`, `.gitkeep`, deploy files are visible/tracked; `node_modules/` ignored.

## Verification

Self-tests live outside the repo in `~/aliya-fresh-tests` (not committed):

```
cd ~/aliya-fresh-tests
NODE_PATH=~/Bot1/node_modules node pending-selftest.js
NODE_PATH=~/Bot1/node_modules node baby-selftest.js
NODE_PATH=~/Bot1/node_modules node tester-selftest.js
NODE_PATH=~/Bot1/node_modules node teach-safety-selftest.js
NODE_PATH=~/Bot1/node_modules node typing-selftest.js
```

All five suites (`pending`, `baby`, `tester`, `teach-safety`, `typing`) pass. No local bot process was started or stopped during the self-tests.

## Speed / logout fixes verified before push

- `scripts/cmds/aliyatester.js`
  - command lookup is now indexed once (was rescanning 570+ files per request): first lookup ~395 ms, cached ~2 ms.
  - every model call has an `AbortController` timeout (6 s per model) plus a 9 s total request budget; no more silent multi-minute stalls.
  - output capped at 1000 tokens by default, source at 24000 chars, and only 2 models race before short fallbacks.
  - timeouts/quota/404 return short service-free replies; no Gemini/Google names ever reach Facebook.
- `scripts/cmds/baby.js`
  - teach prompts are separated by a 1.5 s gap (configurable via `ALIYA_TEACH_PROMPT_GAP_MS`); old prompt is no longer unsent on every reply.
  - teach saves are serialized through a per-session chain: no overlapping API calls or `usersData` writes.
  - all teach sends go through `safeTeachSend()`: callback/promise errors cannot become uncaught exceptions in timers.
  - a real Facebook block still stops the bot via `aliyaFacebookBlocked`; ordinary send failures end that teach session quietly instead of retry bursts.
  - 2 min inactivity, one final `+2K` summary, silent per-teach loop and serif-bold style are unchanged.
- New external selftests (outside the repo): `tester-selftest.js` and `teach-safety-selftest.js`, both passing along with `pending`/`baby`.

## Render MQTT network fix

- `fb-chat-api/src/listenMqtt.js`
  - Facebook DNS returns an AAAA record first on Render, and Render has no usable IPv6 route to the MQTT edge: `connect ENETUNREACH 2a03:2880:...:443 - Local (:::0)`.
  - `wsOptions` now sets `family: 4` and an IPv4-only `dns.lookup` wrapper, so Node never attempts the unreachable AAAA address.
  - `ctx.mqttEndpoint` is always present in `fb-chat-api/index.js`, so the hostname inside it is rotated on each bot-owned retry through `edge-chat`, `edge-mqtt` and `edge-mqtt-fallback`, preserving the Facebook `region` and replacing `sid`.
  - MQTT.js auto-reconnect remains `0`; all retries stay under the existing 2→4→…→15 min bot-owned backoff. No `ws3.relogin()` was reintroduced.

## Local PM2 verification (new state)

- `node /usr/lib/node_modules/pm2/bin/pm2 start ecosystem.config.js` (`botfresh`); process deleted again before push.
- Latest run with the new `account.txt`: `Successful login`, `MQTT: Facebook listener is connected`, `READY`, MongoDB connected, 569 commands loaded.
- Zero `ENETUNREACH`, `ETIMEDOUT`, `LISTEN_MQTT: Callback error`, `Server unavailable`, `blocked login`, `retry #` or `relogin` lines.
- `account.txt` mtime unchanged during startup — no periodic state rewrite.

## Deploying

1. Local PM2 process is stopped before any push so only one session is active.
2. Apply these files plus the fresh `account.txt` onto `Bot1` and push `main` only to `mrking-svg/Aliya-Official-v4`.
3. Verify Render health, successful login, MQTT connect and no retry/blocked lines.
