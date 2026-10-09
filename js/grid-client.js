/* ═══════════════════════════════════════════════════════════════
   Quantro GRID · istemci
   Is birimi dongusu + canli girisim grafigi + 8 dilli arayuz +
   cevrimdisi kuyruk + yerel katki sayaclari. Sifir bagimlilik.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var LANG = (function () {
    var q = new URLSearchParams(location.search).get("lang");
    var ls = null;
    try {
      ls = localStorage.getItem("qlang");
    } catch (e) {}
    var html = (document.documentElement.lang || "").slice(0, 2);
    return q || ls || html || "tr";
  })();
  var L = (window.GRID_I18N && window.GRID_I18N[LANG]) || window.GRID_I18N.en;

  function t(k) {
    return (L && L[k]) || window.GRID_I18N.en[k] || k;
  }

  function applyI18n() {
    document.querySelectorAll("[data-gi18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-gi18n"));
    });
    document.querySelectorAll("[data-gi18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-gi18n-ph")));
    });
  }

  var $ = function (id) {
    return document.getElementById(id);
  };
  var running = false;
  var worker = null;
  var session = { units: 0, shots: 0, fails: 0 };
  var stats = null;
  var QKEY = "quantro-grid-queue";

  /* ── Cevrimdisi kuyruk ─────────────────────────────────────── */
  function queueRead() {
    try {
      return JSON.parse(localStorage.getItem(QKEY) || "[]");
    } catch (e) {
      return [];
    }
  }
  function queueWrite(q) {
    try {
      localStorage.setItem(QKEY, JSON.stringify(q.slice(-500)));
    } catch (e) {}
  }
  function queuePush(item) {
    var q = queueRead();
    q.push(item);
    queueWrite(q);
  }

  /* ── Sayaclar + durum ──────────────────────────────────────── */
  function fmt(n) {
    return (Number(n) || 0).toLocaleString(LANG === "tr" ? "tr-TR" : "en-US");
  }
  function setStatus(msg) {
    var el = $("g-status");
    if (el) el.textContent = msg;
  }
  function renderStats() {
    if (stats) {
      $("g-units").textContent = fmt(stats.units);
      $("g-shots").textContent = fmt(stats.shots);
      $("g-nodes").textContent = fmt(stats.nodes);
    }
    $("g-you-units").textContent = fmt(session.units);
    $("g-you-shots").textContent = fmt(session.shots);
    drawChart();
  }

  /* ── Girisim grafigi ───────────────────────────────────────── */
  function drawChart() {
    var cv = $("g-chart");
    if (!cv || !cv.getContext) return;
    var dpr = window.devicePixelRatio || 1;
    var w = cv.clientWidth || 640;
    var h = 260;
    cv.width = w * dpr;
    cv.height = h * dpr;
    var g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    var pad = 34;
    var X = function (th) {
      return pad + (th / (Math.PI * 2)) * (w - pad - 8);
    };
    var Y = function (p) {
      return h - pad - p * (h - pad - 14);
    };
    /* eksenler */
    g.strokeStyle = "rgba(255,255,255,.18)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(pad, 10);
    g.lineTo(pad, h - pad);
    g.lineTo(w - 8, h - pad);
    g.stroke();
    /* teori: P(00) = (1 - sin th)/2 */
    g.strokeStyle = "#38e1ff";
    g.lineWidth = 2;
    g.beginPath();
    for (var th = 0; th <= Math.PI * 2 + 1e-9; th += Math.PI / 90) {
      var p = (1 - Math.sin(th)) / 2;
      var xx = X(th),
        yy = Y(p);
      th === 0 ? g.moveTo(xx, yy) : g.lineTo(xx, yy);
    }
    g.stroke();
    /* ampirik noktalar */
    if (stats && stats.bins) {
      g.fillStyle = "#f5b23c";
      stats.bins.forEach(function (b) {
        if (!b.shots) return;
        g.beginPath();
        g.arc(X(b.theta), Y(b.p00), 3.4, 0, Math.PI * 2);
        g.fill();
      });
    }
  }

  /* ── Veri akisi ────────────────────────────────────────────── */
  function api(path, opts) {
    return fetch("/api/grid/" + path, opts)
      .then(function (r) {
        return r.text().then(function (txt) {
          var j = null;
          try {
            j = JSON.parse(txt);
          } catch (e) {}
          return { ok: r.ok, status: r.status, body: j };
        });
      })
      .catch(function () {
        return { ok: false, status: 0, body: null };
      });
  }

  function loadStats() {
    return api("stats").then(function (r) {
      if (r.ok) {
        stats = r.body;
        renderStats();
      }
    });
  }

  function flushQueue() {
    var q = queueRead();
    if (!q.length) return Promise.resolve();
    var remaining = [];
    var chain = Promise.resolve();
    q.forEach(function (item) {
      chain = chain.then(function () {
        return api("result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        }).then(function (r) {
          if (!r.ok && r.status >= 500) remaining.push(item);
        });
      });
    });
    return chain.then(function () {
      queueWrite(remaining);
    });
  }

  function makeWorker() {
    if (worker) return worker;
    worker = new Worker("js/grid-worker.js");
    worker.onmessage = function (e) {
      var d = e.data || {};
      if (!d.ok) {
        session.fails++;
        setStatus(t("stFail"));
        nextUnit();
        return;
      }
      var payload = {
        unitId: d.unitId,
        seed: d.seed,
        theta: d.theta,
        counts: d.counts,
      };
      api("result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          if (r.ok && r.body && r.body.ok) {
            session.units++;
            session.shots += d.shots;
            setStatus(t("stOk"));
            renderStats();
            if (session.units % 8 === 0) loadStats();
          } else if (r.status === 409) {
            session.fails++;
            setStatus(t("stFail"));
          } else {
            queuePush(payload);
            setStatus(t("stOffline"));
          }
        })
        .catch(function () {
          queuePush(payload);
          setStatus(t("stOffline"));
        })
        .then(function () {
          if (running) setTimeout(nextUnit, 120);
        });
    };
    return worker;
  }

  function nextUnit() {
    if (!running) return;
    setStatus(t("stQueued"));
    api("unit", { method: "POST" })
      .then(function (r) {
        if (!r.ok || !r.body || !r.body.unitId) throw new Error("unit");
        makeWorker().postMessage(r.body);
      })
      .catch(function () {
        setTimeout(function () {
          if (running) nextUnit();
        }, 2500);
      });
  }

  function start() {
    if (running) return;
    running = true;
    var b = $("g-join");
    if (b) b.setAttribute("data-running", "1");
    flushQueue().then(function () {
      loadStats();
      nextUnit();
    });
  }
  function stop() {
    running = false;
    var b = $("g-join");
    if (b) b.removeAttribute("data-running");
    setStatus("");
  }

  /* ── Baslat ────────────────────────────────────────────────── */
  function boot() {
    applyI18n();
    loadStats();
    var join = $("g-join");
    if (join) {
      join.addEventListener("click", function () {
        running ? stop() : start();
      });
    }
    var next = $("g-next");
    if (next)
      next.addEventListener("click", function () {
        running = false;
        session.units = 0;
        session.shots = 0;
        renderStats();
        start();
      });
    var dl = $("g-download");
    if (dl)
      dl.addEventListener("click", function () {
        api("data").then(function (r) {
          var blob = new Blob([JSON.stringify(r.body, null, 2)], { type: "application/json" });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "quantro-grid-" + new Date().toISOString().slice(0, 10) + ".json";
          a.click();
          URL.revokeObjectURL(a.href);
        });
      });
    window.addEventListener("resize", drawChart);
    if (window.MutationObserver) {
      new MutationObserver(function () {
        LANG = (document.documentElement.lang || "tr").slice(0, 2);
        L = window.GRID_I18N[LANG] || window.GRID_I18N.en;
        applyI18n();
        drawChart();
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    }
    if (window.__quantroGridAuto) start();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.__quantroGrid = {
    start: start,
    stop: stop,
    stats: function () {
      return { session: session, stats: stats, running: running };
    },
  };
})();
