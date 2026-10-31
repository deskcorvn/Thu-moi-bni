import { cat, goiSheet } from "./_sheet.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const kq = await goiSheet("GET", { loai: "loi-chuc" });
      // Lời nhắn mới hiện sau tối đa 30 giây; đỡ gọi Sheet mỗi lượt khách mở trang.
      res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=300");
      return res.json({ ok: !!kq.ok, ds: kq.ok ? kq.ds : [] });
    }
    if (req.method !== "POST") return res.status(405).json({ ok: false });

    const b = req.body || {};
    const ten = cat(b.ten, 60);
    const loi = cat(b.loi, 300);
    if (b.website) return res.json({ ok: true, muc: { ten, loi, gio: "" } });
    if (!ten || !loi) return res.status(400).json({ ok: false, loi: "thieu-thong-tin" });

    const kq = await goiSheet("POST", { loai: "loi-chuc", ten, loi });
    return res.status(kq.ok ? 200 : 502).json(kq.ok ? { ok: true, muc: kq.muc } : { ok: false, loi: kq.loi });
  } catch {
    return res.status(502).json({ ok: false, loi: "khong-goi-duoc-sheet" });
  }
}
