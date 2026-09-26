// ═══════════════════════════════════════════════════════════
// Quantro · /api/zenai — ZENAI sohbet proxy'si
// ── Ne yapar?
//   Sitenin sağ altındaki müşteri hizmeti penceresinden gelen
//   mesajı ZENAI'ye (/api/chat) iletir ve cevabı JSON olarak döner.
//   Böylece tarayıcı ZENAI'ye doğrudan bağlanmaz; CORS allowlist
//   sorunu, anahtar sızıntısı ve kötüye kullanım burada engellenir.
// Güvenlik:
//   · gövde 16 KB ile sınırlı, tek tur (geçmişi sunucu tutmaz — KVKK)
//   · IP başına kova tabanlı hız sınırı
//   · istemciden gelen model/sistem talimatı yok sayılır
// ═══════════════════════════════════════════════════════════
const ZENAI = process.env.ZENAI_URL || "https://zenai-two.vercel.app";
const MODEL = process.env.ZENAI_MODEL || "zenai";
const MAX_BYTES = 16 * 1024;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 15;

// Quantro hakkında temel bilgi. ZENAI genel bir asistan; bu bağlam
// olmadan "Quantro"yu 1990'ların bir bulmaca oyunu sanabiliyor.
const BAGLAM =
  "Bağlam: Bu, quantro-1.vercel.app sitesinin müşteri hizmeti asistanısın. " +
  "Quantro = Türkçe bir kuantum hesaplama simülatörü sitesidir (araştırma merkezi projesi). " +
  "quantro-js: bağımlılıksız tek dosyalık JS kuantum simülasyon kütüphanesi " +
  "(QuantumCircuit, Qubit, bellState, ghzState, H/X/Y/Z/RY/CX/CZ kapıları, " +
  "probabilities(), measureAll(), sampleDistribution, mulberry32). " +
  "Sitede 13 etkileşimli araç var (Bell testi, kendi kuantum devreni kur, " +
  "kuantum zorluğu, rakip kuantum bilgisayar, stokastik karşılaştırma vb.). " +
  "Kuantum fiziği sorularında da (kuantum bilgisayarlar, süperpozisyon, dolanma, " +
  "dekoherans, gerçek kuantum donanımı) yardımcı olabilirsin. " +
  "Cevaplarını kısa ve anlaşılır Türkçe/İngilizce ver.";

// Quantro hakkında sorulabilecek sık sorulara hazır, kaynaklı yanıt.
// ZENAI'nin sağlayıcısı ara sıra HTTP 500 veriyor (uzun/karmaşık
// sorularda); o an kullanıcı "yanıt veremedi" görüyordu. Bu yedek
// cevaplar site gerçeklerini (kendi kaynaklarımızdan) döndürür.
const HAZIR = [
  {
    k: ["quantro nedir", "quantro ne", "bu site", "site ne", "quantro ne yapıyor"],
    c:
      "**Quantro**, tarayıcıda çalışan bir kuantum hesaplama simülatörü ve araştırma projesidir. " +
      "Kendi kuantum devrelerini kurup çalıştırabileceğin 13 etkileşimli araç sunar: " +
      "Bell testi, kendi kuantum devreni kur, kuantum zorluğu karşılaştırması, " +
      "stokastik (klasik) karşılaştırma ve daha fazlası. " +
      "Hepsi tek dosyalık, bağımlılıksız **quantro-js** kütüphanesi üzerinde çalışır.",
  },
  {
    k: ["kaç araç", "araç sayısı", "neler var", "hangi araçlar"],
    c:
      "Sitede **13 etkileşimli araç** var. Başlıcaları: Bell testi, kendi kuantum devreni kur, " +
      "kuantum bilgisayar zorluğu, klasik karşılaştırma, kuantum rastgelelik, ölçüm ve " +
      "devre görselleştirme araçları. Tamamını ana sayfadaki lab bölümünden deneyebilirsin.",
  },
  {
    k: ["quantro-js", "kütüphane", "api", "sdk", "npm"],
    c:
      "**quantro-js** bağımlılıksız, tek dosyalık bir JavaScript kuantum simülasyon kütüphanesidir. " +
      "Temel API: `QuantumCircuit`, `Qubit`, H/X/Y/Z/RY kapıları, CX/CZ (dolanma), " +
      "`probabilities()`, `measureAll()`, `bellState()`, `ghzState()`, `sampleDistribution()` ve " +
      "`mulberry32` (tohumlu PRNG). Tam dokümantasyon docs.html sayfasında; MIT lisanslıdır.",
  },
  {
    k: ["kuantum nedir", "kuantum bilgisayar", "süperpozisyon", "dolanma", "kuantum fiziği"],
    c:
      "**Kuantum bilgisayar**, bilgiyi süperpozisyon ve dolanma gibi kuantum durumlarında " +
      "işleyen makinedir. Klasik bilgisayarlar 0/1 üzerinden çalışırken kuantum işlemcileri " +
      "olasılık genlikleriyle çalışır. Sitedeki gerçek kuantum donanımı (D-Wave, IBM, IonQ) " +
      "kıyaslamasını yaptığın *rakip kuantum bilgisayar* aracı bu farkları somut gösterir. " +
      "Süperpozisyon = birden çok durumun ağırlıklı toplamı; dolanma = parçacıkların " +
      "uzaklıktan bağımlı durumları. Ayrıntılı anlatım istersen sor, kuantum fiziği erişimine de sahibim.",
  },
];

