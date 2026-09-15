const http = require('http');

['/', '/about/', '/services/', '/work/', '/contact/'].forEach(route => {
  http.get('http://localhost:8080' + route, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(route, '-> Status:', res.statusCode);
      if (route === '/about/') {
        console.log('  About contains redirect to /#about:', body.includes('/#about'));
      }
      if (route === '/services/') {
        console.log('  Services contains redirect to /#services:', body.includes('/#services'));
      }
      if (route === '/') {
        console.log('  Home has Learn More button:', body.includes('btn-learn-more-pill'));
        console.log('  Home nav has #services:', body.includes('href="#services"'));
        console.log('  Home nav has #about:', body.includes('href="#about"'));
      }
    });
  });
});
