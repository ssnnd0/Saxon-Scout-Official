(async ()=>{
  // Headless test: load the app and capture console messages.
  try{
    const puppeteer = require('puppeteer');
    const fs = require('fs');
    const out = [];
    const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
    const page = await browser.newPage();
    page.on('console', msg => {
      try{ out.push({type: 'console', text: msg.text(), location: msg.location ? msg.location() : null}); }catch(e){}
    });
    page.on('pageerror', err => { out.push({type: 'pageerror', error: String(err && err.stack ? err.stack : err)}); });
    page.on('requestfailed', req => { out.push({type: 'requestfailed', url: req.url(), failure: req.failure()}); });

    const url = process.argv[2] || 'http://localhost:8787/';
    await page.goto(url, {waitUntil: 'networkidle2', timeout: 15000}).catch(e=>{
      out.push({type:'goto-error', error: String(e)});
    });
    // wait a bit to allow app to initialize; use fallback if API differs
    if (typeof page.waitForTimeout === 'function') {
      await page.waitForTimeout(6000);
    } else {
      await new Promise((r) => setTimeout(r, 6000));
    }
    // capture window globals
    const result = await page.evaluate(()=>{
      return {
        __saxon_app_ready: window.__saxon_app_ready || false,
        __saxon_app_error: window.__saxon_app_error || null
      };
    }).catch(e=>({evalError:String(e)}));
    out.push({type:'globals', value: result});
    await browser.close();
    const outPath = './headless-log.json';
    fs.writeFileSync(outPath, JSON.stringify(out,null,2),'utf8');
    console.log('Headless run complete, wrote', outPath);
  }catch(e){
    console.error('Puppeteer not available or failed:', e.message || e);
    console.error('Install puppeteer: npm i -D puppeteer');
    process.exit(2);
  }
})();
