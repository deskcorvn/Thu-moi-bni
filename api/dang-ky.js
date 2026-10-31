import { cat, goiSheet } from "./_sheet.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, loi: "chi-nhan-post" });
  const b = req.body || {};
  // Ô bẫy: người thật không thấy ô này, bot điền vào thì giả vờ nhận để nó không thử lại.
  if (b.website) return res.json({ ok: true });

  const o = {
    loai: "dang-ky",
    ho_ten: cat(b.ho_ten, 80),
    sdt: cat(b.sdt, 20),
    email: cat(b.email, 120),
    doanh_nghiep: cat(b.doanh_nghiep, 120),
    linh_vuc: cat(b.linh_vuc, 120),
    buoi_hop: cat(b.buoi_hop, 60),
    thanh_vien: b.thanh_vien === "co" ? "co" : b.thanh_vien === "chua" ? "chua" : "",
    chapter: cat(b.chapter, 80),
    nguoi_moi: cat(b.nguoi_moi, 80),
  };
  const soChuSo = o.sdt.replace(/\D/g, "").length;
  if (!o.ho_ten || soChuSo < 9 || soChuSo > 11 || !o.thanh_vien) {
    return res.status(400).json({ ok: false, loi: "thieu-thong-tin" });
  }

  try {
    const kq = await goiSheet("POST", o);
    return res.status(kq.ok ? 200 : 502).json({ ok: !!kq.ok, loi: kq.ok ? undefined : kq.loi });
  } catch {
    return res.status(502).json({ ok: false, loi: "khong-goi-duoc-sheet" });
  }
}
