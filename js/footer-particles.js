export function initFooterParticles() {
  const canvas = document.getElementById('footer-particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const wrapper = canvas.parentElement;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let animationFrameId = null;
  let isVisible = true; // Start as true

  const logoImg = new Image();
  // Optional: prevent CORS taint on some local servers if absolute paths are used
  logoImg.crossOrigin = 'anonymous';
  let isLogoReady = false;
  let initCalled = false;

  function doInit(forceReinit = false) {
    if (initCalled && !forceReinit) return;
    initCalled = true;
    initDimensions();
    startAnimation();
  }

  // Paths to try
  const paths = [
    '/assets/images/logo/eternal-footer-logo-hd.png', // Try absolute first if on web server
    './assets/images/logo/eternal-footer-logo-hd.png', 
    '../assets/images/logo/eternal-footer-logo-hd.png', 
    '../../assets/images/logo/eternal-footer-logo-hd.png'
  ];
  let pathIdx = 0;

  logoImg.onload = () => {
    isLogoReady = true;
    doInit(true);
  };

  logoImg.onerror = () => {
    if (pathIdx < paths.length) {
      // Remove crossOrigin for relative paths to avoid local file:// CORS errors
      logoImg.removeAttribute("crossOrigin"); 
      logoImg.src = paths[pathIdx++];
    } else {
      isLogoReady = false;
      doInit(); // text fallback
    }
  };

  logoImg.src = paths[pathIdx++];

  // Safety net: if image completely hangs, force render fallback after 1.5s
  setTimeout(() => {
    if (!initCalled) {
      isLogoReady = false;
      doInit();
    }
  }, 1500);

  const mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, vx: 0, vy: 0, radius: 95, isActive: false };

  class Particle {
    constructor(originX, originY, radius, isOrange) {
      this.originX = originX;
      this.originY = originY;
      this.x = originX + (Math.random() - 0.5) * 100;
      this.y = originY + (Math.random() - 0.5) * 100;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = (Math.random() - 0.5) * 2;
      this.radius = radius;
      this.isOrange = isOrange;
      this.color = isOrange ? '#EC6430' : 'rgba(255, 255, 255, 0.8)';
      this.friction = 0.82;
      this.springFactor = 0.08;
    }
    update(isLightMode) {
      this.color = this.isOrange ? '#EC6430' : (isLightMode ? '#EC6430' : 'rgba(255, 255, 255, 0.8)');
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let dist = Math.hypot(dx, dy);

      if (dist < mouse.radius && mouse.isActive) {
        let forceDirectionX = dx / dist;
        let forceDirectionY = dy / dist;
        let force = (mouse.radius - dist) / mouse.radius;
        
        // Use vortex on home page, but standard clearer repel on work pages
        if (window.location.pathname.includes('/work/')) {
          let pvx = forceDirectionX * force * 5;
          let pvy = forceDirectionY * force * 5;
          this.vx -= pvx + mouse.vx * force * 0.1;
          this.vy -= pvy + mouse.vy * force * 0.1;
        } else {
          // Vortex / Swirl effect for home page
          let tangentX = -forceDirectionY;
          let tangentY = forceDirectionX;
          this.vx += (forceDirectionX * 1.5 + tangentX * 3.5) * force;
          this.vy += (forceDirectionY * 1.5 + tangentY * 3.5) * force;
        }
      }

      this.vx += (this.originX - this.x) * this.springFactor;
      this.vy += (this.originY - this.y) * this.springFactor;
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.x += this.vx;
      this.y += this.vy;
    }
    draw(ctx) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, width, height);
    const isLightMode = document.body.classList.contains('light-mode');
    for (let i = 0; i < particles.length; i++) {
      particles[i].draw(ctx, isLightMode);
    }
  }

  function initDimensions() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Safer width retrieval
    const rect = wrapper.getBoundingClientRect();
    width = Math.floor(wrapper.offsetWidth || rect.width || window.innerWidth || 360);

    const isMobile = width < 768;
    const naturalRatio = 300 / 69; 
    const maxTargetW = isMobile ? Math.min(width * 0.95, 480) : Math.min(width * 0.88, 960);
    const targetW = Math.round(maxTargetW);
    const targetH = Math.round(targetW / naturalRatio);
    height = Math.round(targetH + (isMobile ? 36 : 60));

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    mouse.radius = isMobile ? Math.max(65, Math.min(95, width * 0.22)) : Math.max(80, Math.min(135, width * 0.1));

    createParticleMatrix(targetW, targetH, isMobile);
    drawFrame();
  }

  function createParticleMatrix(targetW, targetH, isMobile) {
    particles = [];
    let offCanvas = document.createElement('canvas');
    let offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    offCanvas.width = width;
    offCanvas.height = height;

    const startX = Math.round((width - targetW) / 2);
    const startY = Math.round((height - targetH) / 2);

    let useFallback = false;

    if (isLogoReady || (logoImg.complete && logoImg.naturalWidth > 0)) {
      try {
        offCtx.clearRect(0, 0, width, height);
        offCtx.drawImage(logoImg, startX, startY, targetW, targetH);
        offCtx.getImageData(0, 0, 1, 1); // Test taint
      } catch (e) {
        useFallback = true;
      }
    } else {
      useFallback = true;
    }

    if (useFallback) {
      // CRITICAL FIX: If canvas was tainted, we MUST create a fresh untainted canvas!
      offCanvas = document.createElement('canvas');
      offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
      offCanvas.width = width;
      offCanvas.height = height;

      offCtx.clearRect(0, 0, width, height);
      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);
      const iconSize = Math.floor(targetH * 0.85);
      const gap = Math.floor(iconSize * 0.25);
      const fontSize = Math.floor(iconSize * 0.8);
      
      // Draw programmatic fallback
      offCtx.fillStyle = '#EC6430';
      offCtx.fillRect(cx - (iconSize + gap + offCtx.measureText('Eternal').width)/2, cy - iconSize / 2, iconSize, iconSize);
      
      // We'll use simple text mapping to ensure it never fails
      const drawX = cx - (iconSize + gap + (fontSize * 3.5)) / 2;
      offCtx.fillRect(drawX, cy - iconSize / 2, iconSize, iconSize);

      offCtx.fillStyle = '#ffffff';
      offCtx.font = `900 ${Math.floor(iconSize * 0.65)}px "Lato", Arial, sans-serif`;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText('E', drawX + iconSize / 2, cy);

      offCtx.font = `900 ${fontSize}px "Lato", "Arial Black", Arial, sans-serif`;
      offCtx.textAlign = 'left';
      offCtx.fillText('Eternal', drawX + iconSize + gap, cy);
    }

    let imgData;
    try {
      imgData = offCtx.getImageData(0, 0, width, height);
    } catch (e) {
      return;
    }
    
    const data = imgData.data;
    const imgW = imgData.width;
    const imgH = imgData.height;

    // Use finer density
    const step = isMobile ? (width < 480 ? 3 : 4) : 4;
    const dotRadius = isMobile ? (width < 480 ? 1.2 : 1.35) : 1.5;

    for (let y = 0; y < imgH; y += step) {
      const rowOffset = y * imgW;
      for (let x = 0; x < imgW; x += step) {
        const index = (rowOffset + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = data[index + 3];

        if (alpha > 50) {
          const isOrange = (r > 150 && (r - b) > 40 && (r - g) > 20) || (r > 180 && b < 100);
          particles.push(new Particle(x, y, dotRadius, isOrange));
        }
      }
    }
  }

  function triggerShockwave(clickX, clickY) {
    const isMobile = width < 768;
    const blastRadius = isMobile ? 180 : 260;
    const blastForce = isMobile ? 16 : 22;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = p.x - clickX;
      const dy = p.y - clickY;
      const dist = Math.hypot(dx, dy);

      if (dist < blastRadius && dist > 0) {
        const force = ((blastRadius - dist) / blastRadius) * blastForce;
        const angle = Math.atan2(dy, dx);
        p.vx += Math.cos(angle) * force;
        p.vy += Math.sin(angle) * force;
      }
    }
    startAnimation();
  }

  function animate() {
    if (!isVisible) {
      animationFrameId = null;
      return;
    }
    const isLightMode = document.body.classList.contains('light-mode');
    let isMoving = false;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.update(isLightMode);
      p.draw(ctx);
      if (Math.abs(p.vx) > 0.05 || Math.abs(p.vy) > 0.05) isMoving = true;
    }

    if (mouse.isActive) isMoving = true;

    if (isMoving) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      animationFrameId = null;
    }
  }

  function startAnimation() {
    if (!animationFrameId) animate();
  }

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
    mouse.x = (clientX - rect.left) * (width / rect.width);
    mouse.y = (clientY - rect.top) * (height / rect.height);
    mouse.vx = mouse.x - mouse.prevX;
    mouse.vy = mouse.y - mouse.prevY;
  }

  canvas.addEventListener('mousemove', (e) => { mouse.isActive = true; getMousePos(e); startAnimation(); }, { passive: true });
  canvas.addEventListener('mouseleave', () => { mouse.isActive = false; mouse.x = -9999; mouse.y = -9999; });
  canvas.addEventListener('click', (e) => { getMousePos(e); triggerShockwave(mouse.x, mouse.y); });
  canvas.addEventListener('touchstart', (e) => { mouse.isActive = true; getMousePos(e); startAnimation(); }, { passive: true });
  canvas.addEventListener('touchmove', (e) => { mouse.isActive = true; getMousePos(e); startAnimation(); }, { passive: true });
  canvas.addEventListener('touchend', () => { mouse.isActive = false; mouse.x = -9999; mouse.y = -9999; });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        if (particles.length === 0 && initCalled) {
          initDimensions();
        }
        startAnimation();
      }
    });
  }, { threshold: 0.01, rootMargin: '300px 0px' });

  observer.observe(wrapper);

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      initDimensions();
      startAnimation();
    }, 150);
  }, { passive: true });
}

