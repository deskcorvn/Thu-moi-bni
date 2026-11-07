// Tạo mã QR trỏ tới trang thư mời, có logo BNI HD ở giữa.
// Chạy từ thư mục gốc repo:  node qr/tao-qr.mjs
// Địa chỉ lấy từ "tenMien" trong cau-hinh.json, logo lấy từ logo-bni-hd.svg.
import { readFile, writeFile } from "node:fs/promises";
import QRCode from "qrcode";
import { Resvg } from "@resvg/resvg-js";

const CH = JSON.parse(await readFile("cau-hinh.json", "utf8"));
const url = CH.tenMien;

// Mức sửa lỗi H (khôi phục được tới 30%) để có chỗ cho logo ở giữa.
const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
const n = qr.modules.size;
const LE = 4; // vùng trắng quanh mã, tính bằng ô (chuẩn tối thiểu là 4)
const O = 20; // cạnh một ô, đơn vị SVG
const canh = (n + 2 * LE) * O;

// Logo: lấy các đường vẽ trong logo-bni-hd.svg, cắt sát nét chữ.
const svgLogo = await readFile("logo-bni-hd.svg", "utf8");
const duongLogo = [...svgLogo.matchAll(/<path[^>]*\/>/g)].map((m) => m[0]).join("");
const [lx, ly, lw, lh] = [11.4, 8.0, 144.9, 107.6]; // khung bao quanh logo trong file gốc

// Khung trắng giữa mã: logo rộng khoảng 1/4 cạnh mã, cộng viền trắng.
const rongLogo = Math.round(n * 0.26) * O;
const caoLogo = (rongLogo * lh) / lw;
const vien = 1.2 * O;
const khungW = rongLogo + 2 * vien;
const khungH = caoLogo + 2 * vien;
const khungX = (canh - khungW) / 2;
const khungY = (canh - khungH) / 2;

// Ô nào nằm dưới khung thì bỏ, đếm tỉ lệ ô bị che để kiểm.
let che = 0, tong = 0;
const biChe = (x, y) => {
  const px = (x + LE) * O, py = (y + LE) * O;
  return px + O > khungX && px < khungX + khungW && py + O > khungY && py < khungY + khungH;
};
function duongO(mau) {
  let d = "";
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (!qr.modules.get(x, y)) continue;
      tong++;
      if (biChe(x, y)) { che++; continue; }
      d += `M${(x + LE) * O} ${(y + LE) * O}h${O}v${O}h-${O}z`;
    }
  return `<path fill="${mau}" d="${d}"/>`;
}

function dungSvg(mau) {
  che = 0; tong = 0;
  const modules = duongO(mau);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canh}" height="${canh}" viewBox="0 0 ${canh} ${canh}" shape-rendering="crispEdges">
<rect width="${canh}" height="${canh}" fill="#fff"/>
${modules}
<rect x="${khungX}" y="${khungY}" width="${khungW}" height="${khungH}" rx="${O * 1.4}" fill="#fff"/>
<svg x="${khungX + vien}" y="${khungY + vien}" width="${rongLogo}" height="${caoLogo}" viewBox="${lx} ${ly} ${lw} ${lh}">${duongLogo}</svg>
</svg>
`;
}

const BIEN = [
  ["do", "#CF2030"], // đỏ BNI, hợp thương hiệu
  ["den", "#111111"], // đen, dự phòng cho máy quét cũ hoặc in đơn sắc
];
for (const [ten, mau] of BIEN) {
  const svg = dungSvg(mau);
  await writeFile(`qr/qr-thu-moi-bni-hd-${ten}.svg`, svg);
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 2000 } }).render().asPng();
  await writeFile(`qr/qr-thu-moi-bni-hd-${ten}.png`, png);
}
console.log(`URL: ${url}`);
console.log(`Mã ${n}x${n} ô, mức sửa lỗi H. Ô bị logo che: ${che}/${tong} (${((che / tong) * 100).toFixed(1)}% số ô đen)`);
