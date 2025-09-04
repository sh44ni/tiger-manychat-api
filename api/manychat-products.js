// api/manychat-products.js

const PLACEHOLDER_IMG =
  "https://via.placeholder.com/800x800?text=Tiger+Footwear";

export default async function handler(req, res) {
  try {
    // Fetch your existing API
    const apiRes = await fetch(
      "https://tiger-manychat-api-ji6m-hbp2vxw8f-imzeeshankhann-8573s-projects.vercel.app/api/products"
    );
    const data = await apiRes.json();

    const products = Array.isArray(data?.products) ? data.products : [];

    // Build ManyChat v2 cards (max 10 cards at once)
    const elements = products.slice(0, 10).map((p) => {
      const title = p.model_name || "Unnamed Product";
      const price = Number(p.price_jod || 0);
      const subtitle = `${price} JOD`;
      const image_url =
        p.image_url && p.image_url.length > 0 ? p.image_url : PLACEHOLDER_IMG;

      return {
        title,
        subtitle,
        image_url,
        buttons: [
          {
            type: "flow",
            caption: "Choose This",
            target: "Tiger • Pick Size", // name this exactly like your ManyChat next step
            payload: {
              tf_model: title,
              tf_price: price,
              tf_image: image_url,
              tf_url: p.product_url || "",
              tf_sizes: p.sizes || [],
              tf_colors: p.colors || []
            }
          }
        ]
      };
    });

    res.status(200).json({
      version: "v2",
      content: [
        {
          type: "cards",
          elements
        }
      ]
    });
  } catch (err) {
    res.status(200).json({
      version: "v2",
      content: [
        {
          type: "cards",
          elements: [
            {
              title: "⚠️ Products unavailable",
              subtitle: "Please try again later",
              image_url: PLACEHOLDER_IMG,
              buttons: [{ type: "text", caption: "Start Over", text: "shop" }]
            }
          ]
        }
      ]
    });
  }
}
