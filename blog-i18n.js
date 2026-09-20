/* ═══════════════════════════════════════════════════════
   Quantro Blog · arayüz i18n (8 dil — ana site ile aynı `qlang`)
   Blog YAZILARI Türkçe içeriktir; arayüz (nav, hero, arama,
   yorum/sharart formu, footer) seçilen dile çevrilir.
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var LANGS = ['tr', 'en', 'fr', 'es', 'it', 'ru', 'ko', 'ar'];

  var I18N = {
    tr: {
      'nav.home': '← Ana Sayfa', 'skip': 'İçeriğe geç', 'bc.home': 'Ana Sayfa', 'bc.cur': 'Blog',
      'hero.ey': 'Quantro · Araştırma Blogu',
      'hero.h1a': 'ARAŞTIRMA', 'hero.h1b': 'BLOGU',
      'hero.sub': 'Kuantum mekaniği, astrofizik ve ileri araştırma yazıları.',
      'search.ph': 'Yazılarda ara... (başlık, özet, etiket)',
      'loading': 'Yazılar yükleniyor',
      'back': '← Tüm Yazılar', 'cm.lbl': 'Yorum',
      'related': 'İlgili Yazılar', 'cm.title': 'Yorumlar',
      'cm.empty': 'Yorumlar yükleniyor…', 'cm.form': 'Yorum Yap',
      'cm.name': 'Adınız *', 'cm.email': 'E-posta (isteğe bağlı)',
      'cm.content': 'Yorumunuz… *', 'cm.submit': 'Gönder',
      'share': 'Paylaş', 'wa': 'WhatsApp', 'copy': 'Kopyala', 'copied': 'Kopyalandı',
      'reply': '↩ Yanıtla', 'like': 'Beğen',
      'ft.tag': 'Araştırma Blogu', 'ft.copy': '© {0} Quantro ARGE · Kayseri, Türkiye'
    },
    en: {
      'nav.home': '← Home', 'skip': 'Skip to content', 'bc.home': 'Home', 'bc.cur': 'Blog',
      'hero.ey': 'Quantro · Research Blog',
      'hero.h1a': 'RESEARCH', 'hero.h1b': 'BLOG',
      'hero.sub': 'Quantum mechanics, astrophysics and advanced research notes.',
      'search.ph': 'Search posts... (title, summary, tag)',
      'loading': 'Loading posts',
      'back': '← All Posts', 'cm.lbl': 'Comments',
      'related': 'Related Posts', 'cm.title': 'Comments',
      'cm.empty': 'Loading comments…', 'cm.form': 'Leave a Comment',
      'cm.name': 'Your name *', 'cm.email': 'Email (optional)',
      'cm.content': 'Your comment… *', 'cm.submit': 'Submit',
      'share': 'Share', 'wa': 'WhatsApp', 'copy': 'Copy', 'copied': 'Copied',
      'reply': '↩ Reply', 'like': 'Like',
      'ft.tag': 'Research Blog', 'ft.copy': '© {0} Quantro ARGE · Kayseri, Türkiye'
    },
    fr: {
      'nav.home': '← Accueil', 'skip': 'Aller au contenu', 'bc.home': 'Accueil', 'bc.cur': 'Blog',
      'hero.ey': 'Quantro · Blog de recherche',
      'hero.h1a': 'RECHERCHE', 'hero.h1b': 'BLOG',
      'hero.sub': 'Mécanique quantique, astrophysique et notes de recherche.',
      'search.ph': 'Rechercher... (titre, résumé, étiquette)',
      'loading': 'Chargement des articles',
      'back': '← Tous les articles', 'cm.lbl': 'Commentaires',
      'related': 'Articles liés', 'cm.title': 'Commentaires',
      'cm.empty': 'Chargement des commentaires…', 'cm.form': 'Commenter',
      'cm.name': 'Votre nom *', 'cm.email': 'E-mail (facultatif)',
      'cm.content': 'Votre commentaire… *', 'cm.submit': 'Envoyer',
      'share': 'Partager', 'wa': 'WhatsApp', 'copy': 'Copier', 'copied': 'Copié',
      'reply': '↩ Répondre', 'like': 'Aimer',
      'ft.tag': 'Blog de recherche', 'ft.copy': '© {0} Quantro ARGE · Kayseri, Türkiye'
    },
    es: {
      'nav.home': '← Inicio', 'skip': 'Ir al contenido', 'bc.home': 'Inicio', 'bc.cur': 'Blog',
      'hero.ey': 'Quantro · Blog de investigación',
      'hero.h1a': 'INVESTIGACIÓN', 'hero.h1b': 'BLOG',
      'hero.sub': 'Mecánica cuántica, astrofísica y notas de investigación.',
      'search.ph': 'Buscar... (título, resumen, etiqueta)',
      'loading': 'Cargando artículos',
      'back': '← Todos los artículos', 'cm.lbl': 'Comentarios',
      'related': 'Artículos relacionados', 'cm.title': 'Comentarios',
      'cm.empty': 'Cargando comentarios…', 'cm.form': 'Comentar',
      'cm.name': 'Tu nombre *', 'cm.email': 'Correo (opcional)',
      'cm.content': 'Tu comentario… *', 'cm.submit': 'Enviar',
      'share': 'Compartir', 'wa': 'WhatsApp', 'copy': 'Copiar', 'copied': 'Copiado',
      'reply': '↩ Responder', 'like': 'Me gusta',
      'ft.tag': 'Blog de investigación', 'ft.copy': '© {0} Quantro ARGE · Kayseri, Turquía'
    },
    it: {
      'nav.home': '← Home', 'skip': 'Vai al contenuto', 'bc.home': 'Home', 'bc.cur': 'Blog',
      'hero.ey': 'Quantro · Blog di ricerca',
      'hero.h1a': 'RICERCA', 'hero.h1b': 'BLOG',
      'hero.sub': 'Meccanica quantistica, astrofisica e note di ricerca.',
      'search.ph': 'Cerca... (titolo, sommario, etichetta)',
      'loading': 'Caricamento articoli',
      'back': '← Tutti gli articoli', 'cm.lbl': 'Commenti',
      'related': 'Articoli correlati', 'cm.title': 'Commenti',
      'cm.empty': 'Caricamento commenti…', 'cm.form': 'Commenta',
      'cm.name': 'Il tuo nome *', 'cm.email': 'Email (facoltativa)',
      'cm.content': 'Il tuo commento… *', 'cm.submit': 'Invia',
      'share': 'Condividi', 'wa': 'WhatsApp', 'copy': 'Copia', 'copied': 'Copiato',
      'reply': '↩ Rispondi', 'like': 'Mi piace',
      'ft.tag': 'Blog di ricerca', 'ft.copy': '© {0} Quantro ARGE · Kayseri, Turchia'
    },
    ru: {
      'nav.home': '← Главная', 'skip': 'К содержанию', 'bc.home': 'Главная', 'bc.cur': 'Блог',
      'hero.ey': 'Quantro · Исследовательский блог',
      'hero.h1a': 'ИССЛЕДОВАНИЯ', 'hero.h1b': 'БЛОГ',
      'hero.sub': 'Квантовая механика, астрофизика и научные заметки.',
      'search.ph': 'Поиск... (заголовок, описание, тег)',
      'loading': 'Загрузка статей',
      'back': '← Все статьи', 'cm.lbl': 'Комментарии',
      'related': 'Похожие статьи', 'cm.title': 'Комментарии',
      'cm.empty': 'Загрузка комментариев…', 'cm.form': 'Оставить комментарий',
      'cm.name': 'Ваше имя *', 'cm.email': 'Email (необязательно)',
      'cm.content': 'Ваш комментарий… *', 'cm.submit': 'Отправить',
      'share': 'Поделиться', 'wa': 'WhatsApp', 'copy': 'Копировать', 'copied': 'Скопировано',
      'reply': '↩ Ответить', 'like': 'Нравится',
      'ft.tag': 'Исследовательский блог', 'ft.copy': '© {0} Quantro ARGE · Кайсери, Турция'
    },
    ko: {
      'nav.home': '← 홈', 'skip': '콘텐츠로 건너뛰기', 'bc.home': '홈', 'bc.cur': '블로그',
      'hero.ey': 'Quantro · 연구 블로그',
      'hero.h1a': '연구', 'hero.h1b': '블로그',
      'hero.sub': '양자역학, 천체물리학과 첨단 연구 노트.',
      'search.ph': '게시물 검색... (제목, 요약, 태그)',
      'loading': '게시물 불러오는 중',
      'back': '← 전체 게시물', 'cm.lbl': '댓글',
      'related': '관련 게시물', 'cm.title': '댓글',
      'cm.empty': '댓글 불러오는 중…', 'cm.form': '댓글 작성',
      'cm.name': '이름 *', 'cm.email': '이메일 (선택)',
      'cm.content': '댓글… *', 'cm.submit': '전송',
      'share': '공유', 'wa': 'WhatsApp', 'copy': '복사', 'copied': '복사됨',
      'reply': '↩ 댓글 달기', 'like': '좋아요',
      'ft.tag': '연구 블로그', 'ft.copy': '© {0} Quantro ARGE · 카이세리, 튀르키예'
    },
    ar: {
      'nav.home': '← الرئيسية', 'skip': 'تخطي إلى المحتوى', 'bc.home': 'الرئيسية', 'bc.cur': 'المدونة',
      'hero.ey': 'Quantro · مدونة الأبحاث',
      'hero.h1a': 'البحوث', 'hero.h1b': 'المدونة',
      'hero.sub': 'ميكانيكا الكم، الفيزياء الفلكية وملاحظات بحثية.',
      'search.ph': 'بحث في المقالات... (العنوان، الملخص، الوسم)',
      'loading': 'جارٍ تحميل المقالات',
      'back': '← كل المقالات', 'cm.lbl': 'تعليقات',
      'related': 'مقالات ذات صلة', 'cm.title': 'التعليقات',
      'cm.empty': 'جارٍ تحميل التعليقات…', 'cm.form': 'أضف تعليقًا',
      'cm.name': 'اسمك *', 'cm.email': 'البريد الإلكتروني (اختياري)',
      'cm.content': 'تعليقك… *', 'cm.submit': 'إرسال',
      'share': 'مشاركة', 'wa': 'WhatsApp', 'copy': 'نسخ', 'copied': 'تم النسخ',
      'reply': '↩ رد', 'like': 'إعجاب',
      'ft.tag': 'مدونة الأبحاث', 'ft.copy': '© {0} Quantro ARGE · قيصري، تركيا'
    }
  };

  var saved;
  try { saved = localStorage.getItem('qlang'); } catch (e) { saved = null; }
  var uq;
  try { uq = new URLSearchParams(location.search).get('lang'); } catch (e) { uq = null; }
  var LANG = (uq && LANGS.indexOf(uq) > -1) ? uq : ((saved && LANGS.indexOf(saved) > -1) ? saved : 'tr');

  function t(k) {
    return ((I18N[LANG] && I18N[LANG][k]) || I18N.tr[k] || k);
  }

  function apply() {
    try {
      document.documentElement.lang = LANG;
      document.documentElement.dir = (LANG === 'ar') ? 'rtl' : 'ltr';
      var btn = document.getElementById('langbtn');
      if (btn) btn.textContent = (LANG === 'tr' ? 'TR' : LANG.toUpperCase());
      document.querySelectorAll('[data-blog-i18n]').forEach(function (el) {
        el.innerHTML = t(el.getAttribute('data-blog-i18n'));
      });
      document.querySelectorAll('[data-blog-i18n-ph]').forEach(function (el) {
        el.placeholder = t(el.getAttribute('data-blog-i18n-ph'));
      });
      var fy = document.getElementById('fyear');
      var fc = document.getElementById('ft-copy');
      if (fc && fy) fc.innerHTML = t('ft.copy').split('{0}').join(fy.textContent);
    } catch (e) { /* ağır değil */ }
  }

  function toggle() {
    LANG = LANGS[(LANGS.indexOf(LANG) + 1) % LANGS.length];
    try { localStorage.setItem('qlang', LANG); } catch (e) {}
    apply();
    if (window.__blogOnLangSwitch) { try { window.__blogOnLangSwitch(); } catch (e) {} }
  }

  function currentLang() { return LANG; }

  window.blogT = t;
  window.blogLang = currentLang;
  window.blogToggleLang = toggle;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();