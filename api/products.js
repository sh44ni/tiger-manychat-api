// /api/products.js
export default async function handler(req, res) {
  try {
    const url = process.env.SHEET_CSV_URL;
    const r = await fetch(url);
    const csv = await r.text();

    // Split a CSV row by commas that are NOT inside quotes
    const splitSafe = (line) =>
      line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/g).map((s) => {
        // trim + remove wrapping quotes
        const t = s.trim();
        return t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1) : t;
      });

    const lines = csv.trim().split(/\r?\n/);
    const headers = splitSafe(lines.shift());

    const rows = lines.map((line) => {
      const cols = splitSafe(line);
      const obj = {};
      headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
      return obj;
    });

    // helper: split multi-values robustly (supports comma, ;, /, |)
    const toList = (v) =>
      String(v || "")
        .split(/[;,|/]/)
        .map((x) => x.trim())
        .filter(Boolean);

    const products = rows.map((row) => ({
      model_name: row.model_name || "",
      price_jod: Number(row.price_jod || 0),
      image_url: (row.image_url || "").trim(),
      product_url: (row.product_url || "").trim(),
      sizes: toList(row.sizes),
      colors: toList(row.colors),
    })).filter(p => p.model_name); // drop empty rows

    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    res.status(200).json({ ok: true, total: products.length, products });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Failed to load sheet" });
  }
}
