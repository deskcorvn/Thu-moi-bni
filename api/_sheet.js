// Cầu nối tới Google Sheet của BNI HD qua Apps Script (apps-script/Code.gs).
// URL web app nằm ở biến môi trường SHEETS_WEBAPP_URL, không bao giờ gửi xuống trình duyệt.

export function cat(v, dai) {
  return String(v ?? "").trim().slice(0, dai);
}

export async function goiSheet(phuongThuc, duLieu) {
  const url = process.env.SHEETS_WEBAPP_URL;
  if (!url) return { ok: false, loi: "chua-cau-hinh-sheet" };
  // Apps Script trả 302 sang googleusercontent.com; fetch tự đi theo và đọc kết quả.
  const r =
    phuongThuc === "GET"
      ? await fetch(url + "?" + new URLSearchParams(duLieu), { redirect: "follow" })
      : await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(duLieu),
          redirect: "follow",
        });
  const chu = await r.text();
  try {
    return JSON.parse(chu);
  } catch {
    return { ok: false, loi: "sheet-tra-ve-khong-phai-json" };
  }
}
