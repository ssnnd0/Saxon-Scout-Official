const fs = require('fs');
const path = require('path');

// Clean dist directory
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  console.log('Cleaning dist directory...');
  fs.rmSync(distDir, { recursive: true, force: true });
}

// Ensure dist directory structure exists
console.log('Creating dist directory structure...');
fs.mkdirSync(path.join(distDir, 'app'), { recursive: true });
fs.mkdirSync(path.join(distDir, 'server'), { recursive: true });

console.log('Clean completed successfully');