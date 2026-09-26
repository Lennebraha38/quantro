import fs from "node:fs";
import { globSync } from "node:fs";

const files = globSync("*.html");
let ok = 0;
const skip = [];
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  if (s.includes("js/entropy.js")) continue;
  if (/<script src="app\.js"><\/script>/.test(s)) {
    s = s.replace(
      '<script src="app.js"></script>',
      '<script src="js/entropy.js"></script>\n    <script src="app.js"></script>',
    );
    fs.writeFileSync(f, s);
    ok++;
  } else skip.push(f);
}
console.log(`entropy.js eklendi: ${ok}/${files.length}`);
if (skip.length) console.log("app.js bulunamadi:", skip.join(", "));
