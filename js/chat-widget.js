// Quantro · Arşivsel Araştırma Asistanı Penceresi (ZENAI destekli)
// Sağ altta sabit buton → tıklayınca sohbet penceresi açılır.
// Konuşma geçmişi yalnızca tarayıcıda tutulur (sunucuya gönderilmez).
(function () {
  "use strict";
  if (document.getElementById("qtr-chat")) return;

  const CSS = `
#qtr-chat{position:fixed;right:20px;bottom:20px;z-index:9998;font-family:var(--fb,sans-serif)}
#qtr-chat .qtr-btn{width:48px;height:48px;border-radius:2px;border:1px solid rgba(212,168,83,.45);
background:rgba(18,20,24,.95);color:var(--cyan,#d4a853);
cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.55);
transition:background .2s ease,color .2s ease,transform .18s ease}
#qtr-chat .qtr-btn:hover{transform:translateY(-1px);background:var(--cyan,#d4a853);color:var(--void,#0b0c0e)}
#qtr-chat .qtr-btn svg{width:22px;height:22px;fill:currentColor}
#qtr-chat .qtr-win{position:absolute;right:0;bottom:60px;width:350px;max-width:calc(100vw - 32px);
height:460px;max-height:calc(100vh - 110px);background:rgba(11,12,14,.98);border:1px solid rgba(212,168,83,.34);
border-top:2px solid var(--cyan,#d4a853);border-radius:2px;display:none;flex-direction:column;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.7)}
#qtr-chat.open .qtr-win{display:flex}
#qtr-chat .qtr-head{padding:14px 16px;border-bottom:1px solid rgba(236,231,221,.11);display:flex;
align-items:center;justify-content:space-between;background:rgba(18,20,24,.9)}
#qtr-chat .qtr-head b{font-family:var(--fd,Georgia,serif);font-weight:500;font-size:16px;color:var(--text,#ece7dd)}
#qtr-chat .qtr-head small{display:block;font-family:var(--fm,monospace);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--muted,#9e988c);font-weight:400;margin-top:2px}
#qtr-chat .qtr-x{background:none;border:0;color:var(--muted,#9e988c);cursor:pointer;font-size:18px;line-height:1}
#qtr-chat .qtr-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
#qtr-chat .qtr-m{max-width:88%;padding:10px 13px;border-radius:2px;font-size:13.5px;line-height:1.55;white-space:pre-wrap;word-wrap:break-word}
#qtr-chat .qtr-bot{align-self:flex-start;background:rgba(25,28,34,.9);border:1px solid rgba(236,231,221,.11);color:var(--text,#ece7dd)}
#qtr-chat .qtr-me{align-self:flex-end;background:rgba(212,168,83,.14);border:1px solid rgba(212,168,83,.36);color:var(--text,#ece7dd)}
#qtr-chat form{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(236,231,221,.11)}
#qtr-chat input{flex:1;padding:10px 12px;border-radius:2px;border:1px solid rgba(236,231,221,.14);
background:rgba(18,20,24,.9);color:var(--text,#ece7dd);font-size:13.5px;font-family:inherit}
#qtr-chat input:focus{outline:none;border-color:var(--cyan,#d4a853)}
#qtr-chat button.send{padding:0 14px;border-radius:2px;border:1px solid rgba(212,168,83,.4);
background:var(--cyan,#d4a853);color:var(--void,#0b0c0e);cursor:pointer;font-size:13px;font-weight:600}
#qtr-chat button.send:disabled{opacity:.45;cursor:default}
#qtr-chat .qtr-note{padding:6px 12px 0;font-size:10.5px;color:var(--muted,#9e988c);text-align:center}
#qtr-chat .qtr-think{font-style:italic;color:var(--cyan,#d4a853);font-size:12.5px}
#qtr-chat .qtr-again{margin-top:6px;padding:5px 10px;border-radius:2px;border:1px solid rgba(212,168,83,.4);
background:rgba(212,168,83,.12);color:var(--cyan,#d4a853);cursor:pointer;font-size:12px}
#qtr-chat .qtr-again:hover{background:rgba(212,168,83,.22)}
@media (max-width:480px){#qtr-chat .qtr-win{width:calc(100vw - 24px);height:min(70vh,520px)}}`;

  const st = document.createElement("style");
  st.textContent = CSS;
  document.head.appendChild(st);

  const root = document.createElement("div");
  root.id = "qtr-chat";
  root.innerHTML = `
    <div class="qtr-win" role="dialog" aria-label="Destek asistanı">
      <div class="qtr-head">
        <div><b>ZENAI · Araştırma Asistanı</b><small>Enstitü &amp; kuantum soruları</small></div>
        <button class="qtr-x" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="qtr-log" id="qtr-log" aria-live="polite"></div>
      <div class="qtr-note">Yanıtlar yapay zekâ üretir; kritik bilgiyi doğrula.</div>
      <form id="qtr-form">
        <input id="qtr-input" type="text" maxlength="2000" placeholder="Sorunu yaz…" aria-label="Mesajınız" autocomplete="off">
        <button class="send" type="submit" aria-label="Gönder">→</button>
      </form>
    </div>
    <button class="qtr-btn" type="button" aria-label="Destek asistanını aç" aria-expanded="false">
      <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 2a8 8 0 1 1-4.1 14.9l-.4-.2-2.6.7.7-2.5-.2-.4A8 8 0 0 1 12 4Zm-3.5 6.5h7v1.6h-7v-1.6Zm0 3.2h4.5v1.6H8.5v-1.6Z"/></svg>
    </button>`;
  document.body.appendChild(root);

  const log = root.querySelector("#qtr-log");
  const form = root.querySelector("#qtr-form");
  const input = root.querySelector("#qtr-input");
  const send = root.querySelector("button.send");
  const btn = root.querySelector(".qtr-btn");
  const history = [];

  function add(who, text) {
    const d = document.createElement("div");
    d.className = "qtr-m " + (who === "me" ? "qtr-me" : "qtr-bot");
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function addThinking() {
    const d = document.createElement("div");
    d.className = "qtr-m qtr-bot qtr-think";
    d.textContent = "düşünüyor";
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    let t = 0;
    const dots = setInterval(() => {
      t++;
      d.textContent = "düşünüyor" + ".".repeat(t % 4) + "  " + t + " sn";
      log.scrollTop = log.scrollHeight;
    }, 1000);
    return {
      el: d,
      done() {
        clearInterval(dots);
      },
    };
  }

  add(
    "bot",
    "Merhaba! Ben ZENAI. Quantro'yu (kuantum simülatörü, 13 araç, docs) kullanımı, API'si veya kuantum fiziği hakkında soru sorabilirsin.",
  );

  function toggle(open) {
    const on = open === undefined ? !root.classList.contains("open") : open;
    root.classList.toggle("open", on);
    btn.setAttribute("aria-expanded", String(on));
    if (on) input.focus();
  }
  btn.addEventListener("click", () => toggle());
  root.querySelector(".qtr-x").addEventListener("click", () => toggle(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("open")) toggle(false);
  });

  const kuyruk = [];
  let istekYapiliyor = false;

  async function istekleriIsle() {
    if (istekYapiliyor) return;
    istekYapiliyor = true;
    while (kuyruk.length) {
      const soru = kuyruk.shift();
      await soruyuGonder(soru);
    }
    istekYapiliyor = false;
  }

  async function soruyuGonder(soru) {
    add("me", soru);
    history.push({ role: "user", content: soru });
    const think = addThinking();
    try {
      const r = await fetch("api/zenai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soru }),
      });
      const d = await r.json().catch(() => ({}));
      think.done();
      if (d.cevap) {
        think.el.textContent = d.cevap;
        history.push({ role: "assistant", content: d.cevap });
        if (d.kaynak === "hazir") {
          const n = document.createElement("div");
          n.style.cssText = "font-size:10.5px;color:var(--muted,#9e988c);margin-top:4px";
          n.textContent = d.not || "";
          think.el.appendChild(n);
        }
      } else {
        think.el.innerHTML =
          "<em>" +
          (d.error || "Yanıt alınamadı.") +
          '</em><br><button type="button" class="qtr-again">tekrar dene</button>';
        const again = think.el.querySelector(".qtr-again");
        if (again)
          again.addEventListener("click", () => {
            think.el.remove();
            kuyruk.push(soru);
            istekleriIsle();
          });
      }
    } catch {
      think.done();
      think.el.innerHTML = "<em>Bağlantı kurulamadı.</em>";
    } finally {
      log.scrollTop = log.scrollHeight;
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const soru = input.value.trim();
    if (!soru) return;
    input.value = "";
    kuyruk.push(soru);
    const btn2 = send;
    if (!kuyruk.length) btn2.disabled = false;
    istekleriIsle();
    setTimeout(() => {
      if (!istekYapiliyor) send.disabled = false;
    }, 50);
  });
  function durumGuncelle() {
    send.disabled = kuyruk.length > 0;
  }
  setInterval(durumGuncelle, 400);
})();
