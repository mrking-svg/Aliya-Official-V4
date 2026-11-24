const http = require("http");
const base = process.env.API_BASE_URL || "http://127.0.0.1:8080";
const url = base.replace(/\/$/, "") + "/health";
http.get(url, res => {
  let body = "";
  res.on("data", c => body += c);
  res.on("end", () => {
    let ok = false;
    try { ok = JSON.parse(body).status === "online"; } catch (_) {}
    console.log(JSON.stringify({ url, status: res.statusCode, ok }, null, 2));
    process.exit(ok ? 0 : 1);
  });
}).on("error", e => { console.error(JSON.stringify({ url, error: e.message })); process.exit(1); });
