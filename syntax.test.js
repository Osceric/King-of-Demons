// The built page's scripts must at least parse. Run: node syntax.test.js  (expects {"bad":[]})
const fs=require("fs"),vm=require("vm"),path=require("path"),bad=[];
const s=fs.readFileSync(path.join(__dirname,"index.html"),"utf8"),re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;let m,n=0;
while((m=re.exec(s))){n++;try{new vm.Script(m[1])}catch(e){bad.push("script block "+n+": "+e.message)}}
if(!n)bad.push("no script found");
console.log(JSON.stringify({bad,blocks:n}));process.exit(bad.length?1:0);
