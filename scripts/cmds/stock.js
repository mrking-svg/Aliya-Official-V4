const BOLD_MAP = (() => {
	const map = {};
	const plain = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");
	const glyphs = Array.from("𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗");
	for (let i = 0; i < plain.length; i++) map[plain[i]] = glyphs[i];
	return map;
})();

function bold(text) {
	return Array.from(String(text == null ? "" : text)).map(ch => BOLD_MAP[ch] || ch).join("");
}

function compact(value) {
	if (global.utils && typeof global.utils.formatCompact === "function")
		return global.utils.formatCompact(value);
	const n = Number(value) || 0;
	const abs = Math.abs(n);
	const units = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
	for (const [unit, suffix] of units) {
		if (abs >= unit) return `${Number((n / unit).toFixed(2))}${suffix}`;
	}
	return String(Math.round(n));
}

function priceText(value) {
	return "$" + Number(value || 0).toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
}

function pct(value) {
	const n = Number(value) || 0;
	return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

function parseQty(value) {
	const raw = String(value == null ? "" : value).trim().replace(/,/g, "");
	if (!/^\d+$/.test(raw)) return NaN;
	const n = Number(raw);
	return Number.isSafeInteger(n) && n > 0 ? n : NaN;
}

// Simulated exchange: prices drift on a 60s tick so buy/sell/debug stay consistent.
const BASE_STOCKS = [
	{ symbol: "AAPL", name: "Apple Inc.", price: 241.38, volatility: 0.006, sector: "Technology", cap: "3.6T", volume: 52400000 },
	{ symbol: "MSFT", name: "Microsoft Corp.", price: 428.75, volatility: 0.005, sector: "Technology", cap: "3.2T", volume: 19800000 },
	{ symbol: "NVDA", name: "NVIDIA Corp.", price: 138.92, volatility: 0.012, sector: "Semiconductors", cap: "3.4T", volume: 268000000 },
	{ symbol: "GOOGL", name: "Alphabet Inc.", price: 176.31, volatility: 0.007, sector: "Internet", cap: "2.1T", volume: 24100000 },
	{ symbol: "AMZN", name: "Amazon.com Inc.", price: 198.64, volatility: 0.008, sector: "E-Commerce", cap: "2.0T", volume: 38800000 },
	{ symbol: "META", name: "Meta Platforms", price: 592.18, volatility: 0.009, sector: "Social Media", cap: "1.5T", volume: 14200000 },
	{ symbol: "TSLA", name: "Tesla Inc.", price: 248.53, volatility: 0.015, sector: "Automotive", cap: "790B", volume: 92100000 },
	{ symbol: "AMD", name: "Advanced Micro Devices", price: 156.47, volatility: 0.011, sector: "Semiconductors", cap: "253B", volume: 47600000 },
	{ symbol: "NFLX", name: "Netflix Inc.", price: 742.36, volatility: 0.010, sector: "Streaming", cap: "318B", volume: 3900000 },
	{ symbol: "JPM", name: "JPMorgan Chase", price: 224.19, volatility: 0.004, sector: "Banking", cap: "630B", volume: 8100000 },
	{ symbol: "V", name: "Visa Inc.", price: 289.72, volatility: 0.004, sector: "Payments", cap: "570B", volume: 6200000 },
	{ symbol: "WMT", name: "Walmart Inc.", price: 82.41, volatility: 0.004, sector: "Retail", cap: "660B", volume: 17400000 }
];

const TICK_MS = 60000;
let marketState = null;
let lastTick = 0;

function initialMarket() {
	return BASE_STOCKS.map(stock => {
		const open = stock.price * (1 + (Math.random() - 0.5) * 0.01);
		return {
			...stock,
			price: stock.price,
			prevClose: stock.price * (1 + (Math.random() - 0.5) * 0.014),
			open,
			high: Math.max(stock.price, open),
			low: Math.min(stock.price, open),
			volume: stock.volume
		};
	});
}

function getMarket() {
	const now = Date.now();
	if (!marketState) {
		marketState = initialMarket();
		lastTick = now;
	}
	else if (now - lastTick >= TICK_MS) {
		for (const stock of marketState) {
			const drift = (Math.random() - 0.5) * 2 * stock.volatility;
			const next = Math.max(0.01, stock.price * (1 + drift));
			stock.price = next;
			stock.high = Math.max(stock.high, next);
			stock.low = Math.min(stock.low, next);
			stock.volume += Math.floor(Math.random() * 500000);
		}
		lastTick = now;
	}
	return marketState;
}

function getQuote(symbol) {
	const sym = String(symbol || "").toUpperCase();
	return getMarket().find(stock => stock.symbol === sym) || null;
}

function changePercent(stock) {
	return ((stock.price - stock.prevClose) / stock.prevClose) * 100;
}

function marketStatus() {
	const now = new Date();
	const day = now.getUTCDay();
	const hour = now.getUTCHours() + now.getUTCMinutes() / 60;
	const open = day >= 1 && day <= 5 && hour >= 13.5 && hour < 20;
	return open
		? { label: "MARKET OPEN", icon: "🟢", note: "NYSE regular hours • 09:30–16:00 ET" }
		: { label: "MARKET CLOSED", icon: "🔴", note: "Extended-hours quote • NYSE 09:30–16:00 ET" };
}

function normalizeStock(user) {
	const raw = user && user.data && user.data.stock;
	const source = raw && typeof raw.holdings === "object" && !Array.isArray(raw.holdings) ? raw.holdings : {};
	const holdings = {};
	for (const [symbol, position] of Object.entries(source)) {
		const shares = Math.max(0, Math.floor(Number(position && position.shares) || 0));
		const avg = Math.max(0, Number(position && position.avg) || 0);
		if (shares > 0) holdings[symbol.toUpperCase()] = { shares, avg };
	}
	return { holdings };
}

async function saveStock(usersData, userID, user, stock, wallet) {
	const patch = {
		data: {
			...(user && user.data && typeof user.data === "object" ? user.data : {}),
			stock
		}
	};
	if (typeof wallet === "number" && Number.isFinite(wallet)) patch.money = wallet;
	await usersData.set(userID, patch);
}

function sendText({ api, event, message }, body) {
	if (message && typeof message.reply === "function") return message.reply(body);
	return api.sendMessage(body, event.threadID, event.messageID);
}

function marketBoard() {
	const status = marketStatus();
	const line = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
	let text =
		"📈 " + bold("ALIYA STOCK EXCHANGE") + "\n" +
		status.icon + " " + bold(status.label) + " • " + status.note + "\n" +
		line + "\n" +
		"SYMBOL   LAST          CHG        TREND\n";

	for (const stock of getMarket()) {
		const change = changePercent(stock);
		text +=
			stock.symbol.padEnd(9) +
			priceText(stock.price).padEnd(14) +
			pct(change).padEnd(11) +
			(change >= 0 ? "📈" : "📉") + "\n";
	}

	text +=
		line + "\n" +
		"💵 Buy: " + bold("stock buy AAPL 5") + "\n" +
		"💸 Sell: " + bold("stock sell AAPL all") + "\n" +
		"📊 Details: " + bold("stock info NVDA") + " | " + bold("stock portfolio") + "\n" +
		"⚙️ Fee: 0.1% per trade • Prices refresh every 60s";
	return text;
}

function infoCard(stock) {
	const change = changePercent(stock);
	const bid = stock.price * 0.9995;
	const ask = stock.price * 1.0005;
	const line = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
	return line + "\n" +
		"📊 " + bold(`${stock.symbol} • ${stock.name}`) + "\n" +
		line + "\n" +
		"💰 Last: " + bold(priceText(stock.price)) + "  " + (change >= 0 ? "📈" : "📉") + " " + bold(pct(change)) + "\n" +
		"🏷️ Bid: " + priceText(bid) + " | Ask: " + priceText(ask) + "\n" +
		"🔓 Open: " + priceText(stock.open) + " | Prev close: " + priceText(stock.prevClose) + "\n" +
		"📏 Day range: " + priceText(stock.low) + " – " + priceText(stock.high) + "\n" +
		"📊 Volume: " + compact(stock.volume) + " | Mkt cap: $" + stock.cap + "\n" +
		"🏭 Sector: " + bold(stock.sector) + "\n" +
		line + "\n" +
		"💡 " + bold(`stock buy ${stock.symbol} 5`) + " | " + bold(`stock sell ${stock.symbol} all`);
}

function portfolioCard(user, wallet, stockState) {
	const line = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
	const entries = Object.entries(stockState.holdings);
	let text =
		"💼 " + bold("YOUR PORTFOLIO") + "\n" +
		line + "\n" +
		"🪙 Wallet: $" + bold(compact(wallet)) + "\n";

	if (!entries.length) {
		return text +
			"📭 " + bold("No open positions.") + "\n" +
			line + "\n" +
			"💡 Start with: " + bold("stock buy AAPL 5");
	}

	let totalValue = 0;
	let totalCost = 0;
	for (const [symbol, position] of entries) {
		const quote = getQuote(symbol);
		const current = quote ? quote.price : position.avg;
		const value = current * position.shares;
		const cost = position.avg * position.shares;
		const profit = value - cost;
		const profitPct = cost > 0 ? (profit / cost) * 100 : 0;
		totalValue += value;
		totalCost += cost;
		text +=
			"\n" + bold(symbol) + " • " + String(position.shares) + " shares\n" +
			"   Avg " + priceText(position.avg) + " → Now " + priceText(current) + "\n" +
			"   Value $" + compact(value) + " | P/L " + (profit >= 0 ? "🟢 +" : "🔴 -") + "$" + compact(Math.abs(profit)) + " (" + pct(profitPct) + ")\n";
	}

	const totalProfit = totalValue - totalCost;
	const totalProfitPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
	text +=
		line + "\n" +
		"📈 Holdings value: $" + bold(compact(totalValue)) + "\n" +
		"📉 Total P/L: " + (totalProfit >= 0 ? "🟢 +" : "🔴 -") + "$" + bold(compact(Math.abs(totalProfit))) + " (" + pct(totalProfitPct) + ")\n" +
		"💎 Wallet + stocks: $" + bold(compact(wallet + totalValue)) + "\n" +
		line;
	return text;
}

const STOCK_HELP =
	"📈 " + bold("STOCK MARKET MENU") + "\n" +
	"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
	"• stock / stock market — live board\n" +
	"• stock info <TICKER> — full quote\n" +
	"• stock buy <TICKER> <qty> — buy shares\n" +
	"• stock sell <TICKER> <qty|all> — sell shares\n" +
	"• stock portfolio — holdings + P/L\n" +
	"• stock help — this menu\n" +
	"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
	"Tickers: " + bold(BASE_STOCKS.map(s => s.symbol).join(", ")) + "\n" +
	"Trade fee: " + bold("0.1%") + " • Settled instantly from wallet.";

module.exports = {
	config: {
		name: "stock",
		aliases: ["stocks", "shares"],
		version: "1.0.0",
		author: "0xMr_King x ┃ Tanin Islam",
		countDown: 5,
		role: 0,
		category: "economy",
		shortDescription: { en: "Real-vibe stock exchange: market, quotes, buy, sell and portfolio" },
		guide: { en: "{pn} | {pn} market | {pn} info AAPL | {pn} buy AAPL 5 | {pn} sell AAPL all | {pn} portfolio" }
	},

	onStart: async function ({ api, event, args, usersData, message, messageID }) {
		const ctxSend = body => sendText({ api, event, message }, body);
		const sub = String(args[0] || "").toLowerCase();
		const senderID = event.senderID;

		try {
			if (!sub || ["market", "list", "board"].includes(sub))
				return ctxSend(marketBoard());

			if (sub === "help")
				return ctxSend(STOCK_HELP);

			if (sub === "info" || sub === "quote" || sub === "q") {
				const symbol = String(args[1] || "").toUpperCase();
				const quote = getQuote(symbol);
				if (!quote)
					return ctxSend("❌ " + bold("Unknown ticker.") + "\nUse: stock info AAPL");
				return ctxSend(infoCard(quote));
			}

			const user = await usersData.get(senderID) || {};
			let wallet = Math.max(0, Math.floor(Number(user.money) || 0));
			const stockState = normalizeStock(user);

			if (["portfolio", "holdings", "hold"].includes(sub))
				return ctxSend(portfolioCard(user, wallet, stockState));

			if (sub === "buy") {
				const symbol = String(args[1] || "").toUpperCase();
				const quote = getQuote(symbol);
				if (!quote)
					return ctxSend("❌ " + bold("Unknown ticker.") + "\nUse: stock market");
				const qty = parseQty(args[2]);
				if (!Number.isFinite(qty))
					return ctxSend("❌ " + bold("Usage") + ": stock buy <TICKER> <qty>\nExample: stock buy AAPL 5");

				const subtotal = quote.price * qty;
				const fee = Math.max(1, Math.ceil(subtotal * 0.001));
				const cost = Math.ceil(subtotal) + fee;
				if (wallet < cost)
					return ctxSend("❌ " + bold("Not enough wallet money.") + "\nNeed: $" + compact(cost) + "\nWallet: $" + compact(wallet));

				const old = stockState.holdings[symbol] || { shares: 0, avg: 0 };
				const shares = old.shares + qty;
				stockState.holdings[symbol] = {
					shares,
					avg: Number(((old.avg * old.shares + quote.price * qty) / shares).toFixed(4))
				};
				wallet -= cost;
				await saveStock(usersData, senderID, user, stockState, wallet);
				return ctxSend(
					"✅ " + bold("ORDER FILLED") + "\n" +
					"📈 " + bold(symbol) + " • " + qty + " shares @ " + priceText(quote.price) + "\n" +
					"💵 Subtotal: $" + compact(subtotal) + " | Fee: $" + compact(fee) + "\n" +
					"💸 Total paid: $" + bold(compact(cost)) + "\n" +
					"🪙 Wallet left: $" + compact(wallet) + "\n" +
					"📊 Position: " + shares + " shares @ avg " + priceText(stockState.holdings[symbol].avg)
				);
			}

			if (sub === "sell") {
				const symbol = String(args[1] || "").toUpperCase();
				const quote = getQuote(symbol);
				if (!quote)
					return ctxSend("❌ " + bold("Unknown ticker.") + "\nUse: stock market");
				const position = stockState.holdings[symbol];
				if (!position || !position.shares)
					return ctxSend("❌ " + bold("You don't own " + symbol + "."));

				const qtyArg = String(args[2] || "").toLowerCase();
				const qty = qtyArg === "all" ? position.shares : parseQty(qtyArg);
				if (!Number.isFinite(qty))
					return ctxSend("❌ " + bold("Usage") + ": stock sell <TICKER> <qty|all>");
				if (qty > position.shares)
					return ctxSend("❌ " + bold("Not enough shares.") + "\nYou own: " + position.shares);

				const gross = quote.price * qty;
				const fee = Math.max(1, Math.ceil(gross * 0.001));
				const net = Math.max(0, Math.floor(gross - fee));
				const costBasis = position.avg * qty;
				const profit = net - costBasis;
				const profitPct = costBasis > 0 ? (profit / costBasis) * 100 : 0;

				if (qty === position.shares) delete stockState.holdings[symbol];
				else stockState.holdings[symbol].shares -= qty;
				wallet += net;
				await saveStock(usersData, senderID, user, stockState, wallet);

				return ctxSend(
					"✅ " + bold("ORDER FILLED") + "\n" +
					"📉 " + bold(symbol) + " • " + qty + " shares @ " + priceText(quote.price) + "\n" +
					"💵 Gross: $" + compact(gross) + " | Fee: $" + compact(fee) + "\n" +
					"💰 Received: $" + bold(compact(net)) + "\n" +
					"📊 P/L: " + (profit >= 0 ? "🟢 +" : "🔴 -") + "$" + bold(compact(Math.abs(profit))) + " (" + pct(profitPct) + ")\n" +
					"🪙 Wallet now: $" + compact(wallet)
				);
			}

			return ctxSend("❌ " + bold("Unknown stock command.") + "\nUse: stock help");
		}
		catch (error) {
			console.error("STOCK ERROR", error);
			return ctxSend("❌ " + bold("Stock error.") + " " + (error && error.message ? error.message : "Try again."));
		}
	}
};