function hazirCevap(soru) {
  const s = soru.toLocaleLowerCase("tr");
  for (const { k, c } of HAZIR) if (k.some((x) => s.includes(x))) return c;
  return null;
}

const buckets = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const hits = (buckets.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    buckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  buckets.set(ip, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (!v.some((t) => now - t < WINDOW_MS)) buckets.delete(k);
    }
  }
  return false;
}

function json(res, code, body) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BYTES) return null;
    chunks.push(c);
  }
  return Buffer.concat(chunks).toString("utf8");
}

module.exports = async function zenai(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Yalnızca POST" });
  }
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "bilinmiyor";
  if (rateLimited(ip)) {
    return json(res, 429, { error: "Çok hızlı gidiyorsun — bir dakika bekle." });
  }

  const raw = await readBody(req);
  if (raw === null) return json(res, 413, { error: "Mesaj çok büyük (en fazla 16 KB)." });

  let soru;
  try {
    const b = JSON.parse(raw || "{}");
    soru = String(b.soru || b.message || "")
      .trim()
      .slice(0, 2000);
  } catch {
    return json(res, 400, { error: "Geçersiz JSON." });
  }
  if (!soru) return json(res, 400, { error: "Boş mesaj." });

  // ZENAI 4 beyinle düşündüğü için yanıt 5-20 sn sürebilir; tek seferde
  // denemek yerine kısa aralıklarla 3 kez deniyoruz (üstel bekleme).
  let sonHata = "";
  for (let deneme = 1; deneme <= 3; deneme++) {
    try {
      // Origin başlığı gönderilmiyor: ZENAI'nin CORS allowlist'i
      // tarayıcı közenlerine açık, sunucudan çağrıya izin veriyor.
      const r = await fetch(`${ZENAI}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: BAGLAM },
            { role: "user", content: soru },
          ],
        }),
        signal: AbortSignal.timeout(25_000),
      });

      if (r.status === 429) {
        // ZENAI kendi hız sınırına takıldı — kısa bekle, sonra dene.
        sonHata = "yoğunluk";
        if (deneme < 3) await sleep(1500 * deneme);
        continue;
      }

      if (r.status >= 500) {
        // ZENAI'nin model sağlayıcısı geçici hata veriyor (HTTP 500).
        // Uzun sorularda sık olur; daha uzun bekleyip yeniden deniyoruz.
        sonHata = `geçici hata (${r.status})`;
        if (deneme < 3) await sleep(2500 * deneme);
        continue;
      }

      const data = await r.json().catch(() => null);
      // Yanıt alanı zaman zaman "content" yerine "message"/"reply" gelir;
      // hangisi varsa onu kullan, yoksa yeniden dene.
      const cevap =
        data && typeof data === "object"
          ? [data.content, data.message, data.reply, data.text, data.answer].find(
              (v) => typeof v === "string" && v.trim().length > 0,
            ) || ""
          : "";

      if (cevap) {
        return json(res, 200, {
          cevap,
          at: new Date().toISOString(),
          deneme,
        });
      }

      // 400 gibi kalıcı hataların sebebini yüzeye taşı (şeffaflık).
      if (r.status >= 400 && r.status < 500) {
        return json(res, 502, {
          error: "ZENAI bu soruyu şu anda işleyemedi. Soruyu biraz sadeleştirip tekrar dene.",
          sebep: data && data.error ? String(data.error).slice(0, 120) : `HTTP ${r.status}`,
        });
      }

      sonHata = "boş yanıt";
      if (deneme < 3) await sleep(1200 * deneme);
    } catch (e) {
      sonHata = "zaman aşımı";
      if (deneme < 3) await sleep(1500 * deneme);
    }
  }

  // 3 deneme de başarısız: önce site gerçeklerinden hazır cevap dene,
  // o da yoksa anlaşılır hata mesajı ver.
  const hazir = hazirCevap(soru);
  if (hazir) {
    return json(res, 200, {
      cevap: hazir,
      at: new Date().toISOString(),
      kaynak: "hazir",
      not: "ZENAI'ye şu an ulaşılamadı; bu site bilgisinden hazırlandı.",
    });
  }

  return json(res, 502, {
    error:
      "ZENAI şu anda yanıt veremedi (3 deneme sonunda). Biraz sonra tekrar dene ya da sorunu sadeleştir.",
    sebep: sonHata,
  });
};
