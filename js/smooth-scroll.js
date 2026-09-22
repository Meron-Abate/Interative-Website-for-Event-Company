/**
 * ETERNAL STUDIO — SMOOTH SCROLL MODULE
 * Integrates Lenis smooth scrolling with GSAP ScrollTrigger
 */

let lenisInstance = null;

export function initSmoothScroll() {
  // Check if reduced motion is preferred
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    console.info('[SmoothScroll] Reduced motion preferred; Lenis smooth scrolling bypassed.');
    return null;
  }

  // Disable Lenis on touch devices to ensure native silky mobile scrolling
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 992;
  if (isTouch) {
    console.info('[SmoothScroll] Touch/mobile environment detected; using native scroll.');
    return null;
  }

  if (typeof window.Lenis === 'undefined') {
    console.warn('[SmoothScroll] Lenis library not loaded; falling back to native scroll.');
    return null;
  }

  try {
    lenisInstance = new window.Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
      infinite: false
    });

    window.lenis = lenisInstance;

    // Synchronize Lenis scroll with GSAP ScrollTrigger
    if (typeof window.ScrollTrigger !== 'undefined') {
      lenisInstance.on('scroll', window.ScrollTrigger.update);

      if (typeof window.gsap !== 'undefined') {
        window.gsap.ticker.add((time) => {
          lenisInstance.raf(time * 1000);
        });
        window.gsap.ticker.lagSmoothing(0);
      }
    } else {
      function raf(time) {
        lenisInstance.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    console.info('[SmoothScroll] Lenis synchronized with GSAP ScrollTrigger.');
    return lenisInstance;
  } catch (err) {
    console.error('[SmoothScroll] Failed to initialize Lenis:', err);
    return null;
  }
}

export function getLenis() {
  return lenisInstance;
}

export function scrollToTarget(target, offset = 0) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, { offset });
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }
}
