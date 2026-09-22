const { execSync } = require('child_process');
const html = execSync('git show 6bc06c4:index.html', { maxBuffer: 10*1024*1024 }).toString();
const sMatch = html.match(/<section[^>]*id="services"[^>]*>([\s\S]*?)<\/section>/);
if (sMatch) {
  console.log('--- id=services in 6bc06c4 ---');
  console.log(sMatch[0].slice(0, 2500));
}
