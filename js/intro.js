/**
 * ETERNAL STUDIO — OPENING SCREEN
 * 00 → 16 counter, acrobatic "Years of Experience" reveal, then a particle portal
 * opens at the centre. Clicking it dives the camera into the hole and through a
 * short warp tunnel before revealing the hero. Dispatches `eternal:intro-complete`.
 *
 * Low-power devices get a CSS-only portal ("lite"); reduced motion skips the theatrics.
 */

import { getLenis } from './smooth-scroll.js';

export const INTRO_COMPLETE_EVENT = 'eternal:intro-complete';

const COUNT_TARGET = 16;
const COUNT_DURATION = 2200;
const LETTER_STAGGER = 40;     // keep in sync with .intro-letter animation-delay
const LETTER_DURATION = 800;   // keep in sync with introLetterFlip duration
const HOLD_AFTER_TEXT = 700;
const PORTAL_OPEN = 1300;
const DIVE_DURATION = 1500;    // camera falls into the hole
const TUNNEL_DURATION = 1000;  // warp through the dark
const REVEAL_FADE = 800;       // keep in sync with .intro-screen opacity transition

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function initIntro() {
  const root = document.documentElement;
  const intro = document.getElementById('intro-screen');

  if (!intro || !root.classList.contains('intro-active')) {
    intro?.remove();
    root.classList.remove('intro-active');
    return;
  }

  intro.dataset.ready = 'true';

  const counterEl = intro.querySelector('.intro-counter-num');
  const yearsEl = intro.querySelector('.intro-years');
  const portalBtn = intro.querySelector('.intro-portal');
  const canvas = intro.querySelector('.intro-canvas');
  const buildCanvas = intro.querySelector('.intro-build-canvas');
  const buildHud = intro.querySelector('.build-hud');
  const skipBtn = intro.querySelector('.build-skip');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const letterCount = splitLetters(yearsEl);
  const scene = !prefersReducedMotion && !isLowPower() ? createPortalScene(canvas) : null;
  intro.classList.toggle('is-lite', !scene);

  // The stage-build sequence (three.js) loads during the counter on capable devices
  const buildModule = scene && buildCanvas && buildHud
    ? import('./build-stage.js').catch(() => null)
    : null;
  let buildPromise = null;
  let stage = null;
  let isBuilding = false;
  let isRevealed = false;

  function prepareBuild() {
    if (!buildPromise) {
      buildPromise = buildModule
        ? buildModule.then((mod) => {
          if (!mod) return null;
          try {
            stage = mod.createBuildStage({
              canvas: buildCanvas,
              root: intro,
              hud: buildHud,
              onComplete: () => reveal(true)
            });
          } catch {
            stage = null; // No WebGL: fall back to the warp tunnel
          }
          return stage;
        })
        : Promise.resolve(null);
    }
    return buildPromise;
  }

  function updatePortalSize() {
    const r = portalRadius(window.innerWidth, window.innerHeight);
    intro.style.setProperty('--portal-r', `${r}px`);
    intro.style.setProperty('--portal-cover', String((Math.hypot(window.innerWidth, window.innerHeight) / 2 / (r * 0.64)) * 1.1));
    scene?.resize();
  }
  updatePortalSize();
  window.addEventListener('resize', updatePortalSize, { passive: true });

  window.scrollTo(0, 0);
  getLenis()?.stop();

  let isReady = false;
  let isLeaving = false;

  const setCount = (value) => {
    if (counterEl) counterEl.textContent = String(value).padStart(2, '0');
  };

  // --- Sequence: count → letters → portal → ready ---
  function onCounted() {
    setCount(COUNT_TARGET);
    intro.classList.add('is-counted');
    const lettersDone = prefersReducedMotion ? 0 : (letterCount - 1) * LETTER_STAGGER + LETTER_DURATION;
    setTimeout(openPortal, lettersDone + (prefersReducedMotion ? 1200 : HOLD_AFTER_TEXT));
  }

  function openPortal() {
    intro.classList.add('is-portal');
    scene?.open(PORTAL_OPEN);
    setTimeout(markReady, prefersReducedMotion ? 0 : PORTAL_OPEN * 0.75);
  }

  function markReady() {
    isReady = true;
    intro.classList.add('is-ready');
    if (portalBtn) portalBtn.disabled = false;
    // Build the 3D scene while the visitor looks at the portal
    if (buildModule) setTimeout(prepareBuild, 150);
  }

  if (prefersReducedMotion) {
    onCounted();
  } else {
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / COUNT_DURATION);
      setCount(Math.round(easeInOutCubic(t) * COUNT_TARGET));
      if (t < 1) requestAnimationFrame(tick);
      else onCounted();
    };
    requestAnimationFrame(tick);
  }

  // --- Entering the portal ---
  function enter() {
    if (!isReady || isLeaving) return;
    isLeaving = true;
    if (portalBtn) portalBtn.disabled = true;
    intro.classList.add('is-diving');

    if (scene) {
      scene.dive(DIVE_DURATION, TUNNEL_DURATION);
      if (buildModule) {
        // Fall through the portal into the darkness of the venue, then start building
        setTimeout(startBuild, DIVE_DURATION * 0.9);
        return;
      }
      setTimeout(() => reveal(false), DIVE_DURATION + TUNNEL_DURATION * 0.35);
    } else {
      setTimeout(() => reveal(false), prefersReducedMotion ? 0 : 1000);
    }
  }

  function startBuild() {
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 2500));
    Promise.race([prepareBuild(), timeout]).then((ready) => {
      if (isRevealed) return;
      if (!ready) {
        reveal(false);
        return;
      }
      isBuilding = true;
      intro.classList.add('is-building');
      ready.start();
      // The portal scene is hidden behind the build now; stop drawing it
      setTimeout(() => scene?.destroy(), 1300);
    });
  }

  function reveal(seamless) {
    if (isRevealed) return;
    isRevealed = true;
    // A seamless hand-off means the LED wall already fills the screen with the hero video
    if (seamless) root.dataset.introSeamless = 'true';
    document.dispatchEvent(new CustomEvent(INTRO_COMPLETE_EVENT));
    intro.classList.add('is-revealing');

    setTimeout(() => {
      stage?.destroy();
      scene?.destroy();
      window.removeEventListener('resize', updatePortalSize);
      document.removeEventListener('keydown', onKeydown);
      root.classList.remove('intro-active');
      intro.remove();
      getLenis()?.start();
      if (typeof window.ScrollTrigger !== 'undefined') window.ScrollTrigger.refresh();
    }, prefersReducedMotion ? 400 : (isBuilding ? 1000 : REVEAL_FADE) + 50);
  }

  // The portal is the target; anywhere else on the screen also works once ready
  intro.addEventListener('click', enter);

  if (portalBtn && scene) {
    portalBtn.addEventListener('pointerenter', () => scene.setHover(true));
    portalBtn.addEventListener('pointerleave', () => scene.setHover(false));
    portalBtn.addEventListener('focus', () => scene.setHover(true));
    portalBtn.addEventListener('blur', () => scene.setHover(false));
  }

  skipBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    reveal(false);
  });

  function onKeydown(e) {
    if (isLeaving) {
      if (e.key === 'Tab' && isBuilding) {
        e.preventDefault();
        skipBtn?.focus();
      }
      return;
    }
    if (e.key === 'Tab') {
      // Keep focus inside the opening screen while it is shown
      e.preventDefault();
      portalBtn?.focus();
    } else if ((e.key === 'Enter' || e.key === ' ') && e.target !== portalBtn) {
      e.preventDefault();
      enter();
    }
  }
  document.addEventListener('keydown', onKeydown);
}

