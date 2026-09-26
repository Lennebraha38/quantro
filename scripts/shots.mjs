import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
const port = await new Promise((r) => server.listen(0, () => r(server.address().port)));
const BASE = `http://127.0.0.1:${port}`;
fs.mkdirSync("tmp/shots", { recursive: true });

const SHOTS = [
  { n: "iphone-se", w: 375, h: 667, touch: true },
  { n: "iphone-15", w: 393, h: 852, touch: true },
  { n: "ipad-pro", w: 1024, h: 1366, touch: true },
  { n: "macbook", w: 1440, h: 900, touch: false },
];
const PAGES = ["index.html", "basarilar.html", "bilim.html", "blog.html"];

const browser = await chromium.launch();
for (const s of SHOTS) {
  const ctx = await browser.newContext({
    viewport: { width: s.w, height: s.h },
    deviceScaleFactor: 2,
    hasTouch: s.touch,
    isMobile: s.touch,
  });
  const page = await ctx.newPage();
  for (const pg of PAGES) {
    await page.goto(`${BASE}/${pg}`, { waitUntil: "load" });
    await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await page.screenshot({ path: `tmp/shots/v-${pg.replace(".html", "")}-${s.n}.png` });
    if (pg === "index.html") {
      await page.evaluate(() => window.scrollTo(0, 1400));
      await page.waitForTimeout(700);
      await page.screenshot({ path: `tmp/shots/v-scroll-${s.n}.png` });
    }
  }
  await ctx.close();
}
await browser.close();
server.close();
console.log("ekran goruntuleri hazir");
