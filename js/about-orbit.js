/**
 * ETERNAL STUDIO — ABOUT UNIVERSE
 * A large orbital "universe circle" behind the About statement (replaces the old
 * particle field). Driven by the About ScrollTrigger progress: the orbits draw in,
 * the circle grows and tilts as the words illuminate, and the cursor adds parallax.
 */

import { createUniverse, UNIVERSE_PALETTES } from './universe.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (t) => t * t * (3 - 2 * t);

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
  const narrow = () => window.innerWidth < 768;
  let universe = createUniverse({ starCount: narrow() ? 70 : 140, dustScale: narrow() ? 0.6 : 1 });

  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let baseR = 0;
  let safe = null;
  let progress = 0;
  let shown = 0;
  let pointer = { x: 0, y: 0 };
  let pointerShown = { x: 0, y: 0 };
  let rafId = null;
  let visible = false;
  let last = 0;

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
    baseR = w < 768
      ? Math.min(w * 0.62, h * 0.42)
      : Math.min(w * 0.46, Math.max(t.width * 0.62, h * 0.5));
    // Points passing behind the copy are dimmed so the statement stays crisp
    safe = {
      x0: t.left - rect.left - 10,
      y0: t.top - rect.top - 10,
      x1: t.right - rect.left + 10,
      y1: t.bottom - rect.top + 10
    };
  }

  function draw(dt) {
    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const p = shown;
    const reveal = smooth(clamp01(0.15 + p / 0.75));
    const mobile = w < 768;

    universe.update(dt * (1 + p * 0.8));
    ctx.clearRect(0, 0, w, h);

    pointerShown.x += (pointer.x - pointerShown.x) * Math.min(1, dt * 3);
    pointerShown.y += (pointer.y - pointerShown.y) * Math.min(1, dt * 3);

    universe.draw(ctx, {
      cx: cx + pointerShown.x * 18,
      cy: cy + pointerShown.y * 12,
      R: baseR * (0.82 + p * 0.24),
      tilt: (mobile ? 0.62 : 1.2) - p * 0.2 + pointerShown.y * 0.08,
      rot: -0.18 + p * 0.35 + pointerShown.x * 0.1,
      palette: UNIVERSE_PALETTES[theme],
      alpha: theme === 'light' ? 0.85 : 1,
      reveal,
      coreAlpha: (theme === 'light' ? 0.12 : 0.22) + p * 0.2,
      safe,
      starAlpha: theme === 'light' ? 0.7 : 1
    });

    // Softly fade the orbits behind the statement so the copy stays easy to read
    if (safe) {
      const rx = (safe.x1 - safe.x0) / 2;
      const ry = (safe.y1 - safe.y0) / 2;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.translate((safe.x0 + safe.x1) / 2, (safe.y0 + safe.y1) / 2);
      ctx.scale(1, ry / rx);
      const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * 1.08);
      fade.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
      fade.addColorStop(0.72, 'rgba(0, 0, 0, 0.5)');
      fade.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = fade;
      ctx.beginPath();
      ctx.arc(0, 0, rx * 1.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    shown += (progress - shown) * Math.min(1, dt * 4);
    draw(dt);
    rafId = visible ? requestAnimationFrame(frame) : null;
  }

  function start() {
    if (prefersReducedMotion || rafId !== null) return;
    last = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function renderStatic() {
    shown = progress;
    draw(0);
  }

  measure();
  if (prefersReducedMotion) renderStatic();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      universe = createUniverse({ starCount: narrow() ? 70 : 140, dustScale: narrow() ? 0.6 : 1 });
      measure();
      if (prefersReducedMotion) renderStatic();
    }, 200);
  }, { passive: true });

  // Repaint immediately when the theme changes (reduced-motion has no loop)
  new MutationObserver(() => {
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

  // Gentle cursor parallax
  pin.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2
    };
  }, { passive: true });
  pin.addEventListener('pointerleave', () => {
    pointer = { x: 0, y: 0 };
  });

  return {
    setProgress(value) {
      progress = clamp01(value);
      if (prefersReducedMotion) renderStatic();
    }
  };
}
