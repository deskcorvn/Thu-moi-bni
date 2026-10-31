# Thư mời BNI HD

Trang thư mời dự buổi họp kết nối kinh doanh sáng thứ Ba của BNI HD Chapter:
https://thumoi-bnihd.giftytech.com (dự án Vercel `thu-moi-bni-hd`).

## Sửa nội dung

Mọi thông tin hiển thị (giờ họp, địa điểm, chương trình, phí, mã QR, Ban điều hành, Ban Khách mời,
người gửi lời mời, số Zalo) nằm trong `cau-hinh.json`. Sửa file đó rồi deploy lại, không cần đụng
`index.html`.

- Để trống `gioBatDau` thì trang không hiện giờ và không đếm ngược.
- Để mảng `banDieuHanh` hoặc `banKhachMoi` rỗng thì trang bỏ hẳn mục đó.
- `maQR` là chuỗi VietQR đọc từ ảnh QR của chủ tài khoản. Đổi tài khoản thì đọc lại chuỗi mới và kiểm
  mã CRC ở 4 ký tự cuối.

## Cấu trúc

| File | Việc |
|---|---|
| `index.html` | Khung trang, có chỗ `{{khoa}}` để điền từ `cau-hinh.json` |
| `giao-dien.css` | Giao diện, được chèn thẳng vào trang khi build |
| `build.mjs` | Chạy khi deploy: điền cấu hình, dựng logo, ảnh chia sẻ `og.png`, ảnh QR, file lịch `.ics`, ra thư mục `public/` |
| `anh-goc/` | Ảnh thật của BNI HD; `album` và `anhNen` trong `cau-hinh.json` chọn ảnh nào hiện ở đâu |
| `logo-bni-hd.svg` | Logo BNI HD xuất từ file PDF gốc; build dựng bản màu và bản trắng |
| `api/dang-ky.js`, `api/loi-chuc.js` | Nhận đăng ký khách mời và lời nhắn, chuyển sang Google Sheet |
| `apps-script/Code.gs` | Mã dán vào Apps Script của Google Sheet (hướng dẫn ở đầu file) |

Biến môi trường trên Vercel: `SHEETS_WEBAPP_URL`, là URL `/exec` của Apps Script. Bản triển khai Apps
Script phải để "Người có quyền truy cập: Bất kỳ ai".

## Chạy thử trên máy

```bash
npm install
node build.mjs
```

Mở `public/index.html` qua một máy chủ tĩnh bất kỳ. Phần đăng ký và lời nhắn chỉ chạy trên Vercel.
