/**
 * ETERNAL STUDIO — INTERACTIVE FOOTER LOGO PARTICLE MATRIX & SOCIAL SHOWCASE
 * - Renders the official ETERNAL logo (orange flame emblem + white wordmark)
 *   as an interactive dot-matrix canvas.
 * - Particles disperse with fluid repulsion physics on cursor movement and touch,
 *   returning elastically with viscous damping.
 * - Clicking/tapping canvas sends an explosive radial shockwave through the particles.
 * - Adds magnetic cursor pull and interactive dynamic sheen to the social media pills.
 */

export function initFooterParticles() {
  const canvas = document.getElementById('footer-particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const wrapper = canvas.parentElement;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let animationFrameId = null;
  let isVisible = false;

  // Preload official Eternal logo with adaptive path resolution
  const logoImg = new Image();
  logoImg.crossOrigin = 'anonymous';

  const possibleLogoPaths = [
    'assets/images/logo/eternal-footer-logo.png',
    '../assets/images/logo/eternal-footer-logo.png',
    '../../assets/images/logo/eternal-footer-logo.png',
    '/assets/images/logo/eternal-footer-logo.png'
  ];

  let pathIdx = 0;
  const pathParts = window.location.pathname.replace(/\/index\.html$/, '').split('/').filter(Boolean);
  if (pathParts.length >= 2 && pathParts[0] === 'work' && pathParts[1] !== 'index.html') {
    pathIdx = 2; // e.g. /work/10th-session-arfsd/
  } else if (pathParts.length >= 1 && ['work', 'works', 'services', 'contact', 'about'].includes(pathParts[0])) {
    pathIdx = 1; // e.g. /work/ or /services/
  } else {
    pathIdx = 0;
  }

  let isLogoReady = false;

  logoImg.onload = () => {
    isLogoReady = true;
    initDimensions();
    startAnimation();
  };

  logoImg.onerror = () => {
    pathIdx++;
    if (pathIdx < possibleLogoPaths.length) {
      logoImg.src = possibleLogoPaths[pathIdx];
    }
  };

  logoImg.src = possibleLogoPaths[pathIdx];

  if (logoImg.complete && logoImg.naturalWidth > 0) {
    isLogoReady = true;
  }

  const mouse = {
    x: -9999,
    y: -9999,
    prevX: -9999,
    prevY: -9999,
    vx: 0,
    vy: 0,
    radius: 95,
    isActive: false
  };

  class Particle {
    constructor(originX, originY, radius, isOrange) {
      this.originX = originX;
      this.originY = originY;
      this.x = originX;
      this.y = originY;
      this.vx = 0;
      this.vy = 0;
      this.radius = radius;
      this.isOrange = isOrange;
      this.distFromOrigin = 0;
      this.friction = 0.86;
      this.springStrength = 0.082;
    }

    update() {
      if (mouse.isActive) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < mouse.radius && dist > 0) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          const repulsion = force * 9.5;

          this.vx += Math.cos(angle) * repulsion + mouse.vx * 0.18;
          this.vy += Math.sin(angle) * repulsion + mouse.vy * 0.18;
        }
      }

      // Elastic spring back to home origin
      const springX = (this.originX - this.x) * this.springStrength;
      const springY = (this.originY - this.y) * this.springStrength;
      this.vx += springX;
      this.vy += springY;

      // Friction / damping
      this.vx *= this.friction;
      this.vy *= this.friction;

      this.x += this.vx;
      this.y += this.vy;

      this.distFromOrigin = Math.hypot(this.x - this.originX, this.y - this.originY);
    }

    draw(context, isLightMode) {
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

      if (this.isOrange) {
        // Geometric Emblem Particle
        if (this.distFromOrigin > 2.0) {
          const glow = Math.min(1, this.distFromOrigin / 25);
          context.fillStyle = `rgba(255, 125, 60, ${0.9 + glow * 0.1})`;
        } else {
          context.fillStyle = 'rgba(236, 100, 48, 0.96)';
        }
      } else {
        // Typography Particle (White / Neutral)
        if (this.distFromOrigin > 2.0) {
          const intensity = Math.min(1, this.distFromOrigin / 22);
          context.fillStyle = isLightMode
            ? `rgba(236, 100, 48, ${0.75 + intensity * 0.25})`
            : `rgba(255, 150, 100, ${0.85 + intensity * 0.15})`;
        } else {
          context.fillStyle = isLightMode
            ? 'rgba(25, 25, 30, 0.9)'
            : 'rgba(255, 255, 255, 0.92)';
        }
      }

      context.fill();
    }
  }

  function drawFrame() {
    const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].draw(ctx, isLightMode);
    }
  }

  function initDimensions() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = wrapper.getBoundingClientRect();
    width = Math.floor(rect.width || window.innerWidth || 360);

    const isMobile = width < 768;
    const naturalRatio = 300 / 69; // ~4.348

    // Size logo keeping proportional aspect ratio
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

    mouse.radius = isMobile
      ? Math.max(65, Math.min(95, width * 0.22))
      : Math.max(80, Math.min(135, width * 0.1));

    createParticleMatrix(targetW, targetH, isMobile);
    drawFrame();
  }

  function createParticleMatrix(targetW, targetH, isMobile) {
    particles = [];

    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    offCanvas.width = width;
    offCanvas.height = height;

    const startX = Math.round((width - targetW) / 2);
    const startY = Math.round((height - targetH) / 2);

    if (isLogoReady || (logoImg.complete && logoImg.naturalWidth > 0)) {
      offCtx.clearRect(0, 0, width, height);
      offCtx.drawImage(logoImg, startX, startY, targetW, targetH);
    } else {
      // Clean fallback if logo is pending
      offCtx.fillStyle = '#ffffff';
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      const fontSize = Math.floor(targetH * 0.65);
      offCtx.font = `900 ${fontSize}px "Lato", sans-serif`;
      offCtx.fillText('ETERNAL', Math.floor(width / 2), Math.floor(height / 2));
    }

    const imgData = offCtx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const imgW = imgData.width;
    const imgH = imgData.height;

    // Adaptive step & radius for optimal dot density & performance
    const step = isMobile ? (width < 480 ? 3 : 4) : (width < 1024 ? 4 : 5);
    const dotRadius = isMobile ? (width < 480 ? 1.2 : 1.35) : (width < 1024 ? 1.45 : 1.7);

    for (let y = 0; y < imgH; y += step) {
      const rowOffset = y * imgW;
      for (let x = 0; x < imgW; x += step) {
        const index = (rowOffset + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = data[index + 3];

        if (alpha > 50) {
          // Detect orange emblem vs white wordmark
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

    const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';

    ctx.clearRect(0, 0, width, height);

    // Mouse velocity decay
    mouse.vx *= 0.55;
    mouse.vy *= 0.55;

    let hasActiveMotion = mouse.isActive;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.update();
      p.draw(ctx, isLightMode);

      if (p.distFromOrigin > 0.1 || Math.abs(p.vx) > 0.05 || Math.abs(p.vy) > 0.05) {
        hasActiveMotion = true;
      }
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(animate);
    }
  }

  // Pointer interactions
  function handlePointerMove(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const curX = clientX - rect.left;
    const curY = clientY - rect.top;

    if (mouse.prevX !== -9999) {
      mouse.vx = curX - mouse.prevX;
      mouse.vy = curY - mouse.prevY;
    }

    mouse.prevX = curX;
    mouse.prevY = curY;
    mouse.x = curX;
    mouse.y = curY;
    mouse.isActive = true;

    startAnimation();
  }

  canvas.addEventListener('mousemove', (e) => {
    handlePointerMove(e.clientX, e.clientY);
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.isActive = false;
    mouse.x = -9999;
    mouse.y = -9999;
    mouse.prevX = -9999;
    mouse.prevY = -9999;
    mouse.vx = 0;
    mouse.vy = 0;
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    triggerShockwave(e.clientX - rect.left, e.clientY - rect.top);
  });

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
      const rect = canvas.getBoundingClientRect();
      triggerShockwave(touch.clientX - rect.left, touch.clientY - rect.top);
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    mouse.isActive = false;
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // IntersectionObserver: start animation when footer comes into view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        startAnimation();
      }
    });
  }, { threshold: 0.01, rootMargin: '120px 0px' });

  observer.observe(wrapper);

  // Check initial visibility
  const rect = wrapper.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) {
    isVisible = true;
  }

  // Resize listener
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      initDimensions();
      startAnimation();
    }, 150);
  }, { passive: true });

  // Initial load
  initDimensions();
  startAnimation();

  // Social Pills Magnetic & Dynamic Sheen Interaction
  initSocialPills(triggerShockwave, canvas);
}

