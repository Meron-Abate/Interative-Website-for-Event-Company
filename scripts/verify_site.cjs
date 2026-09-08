const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const htmlFiles = [
  'index.html',
  'about/index.html',
  'work/index.html',
  'works/index.html',
  'services/index.html',
  'contact/index.html',
  'work/africa-creative-summit/index.html',
  'work/night-of-culture/index.html',
  'work/future-of-business/index.html',
  'work/city-of-light/index.html',
  'work/africa-in-motion/index.html'
];

const configFiles = [
  'vercel.json',
  'netlify.toml',
  '_redirects',
  '.htaccess',
  'nginx.conf',
  'sitemap.xml',
  'robots.txt'
];

let totalErrors = 0;

// Verify config files exist
configFiles.forEach(cfg => {
  const p = path.join(projectRoot, cfg);
  if (!fs.existsSync(p)) {
    console.error(`MISSING CONFIG FILE: ${cfg}`);
    totalErrors++;
  } else {
    console.log(`[CONFIG OK] ${cfg}`);
  }
});

function resolvePath(baseDir, rawPath) {
  const clean = rawPath.split('?')[0].split('#')[0];
  if (!clean || clean === '/') {
    return path.join(projectRoot, 'index.html');
  }

  if (clean.startsWith('/')) {
    // Root-relative path
    const candidate = path.join(projectRoot, clean);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return path.join(candidate, 'index.html');
    }
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    if (fs.existsSync(candidate + '.html')) {
      return candidate + '.html';
    }
    return candidate;
  } else {
    // Relative path
    const candidate = path.resolve(baseDir, clean);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return path.join(candidate, 'index.html');
    }
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    if (fs.existsSync(candidate + '.html')) {
      return candidate + '.html';
    }
    return candidate;
  }
}

htmlFiles.forEach(f => {
  const fullPath = path.join(projectRoot, f);
  if (!fs.existsSync(fullPath)) {
    console.error('MISSING FILE:', f);
    totalErrors++;
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  const dir = path.dirname(fullPath);

  // Check src
  const srcRegex = /src=["']([^"']+)["']/g;
  let match;
  while ((match = srcRegex.exec(content)) !== null) {
    const src = match[1];
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('#')) continue;
    const resolved = resolvePath(dir, src);
    if (!fs.existsSync(resolved)) {
      console.error(`[${f}] Broken src: "${src}" -> ${resolved}`);
      totalErrors++;
    }
  }

  // Check poster
  const posterRegex = /poster=["']([^"']+)["']/g;
  while ((match = posterRegex.exec(content)) !== null) {
    const poster = match[1];
    if (poster.startsWith('http') || poster.startsWith('data:') || poster.startsWith('#')) continue;
    const resolved = resolvePath(dir, poster);
    if (!fs.existsSync(resolved)) {
      console.error(`[${f}] Broken poster: "${poster}" -> ${resolved}`);
      totalErrors++;
    }
  }

  // Check href (stylesheets, internal pages)
  const hrefRegex = /href=["']([^"']+)["']/g;
  while ((match = hrefRegex.exec(content)) !== null) {
    const href = match[1];
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('data:')) continue;
    const resolved = resolvePath(dir, href);
    if (!fs.existsSync(resolved)) {
      console.error(`[${f}] Broken href: "${href}" -> ${resolved}`);
      totalErrors++;
    }
  }
});

if (totalErrors === 0) {
  console.log(`SUCCESS: All ${htmlFiles.length} HTML pages and all referenced assets/links verified on disk!`);
} else {
  console.log(`COMPLETED WITH ${totalErrors} ERROR(S)`);
  process.exit(1);
}
