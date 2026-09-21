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

      if (this.distFromOrigin > 2.5) {
        // Highlight active dispersed particles with signature #EC6430 accent
        const intensity = Math.min(1, this.distFromOrigin / 22);
        context.fillStyle = `rgba(236, 100, 48, ${0.75 + intensity * 0.25})`;
      } else {
        context.fillStyle = isLightMode ? 'rgba(35, 35, 40, 0.65)' : 'rgba(235, 235, 240, 0.65)';
      }

      context.fill();
    }
  }

  function initDimensions() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = wrapper.getBoundingClientRect();
    width = rect.width || window.innerWidth;
    // Set comfortable responsive height for typography
    height = Math.max(160, Math.min(340, width * 0.22));

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    mouse.radius = Math.max(70, Math.min(130, width * 0.08));

    createParticleMatrix();
  }

  function createParticleMatrix() {
    particles = [];

    // Offscreen canvas for alpha raster sampling
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    offCanvas.width = width;
    offCanvas.height = height;

    const text = 'ETERNAL GROUPS';

    // Calculate font size to span ~94% of canvas width
    let fontSize = Math.floor(height * 0.68);
    offCtx.font = `900 ${fontSize}px "Lato", sans-serif`;
    let textWidth = offCtx.measureText(text).width;
    const targetWidth = width * 0.94;

    if (textWidth > 0) {
      fontSize = Math.floor(fontSize * (targetWidth / textWidth));
      fontSize = Math.min(fontSize, Math.floor(height * 0.8));
      offCtx.font = `900 ${fontSize}px "Lato", sans-serif`;
    }

    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillStyle = '#ffffff';
    offCtx.fillText(text, width / 2, height / 2 + fontSize * 0.03);

    const imgData = offCtx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Grid gap: 4px on mobile, 5px on desktop for clean dot matrix
    const gap = width < 768 ? 4 : 5;
    const dotRadius = width < 768 ? 1.2 : 1.5;

    for (let y = 0; y < height; y += gap) {
      for (let x = 0; x < width; x += gap) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];

        if (alpha > 120) {
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

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.update();
      p.draw(ctx, isLightMode);
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

  // IntersectionObserver: only animate when in view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        startAnimation();
      }
    });
  }, { threshold: 0.05 });

  observer.observe(wrapper);

  // Resize listener
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      initDimensions();
      startAnimation();
    }, 200);
  }, { passive: true });

  // Initial load
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      initDimensions();
      startAnimation();
    });
  } else {
    initDimensions();
    startAnimation();
  }
}