/**
 * Creative Social Pills Micro-Interactions
 * - Dynamic cursor sheen tracking
 * - Smooth magnetic pull toward cursor on hover
 * - Interactive particle ripple trigger on canvas
 */
function initSocialPills(triggerShockwave, canvas) {
  const pills = document.querySelectorAll('.footer-social-pill');
  if (!pills.length) return;

  pills.forEach((pill) => {
    pill.addEventListener('mousemove', (e) => {
      const rect = pill.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update sheen coordinates in CSS
      pill.style.setProperty('--mouse-x', `${x.toFixed(1)}px`);
      pill.style.setProperty('--mouse-y', `${y.toFixed(1)}px`);

      // Micro magnetic cursor pull (max ±5px)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const deltaX = ((x - centerX) / centerX) * 5;
      const deltaY = ((y - centerY) / centerY) * 5;
      pill.style.transform = `translate(${deltaX.toFixed(1)}px, ${deltaY.toFixed(1)}px)`;
    });

    pill.addEventListener('mouseenter', () => {
      if (canvas && triggerShockwave) {
        const cRect = canvas.getBoundingClientRect();
        const pRect = pill.getBoundingClientRect();
        const startX = pRect.left + pRect.width / 2 - cRect.left;
        triggerShockwave(startX, 15);
      }
    });

    pill.addEventListener('mouseleave', () => {
      pill.style.transform = '';
    });

    pill.addEventListener('click', () => {
      if (canvas && triggerShockwave) {
        const cRect = canvas.getBoundingClientRect();
        const pRect = pill.getBoundingClientRect();
        const startX = pRect.left + pRect.width / 2 - cRect.left;
        triggerShockwave(startX, 30);
      }
    });
  });
}