/** Wraps each letter in a span (words kept together) and returns the letter count. */
function splitLetters(el) {
  if (!el) return 0;
  const words = el.textContent.trim().split(/\s+/);
  let index = 0;
  el.textContent = '';
  el.setAttribute('aria-hidden', 'true');

  words.forEach((word) => {
    const wordEl = document.createElement('span');
    wordEl.className = 'intro-word';
    for (const char of word) {
      const letter = document.createElement('span');
      letter.className = index % 2 ? 'intro-letter is-alt' : 'intro-letter';
      letter.style.setProperty('--i', index);
      letter.textContent = char;
      wordEl.appendChild(letter);
      index += 1;
    }
    el.appendChild(wordEl);
  });

  el.classList.add('is-split');
  return index;
}

function isLowPower() {
  const conn = navigator.connection;
  if (conn && conn.saveData) return true;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return true;
  if (navigator.deviceMemory && navigator.deviceMemory < 2) return true;
  const probe = document.createElement('canvas');
  return !(probe.getContext && probe.getContext('2d'));
}

function portalRadius(w, h) {
  const m = Math.min(w, h);
  return Math.round(Math.max(64, Math.min(230, m * (w < 700 ? 0.27 : 0.2))));
}

/**
 * Canvas scene: orange field, gravity-well halo, orbiting particles and the dark hole.
 * The dive zooms the camera into the hole with a spin, then runs a warp-star tunnel.
 */
