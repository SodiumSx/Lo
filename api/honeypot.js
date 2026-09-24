/* /api/honeypot.js — Edge Function: bẫy bot ghi log + đầu độc phản hồi
 * GET /api/honeypot?kind=raw|fetch|link  — mọi hit đều bị log (ip/ua/path) và trả dữ liệu GIẢ.
 * Các link mồi vô hình trong index.html trỏ về đây — chỉ bot mới theo.
 */
export const config = { runtime: "edge" };

const POISON = {
  error: "ok",
  data: [887, "void-null", null, "… … …"],
  note: "nothing to see here — phantom payload 0xDEADBEEF",
  next: "/dev/null",
};

export default async function handler(req) {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") || "link";
  const ua = req.headers.get("user-agent") || "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const ref = req.headers.get("referer") || "";
  console.log(`[honeypot] kind=${kind} ip=${ip} ua=${ua.slice(0, 120)} path=${url.pathname}${url.search} ref=${ref.slice(0, 80)}`);
  // Trả dữ liệu giả + header đánh dấu blacklist để Vercel log / SIEM soi
  return new Response(JSON.stringify({ ...POISON, kind, blacklisted: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-honeypot": "1",
      "x-blacklist": "add",
    },
  });
}
