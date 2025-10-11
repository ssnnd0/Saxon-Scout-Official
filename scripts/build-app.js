const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  const outdir = path.resolve(__dirname, '../dist/app');
  if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });

  // Bundle the app entry
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, '../app/src/main.tsx')],
    bundle: true,
    outfile: path.join(outdir, 'bundle.js'),
    minify: false,
    sourcemap: true,
    platform: 'browser',
    target: ['es2020'],
    loader: { '.png': 'file' },
    jsx: 'transform',
  jsxFactory: 'Inferno.createVNode',
  jsxFragment: 'Inferno.Fragment',
    define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development') }
  });

  // Copy static index.html
  const indexHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Saxon Scout</title>
  <link rel="icon" type="image/x-icon" href="https://images.squarespace-cdn.com/content/v1/6885124a98afac55ac8d915a/71bd5040-7a7f-45e9-96ab-86406027e0dc/favicon.ico?format=100w">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <style>
      body { background-color: #f8f9fa; }
      .loading { text-align: center; margin-top: 50px; }
      .error { color: red; margin: 20px; padding: 20px; border: 1px solid red; }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="loading">
        <h2>Saxon Scout Loading...</h2>
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
    <script>
      window.onerror = function(msg, url, lineNo, columnNo, error) {
        document.getElementById('root').innerHTML = '<div class="error"><h3>JavaScript Error</h3><p>' + msg + '</p><p>Check browser console for details.</p></div>';
        return false;
      };
    </script>
    <script src="/bundle.js"></script>
  </body>
</html>`;
  fs.writeFileSync(path.join(outdir, 'index.html'), indexHtml, 'utf8');

  // Copy assets
  const assetsSrc = path.resolve(__dirname, '../app/src/assets');
  const assetsDest = path.join(outdir, 'assets');
  if (fs.existsSync(assetsSrc)) {
    fs.mkdirSync(assetsDest, { recursive: true });
    for (const f of fs.readdirSync(assetsSrc)) {
      fs.copyFileSync(path.join(assetsSrc, f), path.join(assetsDest, f));
    }
  }

  console.log('App build complete ->', outdir);
}

build().catch(err => { console.error(err); process.exit(1); });
