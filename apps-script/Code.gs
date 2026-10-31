/**
 * Google Apps Script cho thư mời BNI HD.
 * Cách cài (một lần, khoảng 5 phút):
 *  1. Tạo một Google Sheet mới, ví dụ "Thư mời BNI HD".
 *  2. Tiện ích mở rộng > Apps Script, xóa mã mẫu, dán toàn bộ file này, bấm Lưu.
 *  3. Triển khai > Tùy chọn triển khai mới > Loại: Ứng dụng web.
 *     Thực thi dưới dạng: Tôi. Người có quyền truy cập: Bất kỳ ai. Bấm Triển khai, cấp quyền.
 *  4. Chép URL kết thúc bằng /exec, dán vào biến SHEETS_WEBAPP_URL của dự án Vercel thu-moi-bni-hd.
 * Hai tab DangKy và LoiNhan tự tạo ở lượt ghi đầu tiên.
 * Muốn ẩn một lời nhắn khỏi trang: gõ x vào cột "Ẩn" của dòng đó.
 */
var SO = SpreadsheetApp.getActiveSpreadsheet();
var COT_DK = ['Thời gian', 'Họ và tên', 'Số điện thoại', 'Email', 'Doanh nghiệp', 'Lĩnh vực',
  'Đã là thành viên BNI', 'Chapter', 'Người mời', 'Buổi họp muốn dự', 'Ghi chú'];
var COT_LN = ['Thời gian', 'Họ và tên', 'Lời nhắn', 'Ẩn (gõ x để ẩn)'];

function tab(ten, cot) {
  var s = SO.getSheetByName(ten);
  if (!s) { s = SO.insertSheet(ten); s.appendRow(cot); s.setFrozenRows(1); }
  return s;
}
function gio() { return Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'HH:mm · dd/MM/yyyy'); }
// Chặn chữ bắt đầu bằng = + - @ bị Sheet hiểu thành công thức.
function sach(v) { v = String(v || ''); return /^[=+\-@]/.test(v) ? "'" + v : v; }
function tra(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doPost(e) {
  var khoa = LockService.getScriptLock();
  khoa.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents), t = gio();
    if (d.loai === 'dang-ky') {
      tab('DangKy', COT_DK).appendRow([t, sach(d.ho_ten), "'" + String(d.sdt || ''), sach(d.email),
        sach(d.doanh_nghiep), sach(d.linh_vuc), d.thanh_vien === 'co' ? 'Có' : 'Chưa',
        sach(d.chapter), sach(d.nguoi_moi), sach(d.buoi_hop), '']);
      return tra({ ok: true });
    }
    if (d.loai === 'loi-chuc') {
      tab('LoiNhan', COT_LN).appendRow([t, sach(d.ten), sach(d.loi), '']);
      return tra({ ok: true, muc: { ten: d.ten, loi: d.loi, gio: t } });
    }
    return tra({ ok: false, loi: 'sai-loai' });
  } catch (err) {
    return tra({ ok: false, loi: String(err) });
  } finally {
    khoa.releaseLock();
  }
}

function doGet(e) {
  if (e.parameter.loai !== 'loi-chuc') return tra({ ok: false, loi: 'sai-loai' });
  var s = tab('LoiNhan', COT_LN), n = s.getLastRow();
  if (n < 2) return tra({ ok: true, ds: [] });
  var ds = s.getRange(2, 1, n - 1, 4).getDisplayValues()
    .filter(function (r) { return !String(r[3]).trim(); })
    .map(function (r) { return { gio: r[0], ten: String(r[1]).replace(/^'/, ''), loi: String(r[2]).replace(/^'/, '') }; })
    .reverse().slice(0, 100);
  return tra({ ok: true, ds: ds });
}
