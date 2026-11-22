// Copies the newest game page into public/. Never fails the build:
// if ../index.html is not visible (e.g. on a build host), the committed copy is used.
import fs from "node:fs";
try { fs.mkdirSync("public", { recursive: true }); fs.copyFileSync("../index.html", "public/index.html"); console.log("copied ../index.html"); }
catch (e) { console.log("skipped copy (" + e.code + "); using committed public/index.html"); }
