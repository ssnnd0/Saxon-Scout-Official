const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  const outdir = path.resolve(__dirname, '../dist/app');
  // Clean previous build output to avoid duplicate emitted assets
  if (fs.existsSync(outdir)) {
    try {
      fs.rmSync(outdir, { recursive: true, force: true });
    } catch (e) {
      // fallback for older Node versions
      const rimraf = require('rimraf');
      rimraf.sync(outdir);
    }
  }
  fs.mkdirSync(outdir, { recursive: true });

  // Bundle the app entry
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, '../app/src/main.tsx')],
    bundle: true,
    outdir: outdir,
    entryNames: 'bundle',
    assetNames: 'assets/[name]',
    minify: false,
    sourcemap: true,
    publicPath: '/',
    platform: 'browser',
    target: ['es2020'],
    loader: { '.png': 'file' },
    jsx: 'transform',
    jsxFactory: 'Inferno.createVNode',
    jsxFragment: 'Inferno.Fragment',
    define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development') }
  });
  
  // Copy static index.html template (we will inject the watchdog below)
  const indexHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Saxon Scout</title>
  <link rel="icon" type="image/x-icon" href="https://images.squarespace-cdn.com/content/v1/6885124a98afac55ac8d915a/71bd5040-7a7f-45e9-96ab-86406027e0dc/favicon.ico?format=100w">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <style>
      body { 
        background-color: #f8f9fa;
        margin: 0;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
      }
      .loading-content {
        text-align: center;
        max-width: 400px;
      }
      .loading-title {
        color: #1a73e8;
        font-size: 2.5rem;
        margin-bottom: 2rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
      }
      .loading-spinner-group {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
        margin: 2rem 0;
      }
      .loading-spinner {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: inline-block;
        animation: pulse 1.5s ease-in-out infinite;
      }
      .loading-spinner.primary {
        background-color: #007bff;
        animation-delay: 0s;
      }
      .loading-spinner.secondary {
        background-color: #6c757d;
        animation-delay: 0.2s;
      }
      .loading-spinner.success {
        background-color: #28a745;
        animation-delay: 0.4s;
      }
      .loading-message {
        color: #6c757d;
        font-size: 1.1rem;
        margin-top: 1rem;
        animation: fade 2s ease-in-out infinite;
      }
      .error { 
        color: #dc3545;
        margin: 20px;
        padding: 20px;
        border: 1px solid #dc3545;
        border-radius: 8px;
        background-color: #fff;
        box-shadow: 0 2px 4px rgba(220, 53, 69, 0.1);
      }
      @keyframes pulse {
        0% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        50% {
          transform: scale(1.2);
          opacity: 1;
        }
        100% {
          transform: scale(0.8);
          opacity: 0.5;
        }
      }
      @keyframes fade {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="loading">
        <div class="loading-content">
          <h2 class="loading-title">Saxon Scout</h2>
          <div class="loading-spinner-group">
            <div class="loading-spinner primary"></div>
            <div class="loading-spinner secondary"></div>
            <div class="loading-spinner success"></div>
          </div>
          <p class="loading-message">Initializing scouting system...</p>
        </div>
      </div>
    </div>
    <script>
      window.onerror = function(msg, url, lineNo, columnNo, error) {
        document.getElementById('root').innerHTML = '<div class="error"><h3>JavaScript Error</h3><p>' + msg + '</p><p>Check browser console for details.</p></div>';
        return false;
      };
    </script>
  <script src="bundle.js"></script>
  </body>
</html>`;

  // helpful message if the app bundle fails to mount within a few seconds.
  // The browser-executed bundle will set `window.__saxon_app_ready = true` on
  // successful mount; if that never happens we show guidance to the user.
  const watchdog = `
    <script>
      (function(){
        const WAIT_MS = 5000;
        const root = document.getElementById('root');
        const timer = setTimeout(function(){
          try {
            if (window.__saxon_app_ready) return;
            if (!root) return;
            const container = document.createElement('div');
            container.className = 'error';
            const h3 = document.createElement('h3'); h3.textContent = 'Application failed to start';
            container.appendChild(h3);
            const p1 = document.createElement('p'); p1.textContent = 'The frontend bundle did not initialize within ' + (WAIT_MS/1000) + 's.'; container.appendChild(p1);
            const p2 = document.createElement('p'); p2.textContent = 'Open the browser console for errors. If you are using a browser without the File System Access API, some features may be unavailable.'; container.appendChild(p2);
            const p3 = document.createElement('p');
            const btnRetry = document.createElement('button'); btnRetry.id = 'saxon-retry'; btnRetry.className = 'btn btn-primary'; btnRetry.textContent = 'Reload';
            const btnConsole = document.createElement('button'); btnConsole.id = 'saxon-open-console'; btnConsole.className = 'btn btn-secondary'; btnConsole.textContent = 'Show Console';
            p3.appendChild(btnRetry); p3.appendChild(document.createTextNode(' ')); p3.appendChild(btnConsole);
            container.appendChild(p3);
            root.innerHTML = '';
            root.appendChild(container);
            btnRetry.onclick = function(){ location.reload(); };
            btnConsole.onclick = function(){ alert('Open the developer console (F12) to view errors.'); };
          } catch (e) { }
        }, WAIT_MS);
        const poll = setInterval(function(){ if (window.__saxon_app_ready) { clearTimeout(timer); clearInterval(poll); } }, 200);
      })();
    </script>
  `;
  // Inject the watchdog script before closing </body> so it runs if the
  // bundle fails to mount. We keep the original indexHtml contents and
  // append the watchdog just before the body close tag.
  const finalHtml = indexHtml.replace('</body>', `${watchdog}\n  </body>`);
  fs.writeFileSync(path.join(outdir, 'index.html'), finalHtml, 'utf8');

  // esbuild emits assets (images) into the outdir when loader: {'.png':'file'}
  // Keep a fallback: if there is no assets directory and there are source
  // assets, copy them over. This should be rare.
  const assetsSrc = path.resolve(__dirname, '../app/src/assets');
  const assetsDest = path.join(outdir, 'assets');
  if (!fs.existsSync(assetsDest) && fs.existsSync(assetsSrc)) {
    fs.mkdirSync(assetsDest, { recursive: true });
    for (const f of fs.readdirSync(assetsSrc)) {
      fs.copyFileSync(path.join(assetsSrc, f), path.join(assetsDest, f));
    }
  }

  console.log('App build complete ->', outdir);
}

build().catch(err => { console.error(err); process.exit(1); });
