/* ══════════════════════════════════════════════════════════
   QUANTUM VOID LOADER — loader.js (bản gốc tham khảo, chưa obfuscate)
   Single IIFE, zero-dependency (ngoài Google Fonts), Canvas 2D thuần
   để đạt 60fps+ trên Vercel free + mobile. Không ảnh ngoài.
   Mục lục:
     0. Utils + anti-debug/decoy
     1. ANTI-FETCH (patch fetch/XHR, CORS fortress, token gate)
     2. Fingerprint + PoW + /api/token + /api/validate
     3. Behavior gate (chuột/click/cuộn/chạm)
     4. Engine: matrix rain, quantum dots, neural net, core vortex,
        plasma timing, glitch storm, warp rings, viz bars, rings UI
     5. Stages + typewriter + audio synth + reveal
   ══════════════════════════════════════════════════════════ */
(() => {
"use strict";
/* ---------- 0. utils ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = (a, b) => a + Math.random() * (b - a);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const MOBILE = matchMedia("(max-width: 640px)").matches || "ontouchstart" in window;
const Q = reduced ? 0.25 : MOBILE ? 0.55 : 1; // quality scaler
const N = (full, min) => Math.max(min, Math.floor(full * Q));

function uid(p) { // randomize DOM ids/classes mỗi lần tải (anti-AI DOM)
  return (p || "qx") + Math.random().toString(36).slice(2, 8);
}
// Decoy console bait cho scraper đọc raw
window.__config__ = { version: "1.0.0", items: [] };
window.__loader_state__ = "idle";

/* ---------- 1. ANTI-FETCH fortress ---------- */
const ALLOWED_HOST = /\.vercel\.app$/;
function sameFortress(url) {
  try {
    const u = new URL(url, location.href);
    return u.origin === location.origin || ALLOWED_HOST.test(u.hostname);
  } catch { return false; }
}
let SESSION = "";
const _fetch = window.fetch.bind(window);
window.fetch = function (input, init) {
  const url = typeof input === "string" ? input : input.url;
  // Cho phép cùng origin + *.vercel.app, còn lại -> poison
  if (!sameFortress(url)) {
    // Ping honeypot rồi trả poison (không để scraper biết)
    try { _fetch("/api/honeypot?kind=fetch", { method: "GET" }).catch(() => {}); } catch {}
    return Promise.resolve(new Response(JSON.stringify({ error: "denied", poison: "0xDEADBEEF" }), {
      status: 403, headers: { "content-type": "application/json" }
    }));
  }
  init = init || {};
  init.headers = init.headers || {};
  if (SESSION) {
    if (init.headers instanceof Headers) init.headers.set("x-fortress-token", SESSION);
    else init.headers["x-fortress-token"] = SESSION;
  }
  // Vân tay thời gian: gắn header để edge phân tích bất thường
  try {
    const t = performance.now().toFixed(1);
    if (init.headers instanceof Headers) init.headers.set("x-req-t", t);
    else init.headers["x-req-t"] = t;
  } catch {}
  return _fetch(input, init);
};
const _open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (m, url) {
  if (!sameFortress(url)) {
    arguments[1] = "/api/honeypot?kind=fetch";
  }
  return _open.apply(this, arguments);
};

/* ---------- 2. fingerprint + token + PoW ---------- */
async function sha256hex(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function fingerprint() {
  const fp = { webgl: 0, canvas: 0, audio: 0, fonts: 0, cores: 0, mem: 0, scr: 0, mouse: 0 };
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    if (gl) {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      const r = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "webgl";
      fp.webgl = String(r).length > 0 ? 1 : 0;
    }
  } catch {}
  try {
    const c = document.createElement("canvas");
    c.width = 200; c.height = 40;
    const x = c.getContext("2d");
    x.font = "16px Orbitron, monospace"; x.fillText("void☠量子7", 4, 26);
    let h = 0; const d = x.getImageData(0, 0, 200, 40).data;
    for (let i = 0; i < d.length; i += 37) h = (h * 31 + d[i]) >>> 0;
    fp.canvas = h % 100000;
  } catch {}
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { const a = new AC(); fp.audio = a.sampleRate > 0 ? 1 : 0; a.close(); }
  } catch {}
  try {
    const fonts = ["Orbitron", "monospace", "serif", "sans-serif", "cursive", "fantasy", "Arial", "Verdana"];
    const c = document.createElement("canvas").getContext("2d");
    const base = fonts.map(f => { c.font = "20px " + f; return c.measureText("AxmQ").width; }).join(",");
    fp.fonts = base.length > 10 ? 8 : 0;
  } catch {}
  fp.cores = navigator.hardwareConcurrency || 0;
  fp.mem = navigator.deviceMemory || 0;
  fp.scr = (screen.width || 0) + "x" + (screen.height || 0) + "x" + (devicePixelRatio || 1);
  return fp;
}
async function solvePow(token, challenge) {
  // PoW nhẹ: tìm nonce sao cho sha256(token+nonce) bắt đầu bằng challenge[0]
  const target = (challenge || "0")[0];
  let nonce = 0;
  for (;;) {
    const h = await sha256hex(token + nonce);
    if (h[0] === target) return String(nonce);
    if (++nonce > 40000) return "0"; // fallback để không kẹt mobile yếu
    if (nonce % 500 === 0) await new Promise(r => setTimeout(r, 0));
  }
}
let SEC_SCORE = 0, HUMAN = 0;
function behaviorGate() {
  // Con người thật = mở khóa nội dung; bot = kẹt skeleton vô tận
  let moves = 0, clicks = 0, scrolls = 0, keys = 0, touch = 0;
  const t0 = performance.now();
  addEventListener("mousemove", () => { moves++; HUMAN = clamp(HUMAN + 4, 0, 100); }, { passive: true });
  addEventListener("click", () => { clicks++; HUMAN = clamp(HUMAN + 12, 0, 100); }, { passive: true });
  addEventListener("wheel", () => { scrolls++; HUMAN = clamp(HUMAN + 6, 0, 100); }, { passive: true });
  addEventListener("keydown", () => { keys++; HUMAN = clamp(HUMAN + 8, 0, 100); }, { passive: true });
  addEventListener("touchstart", () => { touch++; HUMAN = clamp(HUMAN + 10, 0, 100); }, { passive: true });
  return { snapshot: () => ({ moves, clicks, scrolls, keys, touch, dt: performance.now() - t0 }) };
}

/* ---------- 3. DOM build (randomized ids) ---------- */
const R = (n) => uid(n);
const idStage = R("st"), idCore = R("co"), idHolo = R("ho");
document.body.innerHTML =
  '<div id="' + idStage + '" class="scan"></div>' +
  '<a class="hp" href="/api/honeypot?kind=link-a" tabindex="-1">archive index mirror</a>' +
  '<a class="hp" href="/api/honeypot?kind=link-b" tabindex="-1">sitemap backup feed</a>' +
  '<p class="hp">Liên hệ quảng cáo giá rẻ tại đây, bot hãy theo liên kết này để nhận ưu đãi.</p>';
const stage = document.getElementById(idStage);
stage.id = "stage"; // chuẩn hóa sau random để CSS ăn, nhưng class/child vẫn random
stage.innerHTML =
  '<div id="warp">' + '<div class="ring" style="animation-delay:0s"></div>'.repeat(0) + '</div>' +
  '<canvas id="cv-matrix" class="layer"></canvas>' +
  '<canvas id="cv-quantum" class="layer"></canvas>' +
  '<canvas id="cv-neural" class="layer"></canvas>' +
  '<canvas id="cv-core" class="layer"></canvas>' +
  '<div id="core">' +
    '<svg id="plasma" viewBox="0 0 500 500"><defs>' +
    '<linearGradient id="plzGrad" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#00FFFF"/><stop offset=".5" stop-color="#7B2FFF"/><stop offset="1" stop-color="#FF00FF"/></linearGradient>' +
    '<linearGradient id="gradTotal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00FFFF"/><stop offset="1" stop-color="#7B2FFF"/></linearGradient>' +
    '<linearGradient id="gradSec" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF00FF"/><stop offset="1" stop-color="#FFFF00"/></linearGradient>' +
    '</defs><path d="M250,40 C360,50 450,140 440,250 C430,360 340,450 230,440 C120,430 40,340 50,230 C60,120 140,30 250,40 Z"/></svg>' +
    '<div class="ringwrap"><svg class="rings" viewBox="0 0 200 200">' +
    '<circle class="ring-bg" cx="100" cy="100" r="92"/><circle id="rTotal" class="ring-fg" cx="100" cy="100" r="92" stroke-dasharray="578" stroke-dashoffset="578"/>' +
    '<circle class="ring-bg" cx="100" cy="100" r="76" style="stroke-width:7"/><circle id="rSec" class="ring-fg" cx="100" cy="100" r="76" stroke-dasharray="477" stroke-dashoffset="477"/>' +
    '<circle id="rEnc" class="ring-fg" cx="100" cy="100" r="60" stroke-dasharray="120 257" stroke-dashoffset="0"/>' +
    '</svg></div>' +
    '<div id="nucleus"><b id="pct">0%</b></div>' +
  '</div>' +
  '<div id="holo"><div class="big" id="holoBig">ĐANG TẢI THỰC TẠI...</div><div class="sub" id="holoSub"></div></div>' +
  '<div id="viz"></div>' +
  '<div id="hud"><span class="pill">SEC <b id="hSec">···</b></span><span class="pill">SYNC <b id="hSync">0%</b></span><span class="pill">NODE <b id="hNode">—</b></span><span class="pill">FPS <b id="hFps">—</b></span></div>' +
  '<button id="mute" title="Bật/tắt âm thanh">🔊</button>' +
  '<button id="gate">TIẾN VÀO HƯ VÔ →</button>' +
  '<canvas id="cv-fx" class="layer"></canvas>' +
  '<div class="vignette"></div>' +
  '<div id="shatter"></div>' +
  '<div id="done"><div class="card"><h1>THỰC TẠI ĐÃ TẢI XONG</h1><p>Chào mừng đến Hư Vô Lượng Tử.<br>Mọi lớp bảo mật đã vượt qua. Mọi hạt đã đồng bộ.</p><p style="color:#8ef">Phiên <b id="sessTx"></b> · Điểm bảo mật <b id="scoreTx"></b></p><button id="gate2" class="pill" style="cursor:pointer">↻ TẢI LẠI THỰC TẠI</button></div></div>';
// warp rings
(() => { const w = $("#warp"); for (let i = 0; i < N(9, 4); i++) { const d = document.createElement("div"); d.className = "ring"; d.style.animationDelay = (-i * 0.36) + "s"; w.appendChild(d); } })();
// viz bars
const viz = $("#viz"), vizBars = [];
for (let i = 0; i < N(48, 20); i++) { const b = document.createElement("i"); viz.appendChild(b); vizBars.push(b); }

/* ---------- 4. audio synth ---------- */
let AC = null, muted = false, analyser = null, vizData = null, humOsc = null;
function audioInit() {
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    analyser = AC.createAnalyser(); analyser.fftSize = 64;
    vizData = new Uint8Array(analyser.frequencyBinCount);
    const master = AC.createGain(); master.gain.value = 0.5;
    analyser.connect(master); master.connect(AC.destination);
    humOsc = AC.createOscillator(); humOsc.type = "sawtooth"; humOsc.frequency.value = 40;
    const humG = AC.createGain(); humG.gain.value = 0.05;
    humOsc.connect(humG); humG.connect(analyser); humOsc.start();
    window.__audio__ = { analyser };
  } catch {}
}
function blip(f, t, type, g) {
  if (!AC || muted) return;
  try {
    const o = AC.createOscillator(), gn = AC.createGain();
    o.type = type || "square"; o.frequency.value = f;
    gn.gain.setValueAtTime(g || 0.06, AC.currentTime);
    gn.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + (t || 0.12));
    o.connect(gn); gn.connect(analyser); o.start(); o.stop(AC.currentTime + (t || 0.12));
  } catch {}
}
function fanfare() {
  if (!AC || muted) return;
  [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => blip(f, 0.4, "triangle", 0.12), i * 110));
}
$("#mute").onclick = () => {
  muted = !muted;
  $("#mute").textContent = muted ? "🔇" : "🔊";
  if (AC) { muted ? AC.suspend() : AC.resume(); }
};

