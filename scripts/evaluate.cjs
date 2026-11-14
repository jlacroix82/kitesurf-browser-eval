const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {performance} = require('node:perf_hooks');
const puppeteer = require('puppeteer-core');

const fixture = `<!doctype html><html><head><title>Evaluation fixture</title></head><body>
<nav>Navigation noise</nav><main><h1>Browser quality fixture</h1>
<p id="status">WAIT</p><form id="f"><label>Name<input id="name"></label><button type="submit" id="go">Submit</button></form><p id="answer"></p>
<h2>Reference data</h2><table><thead><tr><th>Item</th><th>Count</th></tr></thead><tbody><tr><td>Orchid</td><td>17</td></tr><tr><td>Cedar</td><td>29</td></tr></tbody></table>
<pre><code>print("quality-fixture")</code></pre><a href="https://example.org/reference">Reference</a>
<details><summary>More</summary><p>Expanded evidence: violet-42</p></details><div id="async"></div></main>
<script>document.getElementById('status').textContent='READY';document.getElementById('f').onsubmit=e=>{e.preventDefault();document.getElementById('answer').textContent='Hello Ada'};setTimeout(()=>{document.getElementById('async').textContent='ASYNC_DONE'},150)</script></body></html>`;
const cases = [
 {id:'fixture',url:null,markers:['READY','Hello Ada','ASYNC_DONE','Orchid','17','Cedar','29','quality-fixture','violet-42']},
 {id:'python',url:'https://docs.python.org/3/library/json.html',markers:['json.dumps','json.loads','JSONDecodeError']},
 {id:'github',url:'https://github.com/cloudflare/kitesurf',markers:['Kitesurf','pnpm','CDP']},
 {id:'cloudflare',url:'https://blog.cloudflare.com/kitesurf-open-source/',markers:['Kitesurf','browser','JavaScript']},
 {id:'arxiv',url:'https://arxiv.org/abs/1706.03762',markers:['Attention Is All You Need','Vaswani','Transformer']},
 {id:'wikipedia',url:'https://en.wikipedia.org/wiki/JSON',markers:['JavaScript Object Notation','Douglas Crockford','application/json']},
 {id:'mdn',url:'https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector',markers:['querySelector','SyntaxError','Element']},
 {id:'nvidia',url:'https://forums.developer.nvidia.com/t/velogb10-v0-7-0-release-qwen3-8-flash-next-tp-2-186-tok-sec-single-at-137-tok-sec-on-code/384765/80',markers:['veloGB10','prefill']},
];
function sanitize(s){return String(s).replaceAll(process.cwd(),'<project>').replace(/\/home\/[^\s'"\n]+/g,'<local-path>');}
(async()=>{
 const endpoint=process.env.KITESURF_WS, executablePath=process.env.CHROMIUM_PATH;
 if(!endpoint||!executablePath)throw Error('Set KITESURF_WS and CHROMIUM_PATH explicitly');
 const rounds=Number(process.env.ROUNDS||2);if(!Number.isInteger(rounds)||rounds<1||rounds>4)throw Error('ROUNDS must be 1..4');
 const ids=process.env.CASES?process.env.CASES.split(','):cases.map(c=>c.id);
 const selected=cases.filter(c=>ids.includes(c.id));if(selected.length!==ids.length)throw Error('Unknown/duplicate CASES');
 const out=path.resolve(process.env.OUTPUT||'results/expanded.json');fs.mkdirSync(path.dirname(out),{recursive:true});
 const artifacts=path.resolve('artifacts');fs.mkdirSync(artifacts,{recursive:true});
 const result={schema:1,created_utc:new Date().toISOString(),upstream_revision:process.env.KITESURF_REVISION||'unknown',environment:{platform:process.platform,arch:process.arch,node:process.version,puppeteer:require('puppeteer-core/package.json').version},method:{rounds,wait_until:'domcontentloaded',settle_ms:700,navigation_timeout_ms:20000,case_timeout_note:'protocol calls limited to 20s; runner should also be externally bounded',fresh_page_per_case:true,order:'alternating engine first each round; identical case order',timing:'page creation through extraction and assertions; screenshots separately',quality:'predeclared marker recall + structural extraction; not semantic answer quality; failed/error cases retained'},rows:[]};
 const save=()=>fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');save();
 for(let round=0;round<rounds;round++)for(const engine of round%2?['chromium','kitesurf']:['kitesurf','chromium']){
 let browser;
 try{
 browser=engine==='kitesurf'?await puppeteer.connect({browserWSEndpoint:endpoint,protocolTimeout:20000}):await puppeteer.launch({executablePath,headless:true,userDataDir:path.resolve('profiles',`chromium-${process.pid}-${round}`),args:['--disable-dev-shm-usage'],protocolTimeout:20000});
 const version=await browser.version();
 for(const task of selected){let page;const row={engine,round:round+1,case:task.id,url:task.url,version,expected:task.markers};const start=performance.now();
 try{
 page=await browser.newPage();page.setDefaultNavigationTimeout(20000);page.setDefaultTimeout(12000);await page.setViewport({width:1280,height:800});
 if(task.url){const response=await page.goto(task.url,{waitUntil:'domcontentloaded'});row.http_status=response?response.status():null;row.final_url=page.url();}else{
 await page.setContent(fixture);await page.type('#name','Ada');await page.click('#go');await page.click('summary');await page.waitForFunction(()=>document.querySelector('#async').textContent==='ASYNC_DONE');}
 await new Promise(r=>setTimeout(r,700));
 const data=await page.evaluate(()=>({title:document.title,text:document.body.innerText,main:document.querySelector('main,article,[role="main"]')?.innerText||'',headings:[...document.querySelectorAll('h1,h2,h3')].map(e=>e.textContent.trim()),tables:[...document.querySelectorAll('table')].map(t=>[...t.rows].map(r=>[...r.cells].map(c=>c.innerText))),code:[...document.querySelectorAll('pre')].map(e=>e.innerText),links:[...document.querySelectorAll('a[href]')].map(e=>({text:e.textContent.trim(),href:e.href}))}));
 row.title=data.title;row.text_chars=data.text.length;row.main_chars=data.main.length;row.text_sha256=crypto.createHash('sha256').update(data.text).digest('hex');row.marker_results=task.markers.map(marker=>({marker,found:data.text.toLowerCase().includes(marker.toLowerCase())}));row.all_markers=row.marker_results.every(x=>x.found);row.headings=data.headings.length;row.tables=data.tables.length;row.code_blocks=data.code.length;row.links=data.links.length;
 row.challenge_hint=/verify you are human|checking your browser|access denied|just a moment/i.test(data.title+'\n'+data.text.slice(0,800));
 if(task.id==='fixture'){row.fixture_checks={heading:data.headings.includes('Browser quality fixture'),table:data.tables.some(t=>JSON.stringify(t)===JSON.stringify([['Item','Count'],['Orchid','17'],['Cedar','29']])),code:data.code.includes('print("quality-fixture")'),link:data.links.some(l=>l.href==='https://example.org/reference'),interaction:data.text.includes('Hello Ada'),expanded:data.text.includes('violet-42'),async:data.text.includes('ASYNC_DONE')};row.fixture_pass=Object.values(row.fixture_checks).every(Boolean);}
 row.elapsed_ms=Math.round(performance.now()-start);
 // Full retrieved pages stay local; published rows contain measurements only.
 fs.writeFileSync(path.join(artifacts,`${engine}-${round+1}-${task.id}.json`),JSON.stringify(data,null,2));
 if(process.env.SCREENSHOTS==='1'){let t=performance.now();try{await page.screenshot({path:path.join(artifacts,`${engine}-${round+1}-${task.id}.png`)});row.screenshot_ms=Math.round(performance.now()-t);}catch(e){row.screenshot_error=sanitize(e.message);}}
 }catch(e){row.error=sanitize(e.message);row.elapsed_ms=Math.round(performance.now()-start);}finally{if(page)await page.close().catch(()=>{});result.rows.push(row);save();console.log(JSON.stringify(row));}
 }
 }catch(e){result.rows.push({engine,round:round+1,setup_error:sanitize(e.message)});save();}
 finally{if(browser){if(engine==='kitesurf')browser.disconnect();else await browser.close();}}
 }
 save();
})().catch(e=>{console.error(sanitize(e.message));process.exitCode=1;});
