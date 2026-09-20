const {
  ADMIN_PASSWORD,
  AUTH_SECRET,
  verifyAdminPassword,
  rateLimiter,
  clientIp,
  readJson,
  signToken,
} = require("./_lib");

const limiter = rateLimiter(10, 10 * 60 * 1000);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ error: "method" });
    return;
  }
  if (!ADMIN_PASSWORD || !AUTH_SECRET) {
    res.status(503).json({ error: "sunucu yapilandirilmadi (env eksik)" });
    return;
  }
  if (!limiter(clientIp(req))) {
    res
      .status(429)
      .json({ error: "rate", message: "Cok fazla deneme. Lutfen 10 dk sonra tekrar deneyin." });
    return;
  }
  const body = readJson(req);
  if (!body || typeof body.password !== "string") {
    res.status(400).json({ error: "bad-request" });
    return;
  }
  if (!verifyAdminPassword(body.password)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  res.json({ token: signToken("admin"), expires_in: 7200 });
};
