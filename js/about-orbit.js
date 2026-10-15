/**
 * ETERNAL STUDIO — ABOUT ORBIT
 * The portal particles from the opening screen, continued inside the About section.
 * Scattered dust gathers into an orbiting ring around the statement as the words
 * illuminate (driven by the About ScrollTrigger progress). The cursor parts the field.
 */

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (t) => t * t * (3 - 2 * t);

// Same brand palette as the portal, tuned for each theme's background
const TONES = {
  dark: [
    { color: '#ffffff', weight: 0.52 },
    { color: '#ffd9c4', weight: 0.2 },
    { color: '#ED632E', weight: 0.28 }
  ],
  light: [
    { color: '#1a1a1a', weight: 0.5 },
    { color: '#8a4a2c', weight: 0.2 },
    { color: '#ED632E', weight: 0.3 }
  ]
};

export function initAboutOrbit(pin) {
  if (!pin) return null;
  const textBlock = pin.querySelector('.about-editorial-wrap');

  const canvas = document.createElement('canvas');
  canvas.className = 'about-orbit-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  pin.prepend(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return null;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let rx = 0;
  let ry = 0;
  let tilt = 0;
  let safe = { x0: 0, y0: 0, x1: 0, y1: 0 };
  let particles = [];
  let progress = 0;
  let shownProgress = 0;
  let pointer = { x: -9999, y: -9999, active: false };
  let rafId = null;
  let visible = false;
  let last = 0;

  function gauss() {
    return Math.sqrt(-2 * Math.log(Math.random() || 1e-6)) * Math.cos(TAU * Math.random());
  }

  function measure() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = pin.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const t = textBlock ? textBlock.getBoundingClientRect() : rect;
    cx = t.left - rect.left + t.width / 2;
    cy = t.top - rect.top + t.height / 2;
    rx = Math.min(w * 0.46, Math.max(t.width * 0.56, Math.min(w * 0.42, 700)));
    ry = Math.min(h * 0.46, Math.max(t.height * 0.65, h * 0.36));
    tilt = w > 768 ? -0.12 : 0;
    // Particles passing behind the copy are dimmed to keep it legible
    safe = {
      x0: t.left - rect.left - 12,
      y0: t.top - rect.top - 12,
      x1: t.right - rect.left + 12,
      y1: t.bottom - rect.top + 12
    };
  }

  function seed() {
    const count = Math.round(Math.min(1100, (w * h) / (w < 768 ? 820 : 1150)));
    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    particles = [];
    TONES[theme].forEach((tone, toneIndex) => {
      const n = Math.round(count * tone.weight);
      for (let i = 0; i < n; i += 1) {
        particles.push({
          tone: toneIndex,
          theta: Math.random() * TAU,
          band: gauss() * 0.075,
          omega: 0.05 + Math.random() * 0.09,
          sx: Math.random() * w,
          sy: Math.random() * h,
          vx: (Math.random() - 0.5) * 9,
          vy: (Math.random() - 0.5) * 9,
          delay: Math.random(),
          size: 0.8 + Math.random() * 1.8,
          alpha: 0.35 + Math.random() * 0.6,
          ox: 0,
          oy: 0
        });
      }
    });
  }

  function draw(dt) {
    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const palette = TONES[theme];
    const p = shownProgress;
    const ignite = clamp01((p - 0.82) / 0.18);

    ctx.clearRect(0, 0, w, h);

    // Warm ember glow behind the statement, growing as the words light up
    const glowR = Math.max(rx, ry) * 1.15;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    const glowA = (theme === 'light' ? 0.05 : 0.06) + p * 0.08 + ignite * 0.05;
    glow.addColorStop(0, `rgba(237, 99, 46, ${glowA})`);
    glow.addColorStop(0.55, `rgba(237, 99, 46, ${glowA * 0.35})`);
    glow.addColorStop(1, 'rgba(237, 99, 46, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    const spin = 1 + p * 1.6 + ignite * 1.5;
    const pointerR = w < 768 ? 90 : 140;
    let currentTone = -1;

    for (let i = 0; i < particles.length; i += 1) {
      const q = particles[i];

      // Free-floating dust
      q.sx += q.vx * dt;
      q.sy += q.vy * dt;
      if (q.sx < -10) q.sx = w + 10; else if (q.sx > w + 10) q.sx = -10;
      if (q.sy < -10) q.sy = h + 10; else if (q.sy > h + 10) q.sy = -10;

      // Orbit position on the tilted ellipse
      q.theta += q.omega * spin * dt;
      const k = 1 + q.band + ignite * Math.sin(q.theta * 3 + q.delay * TAU) * 0.02;
      const ex = Math.cos(q.theta) * rx * k;
      const ey = Math.sin(q.theta) * ry * k;
      const ox = cx + ex * cosT - ey * sinT;
      const oy = cy + ex * sinT + ey * cosT;

      // Staggered gathering from dust to ring as the section progresses
      const m = smooth(clamp01((p - q.delay * 0.35) / 0.55));
      let x = q.sx + (ox - q.sx) * m;
      let y = q.sy + (oy - q.sy) * m;

      // Cursor parts the field
      let tx = 0;
      let ty = 0;
      if (pointer.active) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < pointerR * pointerR) {
          const d = Math.sqrt(d2) || 1;
          const push = (1 - d / pointerR) * 36;
          tx = (dx / d) * push;
          ty = (dy / d) * push;
        }
      }
      q.ox += (tx - q.ox) * Math.min(1, dt * 8);
      q.oy += (ty - q.oy) * Math.min(1, dt * 8);
      x += q.ox;
      y += q.oy;

      let a = q.alpha * (0.3 + 0.7 * m) * (1 + ignite * 0.35);
      if (x > safe.x0 && x < safe.x1 && y > safe.y0 && y < safe.y1) a *= 0.22;
      if (a < 0.02) continue;

      if (q.tone !== currentTone) {
        currentTone = q.tone;
        ctx.fillStyle = palette[currentTone].color;
      }
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillRect(x - q.size / 2, y - q.size / 2, q.size, q.size);
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    shownProgress += (progress - shownProgress) * Math.min(1, dt * 5);
    draw(dt);
    rafId = visible ? requestAnimationFrame(frame) : null;
  }

  function start() {
    if (prefersReducedMotion || rafId !== null) return;
    last = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function renderStatic() {
    shownProgress = progress;
    draw(0);
  }

  function rebuild() {
    measure();
    seed();
    if (prefersReducedMotion) renderStatic();
  }

  rebuild();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, 200);
  }, { passive: true });

  // Re-tint when the theme toggles
  new MutationObserver(() => {
    seed();
    if (prefersReducedMotion) renderStatic();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Only animate while the section is on screen
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) {
      measure();
      start();
    }
  }).observe(pin);

  pin.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
  }, { passive: true });
  pin.addEventListener('pointerleave', () => {
    pointer.active = false;
  });

  return {
    setProgress(value) {
      progress = clamp01(value);
      if (prefersReducedMotion) renderStatic();
    }
  };
}
