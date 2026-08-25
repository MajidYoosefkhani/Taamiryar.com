export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: "GEMINI_API_KEY missing on server" });
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
      res.status(400).json({ error: "Missing prompt" });
      return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const raw = await upstream.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      res.status(502).json({ error: "Gemini returned non-JSON", raw: raw.slice(0, 400) });
      return;
    }

    if (!upstream.ok) {
      res.status(upstream.status).json({
        error: (data && data.error && data.error.message) || "Gemini API error",
        geminiStatus: upstream.status,
      });
      return;
    }

    const text =
      (data &&
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text) ||
      "";

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({
      error: "Unhandled server error",
      message: String(err && err.message || err),
    });
  }
}
