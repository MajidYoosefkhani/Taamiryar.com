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

    const imageBase64 = body && body.image; // raw base64, no data: prefix
    const mimeType = (body && body.mimeType) || "image/jpeg";
    const cityHint = (body && body.cityHint) || "";
    const categoriesHint = (body && body.categoriesHint) || "";

    if (!imageBase64 || typeof imageBase64 !== "string") {
      res.status(400).json({ error: "Missing image" });
      return;
    }

    const prompt = `این عکس تابلوی سردر یک مغازه یا تعمیرگاه است. متن روی تابلو، شماره تلفن، آدرس یا هر نشانه‌ی دیگری که دیده می‌شود را بخوان و اطلاعات زیر را استخراج کن.

خروجی را فقط و فقط به‌صورت یک JSON خام و معتبر بده، بدون هیچ متن اضافه، بدون backtick، بدون توضیح قبل یا بعد از آن. دقیقاً با این ساختار:

{
  "name": "نام مغازه یا تعمیرگاه (اگر روی تابلو نوشته شده)",
  "phone": "شماره تلفن (اگر دیده می‌شود، فقط اعداد و بدون فاصله)",
  "address": "آدرس یا نشانی (اگر روی تابلو نوشته شده)",
  "workingHours": "ساعت کاری (اگر روی تابلو نوشته شده، مثلاً از ۹ صبح تا ۸ شب)",
  "categories": ["یک یا چند دسته از این لیست که با نوع کسب‌وکار مطابقت دارد: ${categoriesHint}"],
  "confidence": "high یا medium یا low بسته به میزان وضوح عکس"
}

اگر مقداری قابل تشخیص نبود، آن فیلد را رشته خالی "" بگذار (برای categories آرایه خالی []). شهر احتمالی کسب‌وکار ${cityHint ? "احتمالاً " + cityHint + " است، مگر خلاف آن روی تابلو نوشته شده باشد." : "را حدس نزن مگر روی تابلو نوشته شده باشد."}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0.2 },
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

    // Strip potential markdown code fences before parsing
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "");

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      res.status(502).json({ error: "Could not parse AI response as JSON", raw: cleaned.slice(0, 400) });
      return;
    }

    res.status(200).json({ result: parsed });
  } catch (err) {
    res.status(500).json({
      error: "Unhandled server error",
      message: String(err && err.message || err),
    });
  }
}
