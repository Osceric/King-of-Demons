// Usage: node build.js  -> concatenates src/* in order into index.html (single self-contained page)
const fs=require("fs"),path=require("path");
const dir=path.join(__dirname,"src");
const out=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),"utf8")).join("");
fs.writeFileSync(path.join(__dirname,"index.html"),out);
console.log("index.html written,",out.length,"bytes");
