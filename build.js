// Usage: node build.js  -> concatenates src/* in order into index.html (single self-contained page)
const fs=require("fs"),path=require("path");
const dir=path.join(__dirname,"src");
const out=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),"utf8")).join("");
// A page whose script does not parse is dead on arrival (Space Scrum shipped one in 0.94): refuse to call the build good.
{
  const vm=require("vm"),re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;let m,n=0;
  while((m=re.exec(out))){n++;try{new vm.Script(m[1])}catch(e){console.error("BUILD BROKEN: script block "+n+" does not parse: "+e.message);process.exit(1)}}
  if(!n){console.error("BUILD BROKEN: no script found in the page.");process.exit(1)}
}
fs.writeFileSync(path.join(__dirname,"index.html"),out);
console.log("index.html written,",out.length,"bytes");
