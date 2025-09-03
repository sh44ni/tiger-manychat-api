// /api/products.js
export default async function handler(req, res) {
  try {
    const url = process.env.SHEET_CSV_URL; // Google Sheets CSV URL
    const r = await fetch(url);
    const csv = await r.text();

    // basic CSV parser
    const lines = csv.trim().split(/\r?\n/);
    const headers = lines.shift().split(",").map(h => h.trim());
    const rows = lines.map(line => {
      const cols = line.split(",").map(c => c.trim());
      const obj = {};
      headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
      return obj;
    });

    const products = rows.map(row => ({
      model_name: row.model_name || "",
      price_jod: Number(row.price_jod || 0),
      image_url: row.image_url || "",
      product_url: row.product_url || "",
      sizes: (row.sizes || "").split(",").map(s => s.trim()).filter(Boolean),
      colors: (row.colors || "").split(",").map(c => c.trim()).filter(Boolean),
    }));

    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    res.status(200).json({ ok: true, total: products.length, products });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Failed to load sheet" });
  }
}
