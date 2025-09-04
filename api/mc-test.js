// api/mc-test.js
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    version: "v2",
    content: [
      {
        type: "cards",
        elements: [
          {
            title: "Tiger Test",
            subtitle: "If you see this, dynamic works",
            image_url: "https://via.placeholder.com/800x800?text=Tiger",
            buttons: [{ type: "text", caption: "OK", text: "ok" }]
          }
        ]
      }
    ]
  });
}