function createPortalScene(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const BG = '#ED632E';
  const HOLE = '#080808';
  // Brand-derived particle tones: white, warm peach, deep ember
  const TONES = [
    { color: '#ffffff', weight: 0.6 },
    { color: '#ffd9c4', weight: 0.26 },
    { color: '#3a1206', weight: 0.14 }
  ];

  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let baseR = 0;
  let maxR = 0;
  let coverZoom = 1;
  let particles = [];
  let stars = [];
  let rafId = null;
  let last = 0;
  let slowFrames = 0;

  const state = {
    mode: 'idle',
    openStart: 0,
    openDur: 1,
    hover: 0,
    hoverTarget: 0,
    diveStart: 0,
    diveDur: 1,
    tunnelDur: 1
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2;
    cy = h / 2;
    baseR = portalRadius(w, h);
    maxR = Math.hypot(w, h) / 2 + 30;
    coverZoom = (maxR / (baseR * 0.82)) * 1.15;
    seed();
  }

  function gauss() {
    return Math.sqrt(-2 * Math.log(Math.random() || 1e-6)) * Math.cos(TAU * Math.random());
  }

  function placeParticle(p, initial) {
    if (p.ring) {
      p.r = baseR * (1.03 + Math.abs(gauss()) * 0.42);
      if (!initial) p.r += baseR * 0.4;
    } else {
      p.r = initial
        ? baseR * 1.1 + Math.sqrt(Math.random()) * (maxR - baseR * 1.1)
        : maxR * (0.88 + Math.random() * 0.12);
    }
    p.a = Math.random() * TAU;
  }

  function seed() {
    const density = w < 700 ? 340 : 400;
    const count = Math.round(Math.min(3400, (w * h) / density));
    particles = [];
    TONES.forEach((tone) => {
      const n = Math.round(count * tone.weight);
      for (let i = 0; i < n; i += 1) {
        const p = {
          color: tone.color,
          ring: Math.random() < 0.58,
          size: 0.9 + Math.random() * (tone.color === '#3a1206' ? 2.4 : 2),
          alpha: 0.45 + Math.random() * 0.55,
          drift: 0.25 + Math.random() * 0.75,
          px: null,
          py: null
        };
        placeParticle(p, true);
        particles.push(p);
      }
    });
  }

  function seedStars() {
    const n = w < 700 ? 140 : 280;
    stars = Array.from({ length: n }, () => ({
      x: (Math.random() * 2 - 1),
      y: (Math.random() * 2 - 1),
      z: 0.15 + Math.random() * 0.85,
      color: Math.random() < 0.7 ? '#ffffff' : BG
    }));
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // Adaptive quality: thin the particle field if frames keep running slow
    if (dt > 0.034) {
      slowFrames += 1;
      if (slowFrames > 40 && particles.length > 400) {
        particles = particles.filter((_, i) => i % 3 !== 0);
        slowFrames = 0;
      }
    } else {
      slowFrames = Math.max(0, slowFrames - 1);
    }

    const t = now / 1000;
    const open = easeOutCubic(clamp01((now - state.openStart) / state.openDur));
    state.hover += (state.hoverTarget - state.hover) * Math.min(1, dt * 6);

    let zoom = 1;
    let spin = 0;
    let diveP = 0;
    let tunnelP = 0;
    if (state.mode === 'dive') {
      const elapsed = now - state.diveStart;
      diveP = clamp01(elapsed / state.diveDur);
      tunnelP = clamp01((elapsed - state.diveDur * 0.75) / state.tunnelDur);
      const fall = diveP * diveP * diveP; // accelerating, like falling
      zoom = Math.pow(coverZoom, fall);
      spin = fall * 1.2;
    }
    const speed = 1 + state.hover * 1.6 + diveP * 6;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    const R = baseR * open * (1 + state.hover * 0.05 + Math.sin(t * 1.3) * 0.012) * zoom;

    // Gravity-well halo: dark rim, warm glow, fading into the orange
    if (R > 1) {
      const halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 2.8);
      halo.addColorStop(0, 'rgba(20, 6, 2, 0.55)');
      halo.addColorStop(0.12, 'rgba(255, 226, 208, 0.2)');
      halo.addColorStop(0.35, 'rgba(110, 32, 8, 0.16)');
      halo.addColorStop(1, 'rgba(237, 99, 46, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);
    }

    // Orbiting particles (Keplerian: faster near the hole, slowly spiralling in)
    const fieldAlpha = open * (1 - tunnelP);
    if (fieldAlpha > 0.01) {
      // While diving, particles become motion streaks
      const streaks = diveP > 0.04;
      let currentColor = null;
      if (streaks) ctx.lineWidth = 1.5;
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        const omega = (0.05 + 0.6 * Math.pow(baseR / p.r, 1.5)) * speed;
        p.a += omega * dt;
        p.r -= p.drift * 9 * (baseR / p.r) * speed * dt;
        if (p.r < baseR * 0.97) {
          placeParticle(p, false);
          p.px = null;
        }

        const rr = p.r * (1 + (1 - open) * 0.7) * zoom;
        const ang = p.a + spin;
        const x = cx + Math.cos(ang) * rr;
        const y = cy + Math.sin(ang) * rr;
        if (x < -30 || x > w + 30 || y < -30 || y > h + 30) {
          p.px = null;
          continue;
        }

        if (streaks) {
          if (p.color !== currentColor) {
            currentColor = p.color;
            ctx.strokeStyle = currentColor;
          }
          if (p.px !== null) {
            ctx.globalAlpha = p.alpha * fieldAlpha;
            ctx.beginPath();
            ctx.moveTo(p.px, p.py);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
        } else {
          if (p.color !== currentColor) {
            currentColor = p.color;
            ctx.fillStyle = currentColor;
          }
          ctx.globalAlpha = p.alpha * fieldAlpha;
          ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
        }
        p.px = x;
        p.py = y;
      }
      ctx.globalAlpha = 1;
    }

    // The hole: solid core with a soft, fuzzy edge
    if (R > 0.5) {
      const edge = R * 1.06;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, edge);
      core.addColorStop(0, HOLE);
      core.addColorStop(0.86, HOLE);
      core.addColorStop(0.94, 'rgba(8, 8, 8, 0.85)');
      core.addColorStop(1, 'rgba(8, 8, 8, 0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, edge, 0, TAU);
      ctx.fill();
    }

    // Warp tunnel: stars rushing past the camera inside the darkness
    if (tunnelP > 0 && stars.length) {
      const tunnelAlpha = Math.min(1, tunnelP * 3) * (1 - clamp01((tunnelP - 0.55) / 0.45));
      const focal = Math.max(w, h) * 0.32;
      const warp = 1.9 * (1 - tunnelP * 0.5);
      ctx.lineCap = 'round';
      for (let i = 0; i < stars.length; i += 1) {
        const s = stars[i];
        const prevZ = s.z;
        s.z -= warp * dt;
        if (s.z <= 0.03) {
          s.z = 1;
          continue;
        }
        const x0 = cx + (s.x * focal) / prevZ;
        const y0 = cy + (s.y * focal) / prevZ;
        const x1 = cx + (s.x * focal) / s.z;
        const y1 = cy + (s.y * focal) / s.z;
        ctx.globalAlpha = tunnelAlpha * (1 - s.z);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 0.6 + (1 - s.z) * 2.2;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (rafId !== null) return;
    last = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  resize();

  return {
    resize,
    open(duration) {
      state.mode = 'open';
      state.openStart = performance.now();
      state.openDur = duration;
      start();
    },
    setHover(on) {
      state.hoverTarget = on ? 1 : 0;
    },
    dive(diveDuration, tunnelDuration) {
      seedStars();
      state.mode = 'dive';
      state.hoverTarget = 0;
      state.diveStart = performance.now();
      state.diveDur = diveDuration;
      state.tunnelDur = tunnelDuration;
    },
    destroy() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      particles = [];
      stars = [];
    }
  };
}
