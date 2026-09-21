/**
 * ETERNAL GROUPS — INTERACTIVE FOOTER PARTICLE MATRIX
 * Renders "ETERNAL GROUPS" as a dot-matrix raster on canvas.
 * Particles disperse with fluid repulsion force on cursor movement and
 * smoothly spring back into position with elastic physics.
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

  const mouse = {
    x: -9999,
    y: -9999,
    prevX: -9999,
    prevY: -9999,
    vx: 0,
    vy: 0,
    radius: 90,
    isActive: false
  };

  class Particle {
    constructor(originX, originY, radius) {
      this.originX = originX;
      this.originY = originY;
      this.x = originX;
      this.y = originY;
      this.vx = 0;
      this.vy = 0;
      this.radius = radius;
      this.distFromOrigin = 0;
    }

    update() {
      if (mouse.isActive) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          const repulsion = force * 8.5;

          this.vx += Math.cos(angle) * repulsion + mouse.vx * 0.18;
          this.vy += Math.sin(angle) * repulsion + mouse.vy * 0.18;
        }
      }

      // Spring back to home origin
      const springX = (this.originX - this.x) * 0.08;
      const springY = (this.originY - this.y) * 0.08;
      this.vx += springX;
      this.vy += springY;

      // Viscous damping / friction
      this.vx *= 0.86;
      this.vy *= 0.86;

      this.x += this.vx;
      this.y += this.vy;

      this.distFromOrigin = Math.hypot(this.x - this.originX, this.y - this.originY);
    }

    draw(context, isLightMode) {
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

      if (this.distFromOrigin > 2.0) {
        // Highlight active dispersed particles with signature #EC6430 accent
        const intensity = Math.min(1, this.distFromOrigin / 20);
        context.fillStyle = `rgba(236, 100, 48, ${0.85 + intensity * 0.15})`;
      } else {
        context.fillStyle = isLightMode ? 'rgba(20, 20, 25, 0.88)' : 'rgba(245, 245, 250, 0.88)';
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

    // On screens < 768px, use 2 stacked lines for maximum impact and bold readability
    const isMobile = width < 768;

    if (isMobile) {
      height = Math.floor(Math.max(220, Math.min(360, width * 0.55)));
    } else {
      height = Math.floor(Math.max(160, Math.min(320, width * 0.2)));
    }

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    mouse.radius = isMobile
      ? Math.max(65, Math.min(95, width * 0.2))
      : Math.max(70, Math.min(130, width * 0.08));

    createParticleMatrix(isMobile);
    drawFrame();
  }

  function createParticleMatrix(isMobile) {
    particles = [];

    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    offCanvas.width = width;
    offCanvas.height = height;

    offCtx.fillStyle = '#ffffff';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';

    let gap, dotRadius;

    if (isMobile) {
      // 2 Stacked Lines on Mobile / Tablet: ETERNAL / GROUPS
      const line1 = 'ETERNAL';
      const line2 = 'GROUPS';

      let fontSize = Math.floor(height * 0.38);
      offCtx.font = `900 ${fontSize}px "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const m1 = offCtx.measureText(line1).width;
      const m2 = offCtx.measureText(line2).width;
      const maxW = Math.max(m1, m2);
      const targetW = width * 0.88;

      if (maxW > 0) {
        fontSize = Math.floor(fontSize * (targetW / maxW));
      }
      fontSize = Math.min(fontSize, Math.floor(height * 0.42));
      offCtx.font = `900 ${fontSize}px "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      const lineSpacing = fontSize * 1.02;
      const centerY = height / 2;
      const y1 = Math.floor(centerY - lineSpacing * 0.48);
      const y2 = Math.floor(centerY + lineSpacing * 0.52);

      offCtx.fillText(line1, Math.floor(width / 2), y1);
      offCtx.fillText(line2, Math.floor(width / 2), y2);

      gap = width < 480 ? 3 : 4;
      dotRadius = width < 480 ? 1.1 : 1.35;
    } else {
      // Single wide line on Desktop
      const text = 'ETERNAL GROUPS';

      let fontSize = Math.floor(height * 0.68);
      offCtx.font = `900 ${fontSize}px "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      let textWidth = offCtx.measureText(text).width;
      const targetWidth = width * 0.94;

      if (textWidth > 0) {
        fontSize = Math.floor(fontSize * (targetWidth / textWidth));
      }
      fontSize = Math.min(fontSize, Math.floor(height * 0.82));
      offCtx.font = `900 ${fontSize}px "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      offCtx.fillText(text, Math.floor(width / 2), Math.floor(height / 2 + fontSize * 0.03));

      gap = width < 1024 ? 4 : 5;
      dotRadius = width < 1024 ? 1.3 : 1.55;
    }

    const imgData = offCtx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const imgW = imgData.width;
    const imgH = imgData.height;
    const step = Math.max(2, Math.round(gap));

    // Pure integer iteration ensuring data[index] is never undefined
    for (let y = 0; y < imgH; y += step) {
      const rowOffset = y * imgW;
      for (let x = 0; x < imgW; x += step) {
        const index = (rowOffset + x) * 4;
        const alpha = data[index + 3];

        if (alpha > 70) {
          particles.push(new Particle(x, y, dotRadius));
        }
      }
    }
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

    // Keep loop active while in view or when particles are settling
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

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
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
  }, { threshold: 0.01, rootMargin: '100px 0px' });

  observer.observe(wrapper);

  // Check initial visibility in case page loaded scrolled down
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

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      initDimensions();
      startAnimation();
    });
  }
}
