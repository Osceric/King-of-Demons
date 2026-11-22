// Copies the newest game page into public/ (and a Test copy into public/test/). Never fails the build:
// if ../index.html is not visible (e.g. on a build host), the committed copies are used.
import fs from "node:fs";
try {
  const h = fs.readFileSync("../index.html", "utf8");
  fs.mkdirSync("public/test", { recursive: true });
  fs.writeFileSync("public/index.html", h);
  fs.writeFileSync("public/test/index.html", h.replace("<title>King of Demons</title>", "<title>King of Demons Test</title>").replace("const TEST_BUILD=false", "const TEST_BUILD=true"));
  console.log("copied ../index.html (and the Test copy)");
} catch (e) { console.log("skipped copy (" + e.code + "); using the committed public/ files"); }
