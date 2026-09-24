/* /api/token.js — Edge Function: cấp token phiên dùng một lần (stateless, free-tier OK)
 * GET /api/token -> { token, ts, exp, pow }  (pow: thử thách proof-of-work nhẹ phía client)
 * Token format: <uuidv4>.<ts36>.<sig24> với sig = sha256(uuid.ts.secret).slice(0,24)
 * SECRET mặc định "quantum-void-v1" — NÊN đặt env FORTRESS_SECRET trên Vercel.
 */
export const config = { runtime: "edge" };

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

export default async function handler(req) {
  const url = new URL(req.url);
  const origin = req.headers.get("origin") || "";
  // CORS pháo đài: chỉ *.vercel.app + cùng origin
  const allowed =
    origin === "" ||
    /\.vercel\.app$/.test(new URL(origin).hostname || "") ||
    new URL(origin).origin === url.origin;
  if (!allowed) {
    return new Response(JSON.stringify({ error: "origin-denied", poison: "☠ dead-end ☠" }), {
      status: 403,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  const ua = req.headers.get("user-agent") || "";
  if (/curl|wget|python|axios|go-http|java|okhttp|headless|gptbot|ccbot|bytespider/i.test(ua)) {
    return new Response(JSON.stringify({ error: "bot-denied" }), {
      status: 403,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  const secret = (typeof process !== "undefined" && process.env && process.env.FORTRESS_SECRET) || "quantum-void-v1";
  const sid = uuid4();
  const ts = Date.now().toString(36);
  const sig = (await sha256hex(`${sid}.${ts}.${secret}`)).slice(0, 24);
  const token = `${sid}.${ts}.${sig}`;
  // Thử thách PoW: tìm nonce sao cho sha256(token+nonce) bắt đầu bằng "0" (1 nibble — nhẹ, mobile OK)
  const challenge = (await sha256hex(token)).slice(0, 8);
  const body = JSON.stringify({ token, ts: Date.now(), exp: 600, pow: { challenge, difficulty: 1 } });
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "access-control-allow-origin": origin || url.origin,
      "vary": "Origin",
    },
  });
}
