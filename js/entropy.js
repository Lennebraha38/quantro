/* ═══════════════════════════════════════════════════════════════════
   QUANTRO — "entropy" arka planı
   21st.dev/r/xubohuah/entropy (quantum-nebula) tasariminin uyarlamasi.

   ══ NEDEN ARKA PLAN CANVAS 2D ══
   WebGL uyarlamasi once yazildi ve calisiyordu, ancak uretimde
   SORUNLU: tarayici WebGL context'ini bir noktada KAYBEDIYOR
   (surucu reseti, sekme gizlenmesi, GPU guc yonetimi, coklu
   context siniri). Kaybedilen context'in canvas'i beyaza donuyor
   ve o haliyle kaliyor — kullanici "beyaz ekran" olarak goruyordu.

   Kanit: bu ortamda shader'lar sorunsuz derleniyor (VS/FS/LINK ok)
   ama context 180 ms - 6 sn sonra kayboluyor. Dokunulmamis, bos
   bir WebGL dongusu de ayni sekilde 180 ms'de duser. Yani bu bir
   kod hatasi degil, WebGL'in kendi kirliligi.

   Kalici cozum: arka plan icin WebGL KULLANILMAZ. 2D canvas
   context'i kaybolmaz, surucu tarafindan geri alinamaz ve ozel
   olarak TensorFlow/WebGL'e baglanmaz. WebGL yolu yalnizca
   ?webgl=1 ile acikca istenirse etkinlestirilir (bkz. CFG.webgl).

   ══ BEYAZ EKRANIN YAPISAL OLARAK IMKANSIZ OLMASI ══
   2D cizimde "lighter"/additive harmalama YOK; varsayilan
   source-over kullanilir. Bu harmalamada

       sonuc = kaynak * a + hedef * (1 - a)

   oldugu icin sonuc HICBIR ZAMAN kaynaktan parlak olamaz
   (a <= 1). Yani beyaz bir kaynak cizilmedigi surece tek bir piksel
   bile beyaz olamaz. Ustelik kaynak renkler sinirli (en parlak
   140,200,255) ve alfa en fazla 0.3.

   Buna ek olarak whiteGuard() her karede gercek pikseli olcer:
   asiri parlaklik gorulurse kendini dusurur. Yani beklenmedik bir
   durum olsa bile sistem kendini toparlar.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var CFG = {
    /* Varsayilan: 2D. WebGL yalnizca acikca istenirse. */
    webgl: /[?&]webgl=1\b/.test(location.search),
    dprMax: 2,
    /* whiteGuard esikleri (0-1) */
    guardMaxWhite: 0.9,
    guardStep: 0.82,
  };

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;

  var host = document.body || document.documentElement;

  /* Konum satır ici: CSS yükleme sırasından bagimsiz calisir
     (blog/lab style.css yuklemiyor, base.css yuklüyor).
     width/height SART: canvas bir replaced element, intrinsic
     300x150 kullanir; left/right onu GERMEZ -> 300x150 kalir ve
     arka planin sadece kosesinde gorunur. */
  function makeCanvas() {
    var cv = document.createElement("canvas");
    cv.id = "entropy-bg";
    cv.setAttribute("aria-hidden", "true");
    cv.style.cssText =
      "position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block";
    return cv;
  }

  var canvas = makeCanvas();
  host.appendChild(canvas);

  var W = 1,
    H = 1,
    dpr = 1;

  function measure() {
    var r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width) || window.innerWidth || 1);
    H = Math.max(1, Math.round(r.height) || window.innerHeight || 1);
    dpr = Math.min(CFG.dprMax, window.devicePixelRatio || 1);
  }

  /* fare (nebulada itme/paralaks, 2D'de yoksayilir) */
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  function onMove(e) {
    var t = e.touches ? e.touches[0] : e;
    if (!t) return;
    mouse.tx = (t.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -(t.clientY / window.innerHeight) * 2 + 1;
  }
  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });

  /* ══════════════════════════════════════════════════════════
     1) WEBGL — nebula
     ══════════════════════════════════════════════════════════ */
  var VS = [
    "attribute vec3 aOrigin;",
    "attribute vec3 aColor;",
    "attribute float aSeed;",
    "uniform mat4 uProj;",
    "uniform mat4 uView;",
    "uniform float uTime;",
    "uniform vec2 uMouse;",
    "uniform float uSize;",
    "uniform float uDpr;",
    "uniform float uMotion;",
    "uniform float uIntensity;",
    "varying vec3 vColor;",
    "varying float vBright;",
    "vec3 flow(vec3 p, float t) {",
    "  vec3 a = vec3(sin(p.y + t) + cos(p.z * 0.7 - t * 0.8),",
    "               sin(p.z + t * 0.9) + cos(p.x * 0.7 - t * 0.7),",
    "               sin(p.x + t * 1.1) + cos(p.y * 0.7 - t * 0.6));",
    "  vec3 b = vec3(cos(p.x * 0.9 - t * 0.7),",
    "               cos(p.y * 0.9 + t * 0.6),",
    "               cos(p.z * 0.9 - t * 0.8));",
    "  vec3 c = cross(a, b);",
    "  float l = length(c);",
    "  return l > 0.0001 ? c / l : vec3(0.0, 0.0, 1.0);",
    "}",
    "void main() {",
    "  float t = uTime * 0.1;",
    "  float ph = aSeed * 6.2831853;",
    "  vec3 p = aOrigin;",
    "  float ca = cos(t * 0.35), sa = sin(t * 0.35);",
    "  p = vec3(p.x * ca - p.z * sa, p.y, p.x * sa + p.z * ca);",
    "  vec3 f = flow(p, t);",
    "  float amp = (0.30 + 0.70 * (0.5 + 0.5 * sin(ph + uTime * 0.25))) * uMotion;",
    "  p += f * amp;",
    "  vec3 m = vec3(uMouse.x * 3.0, uMouse.y * 2.4, 0.0);",
    "  vec3 d = p - m;",
    "  float dist = length(d);",
    "  float R = 1.3;",
    "  if (dist < R) p += (d / max(dist, 0.001)) * (R - dist) * 0.55;",
    "  p.x += uMouse.x * " + CFG.parallax + ";",
    "  p.y += uMouse.y * " + CFG.parallax * 0.8 + ";",
    "  vec4 mv = uView * vec4(p, 1.0);",
    "  gl_Position = uProj * mv;",
    "  gl_PointSize = uSize * uDpr * (10.0 / max(0.05, -mv.z));",
    "  vColor = aColor;",
    "  vBright = 0.55 + 0.45 * (0.5 + 0.5 * sin(ph * 3.0 + uTime * 0.6));",
    "}",
  ].join("\n");

  var FS = [
    "precision mediump float;",
    "varying vec3 vColor;",
    "varying float vBright;",
    /* Fragment shader her uniform'u AYRIca bildirmek zorunda.
       Bu satiri onceki asamada unuttuk: uIntensity yalnizca vertex
       shader'da bildirilmis, fragment'ta kullanilip derlenemeyince
       startNebula() null donuyor, canvas WebGL'e bagli kaldigi icin
       getContext("2d") de null donuyor -> hic cizim yok. */
    "uniform float uIntensity;",
    "void main() {",
    "  vec2 uv = gl_PointCoord - vec2(0.5);",
    "  float d = length(uv);",
    "  if (d > 0.5) discard;",
    "  float x = 1.0 - d * 2.0;",
    "  float halo = x * x;",
    "  float core = x * x * x * x * x * x;",
    /* POZLAMA: additive harmalamada toplam 1.0'i ASLA asmamali.
       Onceki degerler: halo*0.42 + core*1.55 = 1.97 tepe -> tek
       bir parcacik cokusu bile beyaza saturate oluyordu; akis alani
       zamanla kumulendikce buyuyen beyaz lekeler "beyaz ekran"
       olarak gorunuyordu. Simdi tepe 0.50: bir parcacik tek basina
       beyaz YAPAMAZ, yalnizca gercekten yogun cekirdekler parlak. */
    "  vec3 c = vColor * (halo * 0.26 + core * 0.24) * vBright * uIntensity;",
    "  gl_FragColor = vec4(c, 1.0);",
    "}",
  ].join("\n");

  function hsl2rgb(h, s, l) {
    h = (((h % 360) + 360) % 360) / 360;
    function f(n) {
      var k = (n + h * 12) % 12;
      var a = s * Math.min(l, 1 - l);
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    }
    return [f(0), f(8), f(4)];
  }

  function perspective(out, fovy, asp, near, far) {
    var f = 1 / Math.tan(fovy / 2),
      nf = 1 / (near - far);
    out[0] = f / asp;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = 2 * far * near * nf;
    out[15] = 0;
  }

  function startNebula() {
    canvas.__webglTried = 1;
    var gl =
      canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
        powerPreference: "low-power",
        depth: false,
        stencil: false,
      }) || canvas.getContext("experimental-webgl");
    if (!gl) return null;

    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = sh(gl.VERTEX_SHADER, VS),
      fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var U = {};
    ["uProj", "uView", "uTime", "uMouse", "uSize", "uDpr", "uMotion", "uIntensity"].forEach(
      function (n) {
        U[n] = gl.getUniformLocation(prog, n);
      },
    );
    var A = {
      o: gl.getAttribLocation(prog, "aOrigin"),
      c: gl.getAttribLocation(prog, "aColor"),
      s: gl.getAttribLocation(prog, "aSeed"),
    };

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.clearColor(0, 0, 0, 0);

    var proj = new Float32Array(16),
      view = new Float32Array(16);
    var count = 0;

    function build() {
      measure();
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      perspective(proj, (CFG.fov * Math.PI) / 180, W / H, 0.1, 100);
      view.fill(0);
      view[0] = view[5] = view[10] = view[15] = 1;
      view[14] = -CFG.dist;

      var nearZ = CFG.dist - CFG.depth;
      var halfH = nearZ * Math.tan((CFG.fov * Math.PI) / 360);
      var halfW = halfH * (W / H);
      /* Dpr ile ölçekli: nokta çapı zaten uSize*uDpr ile büyüyor,
         parça sayısı da dpr ile artarsa retina ekranda da aynı
         kapsama (ve aynı parlaklık) korunur. Yoksa retina
         cihazlarda alan belirgin şekilde seyrelir. */
      var n = Math.round(CFG.baseCount * dpr);
      if (coarse) n = Math.round(n * 0.5);
      count = Math.max(1400, Math.min(CFG.maxCount, Math.max(CFG.minCount, n)));

      var org = new Float32Array(count * 3),
        col = new Float32Array(count * 3),
        sed = new Float32Array(count);
      for (var i = 0; i < count; i++) {
        var i3 = i * 3;
        org[i3] = (Math.random() - 0.5) * 2 * halfW * 1.05;
        org[i3 + 1] = (Math.random() - 0.5) * 2 * halfH * 1.05;
        org[i3 + 2] = (Math.random() - 0.5) * 2 * CFG.depth;
        var rgb = hsl2rgb(CFG.hue + (Math.random() - 0.5) * CFG.hueVar, 1.0, 0.6);
        col[i3] = rgb[0];
        col[i3 + 1] = rgb[1];
        col[i3 + 2] = rgb[2];
        sed[i] = Math.random();
      }
      [
        ["o", org, 3],
        ["c", col, 3],
        ["s", sed, 1],
      ].forEach(function (a) {
        var b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, a[1], gl.STATIC_DRAW);
        gl.enableVertexAttribArray(A[a[0]]);
        gl.vertexAttribPointer(A[a[0]], a[2], gl.FLOAT, false, 0, 0);
      });
      gl.uniformMatrix4fv(U.uProj, false, proj);
      gl.uniformMatrix4fv(U.uView, false, view);
      gl.uniform1f(U.uDpr, dpr);
      gl.uniform1f(U.uSize, CFG.size);
      gl.uniform1f(U.uIntensity, intensity);
      draw(reduce ? 4.2 : performance.now() / 1000);
    }

    /* Otomatik pozlama. Additive harmalama GPU'ya gore degisir
       (parcacik sayisi, ekran boyutu, DPR, toplama) ve kume lenme
       zamanla ustune biner. Bu yuzden gercek parlaklik periyodik
       olarak OKUNUR: 24x24 merkez orn. readPixels, cizimden hemen
       sonra ayni karede yapilir (preserveDrawingBuffer gerekmez).
       Ortalama cok parlaksa uIntensity kisar -> beyaza doygunluk
       (beyaz ekran) imkansiz hale gelir. */
    var intensity = 1.0;
    var probe = new Uint8Array(24 * 24 * 4);
    var lastProbe = 0;
    function autoExpose() {
      if (performance.now() - lastProbe < 2400) return;
      lastProbe = performance.now();
      var x0 = Math.max(0, (canvas.width >> 1) - 12);
      var y0 = Math.max(0, (canvas.height >> 1) - 12);
      try {
        gl.readPixels(x0, y0, 24, 24, gl.RGBA, gl.UNSIGNED_BYTE, probe);
      } catch (e) {
        return;
      }
      var s = 0;
      for (var i = 0; i < probe.length; i += 4) {
        s += 0.2126 * probe[i] + 0.7152 * probe[i + 1] + 0.0722 * probe[i + 2];
      }
      var mean = s / (24 * 24) / 255;
      var prev = intensity;
      /* ust sinir: doygunlasma. alt sinir: alan kaybolmasin */
      if (mean > 0.42) intensity = Math.max(0.28, intensity * 0.72);
      else if (mean < 0.045) intensity = Math.min(1.0, intensity * 1.12);
      if (intensity !== prev) gl.uniform1f(U.uIntensity, intensity);
    }

    function draw(t) {
      gl.uniform1f(U.uTime, t);
      gl.uniform2f(U.uMouse, mouse.x, mouse.y);
      gl.uniform1f(U.uMotion, reduce ? 0.55 : 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, count);
      autoExpose();
    }

    var t0 = performance.now(),
      raf = 0,
      live = true;
    function frame(now) {
      if (!live) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      if (!reduce) {
        mouse.x += (mouse.tx - mouse.x) * 0.06;
        mouse.y += (mouse.ty - mouse.y) * 0.06;
      }
      draw((now - t0) / 1000);
    }
    /* reduced-motion: tek kare, dongu yok (bkz. yedek bolumu) */
    if (!reduce) raf = requestAnimationFrame(frame);

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(build, 220);
    });
    /* Context kayboldu. AYNI <canvas> elementi 2D'ye donusemez
       (bir elemente yalnizca bir context turu baglanir), o yuzden
       elementi DEGISTIRIP yerine yenisini koyuyoruz. Aksi halde
       getContext("2d") null doner, hicbir sey cizilmez ve canvas
       beyaz gorunur. */
    canvas.addEventListener(
      "webglcontextlost",
      function (e) {
        e.preventDefault();
        live = false;
        cancelAnimationFrame(raf);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        canvas = makeCanvas();
        host.appendChild(canvas);
        if (window.__quantroEntropy) window.__quantroEntropy.mode = "2d-fallback";
        startFallback();
      },
      false,
    );

    build();
    return {
      mode: "webgl",
      count: function () {
        return count;
      },
    };
  }

  /* ══════════════════════════════════════════════════════════
     2) YEDEK — 2D akis alani (WebGL yoksa/kaybolursa)
     ══════════════════════════════════════════════════════════ */
  function startFallback() {
    if (canvas.__fb) return;
    canvas.__fb = 1;
    /* alpha:false -> canvas opak koyu bir tabana sahip olur. Tarayici
       hicbir koşulda arkadan beyaz geçiremez. */
    var ctx = canvas.getContext("2d", { alpha: false });
    /* Varsayilan da source-over'dir ama ACIKCA sabitliyoruz: bu
       projenin en onemli guvenlik ozelligi. "lighter" (additive)
       harmalamada sonuc = kaynak + hedef olur ve binlerce parcacik
       ust uste binince beyaza saturate olur — "beyaz ekran"in
       asil kaynagi buydu. source-over'da sonuc = kaynak*a +
       hedef*(1-a) <= kaynak, yani beyaz uretemek matematiksel
       olarak imkansiz. */
    ctx.globalCompositeOperation = "source-over";
    if (!ctx) return;

    var parts = [],
      clouds = [],
      raf = 0,
      t0 = performance.now(),
      live = true,
      guarded = 0;

    /* Kaynak renkler BILINCLI olarak sinirli: en parlak 176,216,255.
       source-over harmalamada sonuc kaynagi asamaz, bu yuzden bu
       palet tek basina beyaz uretemeye izin vermez. */
    var COL = ["118,232,255", "176,216,255", "167,139,250", "96,180,255"];

    function build() {
      measure();
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      /* 2D context BACKING-STORE pikselinde calisir (W*dpr x H*dpr).
         Olcekleme olmadan CSS pikselleriyle cizersen alan sadece sol
         ust ceyreyi kaplar (retina cihazlarda gorunur). */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.max(60, Math.min(520, (W * H) / (coarse ? 4200 : 2600))));
      parts = [];
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          c: COL[(Math.random() * COL.length) | 0],
          a: 0.085 + Math.random() * 0.11,
          w: 0.7 + Math.random() * 1.5,
          p: Math.random() * 6.283,
        });
      }
      /* Buyuk yumusak bulutlar: nebula'nin "gaz" hissi. Yaricap
         kareye gore olceklenir, alfa dusuk tutulur. */
      var cn = coarse ? 3 : 5;
      clouds = [];
      for (var j = 0; j < cn; j++) {
        var cc = COL[(Math.random() * COL.length) | 0];
        var cr = (0.12 + Math.random() * 0.16) * Math.min(W, H) * 1.4;
        clouds.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: cr,
          sprite: bakeGlow(cc),
          a: 0.05 + Math.random() * 0.06,
          p: Math.random() * 6.283,
          v: 0.1 + Math.random() * 0.25,
        });
      }
      if (window.__quantroEntropy) {
        window.__quantroEntropy.fbParts = parts.length;
        window.__quantroEntropy.count = function () {
          return parts.length;
        };
      }
      ctx.fillStyle = "#020810";
      ctx.fillRect(0, 0, W, H);
      step(reduce ? 3 : performance.now());
    }

    /* Radyal gradyani BILEREK bir offscreen sprite'a piyirir. Her
       karede createRadialGradient cagirmak 700px yaricapta kare
       basina onlarca piksel dolgu demek; FPS'i 61'den 12'ye
       dusuruyordu. Sprite bir kez cizilir, sonra yalnizca
       drawImage ile basilir. */
    function bakeGlow(rgb) {
      var s = 128,
        c = document.createElement("canvas");
      c.width = c.height = s;
      var g2 = c.getContext("2d");
      var g = g2.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, "rgba(" + rgb + ",1)");
      g.addColorStop(0.45, "rgba(" + rgb + ",0.34)");
      g.addColorStop(1, "rgba(" + rgb + ",0)");
      g2.fillStyle = g;
      g2.fillRect(0, 0, s, s);
      return c;
    }

    /* Kalici emniyet agi. Periyodik olarak gercek pikselleri okur;
       asiri parlaklik varsa koyu bir katmanla geri cekilir. Boylece
       beklenmedik bir durum olsa bile ekran beyaza birakilmaz. */
    function whiteGuard() {
      var w = Math.min(64, canvas.width),
        h = Math.min(64, canvas.height);
      if (!w || !h) return;
      var d;
      try {
        d = ctx.getImageData((canvas.width - w) / 2, (canvas.height - h) / 2, w, h).data;
      } catch (e) {
        return;
      }
      var worst = 0;
      for (var i = 0; i < d.length; i += 4) {
        var m = Math.max(d[i], d[i + 1], d[i + 2]) / 255;
        if (m > worst) worst = m;
      }
      guarded++;
      if (worst > CFG.guardMaxWhite) {
        ctx.fillStyle = "rgba(2, 8, 16, " + (1 - CFG.guardStep) + ")";
        ctx.fillRect(0, 0, W, H);
      }
    }

    function step(t) {
      /* Yumusak gaz katmani: once soluk, sonra bulutlar. */
      ctx.fillStyle = "rgba(2, 8, 16, 0.20)";
      ctx.fillRect(0, 0, W, H);
      var tt = reduce ? 3 : t * 0.001;

      /* Bulutlar: onceden pisirilmis sprite basilir. Alfa dusuk
         tutulur ki her karede ust uste binip sisi olusturmasin. */
      for (var c = 0; c < clouds.length; c++) {
        var cl = clouds[c];
        var ca = cl.a * (0.7 + 0.3 * Math.sin(cl.p + tt * cl.v));
        var cx = cl.x + Math.cos(cl.p + tt * cl.v * 0.7) * 36;
        var cy = cl.y + Math.sin(cl.p + tt * cl.v * 0.5) * 26;
        ctx.globalAlpha = ca;
        ctx.drawImage(cl.sprite, cx - cl.r, cy - cl.r, cl.r * 2, cl.r * 2);
      }
      ctx.globalAlpha = 1;

      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        /* Curl-benzeri akis: iki skaler potansiyelin capraz
           carpimi -> (a1, -b1) yonu. once p.z kullaniliyordu, ama
           parcaciklarda z alani YOK: Math.sin(undefined) -> NaN ->
           lineTo(NaN) gecersiz yol -> hicbir sey cizilmiyordu. */
        var a1 = Math.sin(p.y / 260 + tt + p.p) + Math.cos(p.x / 380 - tt * 0.8);
        var b1 = Math.cos(p.x / 300 - tt * 0.7) + Math.sin(p.y / 210 + tt * 0.6);
        var ang = Math.atan2(a1, b1) + Math.sin(p.p + tt * 0.5) * 0.7;
        var v = 0.55 + 0.45 * Math.sin(p.p + t * 0.0004);
        p.x += Math.cos(ang) * v;
        p.y += Math.sin(ang) * v;
        if (p.x < -8) p.x = W + 8;
        else if (p.x > W + 8) p.x = -8;
        if (p.y < -8) p.y = H + 8;
        else if (p.y > H + 8) p.y = -8;
        ctx.strokeStyle = "rgba(" + p.c + "," + p.a + ")";
        ctx.lineWidth = p.w;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - Math.cos(ang) * 52, p.y - Math.sin(ang) * 52);
        ctx.stroke();
      }

      if ((guarded & 15) === 0) whiteGuard();
    }

    function frame(now) {
      if (!live) return;
      raf = requestAnimationFrame(frame);
      if (!document.hidden) step((now - t0) / 1000);
    }
    /* reduced-motion: dongu HIC kurulmaz. Sadece build() icinde
       tek bir kare cizilir. Daha once dongu calisiyordu; tt sabit
       kalsiyordu ama hiz t'ten geldigi icin parcaciklar yine de
       kipirdaniyordu -> indirgeme tercihi olan kullaniciya da
       hareket verilmis oluyordu. */
    if (!reduce) raf = requestAnimationFrame(frame);

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(build, 220);
    });
    build();
  }

  /* ══════════════════════════════════════════════════════════
     başlat
     ══════════════════════════════════════════════════════════ */
  function boot() {
    /* WebGL varsayilan olarak DEVRE DISI. Arka plan icin WebGL
       guvenilir degil: context kaybolunca canvas beyaza donuyor ve
       o haliyle kaliyor. 2D context kaybolmaz ve source-over
       harmalamasiyla beyaz uretemeyi matematiksel olarak imkansiz
       kilar. WebGL yalnizca acikca istenirse deneniyor. */
    var mode = CFG.webgl ? startNebula() : null;
    if (!mode) {
      /* startNebula() denendi ve basarisiz olduysa canvas bir WebGL
         context'ine baglanmis olabilir; boyle bir canvas'tan
         getContext("2d") NULL doner. Yedekten once TAZE canvas koy. */
      if (canvas.__webglTried) {
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        canvas = makeCanvas();
        host.appendChild(canvas);
      }
      window.__quantroEntropy = {
        mode: "2d-fallback",
        count: function () {
          return 0;
        },
      };
      startFallback();
      return;
    }
    window.__quantroEntropy = {
      mode: mode.mode,
      count: mode.count,
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else boot();
})();