/* ---------- 5. engines ---------- */
function fit(cv) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  cv.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: innerWidth, h: innerHeight };
}
const cvM = $("#cv-matrix"), cvQ = $("#cv-quantum"), cvNr = $("#cv-neural"), cvC = $("#cv-core"), cvFx = $("#cv-fx");
let W = innerWidth, H = innerHeight;
function refit() { W = innerWidth; H = innerHeight; [cvM, cvQ, cvNr, cvC, cvFx].forEach(fit); buildMatrix(); buildQuantum(); buildNeural(); }
addEventListener("resize", refit);

// 5a. matrix rain
let drops = [];
const GLYPHS = "アイウエオカキクケコサシスセソ01ABCDEF量子虚空XYZ#$%";
function buildMatrix() {
  const cols = Math.floor(W / 16);
  drops = Array.from({ length: cols }, () => ({ y: rnd(-H, 0), s: rnd(8, 22) }));
}
function drawMatrix(x) {
  x.fillStyle = "rgba(5,5,8,0.22)"; x.fillRect(0, 0, W, H);
  x.font = "14px 'Share Tech Mono', monospace";
  drops.forEach((d, i) => {
    const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
    const g = x.createLinearGradient(0, d.y - 20, 0, d.y);
    g.addColorStop(0, "#00FFFF"); g.addColorStop(1, "#FF00FF");
    x.fillStyle = g;
    x.fillText(ch, i * 16, d.y);
    d.y += d.s * 0.35 + 1;
    if (d.y > H + 20 && Math.random() < 0.06) { d.y = rnd(-80, 0); d.s = rnd(8, 22); }
  });
}
// 5b. quantum dots (physics-lite)
let dots = [];
function buildQuantum() {
  dots = Array.from({ length: N(1000, 220) }, () => ({
    x: rnd(0, W), y: rnd(0, H), vx: rnd(-0.4, 0.4), vy: rnd(-0.4, 0.4),
    r: rnd(0.6, 2.2), c: Math.random() < 0.5 ? "#00FFFF" : Math.random() < 0.5 ? "#FF00FF" : "#FFFF00",
    m: rnd(0.5, 1.5)
  }));
}
function drawQuantum(x, t) {
  x.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;
  for (const p of dots) {
    // từ trường quanh lõi + trọng lực nhẹ + damping
    const dx = cx - p.x, dy = cy - p.y, d = Math.hypot(dx, dy) || 1;
    const f = clamp(9000 / (d * d), 0, 0.05);
    p.vx += (dx / d) * f * 0.4 + Math.sin(t / 900 + p.y / 90) * 0.008;
    p.vy += (dy / d) * f * 0.4 + Math.cos(t / 1100 + p.x / 90) * 0.008;
    p.vx *= 0.985; p.vy *= 0.985;
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
    x.globalAlpha = 0.75; x.fillStyle = p.c;
    x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill();
  }
  x.globalAlpha = 1;
}
// 5c. neural net
let nodes = [];
function buildNeural() {
  nodes = Array.from({ length: N(200, 60) }, () => ({
    x: rnd(0, W), y: rnd(0, H), vx: rnd(-0.5, 0.5), vy: rnd(-0.5, 0.5)
  }));
}
function drawNeural(x) {
  x.clearRect(0, 0, W, H);
  for (const n of nodes) {
    n.x += n.vx; n.y += n.vy;
    if (n.x < 0 || n.x > W) n.vx *= -1;
    if (n.y < 0 || n.y > H) n.vy *= -1;
  }
  x.lineWidth = 1;
  let links = 0;
  for (let i = 0; i < nodes.length && links < 800; i++) {
    for (let j = i + 1; j < Math.min(nodes.length, i + 14); j++) {
      const a = nodes[i], b = nodes[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      if (dx * dx + dy * dy < 130 * 130) {
        x.strokeStyle = "rgba(0,255,255,0.14)";
        x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
        if (++links >= 800) break;
      }
    }
  }
  x.fillStyle = "#FF00FF";
  for (const n of nodes) { x.fillRect(n.x - 1, n.y - 1, 2, 2); }
}
// 5d. core vortex (torus 500+ hạt chiếu 2D)
const core = Array.from({ length: N(520, 180) }, (_, i) => {
  const a = (i / 520) * Math.PI * 2, b = rnd(0, Math.PI * 2);
  return { a, b, s: rnd(0.5, 1.6) };
});
function drawCore(x, t) {
  x.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2, Rr = Math.min(W, H) * 0.16;
  const rot = t / 1400;
  for (const p of core) {
    const a = p.a + rot, b = p.b + rot * 1.7;
    const X = (Rr + 34 * Math.cos(b)) * Math.cos(a);
    const Y = (Rr + 34 * Math.cos(b)) * Math.sin(a) * 0.62;
    const Z = 34 * Math.sin(b);
    const px = cx + X, py = cy + Y + Math.sin(t / 700) * 4;
    const sc = 1 + Z / 120;
    x.fillStyle = Z > 0 ? "#00FFFF" : "#FF00FF";
    x.globalAlpha = 0.85;
    x.beginPath(); x.arc(px, py, p.s * sc, 0, 7); x.fill();
  }
  x.globalAlpha = 1;
}
// 5e. glitch storm
function glitchStorm() {
  if (reduced) return;
  (function loop() {
    setTimeout(() => {
      document.body.classList.add("glitching");
      blip(rnd(200, 2400), 0.08, "sawtooth", 0.05);
      const fx = cvFx.getContext("2d");
      fx.clearRect(0, 0, W, H);
      for (let i = 0; i < 6; i++) {
        fx.fillStyle = Math.random() < 0.5 ? "#00ffff22" : "#ff00ff22";
        fx.fillRect(rnd(0, W), rnd(0, H), rnd(40, 300), rnd(4, 18));
      }
      setTimeout(() => {
        document.body.classList.remove("glitching");
        fx.clearRect(0, 0, W, H);
      }, rnd(120, 300));
      loop();
    }, rnd(200, 800));
  })();
}

/* ---------- 6. stages + progress ---------- */
const STAGES = [
  [0, "KHỞI TẠO LÕI LƯỢNG TỬ..."],
  [5, "MÃ HÓA CÁC CON ĐƯỜNG THẦN KINH..."],
  [20, "VƯỢT QUA CÁC RÀO CẢN CHIỀU KHÔNG GIAN..."],
  [40, "HIỆU CHỈNH ĐỘNG CƠ THỰC TẠI..."],
  [60, "ĐỒNG BỘ HÓA CÁC PHIÊN BẢN SONG SONG..."],
  [80, "THIẾT LẬP ĐƯỜNG TRUYỀN BẢO MẬT..."],
  [95, "GẦN XONG RỒI... ĐỪNG CHỚP MẮT."],
  [100, "THỰC TẠI ĐÃ SẴN SÀNG."]
];
let progress = 0, secProg = 0;
const holoSub = () => $("#holoSub");
function typeStage(text) {
  const el = holoSub(); el.textContent = "";
  const GL = "!<>-_\\/[]{}—=+*^?#░▒▓";
  let i = 0;
  (function tick() {
    if (i <= text.length) {
      let s = text.slice(0, i);
      if (i < text.length && Math.random() < 0.3) s += GL[(Math.random() * GL.length) | 0];
      el.textContent = s;
      i++;
      setTimeout(tick, 18 + Math.random() * 30);
    } else el.textContent = text;
  })();
}
function stageFor(p) {
  let cur = STAGES[0][1];
  for (const [th, tx] of STAGES) if (p >= th) cur = tx;
  return cur;
}
const C_T = 578, C_S = 477;
function paintRings() {
  $("#rTotal").style.strokeDashoffset = C_T * (1 - progress / 100);
  $("#rSec").style.strokeDashoffset = C_S * (1 - secProg / 100);
  $("#pct").textContent = Math.floor(progress) + "%";
  $("#hSec").textContent = Math.floor(secProg) + "%";
  $("#hSync").textContent = Math.floor(progress) + "%";
}

/* ---------- 7. main loop (adaptive fps) ---------- */
let lastT = performance.now(), fpsA = 60, frames = 0, fpsT = 0;
function loop(t) {
  const dt = Math.min(50, t - lastT); lastT = t;
  fpsA = fpsA * 0.95 + (1000 / Math.max(1, t - (loop._p || t - 16))) * 0.05; loop._p = t;
  if (++frames % 20 === 0) $("#hFps").textContent = Math.round(fpsA);
  drawMatrix(cvM.getContext("2d"));
  drawQuantum(cvQ.getContext("2d"), t);
  drawNeural(cvNr.getContext("2d"));
  drawCore(cvC.getContext("2d"), t);
  // viz bars từ analyser hoặc giả lập theo progress
  let lv = 0;
  if (analyser && vizData && !muted) {
    analyser.getByteFrequencyData(vizData);
    vizBars.forEach((b, i) => {
      const v = vizData[i % vizData.length] / 255;
      b.style.height = (2 + v * 42) + "px"; lv += v;
    });
  } else {
    vizBars.forEach((b, i) => {
      const v = (Math.sin(t / 300 + i * 0.55) * 0.5 + 0.5) * (0.25 + progress / 130);
      b.style.height = (2 + v * 42) + "px";
    });
  }
  // sweep âm cao dần theo progress
  if (AC && !muted && humOsc && frames % 60 === 0) {
    try { humOsc.frequency.value = 40 + progress * 1.2; } catch {}
  }
  requestAnimationFrame(loop);
}

/* ---------- 8. flow: token -> pow -> validate -> load -> reveal ---------- */
const gate = behaviorGate();
async function boot() {
  refit(); paintRings(); typeStage(STAGES[0][1]);
  requestAnimationFrame(loop); glitchStorm();
  $("#hNode").textContent = (location.host || "local") + " · edge";
  const t0 = performance.now();
  // B1: lấy token phiên
  try {
    const r = await fetch("/api/token");
    const j = await r.json();
    if (j.token) {
      SESSION = j.token;
      // B2: fingerprint + PoW (proof-of-work nhiều bước trước khi hiện nội dung)
      const fp = fingerprint();
      fp.mouse = 0; // sẽ cập nhật sau behavior
      const powNonce = await solvePow(j.token, (j.pow && j.pow.challenge) || "0");
      const snap = gate.snapshot();
      fp.mouse = snap.moves > 2 || snap.touch > 0 ? 1 : 0;
      HUMAN = clamp(HUMAN + (snap.moves > 2 ? 20 : 0), 0, 100);
      // B3: validate
      try {
        const v = await fetch("/api/validate", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ token: j.token, fp, powNonce, timing: { dt: performance.now() - t0 } })
        });
        const vj = await v.json();
        SEC_SCORE = vj.score || 0;
      } catch { SEC_SCORE = 55; }
    }
  } catch { /* offline/preview: chạy chế độ local, vẫn full hiệu ứng */ SEC_SCORE = 50; }

  // B4: chạy progress đa giai đoạn, gate bởi behavior (người thật mở khóa nhanh hơn)
  audioInit();
  let lastStage = "";
  await new Promise((resolve) => {
    const iv = setInterval(() => {
      const boost = 0.6 + HUMAN / 140; // người tương tác -> nhanh hơn; bot im lặng -> chậm như skeleton
      progress = clamp(progress + rnd(0.5, 1.6) * boost, 0, 100);
      secProg = clamp(secProg + rnd(0.8, 2.2), 0, 100);
      const st = stageFor(progress);
      if (st !== lastStage) { lastStage = st; typeStage(st); blip(rnd(400, 1200), 0.1, "square", 0.05); }
      paintRings();
      if (progress >= 100 && secProg >= 99) { clearInterval(iv); resolve(); }
    }, 90);
  });
  reveal();
}
function reveal() {
  fanfare();
  $("#holoBig").textContent = "THỰC TẠI ĐÃ SẴN SÀNG";
  // nổ hạt ra ngoài + vỡ kính (canvas fx) rồi fade trang mới
  const fx = cvFx.getContext("2d");
  let k = 0;
  const iv = setInterval(() => {
    fx.clearRect(0, 0, W, H);
    fx.strokeStyle = "#fff"; fx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      fx.beginPath();
      fx.moveTo(W / 2 + rnd(-40, 40), H / 2 + rnd(-40, 40));
      fx.lineTo(W / 2 + rnd(-W, W) * (k / 20), H / 2 + rnd(-H, H) * (k / 20));
      fx.stroke();
    }
    if (++k > 20) {
      clearInterval(iv); fx.clearRect(0, 0, W, H);
      $("#sessTx").textContent = (SESSION || "local-session").slice(0, 13) + "…";
      $("#scoreTx").textContent = (SEC_SCORE || 77) + "/100";
      $("#done").classList.add("show");
      const g = $("#gate"); g.classList.add("show"); g.textContent = "TIẾN VÀO HƯ VÔ →";
      g.onclick = () => { $("#done").classList.add("show"); $("#stage").style.filter = "blur(6px) brightness(.5)"; };
      $("#gate2").onclick = () => location.reload();
      try { document.dispatchEvent(new CustomEvent("quantum:ready")); } catch {}
    }
  }, 50);
}
// user-gesture mở audio (autoplay policy)
addEventListener("pointerdown", function once() { if (AC && AC.state === "suspended") AC.resume(); removeEventListener("pointerdown", once); });
// anti view-source thô: chặn Ctrl+U / F12 hiển thị cảnh báo (không chặn devtools thật, chỉ tăng friction)
addEventListener("keydown", (e) => {
  if ((e.ctrlKey && e.key.toLowerCase() === "u") || e.key === "F12") {
    e.preventDefault();
    typeStage("NIHIL OBSTAT — HÃY NHÌN BẰNG MẮT THƯỜNG. 👁");
  }
});
document.addEventListener("DOMContentLoaded", boot);
})();
