/**
 * ETERNAL STUDIO — SELECTED WORK GALLERY (homepage)
 * Portrait cards on a concave arc: cards toward the edges come closer and turn to
 * face the centre, the outermost ones cropped by the viewport. The section pins and
 * vertical scrolling slides the row to the left until the "More works" card arrives,
 * then the page continues. Hovering a card brings it forward.
 */

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function initWorkGallery() {
  const root = document.querySelector('[data-work-gallery]');
  if (!root) return;

  const section = root.closest('section') || root;
  const track = root.querySelector('.work-gallery-track');
  const originals = [...track.querySelectorAll('.work-card:not(.work-card--more)')];
  const moreCard = track.querySelector('.work-card--more');
  if (!originals.length) return;

  // Repeat the real projects once so the arc is full; copies are hidden from assistive tech
  const minProjects = 8;
  const copies = Math.max(1, Math.ceil(minProjects / originals.length));
  for (let c = 1; c < copies; c += 1) {
    originals.forEach((orig) => {
      const el = orig.cloneNode(true);
      el.setAttribute('aria-hidden', 'true');
      el.querySelector('a').setAttribute('tabindex', '-1');
      const img = el.querySelector('img');
      if (img) img.alt = '';
      track.insertBefore(el, moreCard || null);
    });
  }
  const cards = [...track.querySelectorAll('.work-card')].map((el, slot) => ({ el, slot, focus: 0 }));
  const last = cards.length - 1;
  root.classList.add('is-ready');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { gsap, ScrollTrigger } = window;

  // ------------------------------------------------------------------ layout
  let L = null;
  function measure() {
    const w = root.clientWidth;
    const h = window.innerHeight;
    const mobile = w < 640;
    const tablet = w < 1024;
    const cw = mobile
      ? Math.min(w * 0.42, 190)
      : tablet
        ? Math.min(w * 0.2, 200)
        : Math.max(140, Math.min(w * 0.12, h * 0.26, 220));
    const ch = cw * 1.38;
    L = {
      cw,
      ch,
      spacing: cw * (mobile ? 1.12 : 1.16),
      depth: mobile ? 16 : 20,
      turn: mobile ? 10 : 14,
      range: mobile ? 2.6 : tablet ? 3.6 : 4.4,
      // Scroll range: the row starts filled from the left edge and ends on "More works"
      start: Math.min(last, mobile ? 1 : tablet ? 2 : 3),
      // Finish with "More works" right of centre so the row still fills the screen
      end: Math.max(0, last - (mobile ? 0.6 : tablet ? 1.5 : 2))
    };
    root.style.setProperty('--card-w', `${cw}px`);
    root.style.setProperty('--card-h', `${ch}px`);
  }

  // ------------------------------------------------------------------ render
  let pos = 0;
  let target = 0;
  let hovered = null;
  let rafId = null;
  let lastT = 0;

  function render(dt) {
    let moving = Math.abs(target - pos) > 0.0005;
    cards.forEach((card) => {
      const r = card.slot - pos;
      const t = Math.abs(r);
      const goal = card === hovered ? 1 : 0;
      card.focus += (goal - card.focus) * (prefersReducedMotion ? 1 : Math.min(1, dt * 9));
      if (Math.abs(goal - card.focus) > 0.002) moving = true;
      const f = card.focus;

      // Concave arc: edge cards come closer and turn toward the centre
      const x = r * L.spacing * (1 + t * 0.03);
      const z = t * t * L.depth + f * 60;
      const rotY = -r * L.turn * (1 - f * 0.5);
      const scale = 1 + f * 0.06;
      const opacity = t <= L.range ? 1 : clamp01(1 - (t - L.range) / 0.9);

      const el = card.el;
      el.style.transform = `translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      el.style.opacity = opacity.toFixed(3);
      el.style.zIndex = String(100 + Math.round(t * 10) + Math.round(f * 400));
      el.style.visibility = opacity <= 0 ? 'hidden' : 'visible';
      el.style.setProperty('--focus', f.toFixed(3));
      el.classList.toggle('is-active', card === hovered);
    });
    return moving;
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    pos += (target - pos) * (prefersReducedMotion ? 1 : 1 - Math.exp(-dt * 8));
    if (Math.abs(target - pos) < 0.0005) pos = target;
    rafId = render(dt) ? requestAnimationFrame(frame) : null;
  }

  function kick() {
    if (rafId === null) {
      lastT = performance.now();
      rafId = requestAnimationFrame(frame);
    }
  }

  // ------------------------------------------------------------------ hover (mouse)
  cards.forEach((card) => {
    card.el.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      hovered = card;
      kick();
    });
    card.el.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (hovered === card) hovered = null;
      kick();
    });
  });

  // ------------------------------------------------------------------ scroll drive
  measure();
  pos = target = L.start;
  render(1);

  if (gsap && ScrollTrigger && !prefersReducedMotion) {
    ScrollTrigger.create({
      id: 'selected-work',
      trigger: section,
      pin: true,
      start: 'top top',
      end: () => `+=${Math.max(1, L.end - L.start) * window.innerHeight * 0.45}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        target = L.start + (L.end - L.start) * self.progress;
        kick();
      },
      onRefresh: (self) => {
        measure();
        pos = target = L.start + (L.end - L.start) * self.progress;
        render(1);
      }
    });
  } else {
    // Reduced motion: a plain horizontally scrollable row (see .is-static in CSS)
    root.classList.add('is-static');
    cards.forEach((card) => { card.el.style.cssText = ''; });
    return;
  }

  window.addEventListener('resize', () => {
    measure();
    render(1);
  }, { passive: true });
}
