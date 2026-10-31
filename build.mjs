// Dựng thư mời BNI HD vào thư mục public/ (Vercel chạy lệnh này khi deploy).
// Đọc cau-hinh.json, điền vào index.html, nén ảnh, dựng logo, ảnh chia sẻ og.png, ảnh QR và lịch .ics.
import { readFile, writeFile, mkdir, rm, copyFile } from "node:fs/promises";
import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import QRCode from "qrcode";

const CH = JSON.parse(await readFile("cau-hinh.json", "utf8"));
const RA = "public";
await rm(RA, { recursive: true, force: true });
await mkdir(`${RA}/anh`, { recursive: true });

// ---- Ảnh thật của BNI HD (thư mục anh-goc/) ----
// Ảnh album giữ nguyên file gốc, không thu nhỏ hay nén lại (người vận hành yêu cầu giữ đúng chất lượng).
// Riêng ảnh nền đầu trang nằm dưới lớp phủ đỏ nên thu về 1280 điểm ảnh cho trang mở nhanh.
for (const [ten] of CH.album) await copyFile(`anh-goc/${ten}`, `${RA}/anh/${ten}`);
await sharp(`anh-goc/${CH.anhNen}`).resize({ width: 1280 }).jpeg({ quality: 78, mozjpeg: true }).toFile(`${RA}/anh/nen.jpg`);

// ---- Nhạc nền (thư mục nhac/), phát khi khách bấm "Mở thư mời" ----
if (CH.nhacNen) {
  await mkdir(`${RA}/nhac`, { recursive: true });
  await copyFile(`nhac/${CH.nhacNen}`, `${RA}/nhac/${CH.nhacNen}`);
}

// ---- Logo BNI HD: dựng từ logo-bni-hd.svg (xuất từ file PDF gốc người vận hành gửi), thêm bản trắng cho nền đỏ ----
const logoSvg = await readFile("logo-bni-hd.svg", "utf8");
for (const [svg, ten] of [[logoSvg, "bni-hd.png"], [logoSvg.replace(/fill="#[0-9A-Fa-f]+"/g, 'fill="#fff"'), "bni-hd-trang.png"]]) {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 600 } }).render().asPng();
  await sharp(png).trim().png().toFile(`${RA}/anh/${ten}`);
}

