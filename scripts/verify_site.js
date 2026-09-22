import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'index.html',
  'work.html',
  'services.html',
  'about.html',
  'contact.html',
  'work/africa-creative-summit/index.html',
  'work/night-of-culture/index.html',
  'work/future-of-business/index.html',
  'work/city-of-light/index.html',
  'work/africa-in-motion/index.html'
];

let totalErrors = 0;

files.forEach(f => {
  const fullPath = path.resolve(__dirname, '..', f);
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
    const resolved = path.resolve(dir, src);
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
    const resolved = path.resolve(dir, poster);
    if (!fs.existsSync(resolved)) {
      console.error(`[${f}] Broken poster: "${poster}" -> ${resolved}`);
      totalErrors++;
    }
  }

  // Check href (stylesheets, internal pages)
  const hrefRegex = /href=["']([^"']+)["']/g;
  while ((match = hrefRegex.exec(content)) !== null) {
    const href = match[1];
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('data:')) continue;
    const resolved = path.resolve(dir, href);
    if (!fs.existsSync(resolved)) {
      console.error(`[${f}] Broken href: "${href}" -> ${resolved}`);
      totalErrors++;
    }
  }
});

if (totalErrors === 0) {
  console.log('SUCCESS: All 10 HTML pages and all referenced assets/links verified on disk!');
} else {
  console.log(`COMPLETED WITH ${totalErrors} ERROR(S)`);
  process.exit(1);
}
