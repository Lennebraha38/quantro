/* ═══════════════════════════════════════════════════════════════
   Quantro GRID · istemci (v2)
   İş birimi döngüsü + canlı girişim grafiği + 8 dilli arayüz +
   çevrimdışı kuyruk + düğüm kimliği + kalıcı katkı + rozetler +
   liderlik + paylaşım kartı + ham veri (JSON/CSV) indirme.
   Sıfır bağımlılık.
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
  var current = null; // işlenen iş birimi (experiment/shot bilgisi için)
  var session = { units: 0, shots: 0, fails: 0 };
  var stats = null;
  var EXP_INFO = {}; // id -> {title, circuit, kind}
  var PRIMARY = null;

  var QKEY = "quantro-grid-queue";
  var NKEY = "quantro-grid-node";
  var TKEY = "quantro-grid-total";

  /* ── Düğüm kimliği (pseudonim, yalnızca tarayıcıda) ────────── */
  function makeId() {
    try {
      if (window.crypto && crypto.randomUUID)
        return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    } catch (e) {}
    var hex = "0123456789abcdef",
      s = "";
    for (var i = 0; i < 16; i++) s += hex[(Math.random() * 16) | 0];
    return s;
  }
  function nodeId() {
    var v = null;
    try {
      v = localStorage.getItem(NKEY);
    } catch (e) {}
    if (!v || !/^[a-zA-Z0-9_-]{6,64}$/.test(v)) {
      v = makeId();
      try {
        localStorage.setItem(NKEY, v);
      } catch (e) {}
    }
    return v;
  }

  /* ── Kalıcı katkı sayacı ──────────────────────────────────── */
  function lifeRead() {
    try {
      return JSON.parse(localStorage.getItem(TKEY) || '{"units":0,"shots":0,"since":null}');
    } catch (e) {
      return { units: 0, shots: 0, since: null };
    }
  }
  function lifeWrite(v) {
    try {
      localStorage.setItem(TKEY, JSON.stringify(v));
    } catch (e) {}
  }
  function lifeAdd(shots) {
    var v = lifeRead();
    v.units += 1;
    v.shots += shots;
    if (!v.since) v.since = new Date().toISOString();
    lifeWrite(v);
    return v;
  }

  var BADGES = [
    { n: 1, k: "badge1" },
    { n: 25, k: "badge2" },
    { n: 100, k: "badge3" },
    { n: 500, k: "badge4" },
    { n: 2000, k: "badge5" },
  ];

  /* ── Çevrimdışı kuyruk ─────────────────────────────────────── */
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

  /* ── Yardımcılar ───────────────────────────────────────────── */
  function fmt(n) {
    return (Number(n) || 0).toLocaleString(LANG === "tr" ? "tr-TR" : "en-US");
  }
  function setStatus(msg) {
    var el = $("g-status");
    if (el) el.textContent = msg;
  }
  function renderStats() {
    if (stats) {
      $("g-units").textContent = fmt(stats.totalUnits != null ? stats.totalUnits : stats.units);
      $("g-shots").textContent = fmt(stats.totalShots != null ? stats.totalShots : stats.shots);
      $("g-nodes").textContent = fmt(stats.totalNodes != null ? stats.totalNodes : stats.nodes);
    }
    $("g-you-units").textContent = fmt(session.units);
    $("g-you-shots").textContent = fmt(session.shots);
    var life = lifeRead();
    if ($("g-life-units")) $("g-life-units").textContent = fmt(life.units);
    if ($("g-life-shots")) $("g-life-shots").textContent = fmt(life.shots);
    renderBadges(life.units);
    drawChart();
  }

  function renderBadges(units) {
    var box = $("g-badges");
    if (!box) return;
    box.innerHTML = "";
    BADGES.forEach(function (b) {
      var s = document.createElement("span");
      s.className = "g-badge" + (units >= b.n ? " on" : "");
      s.textContent = t(b.k);
      s.title = units + " / " + b.n;
      box.appendChild(s);
    });
  }

  function renderNode() {
    var el = $("g-node");
    if (el) el.textContent = nodeId().slice(0, 8);
  }

  function renderExperiment() {
    var el = $("g-exp");
    if (!el) return;
    var exp = (current && EXP_INFO[current.experiment]) || (PRIMARY && EXP_INFO[PRIMARY]);
    el.textContent = exp ? exp.title + " · " + exp.circuit : "";
  }

  /* ── Liderlik ─────────────────────────────────────────────── */
  function loadLeaderboard() {
    return api("leaderboard").then(function (r) {
      var box = $("g-lb");
      if (!box || !r.ok || !r.body) return;
      var rows = r.body.leaderboard || [];
      if (!rows.length) {
        box.innerHTML = '<li class="g-lb-empty">' + t("lbEmpty") + "</li>";
        return;
      }
      var me = nodeId().slice(0, 8);
      box.innerHTML = rows
        .map(function (row, i) {
          var mine = row.node === me ? " <b>(" + t("youStats") + ")</b>" : "";
          return (
            "<li><span class='g-lb-rk'>" +
            (i + 1) +
            "</span><code>" +
            String(row.node || "").replace(/[<>&]/g, "") +
            "</code>" +
            mine +
            "<span class='g-lb-v'>" +
            fmt(row.units) +
            " · " +
            fmt(row.shots) +
            "</span></li>"
          );
        })
        .join("");
    });
  }

  /* ── Girişim grafiği (birincil deney) ─────────────────────── */
  function theoryP(theta) {
    return (1 - Math.sin(theta)) / 2;
  }
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
    g.strokeStyle = "rgba(255,255,255,.18)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(pad, 10);
    g.lineTo(pad, h - pad);
    g.lineTo(w - 8, h - pad);
    g.stroke();
    g.strokeStyle = "#38e1ff";
    g.lineWidth = 2;
    g.beginPath();
    for (var th = 0; th <= Math.PI * 2 + 1e-9; th += Math.PI / 90) {
      var p = theoryP(th);
      var xx = X(th),
        yy = Y(p);
      th === 0 ? g.moveTo(xx, yy) : g.lineTo(xx, yy);
    }
    g.stroke();
    if (stats && stats.bins && !stats.__mixed) {
      g.fillStyle = "#f5b23c";
      stats.bins.forEach(function (b) {
        if (!b.shots) return;
        g.beginPath();
        g.arc(X(b.theta), Y(b.p00), 3.4, 0, Math.PI * 2);
        g.fill();
      });
    }
  }

  /* ── Veri akışı ───────────────────────────────────────────── */
  function api(path, opts) {
    return fetch("/api/grid?op=" + path, opts)
      .then(function (r) {
        return r
          .text()
          .then(function (txt) {
            var j = null;
            try {
              j = JSON.parse(txt);
            } catch (e) {}
            return { ok: r.ok, status: r.status, body: j };
          })
          .catch(function () {
            return { ok: r.ok, status: r.status, body: null };
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
  function loadExperiments() {
    return api("experiment").then(function (r) {
      if (r.ok && r.body) {
        (r.body.items || []).forEach(function (e) {
          EXP_INFO[e.id] = e;
        });
        PRIMARY = r.body.primary || (r.body.items && r.body.items[0] && r.body.items[0].id);
        renderExperiment();
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
          if (!r.ok && (r.status === 0 || r.status >= 500)) remaining.push(item);
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
      var unit = current || {};
      var payload = {
        unitId: d.unitId,
        experiment: unit.experiment,
        seed: d.seed,
        theta: d.theta,
        counts: d.counts,
        nodeId: nodeId(),
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
            lifeAdd(d.shots);
            setStatus(t("stOk"));
            renderStats();
            if (session.units % 8 === 0) {
              loadStats();
              loadLeaderboard();
            }
          } else if (r.status === 409) {
            session.fails++;
            setStatus(t("stFail"));
          } else if (r.status === 429) {
            setStatus(t("stOffline"));
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
        current = r.body;
        renderExperiment();
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
      loadLeaderboard();
      nextUnit();
    });
  }
  function stop() {
    running = false;
    var b = $("g-join");
    if (b) b.removeAttribute("data-running");
    setStatus("");
  }

  /* ── Paylaşım kartı (canvas → PNG) ─────────────────────────── */
  function download(blob, name) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 1000);
  }
  function shareCard() {
    var cv = document.createElement("canvas");
    cv.width = 1000;
    cv.height = 560;
    var g = cv.getContext("2d");
    var grad = g.createLinearGradient(0, 0, 1000, 560);
    grad.addColorStop(0, "#04121c");
    grad.addColorStop(1, "#0a0a1f");
    g.fillStyle = grad;
    g.fillRect(0, 0, 1000, 560);
    g.strokeStyle = "rgba(56,225,255,.5)";
    g.lineWidth = 2;
    g.strokeRect(24, 24, 952, 512);
    g.fillStyle = "#38e1ff";
    g.font = "700 46px 'Syne', Arial, sans-serif";
    g.fillText("Quantro GRID", 64, 110);
    g.fillStyle = "#a9d3e0";
    g.font = "300 24px Arial, sans-serif";
    g.fillText("Verifiable distributed Monte Carlo", 64, 150);
    var life = lifeRead();
    g.fillStyle = "#eafcff";
    g.font = "700 40px Arial, sans-serif";
    g.fillText(fmt(life.units) + " " + t("statUnits"), 64, 250);
    g.fillText(fmt(life.shots) + " " + t("statShots"), 64, 310);
    g.fillStyle = "#f5b23c";
    g.font = "400 26px monospace";
    g.fillText("node " + nodeId().slice(0, 8), 64, 380);
    var earned = BADGES.filter(function (b) {
      return life.units >= b.n;
    }).map(function (b) {
      return t(b.k);
    });
    g.fillStyle = "#9fe8b6";
    g.font = "400 22px Arial, sans-serif";
    g.fillText(earned.join("  ·  ") || "—", 64, 440);
    if (stats) {
      g.fillStyle = "#7fb6c7";
      g.font = "400 20px Arial, sans-serif";
      g.fillText(
        "network: " + fmt(stats.totalUnits) + " units · " + fmt(stats.totalShots) + " samples",
        64,
        500,
      );
    }
    g.fillStyle = "#38e1ff";
    g.font = "400 20px Arial, sans-serif";
    g.fillText("quantro-1.vercel.app/quantro-grid.html", 560, 500);
    cv.toBlob(function (blob) {
      if (blob) download(blob, "quantro-grid-node-" + nodeId().slice(0, 8) + ".png");
    });
  }

  /* ── Başlat ────────────────────────────────────────────────── */
  function boot() {
    applyI18n();
    renderNode();
    loadExperiments();
    loadStats();
    loadLeaderboard();
    var join = $("g-join");
    if (join)
      join.addEventListener("click", function () {
        running ? stop() : start();
      });
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
        api("export").then(function (r) {
          var blob = new Blob([JSON.stringify(r.body, null, 2)], { type: "application/json" });
          download(blob, "quantro-grid-" + new Date().toISOString().slice(0, 10) + ".json");
        });
      });
    var csv = $("g-csv");
    if (csv)
      csv.addEventListener("click", function () {
        window.open("/api/grid?op=export&format=csv&limit=50000", "_blank");
      });
    var share = $("g-share");
    if (share) share.addEventListener("click", shareCard);
    window.addEventListener("resize", drawChart);
    if (window.MutationObserver) {
      new MutationObserver(function () {
        LANG = (document.documentElement.lang || "tr").slice(0, 2);
        L = window.GRID_I18N[LANG] || window.GRID_I18N.en;
        applyI18n();
        renderStats();
        renderExperiment();
        loadLeaderboard();
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    }
    if (window.__quantroGridAuto) start();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.__quantroGrid = {
    start: start,
    stop: stop,
    nodeId: nodeId,
    stats: function () {
      return { session: session, stats: stats, running: running, node: nodeId() };
    },
  };
})();