// ---- Ảnh chia sẻ 1200x630 cho Zalo, Facebook ----
// Font lấy từ gói npm (bản TTF của Google Fonts, giấy phép OFL), không phụ thuộc mạng lúc dựng.
const THU_MUC_FONT = "node_modules/@expo-google-fonts/be-vietnam-pro/";
const fontFiles = ["700Bold/BeVietnamPro_700Bold.ttf", "500Medium/BeVietnamPro_500Medium.ttf"].map((f) => THU_MUC_FONT + f);
const chuTrang = (await readFile(`${RA}/anh/bni-hd-trang.png`)).toString("base64");
const nenOg = (await sharp(`${RA}/anh/nen.jpg`).resize(1200, 630, { fit: "cover" }).jpeg({ quality: 70 }).toBuffer()).toString("base64");
const svgOg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CF2030" stop-opacity=".94"/><stop offset="1" stop-color="#9c1722" stop-opacity=".97"/></linearGradient></defs>
  <image href="data:image/jpeg;base64,${nenOg}" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1200" height="630" fill="url(#g)"/>
  <image href="data:image/png;base64,${chuTrang}" x="80" y="48" width="150" height="112" preserveAspectRatio="xMinYMid meet"/>
  <text x="80" y="216" font-family="Be Vietnam Pro" font-weight="500" font-size="30" letter-spacing="9" fill="#fff" fill-opacity=".9">THƯ MỜI · BNI HD CHAPTER</text>
  <text x="80" y="302" font-family="Be Vietnam Pro" font-weight="700" font-size="76" fill="#fff">BUỔI HỌP KẾT NỐI</text>
  <text x="80" y="404" font-family="Be Vietnam Pro" font-weight="700" font-size="76" fill="#fff">KINH DOANH</text>
  <rect x="80" y="456" width="476" height="64" rx="12" fill="#fff"/>
  <text x="318" y="499" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="29" letter-spacing="2" fill="#CF2030">SÁNG THỨ BA HÀNG TUẦN</text>
  <text x="80" y="572" font-family="Be Vietnam Pro" font-weight="500" font-size="30" fill="#fff">${CH.gioBatDau ? `${CH.gioBatDau} – ${CH.gioKetThuc} · ` : ""}${CH.tenDiaDiem}</text>
</svg>`;
const og = new Resvg(svgOg, { font: { fontFiles, loadSystemFonts: false, defaultFontFamily: "Be Vietnam Pro" } }).render().asPng();
await writeFile(`${RA}/anh/og.png`, await sharp(og).png({ palette: true, quality: 90 }).toBuffer());

// ---- Mã QR chuyển khoản: dựng lại từ chuỗi VietQR trong ảnh người vận hành gửi (đã đọc và kiểm mã CRC) ----
const CK = CH.chuyenKhoan;
const qr = QRCode.create(CK.maQR, { errorCorrectionLevel: "M" });
const n = qr.modules.size, o = 440 / n;
let o2 = "";
for (let y = 0; y < n; y++) for (let x = 0; x < n; x++)
  if (qr.modules.get(x, y)) o2 += `<rect x="${(90 + x * o).toFixed(2)}" y="${(96 + y * o).toFixed(2)}" width="${(o + 0.4).toFixed(2)}" height="${(o + 0.4).toFixed(2)}"/>`;
const svgQr = `<svg xmlns="http://www.w3.org/2000/svg" width="620" height="760" viewBox="0 0 620 760">
  <rect width="620" height="760" rx="28" fill="#fff"/>
  <text x="310" y="62" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="500" font-size="24" fill="#64666A">Quét mã để chuyển phí tham dự</text>
  <g fill="#111">${o2}</g>
  <text x="310" y="610" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="34" fill="#2b2c2e">${CK.ten}</text>
  <text x="310" y="660" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="30" fill="#CF2030">${CK.soTaiKhoan} – ${CK.nganHang}</text>
</svg>`;
const anhQr = new Resvg(svgQr, { font: { fontFiles, loadSystemFonts: false, defaultFontFamily: "Be Vietnam Pro" } }).render().asPng();
await writeFile(`${RA}/anh/qr.png`, await sharp(anhQr).png({ palette: true }).toBuffer());

// ---- Lịch lặp lại hằng tuần cho iPhone, Outlook ----
const THU_ICS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][CH.thuHop];
const homNay = new Date(Date.now() + 7 * 3600e3);
const dau = new Date(Date.UTC(homNay.getUTCFullYear(), homNay.getUTCMonth(), homNay.getUTCDate() + ((CH.thuHop - homNay.getUTCDay() + 7) % 7)));
const ymd = (x) => x.toISOString().slice(0, 10).replace(/-/g, "");
// Ghi giờ UTC (đuôi Z) để mọi ứng dụng lịch hiểu đúng mà không cần khối VTIMEZONE.
const gioIcs = (x, hhmm) => { const [h, m] = hhmm.split(":").map(Number); return new Date(x.getTime() + ((h - 7) * 60 + m) * 60e3).toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z"; };
const dongIcs = CH.gioBatDau
  ? [`DTSTART:${gioIcs(dau, CH.gioBatDau)}`, `DTEND:${gioIcs(dau, CH.gioKetThuc || CH.gioBatDau)}`]
  : [`DTSTART;VALUE=DATE:${ymd(dau)}`, `DTEND;VALUE=DATE:${ymd(new Date(dau.getTime() + 864e5))}`];
const ics = [
  "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BNI HD//Thu moi//VI", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
  "BEGIN:VEVENT", "UID:hop-tuan-bni-hd@thumoi-bnihd.giftytech.com", `DTSTAMP:${ymd(new Date())}T000000Z`,
  ...dongIcs, `RRULE:FREQ=WEEKLY;BYDAY=${THU_ICS}`,
  "SUMMARY:Buổi họp kết nối kinh doanh · BNI HD Chapter",
  `LOCATION:${(CH.tenDiaDiem + ", " + CH.diaChi).replace(/,/g, "\\,")}`, `DESCRIPTION:Thư mời: ${CH.tenMien}`,
  "END:VEVENT", "END:VCALENDAR", "",
].join("\r\n");
await writeFile(`${RA}/lich-hop.ics`, ics);

// ---- Trang: điền cấu hình vào index.html ----
const thoat = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Chưa xác nhận được Ban điều hành thì để mảng rỗng: trang bỏ hẳn mục này, không hiện tên sai.
const the = (cv, ten, cty) => `<div class="r">${cv ? `<small>${thoat(cv)}</small>` : ""}<b>${thoat(ten)}${cty ? `<span>${thoat(cty)}</span>` : ""}</b></div>`;
const nhom = (tieuDe, ds) => ds.length ? `    <p class="r bdh-nhom">${tieuDe}</p>\n    <div class="bdh">${ds.join("")}</div>\n` : "";
const banDieuHanh =
  nhom("Ban điều hành Chapter:", CH.banDieuHanh.map(([cv, ten, cty]) => the(cv, ten, cty))) +
  nhom("Ban hỗ trợ khách mời:", (CH.banKhachMoi || []).map(([ten, cty]) => the("", ten, cty)));
const chuongTrinh = CH.chuongTrinh.length
  ? `  <section class="xam" id="chuong-trinh">
    <p class="nhan r">Chương trình</p>
    <h2 class="r" data-vua><span class="d">Nội dung <b>chương trình</b></span></h2>
    <div class="vach r"></div>
    <div class="ct">` +
    CH.chuongTrinh.map(([tu, den, ds]) => `<div class="muc r"><div class="gio">${tu}<small>đến ${den}</small></div><ul>${ds.map((x) => `<li>${thoat(x)}</li>`).join("")}</ul></div>`).join("") +
    `</div>\n  </section>\n`
  : "";
// Mục thứ ba "tron-anh": hiện trọn ảnh (sơ đồ, poster) thay vì cắt cho đầy khung.
const album = CH.album.map(([f, alt, kieu]) => `<figure${kieu ? ` class="${kieu}"` : ""}><img src="anh/${f}" alt="${thoat(alt)}" loading="lazy"></figure>`).join("\n      ");
const dauTick = `<i><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M5 12l5 5 9-10"/></svg></i>`;
const luuY = CH.luuY.length
  ? `      <div class="luu-y r"><p style="font-weight:700;color:var(--chu)">Lưu ý tham dự:</p><ul class="loi-ich">${CH.luuY.map((x) => `<li>${dauTick}${thoat(x)}</li>`).join("")}</ul></div>\n`
  : "";
const choBrowser = { thuHop: CH.thuHop, gioBatDau: CH.gioBatDau, gioKetThuc: CH.gioKetThuc, tenDiaDiem: CH.tenDiaDiem, diaChi: CH.diaChi, diaDiemNgan: CH.diaDiemNgan, zaloHienThi: CH.zaloHienThi };
let trang = await readFile("index.html", "utf8");
trang = trang
  .replace("/*GIAO_DIEN*/", await readFile("giao-dien.css", "utf8"))
  .replace("{{BAN_DIEU_HANH}}", banDieuHanh)
  .replace("{{CHUONG_TRINH}}", chuongTrinh)
  .replace("{{LUU_Y}}", luuY)
  .replace("{{ALBUM}}", album)
  .replace("{{CAU_HINH_JSON}}", JSON.stringify(choBrowser).replace(/</g, "\\u003c"))
  .replace(/\{\{timBanDoUrl\}\}/g, encodeURIComponent(CH.timBanDo))
  .replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in CH)) throw new Error(`index.html dùng {{${k}}} nhưng cau-hinh.json không có`);
    return thoat(CH[k]);
  });
await writeFile(`${RA}/index.html`, trang);
console.log("Xong: public/index.html, anh/, lich-hop.ics");
