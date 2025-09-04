// api/manychat-products-from-sheet.js

// 1) DROP YOUR PUBLISHED SHEET LINK HERE (the one you sent)
const SHEET_PUBHTML =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSMgw4nMQpbSyrtykmAWQL2Jtyf6ImoQEBWT8VlK-0UJDzUkCMct1tcafLVIOVml4LsbRcyinz3K2a5/pubhtml";

// 2) We'll convert the pubhtml link to CSV automatically:
function toCsvUrl(pubhtml) {
  // if it's a /pubhtml, swap to /pub?output=csv
  if (pubhtml.includes("/pubhtml")) {
    return pubhtml.replace("/pubhtml", "/pub?output=csv");
  }
  // fallback: just return as-is
  return pubhtml;
}

const PLACEHOLDER_IMG =
  "https://via.placeholder.com/800x800?text=Tiger+Footwear";

export default async function handler(req, res) {
  try {
    const csvUrl = toCsvUrl(SHEET_PUBHTML);

    const r = await fetch(csvUrl, { cache: "no-store" });
    if (!r.ok) {
      const t = await r.text();
      console.error("Sheet fetch failed:", r.status, t?.slice(0, 300));
      return sendFallback(res, "Sheet fetch error " + r.status);
    }

    const csv = await r.text();
    const rows = parseCSV(csv);
    if (!rows.length) {
      return sendFallback(res, "Empty sheet");
    }

    // Expect headers similar to:
    // model_name | price_jod | image_url | product_url | sizes | colors
    const header = rows[0].map(n => (n || "").toLowerCase().trim());
    const getIdx = (name) => header.indexOf(name);

    const iModel = getIdx("model_name");
    const iPrice = getIdx("price_jod");
    const iImage = getIdx("image_url");
    const iUrl   = getIdx("product_url");
    const iSizes = getIdx("sizes");
    const iColors= getIdx("colors");

    const dataRows = rows.slice(1).filter(r => (r[iModel] || "").trim().length);

    const elements = dataRows.slice(0, 10).map(row => {
      const title = (row[iModel] || "").trim();
      const price = Number(row[iPrice] || 0);
      const image = (row[iImage] || "").trim() || PLACEHOLDER_IMG;
      const url   = (row[iUrl] || "").trim();
      const sizes = splitMulti(row[iSizes]);
      const colors= splitMulti(row[iColors]);

      return {
        title,
        subtitle: `${price} JOD`,
        image_url: image,
        buttons: [
          {
            type: "flow",
            caption: "Choose This",
            target: "Tiger • Pick Size", // must match your ManyChat step name
            payload: {
              tf_model: title,
              tf_price: price,
              tf_image: image,
              tf_url: url,
              tf_sizes: sizes,
              tf_colors: colors
            }
          }
        ]
      };
    });

    return res.status(200).json({
      version: "v2",
      content: [{ type: "cards", elements }]
    });
  } catch (e) {
    console.error("manychat-products-from-sheet error:", e);
    return sendFallback(res, "Exception");
  }
}

function sendFallback(res, note) {
  return res.status(200).json({
    version: "v2",
    content: [
      {
        type: "cards",
        elements: [
          {
            title: "⚠️ Products unavailable",
            subtitle: `Please try again later (${note})`,
            image_url: PLACEHOLDER_IMG,
            buttons: [{ type: "text", caption: "Start Over", text: "shop" }]
          }
        ]
      }
    ]
  });
}

// --- helpers ---

// tolerant CSV parser (handles quotes)
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(cur);
        cur = "";
      } else if (c === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else if (c === "\r") {
        // ignore CR
      } else {
        cur += c;
      }
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

// split "40,41,42" or "Multiple" safely
function splitMulti(val) {
  if (!val) return [];
  const s = String(val).trim();
  if (!s) return [];
  // If it's literally "Multiple" or similar, just return empty -> we will ask fixed options later
  if (/^multiple$/i.test(s)) return [];
  // Accept comma or slash separated
  return s.split(/[,\u066B\/|]/).map(x => x.trim()).filter(Boolean);
}
