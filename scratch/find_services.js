const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.toLowerCase().includes('service') && (l.includes('<section') || l.includes('<div class=') || l.includes('<h2') || l.includes('<h3'))) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
