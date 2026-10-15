/**
 * ETERNAL STUDIO — EVENTS WE PRODUCE
 * Pinned scrollytelling carousel. Each event type is a portal lit from below by a
 * ground-level uplight; the beam's strength reveals the image from the bottom up.
 * Scrolling moves the line-up to the right (the next portal arrives from the left),
 * crossfades the title and description, and snaps to each event type. The lights
 * fade up as the section scrolls into view, and brand-coloured dust rises in the
 * centre beam.
 */

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (t) => t * t * (3 - 2 * t);
const PARTICLE_TONES = ['#ffffff', '#ffd9c4', '#ED632E'];

export function initEventTypes() {
  const section = document.querySelector('.events-scrolly');
  if (!section) return;

  const pin = section.querySelector('.events-pin');
  const visuals = [...section.querySelectorAll('.events-visual')];
  const lights = [...section.querySelectorAll('.events-light')];
  const items = [...section.querySelectorAll('.events-item')];
  const bgWord = section.querySelector('.events-bgword');
  const fill = section.querySelector('.events-progress-fill');
  const canvas = section.querySelector('.events-canvas');
  const count = visuals.length;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { gsap, ScrollTrigger } = window;
  if (prefersReducedMotion || !gsap || !ScrollTrigger || count < 2) {
    section.classList.add('is-static');
    return;
  }

  let layout = null;
  const state = { pos: 0, enter: 0 };

  function measure() {
    const w = pin.clientWidth;
    const h = pin.clientHeight;
    const mobile = w < 769;
    const d = Math.round(mobile ? Math.min(w * 0.56, h * 0.3) : Math.min(h * 0.36, w * 0.24, 360));

    layout = mobile
      ? { w, h, d, mobile, side: w * 0.46, far: w * 0.95, cy: h * 0.31, cySide: h * 0.37, sideScale: 0.48, floor: h * 0.95 }
      : { w, h, d, mobile, side: w * 0.36, far: w * 0.78, cy: h * 0.4, cySide: h * 0.6, sideScale: 0.6, floor: h * 0.92 };

    section.style.setProperty('--d', `${d}px`);
    section.style.setProperty('--floor', `${layout.floor}px`);
    const titleTop = mobile ? layout.cy + d / 2 + d * 0.3 : layout.cy - d * 0.42;
    section.style.setProperty('--title-top', `${titleTop}px`);

    items.forEach((item) => {
      // Shrink long single words (e.g. "International") so they never run into the portal
      const title = item.querySelector('.events-title');
      title.style.fontSize = '';
      let size = parseFloat(getComputedStyle(title).fontSize);
      while (title.scrollWidth > title.clientWidth + 1 && size > 22) {
        size -= 2;
        title.style.fontSize = `${size}px`;
      }
      if (mobile) {
        const titleH = item.querySelector('.events-item-title').offsetHeight;
        item.style.setProperty('--desc-top', `${titleTop + titleH + 12}px`);
      }
    });
  }

  /** Where item i sits for offset s from centre (0 = centre, ±1 = neighbours). */
  function slot(s) {
    const L = layout;
    const t = Math.abs(s);
    const sign = Math.sign(s);
    const near = Math.min(t, 1);
    const beyond = clamp01(t - 1);
    const ease = smooth(near);
    return {
      t,
      x: sign * (L.side * near + (L.far - L.side) * beyond),
      y: L.cy + (L.cySide - L.cy) * ease + beyond * L.h * 0.06,
      scale: 1 + (L.sideScale - 1) * ease - beyond * 0.15,
      opacity: t <= 1.15 ? 1 : clamp01(1 - (t - 1.15) / 0.6)
    };
  }

  function placeItem(i, s) {
    const L = layout;
    const p = slot(s);
    const enter = smooth(state.enter);

    // Light strength: full at centre, a dimmer glow for the neighbours
    const intensity = enter * (0.35 + 0.65 * clamp01(1 - p.t));
    // Image reveal follows the light: fully discovered at centre, partly for neighbours
    const reveal = enter * clamp01(1 - p.t * 0.68);

    const el = visuals[i];
    el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${(p.y - L.d / 2).toFixed(1)}px, 0) scale(${p.scale.toFixed(3)})`;
    el.style.opacity = p.opacity.toFixed(3);
    el.style.zIndex = String(100 - Math.round(p.t * 10));
    el.style.visibility = p.opacity <= 0 ? 'hidden' : 'visible';
    el.style.setProperty('--focus', (clamp01(1 - p.t * 1.6) * enter).toFixed(3));
    el.style.setProperty('--reveal', reveal.toFixed(3));

    const light = lights[i];
    if (!light) return;
    const top = p.y;
    const width = L.d * p.scale * 1.35;
    light.style.setProperty('--x', `${p.x.toFixed(1)}px`);
    light.style.setProperty('--top', `${top.toFixed(1)}px`);
    light.style.setProperty('--h', `${Math.max(0, L.floor - top).toFixed(1)}px`);
    light.style.setProperty('--w', `${width.toFixed(1)}px`);
    light.style.setProperty('--i', (intensity * (L.mobile ? 0.75 : 1)).toFixed(3));
    light.style.opacity = p.opacity.toFixed(3);
    light.style.visibility = p.opacity <= 0 ? 'hidden' : 'visible';
  }

  function placeCopy(item, s) {
    const a = clamp01(1 - Math.abs(s) * 2.2);
    item.style.opacity = a.toFixed(3);
    item.style.setProperty('--shift', `${(s * 80).toFixed(1)}px`);
    item.classList.toggle('is-visible', a > 0.001);
  }

  function apply() {
    if (!layout) return;
    const pos = state.pos;
    for (let i = 0; i < count; i += 1) placeItem(i, pos - i);
    items.forEach((item, i) => placeCopy(item, pos - i));
    section.style.setProperty('--stage-light', smooth(state.enter).toFixed(3));
    if (bgWord) {
      const drift = (pos / (count - 1) - 0.5) * layout.w * 0.12;
      bgWord.style.transform = `translateX(calc(-50% + ${drift.toFixed(1)}px))`;
    }
    if (fill) fill.style.transform = `scaleX(${((pos + 1) / count).toFixed(3)})`;
  }

  measure();
  apply();

  const smoother = gsap.quickTo(state, 'pos', {
    duration: 0.65,
    ease: 'power3.out',
    onUpdate: apply
  });

  // Lights come up as the section scrolls into view
  ScrollTrigger.create({
    trigger: section,
    start: 'top 85%',
    end: 'top top',
    scrub: 0.5,
    onUpdate: (self) => {
      state.enter = self.progress;
      apply();
    }
  });

  ScrollTrigger.create({
    id: 'event-types',
    trigger: section,
    pin,
    start: 'top top',
    end: () => `+=${(count - 1) * window.innerHeight * 0.9}`,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    snap: {
      snapTo: 1 / (count - 1),
      duration: { min: 0.25, max: 0.7 },
      delay: 0.08,
      ease: 'power2.inOut'
    },
    onUpdate: (self) => {
      state.enter = 1;
      smoother(self.progress * (count - 1));
    },
    onRefresh: (self) => {
      measure();
      state.pos = self.progress * (count - 1);
      apply();
    }
  });

  // Re-measure once the condensed display font has loaded
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  if (canvas) {
    initBeamDust(canvas, section, () => layout, () => state.pos, () => smooth(state.enter));
  }
}

/** Brand-coloured dust drifting up through the centre beam; it stirs while scrolling. */
function initBeamDust(canvas, section, getLayout, getPos, getEnter) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let particles = [];
  let rafId = null;
  let visible = false;
  let last = 0;
  let lastPos = 0;
  let energy = 0;

  function gaussian() {
    return Math.sqrt(-2 * Math.log(Math.random() || 1e-6)) * Math.cos(TAU * Math.random());
  }

  function resize() {
    const L = getLayout();
    if (!L) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(L.w * dpr);
    canvas.height = Math.round(L.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const n = L.mobile ? 110 : 200;
    particles = Array.from({ length: n }, (_, i) => ({
      tone: i % 3,
      u: Math.max(-1, Math.min(1, gaussian() * 0.45)),
      y: Math.random(),
      speed: 0.04 + Math.random() * 0.09,
      sway: Math.random() * TAU,
      size: 0.8 + Math.random() * 1.6,
      alpha: 0.35 + Math.random() * 0.6
    })).sort((p, q) => p.tone - q.tone);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const L = getLayout();
    if (!L) {
      rafId = visible ? requestAnimationFrame(frame) : null;
      return;
    }

    const pos = getPos();
    const velocity = Math.abs(pos - lastPos) / Math.max(dt, 0.001);
    lastPos = pos;
    energy += (Math.min(velocity, 3) - energy) * Math.min(1, dt * 4);

    // Brightest when settled on an event type, as the centre beam is at full strength
    const settle = clamp01(1 - Math.abs(pos - Math.round(pos)) * 2.2);
    const strength = getEnter() * (0.35 + settle * 0.65);
    const cx = L.w / 2;
    const top = L.cy - L.d * 0.2;
    const span = L.floor - top;
    const halfTop = (L.d * 1.35) / 2;

    ctx.clearRect(0, 0, L.w, L.h);
    if (strength > 0.01) {
      let tone = -1;
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.y += p.speed * (1 + energy * 2.5) * dt;
        if (p.y > 1) {
          p.y = 0;
          p.u = Math.max(-1, Math.min(1, gaussian() * 0.45));
        }
        const half = 18 + (halfTop - 18) * p.y;
        const x = cx + p.u * half * 0.8 + Math.sin(now / 1000 + p.sway) * 3;
        const y = L.floor - p.y * span;
        const fade = Math.min(1, p.y * 8) * (1 - p.y * p.y * 0.7);
        if (p.tone !== tone) {
          tone = p.tone;
          ctx.fillStyle = PARTICLE_TONES[tone];
        }
        ctx.globalAlpha = p.alpha * fade * strength;
        ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    }

    rafId = visible ? requestAnimationFrame(frame) : null;
  }

  resize();
  window.ScrollTrigger.addEventListener('refresh', resize);

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && rafId === null) {
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    }
  }).observe(section);
}
