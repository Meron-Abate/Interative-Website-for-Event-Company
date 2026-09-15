const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

// 1. Redirect templates
const aboutRedirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=/#about">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting to ETERNAL About Us...</title>
  <link rel="canonical" href="https://eternalstudio.com/#about">
  <script>window.location.replace('/#about' + window.location.search);</script>
</head>
<body style="background: #080808; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
  <p>Redirecting to <a href="/#about" style="color: #ff5a36;">About Us</a>...</p>
</body>
</html>
`;

const servicesRedirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=/#services">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting to ETERNAL Services...</title>
  <link rel="canonical" href="https://eternalstudio.com/#services">
  <script>window.location.replace('/#services' + window.location.search);</script>
</head>
<body style="background: #080808; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
  <p>Redirecting to <a href="/#services" style="color: #ff5a36;">Services</a>...</p>
</body>
</html>
`;

// Write redirect files
['about/index.html', 'about.html'].forEach(rel => {
  fs.writeFileSync(path.join(projectRoot, rel), aboutRedirectHtml, 'utf8');
  console.log('Written redirect to /#about:', rel);
});

['services/index.html', 'services.html'].forEach(rel => {
  fs.writeFileSync(path.join(projectRoot, rel), servicesRedirectHtml, 'utf8');
  console.log('Written redirect to /#services:', rel);
});

// 2. Update all other HTML files to point nav and footer to /#services and /#about
const subpages = [
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

subpages.forEach(rel => {
  const p = path.join(projectRoot, rel);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');

  // Replace links to /services/ with /#services
  content = content.replace(/href="\/services\/"/g, 'href="/#services"');
  content = content.replace(/href="services\.html"/g, 'href="/#services"');

  // Replace links to /about/ with /#about
  content = content.replace(/href="\/about\/"/g, 'href="/#about"');
  content = content.replace(/href="about\.html"/g, 'href="/#about"');

  fs.writeFileSync(p, content, 'utf8');
  console.log('Updated links in:', rel);
});

// 3. Update _redirects
const redirectsPath = path.join(projectRoot, '_redirects');
if (fs.existsSync(redirectsPath)) {
  let r = fs.readFileSync(redirectsPath, 'utf8');
  r = r.replace(/\/about\.html\s+\/about\s+301/, '/about.html       /#about         301\n/about/          /#about         301\n/about           /#about         301');
  r = r.replace(/\/services\.html\s+\/services\s+301/, '/services.html    /#services      301\n/services/       /#services      301\n/services        /#services      301');
  fs.writeFileSync(redirectsPath, r, 'utf8');
  console.log('Updated _redirects');
}

// 4. Update vercel.json
const vercelPath = path.join(projectRoot, 'vercel.json');
if (fs.existsSync(vercelPath)) {
  const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  vercel.redirects = vercel.redirects.map(rd => {
    if (rd.destination === '/about' || rd.source === '/about.html') {
      return { ...rd, destination: '/#about' };
    }
    if (rd.destination === '/services' || rd.source === '/services.html') {
      return { ...rd, destination: '/#services' };
    }
    return rd;
  });
  // Add direct /about and /services redirects if not present
  if (!vercel.redirects.some(rd => rd.source === '/about')) {
    vercel.redirects.unshift({ source: '/about', destination: '/#about', permanent: true });
    vercel.redirects.unshift({ source: '/services', destination: '/#services', permanent: true });
  }
  fs.writeFileSync(vercelPath, JSON.stringify(vercel, null, 2), 'utf8');
  console.log('Updated vercel.json');
}

// 5. Update netlify.toml
const netlifyPath = path.join(projectRoot, 'netlify.toml');
if (fs.existsSync(netlifyPath)) {
  let n = fs.readFileSync(netlifyPath, 'utf8');
  n = n.replace(/from = "\/about\.html"\s+to = "\/about"/, 'from = "/about.html"\n  to = "/#about"\n  status = 301\n\n[[redirects]]\n  from = "/about"\n  to = "/#about"\n  status = 301\n\n[[redirects]]\n  from = "/about/"\n  to = "/#about"');
  n = n.replace(/from = "\/services\.html"\s+to = "\/services"/, 'from = "/services.html"\n  to = "/#services"\n  status = 301\n\n[[redirects]]\n  from = "/services"\n  to = "/#services"\n  status = 301\n\n[[redirects]]\n  from = "/services/"\n  to = "/#services"');
  fs.writeFileSync(netlifyPath, n, 'utf8');
  console.log('Updated netlify.toml');
}

console.log('DONE!');
