#!/usr/bin/env node

/**
 * Build script for Saxon Scout app
 * Compiles TypeScript/JSX with esbuild and copies PWA assets
 */

import esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.argv.includes('--dev');
const distDir = path.resolve(__dirname, '../dist/app');

async function build() {
  try {
    console.log('Building Saxon Scout app...');

    // Ensure dist directory exists
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
      console.log(`Created directory: ${distDir}`);
    }

    // Copy CSS file
    console.log('Copying CSS...');
    fs.copyFileSync(
      path.resolve(__dirname, '../app/src/styles/theme.css'),
      path.resolve(distDir, 'app.css')
    );
    console.log('✓ CSS copied successfully');

    // Build configuration
    const buildConfig = {
      entryPoints: [path.resolve(__dirname, '../app/src/main.tsx')],
      outfile: path.resolve(distDir, 'app.js'),
      bundle: true,
      minify: !isDev,
      sourcemap: isDev,
      format: 'iife',
      target: 'es2020',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      loader: {
        '.png': 'file',
        '.jpg': 'file',
        '.jpeg': 'file',
        '.webp': 'file',
        '.svg': 'file',
        '.woff': 'file',
        '.woff2': 'file',
        '.ttf': 'file',
        '.eot': 'file',
        '.css': 'css'
      },
      define: {
        'process.env.NODE_ENV': isDev ? '"development"' : '"production"',
        'process.env': '{"NODE_ENV":"' + (isDev ? 'development' : 'production') + '"}',
        'process': '{"env":{"NODE_ENV":"' + (isDev ? 'development' : 'production') + '"}}'
      }
    };

    // Build with esbuild (use context for watch mode)
    if (isDev) {
      const ctx = await esbuild.context(buildConfig);
      await ctx.watch();
      console.log('✓ Initial build complete, watching for changes...');
    } else {
      await esbuild.build(buildConfig);
      console.log('✓ TypeScript/JSX compiled successfully');
    }

    // Copy index.html
    const indexHtmlSrc = path.resolve(__dirname, '../app/index.html');
    const indexHtmlDist = path.resolve(distDir, 'index.html');
    fs.copyFileSync(indexHtmlSrc, indexHtmlDist);
    console.log('✓ Copied index.html');

    // Copy PWA manifest
    const manifestSrc = path.resolve(__dirname, '../app/public/manifest.json');
    const manifestDist = path.resolve(distDir, 'manifest.json');
    if (fs.existsSync(manifestSrc)) {
      fs.copyFileSync(manifestSrc, manifestDist);
      console.log('✓ Copied manifest.json');
    } else {
      console.warn('⚠ manifest.json not found at', manifestSrc);
      // Create a default manifest
      const defaultManifest = {
        name: 'Saxon Scout',
        short_name: 'Saxon Scout',
        description: 'A local-first scouting platform for FRC events',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0066cc',
        orientation: 'portrait-primary',
        scope: '/',
        icons: [
          {
            src: '/app/assets/Logo+611.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      };
      fs.writeFileSync(manifestDist, JSON.stringify(defaultManifest, null, 2));
      console.log('✓ Created default manifest.json');
    }

    // Copy service worker
    const swSrc = path.resolve(__dirname, '../app/public/service-worker.js');
    const swDist = path.resolve(distDir, 'service-worker.js');
    if (fs.existsSync(swSrc)) {
      fs.copyFileSync(swSrc, swDist);
      console.log('✓ Copied service-worker.js');
    } else {
      console.warn('⚠ service-worker.js not found at', swSrc);
      // Create a minimal service worker
      const minimalSW = `
const CACHE_NAME = 'saxon-scout-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => new Response('Offline', { status: 503 }))
  );
});
`;
      fs.writeFileSync(swDist, minimalSW);
      console.log('✓ Created minimal service-worker.js');
    }

    // Copy browserconfig.xml (from app/public or project root)
    const browserconfigDist = path.resolve(distDir, 'browserconfig.xml');
    const browserconfigCandidates = [
      path.resolve(__dirname, '../app/public/browserconfig.xml'),
      path.resolve(__dirname, '../browserconfig.xml')
    ];
    for (const src of browserconfigCandidates) {
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, browserconfigDist);
        console.log('✓ Copied browserconfig.xml');
        break;
      }
    }

    // Copy assets
    const assetsSrc = path.resolve(__dirname, '../app/src/assets');
    const assetsDist = path.resolve(distDir, 'app', 'assets');
    if (fs.existsSync(assetsSrc)) {
      copyDirRecursive(assetsSrc, assetsDist);
      console.log('✓ Copied assets');
    }

    console.log('\n✅ Build completed successfully!');
    console.log(`📦 Output directory: ${distDir}`);
    
    if (isDev) {
      console.log('👀 Watching for changes...');
    }

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

/**
 * Recursively copy a directory
 */
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    const stat = fs.statSync(srcFile);

    if (stat.isDirectory()) {
      copyDirRecursive(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}

// Run build
build();