# 🌐 QUANTUM VOID LOADER — Hướng dẫn triển khai Vercel

> Cyberpunk Hư Vô × Quantum × Divine. Full-stack fortress, chạy được trên gói **Vercel Free**, không ảnh ngoài, 60fps+ cả mobile.

## ① Cấu trúc bàn giao

```
/
├── index.html          ← shell bootstrap tối giản, payload XOR+base64 (tự chứa, đã build)
├── vercel.json         ← headers pháo đài + rewrites bẫy raw
├── middleware.js       ← Edge Middleware: chặn UA curl/headless/AI, cấp cookie __ft
├── api/
│   ├── token.js        ← Edge: cấp token phiên dùng một lần + thử thách PoW
│   ├── validate.js     ← Edge: chấm điểm fingerprint + verify PoW/token
│   └── honeypot.js     ← Edge: bẫy bot, log + trả dữ liệu giả
├── src/
│   ├── loader.js       ← JS loader bản gốc (tham khảo, chưa obfuscate)
│   └── styles.css      ← CSS đầy đủ (tham khảo)
├── build-index.js      ← script rebuild index.html từ src/*
└── README-DEPLOY.md    ← file này
```

> `index.html` là artifact đã build từ `src/*`. Muốn sửa hiệu ứng: sửa `src/loader.js` / `src/styles.css` rồi chạy `node build-index.js`.

## ② Triển khai (2 phút)

**Cách A — Vercel CLI:**
```bash
npm i -g vercel
cd "anti raw rebuild"
vercel --prod
```

**Cách B — GitHub → Vercel Dashboard:**
1. Push thư mục này lên repo GitHub.
2. Vercel → Add New → Project → Import repo.
3. Framework Preset: **Other**. Build Command: *(trống)*. Output: `./`.
4. Deploy. Domain nhận được dạng `*.vercel.app` — CORS fortress đã whitelist sẵn pattern này.

**Biến môi trường (khuyến nghị):**
- `FORTRESS_SECRET` = chuỗi ngẫu nhiên dài (VD: `openssl rand -hex 32`). Cả 3 API + middleware dùng chung để ký token. Không đặt cũng chạy (fallback `quantum-void-v1`).

## ③ Kiểm tra sau deploy

| Test | Cách làm | Kết quả đúng |
|---|---|---|
| Người thật | Mở bằng Chrome/Edge/Safari | Full 10 hiệu ứng, 8 giai đoạn, reveal ở 100% |
| Anti-curl | `curl -A "curl/8.0" https://<app>.vercel.app/` | Trang mồi “ĐANG KHỞI TẠO…” (không nội dung thật) |
| Anti-AI UA | `curl -A "GPTBot/1.0" https://<app>.vercel.app/` | Trang mồi + log `[honeypot] blocked` |
| Anti-fetch | Mở console, `fetch("https://example.com")` | `403 { poison: "0xDEADBEEF" }` + hit `/api/honeypot?kind=fetch` |
| Honeypot | `GET /api/honeypot?kind=raw` | JSON giả + header `x-honeypot: 1` |
| Token | `GET /api/token` | `{ token, pow }` |
| Raw view | Mở view-source | Chỉ thấy skeleton + base64, không HTML/CSS/JS đọc được |

## ④ Tinh chỉnh nhanh

- **Giảm hiệu ứng cho máy yếu:** quality scaler `Q` trong `src/loader.js` tự hạ (mobile ×0.55, reduced-motion ×0.25). Muốn ép nhẹ thêm: giảm `1000 → 400` ở `buildQuantum`, `520 → 250` ở core vortex.
- **Đổi text giai đoạn:** mảng `STAGES` trong `src/loader.js`.
- **Màu sắc:** `:root` trong `src/styles.css` (`--cyan`, `--mag`, `--ylw`, `--vio`).
- **Tắt âm thanh mặc định:** đặt `muted = true` ban đầu trong `src/loader.js`.
- **Chặn geo (tùy chọn):** thêm vào `middleware.js`: `req.geo?.country === "XX"` → trả decoy.

## ⑤ Lưu ý trung thực về giới hạn

- “Chống scrape tuyệt đối” không tồn tại: mọi thứ render phía client đều có thể bị headless-browser đầy đủ (Playwright thật + GPU + mouse) vượt qua. Pháo đài này **tăng chi phí scrape lên hàng chục lần** (token+PoW+fingerprint+behavior+rate tại edge) và **đầu độc dataset AI** (meta giả, honeypot, CSS-content, canvas-text), chứ không hứa hẹn bất khả xâm phạm 100%.
- TLS fingerprint “qua Edge” ở gói free chỉ đọc được headers (`User-Agent`, `Accept`, `x-forwarded-*`); JA3 fingerprint đầy đủ cần Vercel Enterprise / Cloudflare phía trước.
- SharedArrayBuffer + cross-origin isolation **đã lược bỏ** để tương thích free-tier (cần `COOP/COEP` headers sẽ phá Google Fonts). Vật lý hạt chạy single-thread Canvas 2D, vẫn 60fps nhờ adaptive quality.
