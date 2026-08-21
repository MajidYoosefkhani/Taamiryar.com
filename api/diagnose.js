export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(500).json({ error: "ANTHROPIC_API_KEY missing on server" });
      return;
    }

    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (e) {
        res.status(400).json({ error: "Body is not valid JSON", details: String(e && e.message || e) });
        return;
      }
    }

    const prompt = body && body.prompt;
    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "Missing prompt", gotBody: JSON.stringify(body).slice(0, 200) });
      return;
    }

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1100,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const raw = await upstream.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      res.status(502).json({ error: "Anthropic returned non-JSON", raw: raw.slice(0, 400) });
      return;
    }

    if (!upstream.ok) {
      res.status(upstream.status).json({
        error: (data && data.error && data.error.message) || "Anthropic API error",
        type: (data && data.error && data.error.type) || null,
        anthropicStatus: upstream.status,
      });
      return;
    }

    const text = (data && data.content && data.content[0] && data.content[0].text) || "";
    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({
      error: "Unhandled server error",
      message: String(err && err.message || err),
      stack: err && err.stack ? String(err.stack).slice(0, 500) : null,
    });
  }
}
