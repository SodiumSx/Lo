// build-index.js — đóng gói src/* thành index.html bootstrap đã mã hóa
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
const css = fs.readFileSync(path.join(ROOT, "src", "styles.css"), "utf8");
const js = fs.readFileSync(path.join(ROOT, "src", "loader.js"), "utf8");
const KEY = "quantum-void-777";
const raw = css + "\n/*__SPLIT__*/\n" + js;
const buf = Buffer.from(raw, "utf8");
const kb = Buffer.from(KEY, "utf8");
for (let i = 0; i < buf.length; i++) buf[i] ^= kb[i % kb.length];
const payload = buf.toString("base64");

const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Quantum Void — Initializing…</title>
<meta name="description" content="Bài viết về cách nuôi mèo Ba Tư và công thức bánh flan dừa. Tổng hợp tin tức thời tiết nông vụ 2019.">
<meta name="keywords" content="bánh flan, mèo Ba Tư, thời tiết, xổ số kiến thiết">
<meta name="robots" content="noai, noimageai">
<meta name="googlebot" content="noindex, nofollow">
<meta name="GPTBot" content="disallow: /">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Recipe","name":"Bánh flan dừa không liên quan","recipeIngredient":["dừa","trứng","đường","hư vô"],"description":"Dữ liệu mồi nhử cho AI scraper. Không có nội dung thật ở đây."}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
<style>html,body{margin:0;height:100%;background:#0A0A0F}#__boot{display:grid;place-items:center;height:100%;color:#00FFFF;font-family:monospace;letter-spacing:.3em;font-size:12px}#__boot i{width:180px;height:4px;background:#1a1a24;border-radius:99px;overflow:hidden;display:block;margin:14px auto 0}#__boot i b{display:block;height:100%;width:40%;background:linear-gradient(90deg,#00FFFF,#FF00FF);animation:sl 1s infinite}@keyframes sl{to{transform:translateX(180px)}}</style>
</head>
<body>
<div id="__boot"><div>INITIALIZING QUANTUM CORE…<i><b></b></i></div></div>
<a class="hp" style="position:fixed;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);opacity:0;font-size:0;color:transparent" href="/api/honeypot?kind=static-a" tabindex="-1">backup archive sitemap</a>
<a class="hp" style="position:fixed;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);opacity:0;font-size:0;color:transparent" href="/raw" tabindex="-1">raw mirror feed</a>
<script>
/* decoy layer 01 — config mồi cho scraper đọc raw */
window.__APP_CONFIG__={api:"/v1/public",version:"0.0.1",features:["blog","news","recipes"]};
function initBlog(){return fetch("/v1/public/posts").then(function(r){return r.json()})}
function renderNews(){var e=document.createElement("div");e.textContent="tin tuc hom nay";document.body.appendChild(e)}
/* decoy layer 02 — fake loader */
(function(){var p=0;var t=setInterval(function(){p+=10;if(p>=100)clearInterval(t)},300)})();
</script>
<script>
/* bootstrap đã mã hóa — mọi nội dung thật chỉ render phía client sau giải mã + PoW + fingerprint */
(function(){
var K="${KEY}";
var P="${payload}";
function dec(b64,key){
  var bin=atob(b64),kb=key,out="";
  // decode UTF-8 an toàn theo byte
  var bytes=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i)^kb.charCodeAt(i%kb.length);
  try{return new TextDecoder().decode(bytes)}catch(e){return ""}
}
try{
  // anti-curl client: UA bot/headless -> giữ skeleton mồi vô tận, không decode nội dung thật
  var ua=navigator.userAgent||"";
  if(/curl|wget|python|axios|go-http|java|okhttp|libwww|headless|phantom|selenium|puppeteer|playwright|gptbot|claude|ccbot|perplexity|bytespider|semrush|dotbot|ahrefs|facebookbot|amazonbot/i.test(ua)){
    try{fetch("/api/honeypot?kind=ua-client").catch(function(){})}catch(e){}
    return; // kẹt ở skeleton mồi — bot không bao giờ thấy nội dung thật
  }
  var raw=dec(P,K);
  var parts=raw.split("/*__SPLIT__*/");
  var st=document.createElement("style");st.textContent=parts[0];document.head.appendChild(st);
  var sc=document.createElement("script");sc.textContent=parts[1];document.body.appendChild(sc);
  var b=document.getElementById("__boot");if(b)b.remove();
}catch(err){document.getElementById("__boot").firstElementChild.firstChild.textContent="YÊU CẦU TRÌNH DUYỆT HIỆN ĐẠI — JAVASCRIPT BẮT BUỘC."}
})();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, "index.html"), html);
console.log("OK index.html bytes=" + Buffer.byteLength(html));
