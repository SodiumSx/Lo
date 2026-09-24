/* VERCEL EDGE MIDDLEWARE — Fortress Gate
 * File: /middleware.js (Edge Runtime, free-tier OK)
 * Chặn UA curl/headless/AI-crawler, gắn token phiên, thêm headers pháo đài.
 * NOTE: _middleware.js (legacy) đã được thay bằng /middleware.js theo docs Vercel hiện tại.
 */

const BOT_UA = [
  /curl\//i, /wget\//i, /python-requests/i, /python-urllib/i, /axios\//i,
  /httpie\//i, /go-http-client/i, /\bjava\//i, /libwww-perl/i, /okhttp\//i,
  /headless/i, /phantomjs/i, /selenium/i, /puppeteer/i, /playwright/i,
  /gptbot/i, /claude-web/i, /claudebot/i, /google-extended/i, /ccbot/i,
  /facebookbot/i, /meta-externalagent/i, /perplexitybot/i, /youbot/i,
  /bytespider/i, /amazonbot/i, /dataforseo/i, /dotbot/i, /semrushbot/i,
  /ahrefsbot/i, /mj12bot/i, /barkrowler/i, /cohere/i
];

const DECOY_HTML = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Quantum Loader — Đang khởi tạo…</title><style>body{background:#0A0A0F;color:#9be9ff;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0}.card{border:1px solid #1de9e9;border-radius:16px;padding:32px 40px;text-align:center;box-shadow:0 0 40px #00ffff33}.bar{width:220px;height:6px;background:#1a1a24;border-radius:99px;margin:18px auto;overflow:hidden}.bar i{display:block;height:100%;width:40%;background:linear-gradient(90deg,#00ffff,#ff00ff);animation:slide 1.2s infinite}@keyframes slide{to{transform:translateX(220px)}}</style></head><body><div class="card"><h1>ĐANG KHỞI TẠO…</h1><div class="bar"><i></i></div><p>Vui lòng mở bằng trình duyệt hiện đại để tiếp tục.</p></div></body></html>`;

function uuid4() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

async function sha256hex(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };

export default async function middleware(req) {
  const url = new URL(req.url);
  const ua = req.headers.get("user-agent") || "";
  const accept = req.headers.get("accept") || "";
  const isApi = url.pathname.startsWith("/api/");
  const isAsset =
    /\.(css|js|png|jpg|ico|woff2?|ttf|svg)$/i.test(url.pathname) && !isApi;

  // 1) Chặn UA bot/curl/AI ngay tại edge
  const uaHit = BOT_UA.find((re) => re.test(ua));
  // 2) Heuristic headless: không có Accept text/html nhưng xin page
  const looksHeadless =
    !isApi && !isAsset && accept && !/text\/html/i.test(accept) && ua.length < 20;

  if (uaHit || looksHeadless) {
    // Ghi log + trả trang mồi đẹp nhưng rỗng (không nội dung thật)
    console.log(`[honeypot] blocked ua="${ua.slice(0, 120)}" path=${url.pathname} reason=${uaHit ? uaHit.source : "headless-accept"}`);
    return new Response(DECOY_HTML, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-fortress": "decoy",
        "x-fortress-reason": (uaHit ? uaHit.source : "headless").slice(0, 64),
      },
    });
  }

  // 3) Tiếp tục — gắn session id + headers pháo đài
  const res = await fetch(req);
  const h = new Headers(res.headers);
  h.set("x-fortress", "gate-pass");
  h.set("x-frame-options", "DENY");
  h.set("x-content-type-options", "nosniff");

  // Cấp fortress session cookie dùng một lần nếu chưa có
  const cookie = req.headers.get("cookie") || "";
  if (!/__ft=/.test(cookie)) {
    const sid = uuid4();
    const ts = Date.now().toString(36);
    const sig = (await sha256hex(sid + "." + ts + ".quantum-void-v1")).slice(0, 24);
    const token = `${sid}.${ts}.${sig}`;
    h.append(
      "set-cookie",
      `__ft=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=600`
    );
  }
  return new Response(res.body, { status: res.status, headers: h });
}
