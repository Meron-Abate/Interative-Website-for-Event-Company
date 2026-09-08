const fs = require('fs');
const path = require('path');

const projectRoot = __dirname ? path.resolve(__dirname, '..') : process.cwd();

const files = [
  'about/index.html',
  'about.html',
  'services/index.html',
  'services.html',
  'work/index.html',
  'work.html',
  'works/index.html',
  'contact/index.html',
  'contact.html',
  'work/africa-creative-summit/index.html',
  'work/africa-in-motion/index.html',
  'work/city-of-light/index.html',
  'work/future-of-business/index.html',
  'work/night-of-culture/index.html'
];

files.forEach(rel => {
  const fullPath = path.join(projectRoot, rel);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace header logo
  content = content.replace(
    /<a href="[^"]*" class="brand-logo" aria-label="[^"]*">[\s\S]*?<\/a>/,
    '<a href="/" class="brand-logo" aria-label="ETERNAL Events Home">\n        <img src="/assets/images/logo/eternal-events-dark.png" alt="ETERNAL Events" class="brand-logo-img brand-logo-dark">\n        <img src="/assets/images/logo/eternal-events-light.png" alt="ETERNAL Events" class="brand-logo-img brand-logo-light">\n      </a>'
  );

  // Replace footer logo
  content = content.replace(
    /<a href="[^"]*" class="brand-logo">[\s\S]*?<\/a>/,
    '<a href="/" class="brand-logo footer-logo" aria-label="ETERNAL Events Home">\n            <img src="/assets/images/logo/eternal-events-dark.png" alt="ETERNAL Events" class="brand-logo-img brand-logo-dark">\n            <img src="/assets/images/logo/eternal-events-light.png" alt="ETERNAL Events" class="brand-logo-img brand-logo-light">\n          </a>'
  );

  // Coords
  content = content.replace(/ADDIS ABABA \/\/ NAIROBI \/\/ LONDON/g, 'ADDIS ABABA • NAIROBI • LONDON');

  // CAPABILITY // 01
  content = content.replace(/CAPABILITY \/\/ (\d+)/g, 'CAPABILITY $1');

  // Case study sections
  content = content.replace(/(\d{2}) \/\/ CASE STUDY/g, '$1 CASE STUDY');
  content = content.replace(/(\d{2}) \/\/ CONTEXT/g, '$1 CONTEXT');
  content = content.replace(/(\d{2}) \/\/ STRATEGY/g, '$1 STRATEGY');
  content = content.replace(/NEXT CASE STUDY \/\/ (\d+)/g, 'NEXT CASE STUDY $1');

  // Badges
  content = content.replace(/(\d{2}) \/\/ ([A-Z\s&]+)/g, '$1 $2');

  // Remaining textual separators
  content = content.replace(/ \/\/ /g, ' • ');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Successfully updated:', rel);
});
