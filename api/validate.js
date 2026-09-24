/* /api/validate.js — Edge Function: chấm điểm vân tay trình duyệt + PoW
 * POST /api/validate { token, fp:{webgl,canvas,audio,fonts,cores,mem,scr,mouse}, powNonce, timing }
 * Trả { ok:true, score, pass } hoặc { ok:false, decoy:true } cho bot.
 */
export const config = { runtime: "edge" };

async function sha256hex(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method" }), { status: 405 });
  }
  let body = {};
  try { body = await req.json(); } catch { body = {}; }
  const { token = "", fp = {}, powNonce = "", timing = {} } = body;
  const ua = req.headers.get("user-agent") || "";

  // UA bot -> decoy ngay
  if (/curl|wget|python|axios|go-http|java|okhttp|headless|gptbot|claude|ccbot|perplexity|bytespider|semrush|dotbot|ahrefs/i.test(ua)) {
    console.log(`[validate] bot ua blocked: ${ua.slice(0, 100)}`);
    return Response.json({ ok: false, decoy: true, reason: "ua" });
  }

  // Verify token stateless
  const secret = (typeof process !== "undefined" && process.env && process.env.FORTRESS_SECRET) || "quantum-void-v1";
  const parts = String(token).split(".");
  let tokenOk = false;
  if (parts.length === 3) {
    const expect = (await sha256hex(`${parts[0]}.${parts[1]}.${secret}`)).slice(0, 24);
    tokenOk = expect === parts[2];
    const age = Date.now() - parseInt(parts[1], 36);
    if (!(age > 0 && age < 10 * 60 * 1000)) tokenOk = false;
  }

  // Verify PoW nhẹ: sha256(token+nonce) bắt đầu bằng "0"
  let powOk = false;
  try {
    const h = await sha256hex(String(token) + String(powNonce));
    powOk = h.startsWith("0");
  } catch { powOk = false; }

  // Chấm điểm fingerprint (mỗi tín hiệu +điểm; bot headless thường thiếu nhiều tín hiệu)
  let score = 0;
  if (fp.webgl) score += 25;
  if (fp.canvas) score += 20;
  if (fp.audio) score += 15;
  if (fp.fonts >= 5) score += 10;
  if (fp.cores >= 2) score += 10;
  if (fp.scr) score += 10;
  if (fp.mouse) score += 10;
  // Phân tích thời gian: request quá nhanh (<150ms từ lúc lấy token) hoặc timing bất thường -> trừ điểm
  if (timing && timing.dt != null) {
    if (timing.dt < 150) score -= 30; // script fetch, không phải người
  }

  const pass = tokenOk && powOk && score >= 60;
  if (!pass) console.log(`[validate] fail tokenOk=${tokenOk} powOk=${powOk} score=${score} ua=${ua.slice(0, 60)}`);
  return Response.json(
    pass
      ? { ok: true, score, pass: true, stage: "unlocked" }
      : { ok: false, decoy: true, score, reason: !tokenOk ? "token" : !powOk ? "pow" : "fp" }
  );
}
