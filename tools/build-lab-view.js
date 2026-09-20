const fs = require('fs');

const lab = fs.readFileSync('quantro-lab.html', 'utf8');
const idx = fs.readFileSync('index.html', 'utf8');

/* ── 1. Extract body markup (from <div class="bg"> to </footer>) ── */
const bodyStart = lab.indexOf('<div class="bg">');
const footerEnd = lab.indexOf('</footer>') + '</footer>'.length;
let bodyMarkup = lab.slice(bodyStart, footerEnd);

/* ── 2. Transform markup for index.html integration ── */
bodyMarkup = bodyMarkup
  .replace(/\bid="nav"/g, 'id="lab-nav"')
  .replace(/\bid="hero"/g, 'id="lab-hero"')
  .replace(/\bid="hero-canvas"/g, 'id="lab-hero-canvas"')
  .replace(/\bid="langbtn"/g, 'id="lab-langbtn"')
  .replace(/data-i18n="hero\.desc"/g, 'data-i18n="lab.hero.desc"')
  .replace(/data-i18n="hero\.scroll"/g, 'data-i18n="lab.hero.scroll"')
  .replace(/href="index\.html"/g, 'href="#home"');

/* ── 3. Extract lab CSS (between <style> and </style>) ── */
const styleStart = lab.indexOf('<style>') + '<style>'.length;
const styleEnd = lab.indexOf('</style>');
let css = lab.slice(styleStart, styleEnd);

/* ── 4. Drop rules that index.html already owns ── */
function dropFirstRule(css, selectorPrefix) {
  const re = new RegExp('(^|\\n)' + selectorPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^{]*\\{[\\s\\S]*?\\n\\}', 'g');
  return css.replace(re, '\n');
}
css = css.replace(/\/\*[\s\S]*?\*\//g, '\n'); // strip all comments first
css = css.replace(/^(\s*\*,?\*::before,?\*::after\{[\s\S]*?\n\})\n/m, '\n'); // * reset
css = css.replace(/^(:root\{[\s\S]*?\n\})\n/m, '\n'); // :root (index.html has same vars)
css = css.replace(/^html\{scroll-behavior:smooth\}\n/m, '\n'); // html
css = css.replace(/^body\{[^\n]*\}\n/m, '\n'); // body
css = css.replace(/^::-webkit-scrollbar\{width:3px\}\n/m, '\n'); // scrollbar width
css = css.replace(/^::-webkit-scrollbar-thumb\{[^\n]*\}\n/m, '\n'); // scrollbar thumb
css = css.replace(/^:focus-visible\{[^\n]*\}\n/m, '\n'); // focus-visible
css = css.replace(/\/\* ══ Cookie Consent \(KVKK\) ══ \*\/[\s\S]*$/, '\n'); // cookie CSS (index.html has it)
const COOKIE_RE = /qc-cookie|qc-inner|qc-text|qc-btns|qc-btn|qc-accept|qc-reject/;

/* ── 4.5 Map lab ids to #lab-* (markup renamed; CSS must match) ── */
css = css
  .replace(/#hero-canvas/g, '#lab-hero-canvas')
  .replace(/#hero\b/g, '#lab-hero');

/* ── 5. Scope selectors under #lab-view ── */
function scopeRule(selector) {
  if (selector.trim() === '') return selector;
  const parts = selector.split(',');
  return parts.map(p => {
    p = p.trim();
    if (!p) return p;
    if (p.startsWith('@')) return p;
    if (p === '*' || p === '*::before' || p === '*::after') return '#lab-view ' + p;
    return '#lab-view ' + p;
  }).join(', ');
}

function processCssBlock(input) {
  let out = '';
  let i = 0;
  while (i < input.length) {
    if (input.startsWith('/*', i)) {
      const end = input.indexOf('*/', i + 2);
      if (end === -1) { out += input.slice(i); break; }
      out += input.slice(i, end + 2);
      i = end + 2;
      continue;
    }
    const at = input[i];
    if (at === '@' || /^\s+@/.test(input.slice(i, i + 16))) {
      const b = input.indexOf('{', i);
      if (b === -1) { out += input.slice(i); break; }
      const header = input.slice(i, b).trim();
      const { inner, end } = readBraced(input, b);
      if (/@media/.test(header)) {
        out += header + '{\n' + processCssBlock(inner) + '\n}';
      } else if (/@keyframes/.test(header)) {
        out += header + '{\n' + inner + '\n}';
      } else {
        out += header + '{\n' + processCssBlock(inner) + '\n}';
      }
      i = end;
      continue;
    }
    const braceIdx = input.indexOf('{', i);
    if (braceIdx === -1) { out += input.slice(i); break; }
    const selector = input.slice(i, braceIdx).trim();
    const { inner, end } = readBraced(input, braceIdx);
    if (COOKIE_RE.test(selector)) { i = end; continue; } // skip cookie CSS (index.html owns it)
    out += scopeRule(selector) + '{\n' + inner + '\n}';
    i = end;
  }
  return out;
}

function readBraced(input, openIdx) {
  let depth = 0, j = openIdx;
  for (; j < input.length; j++) {
    if (input[j] === '{') depth++;
    else if (input[j] === '}') { depth--; if (depth === 0) break; }
  }
  return { inner: input.slice(openIdx + 1, j), end: j + 1 };
}

css = processCssBlock(css);

/* ── 6. Build the #lab-view HTML ── */
const labView =
  '<!-- ══ LAB VIEW (quantro-lab.html entegre) ══ -->\n' +
  '<div id="lab-view" hidden aria-hidden="true">\n' +
  bodyMarkup + '\n' +
  '</div>\n';

/* ── 7. Insert into index.html ── */
// remove previously-inserted blocks (idempotent)
let out = idx.replace(/<!-- ══ LAB VIEW CSS \(scoped #lab-view\) ══ -->\n<style>[\s\S]*?<\/style>\n/g, '');
out = out.replace(/<!-- ══ LAB VIEW \(quantro-lab\.html entegre\) ══ -->\n<div id="lab-view"[\s\S]*?\n<\/div>\n\n/g, '');

// CSS into <head> before </head>
const headClose = out.lastIndexOf('</head>');
out = out.slice(0, headClose) +
  '\n<!-- ══ LAB VIEW CSS (scoped #lab-view) ══ -->\n<style>\n' + css + '\n</style>\n' +
  out.slice(headClose);

// lab-view markup before </body>
const bodyClose = out.lastIndexOf('</body>');
out = out.slice(0, bodyClose) + '\n' + labView + '\n' + out.slice(bodyClose);

fs.writeFileSync('index.html', out);
console.log('bodyMarkup lines:', bodyMarkup.split('\n').length);
console.log('css length:', css.length);
console.log('OK');
