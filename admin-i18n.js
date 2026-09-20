/* ═══════════════════════════════════════════════════════
   Quantro Admin · arayüz i18n (TR / EN — qlang ile senkron)
   Kapsam: giriş ekranı, kenar çubuğu, istatistikler, form
   etiketleri/butonları ve dinamik liste butonları (Sil/Onayla).
   Sistem mesajları (hata/uyarı) Türkçe kalabilir (güvenlik için).
   ═══════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var LANGS = ["tr", "en"];

  var I18N = {
    tr: {
      "login.sub": "Yönetim Paneli · Gizli Erişim",
      "login.code": "Erişim Kodu",
      "login.eye": "Şifreyi göster",
      "login.btn": "Sisteme Gir",
      "sb.cc": "Control Center",
      "sb.posts": "Yazılar",
      "sb.msgs": "Mesajlar",
      "sb.coms": "Yorumlar",
      "sb.status": "Sistem Aktif",
      "sb.logout": "Çıkış Yap",
      "top.title": "Yönetim <em>Paneli</em>",
      "stat.total": "Toplam Yazı",
      "stat.pub": "Yayında",
      "stat.msg": "Mesaj",
      "stat.pending": "Bekleyen Yorum",
      "sec.posts": "Blog Yazıları",
      "post.search.ph": "🔍 Ara: başlık, slug, etiket",
      loading: "Yükleniyor...",
      "form.new": "Yeni Yazı",
      "flbl.title": "Başlık",
      "flbl.slug": "Slug (otomatik)",
      "flbl.emoji": "Emoji",
      "flbl.tags": "Etiketler (virgülle ayırın)",
      "flbl.summary": "Özet (kart ve meta için)",
      "flbl.content": "İçerik",
      "ph.title": "Yazı başlığı",
      "ph.summary": "Yazının kısa özeti...",
      "md.preview": "Önizle",
      "btn.publish": "✓ Yayınla",
      "btn.draft": "Taslak Kaydet",
      "btn.clear": "Temizle",
      "sec.msgs": "İletişim Mesajları",
      "sec.coms": "Blog Yorumları",
    },
    en: {
      "login.sub": "Admin Panel · Restricted Access",
      "login.code": "Access Code",
      "login.eye": "Show password",
      "login.btn": "Sign In",
      "sb.cc": "Control Center",
      "sb.posts": "Posts",
      "sb.msgs": "Messages",
      "sb.coms": "Comments",
      "sb.status": "System Active",
      "sb.logout": "Log Out",
      "top.title": "Admin <em>Panel</em>",
      "stat.total": "Total Posts",
      "stat.pub": "Published",
      "stat.msg": "Messages",
      "stat.pending": "Pending Comments",
      "sec.posts": "Blog Posts",
      "post.search.ph": "🔍 Search: title, slug, tag",
      loading: "Loading...",
      "form.new": "New Post",
      "flbl.title": "Title",
      "flbl.slug": "Slug (auto)",
      "flbl.emoji": "Emoji",
      "flbl.tags": "Tags (comma-separated)",
      "flbl.summary": "Summary (for cards & meta)",
      "flbl.content": "Content",
      "ph.title": "Post title",
      "ph.summary": "Short summary of the post...",
      "md.preview": "Preview",
      "btn.publish": "✓ Publish",
      "btn.draft": "Save Draft",
      "btn.clear": "Clear",
      "sec.msgs": "Contact Messages",
      "sec.coms": "Blog Comments",
    },
  };

  var TOK = { tr: { Sil: "Sil", Onayla: "Onayla" }, en: { Sil: "Delete", Onayla: "Approve" } };

  var saved;
  try {
    saved = localStorage.getItem("qlang");
  } catch (e) {
    saved = null;
  }
  var LANG = saved === "en" ? "en" : "tr";

  function t(k) {
    return I18N[LANG][k] || I18N.tr[k] || k;
  }
  function swap(el) {
    var cur = (el.textContent || "").trim();
    if (LANG === "en") {
      if (TOK.tr[cur]) el.textContent = TOK.en[cur];
    } else if (TOK.en[cur]) el.textContent = TOK.tr[cur];
  }

  function apply() {
    try {
      document.documentElement.lang = LANG;
      document.querySelectorAll("#langbtn").forEach(function (btn) {
        btn.textContent = LANG === "tr" ? "TR" : "EN";
      });
      document.querySelectorAll("[data-admin-i18n]").forEach(function (el) {
        var v = t(el.getAttribute("data-admin-i18n"));
        if (el.innerHTML !== v) el.innerHTML = v;
      });
      document.querySelectorAll("[data-admin-i18n-ph]").forEach(function (el) {
        el.placeholder = t(el.getAttribute("data-admin-i18n-ph"));
      });
      document.querySelectorAll("[data-admin-i18n-aria]").forEach(function (el) {
        el.setAttribute("aria-label", t(el.getAttribute("data-admin-i18n-aria")));
      });
      document.querySelectorAll(".act-btn").forEach(swap);
    } catch (e) {
      /* ağır değil */
    }
  }

  function observe() {
    var panel = document.getElementById("admin-panel");
    if (!panel || !window.MutationObserver) return;
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var nodes = muts[i].addedNodes;
        for (var j = 0; j < nodes.length; j++) {
          if (!nodes[j].querySelectorAll) continue;
          nodes[j].querySelectorAll(".act-btn").forEach(swap);
        }
      }
    }).observe(panel, { childList: true, subtree: true });
  }

  function toggle() {
    LANG = LANG === "tr" ? "en" : "tr";
    try {
      localStorage.setItem("qlang", LANG);
    } catch (e) {}
    apply();
  }

  window.adminTT = toggle;
  window.adminT = t;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      apply();
      observe();
    });
  } else {
    apply();
    observe();
  }
})();
