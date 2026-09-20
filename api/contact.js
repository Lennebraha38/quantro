const { supabaseFetch, rateLimiter, clientIp, readJson } = require("./_lib");

const limiter = rateLimiter(8, 15 * 60 * 1000);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ error: "method" });
    return;
  }
  if (!limiter(clientIp(req))) {
    res
      .status(429)
      .json({ error: "rate", message: "Cok fazla istek. Lutfen 15 dk sonra tekrar deneyin." });
    return;
  }
  const b = readJson(req);
  if (!b) {
    res.status(400).json({ error: "bad-request" });
    return;
  }

  // Honeypot: doldurulduysa bot, sessizce başarılı say
  if (b.website && String(b.website).length > 0) {
    res.json({ ok: true });
    return;
  }

  const name = String(b.name || "")
    .trim()
    .slice(0, 120);
  const email = String(b.email || "")
    .trim()
    .slice(0, 254);
  const message = String(b.message || "")
    .trim()
    .slice(0, 4000);

  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || message.length < 10) {
    res.status(400).json({ error: "validation" });
    return;
  }

  try {
    const r = await supabaseFetch("/rest/v1/contact_messages", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ name, email, message }),
    });
    if (r.ok) notifyEmail(name, email, message);
    res.status(r.ok ? 201 : 502).json({ ok: r.ok });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};

async function notifyEmail(name, email, message) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  const from = process.env.NOTIFY_FROM || "Quantro <onboarding@resend.dev>";
  if (!key || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: "Quantro: Yeni iletişim mesajı",
        text: `Yeni iletişim formu mesajı\n\nAd: ${name}\nE-posta: ${email}\n\n${message}\n\n— Quantro ARGE`,
      }),
    });
  } catch (e) {}
}
