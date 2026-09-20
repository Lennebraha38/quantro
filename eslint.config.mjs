// ═══════════════════════════════════════════════════════════
// ESLint flat config — Quantro (vanilla JS, hiç framework yok)
// Amaç: gerçek bug'ları yakalamak (tanımsız değişken, kopya anahtar,
// ölü kod). Stil kuralları bilinçli olarak AG kapalı.
//   · Node tarafı (api/apifns/scripts/tools/test): no-undef SIKI.
//   · Tarayıcı tarafı: HTML<->script ortak global'ler tek dosyada
//     görünmediği için no-undef kapalı; diğer bug kuralları açık.
// ═══════════════════════════════════════════════════════════
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      "blog-static.js",
      "**/*.min.js",
      "package/**",
      "eslint.config.mjs",
    ],
  },
  {
    files: ["{api,apifns,scripts,tools,test}/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: {
      "no-undef": "error",
      "no-dupe-keys": "error",
      "no-dupe-class-members": "error",
      "no-redeclare": "error",
      "no-constant-condition": "error",
      "no-unreachable": "error",
      "no-unused-vars": ["error", { vars: "all", args: "none", caughtErrors: "none" }],
    },
  },
  {
    files: ["{api,apifns,scripts,tools,test}/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-undef": "error",
      "no-dupe-keys": "error",
      "no-dupe-class-members": "error",
      "no-redeclare": "error",
      "no-constant-condition": "error",
      "no-unreachable": "error",
      "no-unused-vars": ["error", { vars: "all", args: "none", caughtErrors: "none" }],
    },
  },
  {
    files: ["test/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.browser, // Playwright page.evaluate() içinde tarayıcı API'leri
      },
    },
    rules: {
      "no-undef": "error",
      "no-dupe-keys": "error",
      "no-dupe-class-members": "error",
      "no-redeclare": "error",
      "no-constant-condition": "error",
      "no-unreachable": "error",
      "no-unused-vars": ["error", { vars: "all", args: "none", caughtErrors: "none" }],
    },
  },
  {
    files: ["*.js", "blog*.js", "lab/**/*.js", "lang/**/*.js", "inline/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.node,
        THREE: "readonly",
        self: "readonly",
      },
    },
    rules: {
      "no-dupe-keys": "error",
      "no-dupe-class-members": "error",
      "no-redeclare": "error",
      "no-constant-condition": "error",
      "no-unreachable": "error",
      "no-constant-binary-expression": "error",
      // no-unused-vars bilinçli AG KAPALI: klasik <script> dosyalarında üst düzey
      // fonksiyon/değişkenler öbür script etiketleri ve HTML onclick gövdesinden
      // çağrılan KÜRESEL'lerdir; ESLint bu referansları göremez, yanlış pozitif üretir.
      // Küresel kontrolü Node/test bloklarında (kesin kapsamlı) sıkıdır.
    },
  },
];
