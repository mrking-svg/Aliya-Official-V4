'use strict';

// Small MQTT watchdog state machine.
//
// A first-connect failure means the account is dead/checkpointed and must be
// handed to the supervisor (exit 5). A listener drop after READY is normal on
// cloud hosts; it must only restart this engine (exit 7) if it never recovers,
// so a healthy account is never blamed for a temporary MQTT error.

function createMqttWatchdog(opts) {
	const o = opts || {};
	const log = o.log || { info() {}, warn() {}, err() {} };
	const setTimer = o.setTimer || ((fn, ms) => setTimeout(fn, ms));
	const clearTimer = o.clearTimer || clearTimeout;

	let ready = false;
	let deadline = null;
	let fatal = true;

	function clear() {
		if (deadline) {
			try { clearTimer(deadline); } catch (_e) { /* ignore */ }
			deadline = null;
		}
	}

	function arm(ms, why, isFatal) {
		clear();
		fatal = !!isFatal;
		deadline = setTimer(() => {
			deadline = null;
			if (fatal) {
				log.err("MQTT_WATCHDOG", why + " Asking the supervisor to switch account (exit 5).");
				if (typeof o.onFatal === "function") o.onFatal();
				else process.exit(5);
			}
			else {
				log.warn("MQTT_WATCHDOG", why + " Restarting this engine without switching account (exit 7).");
				if (typeof o.onSoft === "function") o.onSoft();
				else process.exit(7);
			}
		}, ms);
		if (deadline && typeof deadline.unref === "function") deadline.unref();
		return deadline;
	}

	function markReady() {
		clear();
		const first = !ready;
		ready = true;
		return first;
	}

	function markDown(ms, why) {
		// Before the first READY the fatal startup deadline stays in charge.
		if (!ready) return false;
		ready = false;
		arm(ms, why, false);
		return true;
	}

	return {
		arm,
		markReady,
		markDown,
		clear,
		isReady: () => ready,
		isArmed: () => !!deadline
	};
}

module.exports = { createMqttWatchdog };
