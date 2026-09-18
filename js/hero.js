/**
 * ETERNAL STUDIO — HERO CINEMATIC SCROLLYTELLING
 * Full-screen uninterrupted background video with 4-stage pinned narrative transitions,
 * interactive progress pill, and vertical rail tracking.
 */

import { getLenis } from './smooth-scroll.js';

export function initHero() {
  const heroContainer = document.querySelector('.hero-scrolly-container') || document.querySelector('.hero-section');
  if (!heroContainer) return;

  const video = heroContainer.querySelector('video');
  const canvas = heroContainer.querySelector('.hero-ambient-canvas');

  // Video Autoplay & Fallback Handling
  // Crucial: The video plays continuously and uninterrupted during all scroll interactions
  if (video) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.info('[Hero] Video autoplay notice or blocked; activating ambient canvas fallback.', err);
        if (canvas) initAmbientCanvas(canvas);
      });
    }
  } else if (canvas) {
    initAmbientCanvas(canvas);
  }  // Identify Stages & Controls
  const stage1 = heroContainer.querySelector('.hero-stage--1');
  const stage2 = heroContainer.querySelector('.hero-stage--2');
  const stages = [stage1, stage2].filter(Boolean);

  const hud = heroContainer.querySelector('.hero-scroll-hud');
  const dialProgress = heroContainer.querySelector('.hero-dial-progress');
  const dialCurrent = heroContainer.querySelector('.hero-dial-current');
  const hudTitle = heroContainer.querySelector('.hero-hud-title');

  const rail = heroContainer.querySelector('.hero-progress-rail');
  const railFill = heroContainer.querySelector('.hero-rail-fill');
  const railDot = heroContainer.querySelector('.hero-rail-dot');
  const railSteps = heroContainer.querySelectorAll('.hero-rail-step');

  const chapterTitles = {
    1: '01 — MANIFESTO',
    2: '02 — OUR MISSION'
  };

  // Circumference for r=44 circle: 2 * PI * 44 ≈ 276.46
  const dialCircumference = 276.46;
  if (dialProgress) {
    dialProgress.style.strokeDasharray = `${dialCircumference}`;
    dialProgress.style.strokeDashoffset = `${dialCircumference}`;
  }

  // Reduced motion handling
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    if (stage1) {
      stage1.style.opacity = '1';
      stage1.style.visibility = 'visible';
      stage1.style.transform = 'none';
      stage1.style.pointerEvents = 'auto';
    }
    return;
  }

  // Ensure GSAP and ScrollTrigger are loaded
  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
    if (stage1) {
      stage1.style.opacity = '1';
      stage1.style.visibility = 'visible';
      stage1.style.transform = 'none';
      stage1.style.pointerEvents = 'auto';
    }
    return;
  }

  const { gsap, ScrollTrigger } = window;

  // Initial State Setup
  gsap.set(stage1, { autoAlpha: 1, y: 0, pointerEvents: 'auto' });
  if (stage2) gsap.set(stage2, { autoAlpha: 0, y: 30, pointerEvents: 'none' });

  // Initial Entrance Animation on Page Load
  if (window.scrollY < 40) {
    const entranceTl = gsap.timeline({ delay: 0.15 });

    entranceTl.to('.hero-media-wrapper', {
      opacity: 1,
      duration: 1.2,
      ease: 'power2.out'
    })
    .from('.hero-stage--1 .hero-stage-headline', {
      opacity: 0,
      y: 28,
      duration: 1.0,
      ease: 'power4.out'
    }, '-=0.7')
    .from('.hero-stage--1 .hero-stage-col--right', {
      opacity: 0,
      y: 20,
      duration: 0.9,
      ease: 'power3.out'
    }, '-=0.7')
    .from('.hero-scroll-hud', {
      opacity: 0,
      y: 24,
      duration: 0.7,
      ease: 'power3.out'
    }, '-=0.5')
    .from('.hero-progress-rail', {
      opacity: 0,
      x: 20,
      duration: 0.7,
      ease: 'power3.out'
    }, '-=0.6');
  }

  // Navigation helper to jump to a specific progress or stage
  let navTween = null;

  function scrollToHeroProgress(targetProgress, onComplete) {
    const containerRect = heroContainer.getBoundingClientRect();
    const currentScroll = window.scrollY || window.pageYOffset;
    const startY = currentScroll + containerRect.top;
    const scrollableDistance = heroContainer.offsetHeight - window.innerHeight;

    if (targetProgress > 1) {
      const aboutEl = document.getElementById('about');
      if (aboutEl) {
        const lenis = getLenis();
        if (lenis) {
          lenis.scrollTo(aboutEl, { duration: 0.85, onComplete });
        } else {
          aboutEl.scrollIntoView({ behavior: 'smooth' });
          if (onComplete) setTimeout(onComplete, 800);
        }
        return;
      }
    }

    const targetY = startY + (targetProgress * scrollableDistance);
    const lenis = getLenis();

    if (lenis) {
      lenis.scrollTo(targetY, {
        duration: 0.75,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        onComplete: onComplete
      });
    } else {
      if (navTween) navTween.kill();
      const scrollObj = { y: currentScroll };
      navTween = gsap.to(scrollObj, {
        y: targetY,
        duration: 0.75,
        ease: 'power2.out',
        onUpdate: () => {
          window.scrollTo(0, scrollObj.y);
        },
        onComplete: () => {
          window.scrollTo(0, targetY);
          if (onComplete) onComplete();
        }
      });
    }
  }

  // Active stage tracker for single-scroll navigation
  let currentStageIndex = 1;

  // Master Scrollytelling Scrub Timeline
  const scrollyTl = gsap.timeline({
    scrollTrigger: {
      trigger: heroContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.3,
      snap: {
        snapTo: [0, 0.65],
        duration: { min: 0.2, max: 0.45 },
        ease: 'power2.out',
        delay: 0.05
      },
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;

        // Update orbital circular progress meter
        if (dialProgress) {
          const offset = dialCircumference * (1 - p);
          dialProgress.style.strokeDashoffset = Math.max(0, offset);
        }

        // Update right rail height & glowing dot position
        if (railFill) railFill.style.height = `${p * 100}%`;
        if (railDot) railDot.style.top = `${p * 100}%`;

        // Determine current stage index based on progress (2 stages)
        if (p >= 0.32) {
          currentStageIndex = 2;
        } else {
          currentStageIndex = 1;
        }

        // Update dial current stage display
        if (dialCurrent) {
          dialCurrent.textContent = `0${currentStageIndex}`;
        }

        // Update chapter title
        if (hudTitle) {
          hudTitle.textContent = chapterTitles[currentStageIndex] || '01 — MANIFESTO';
        }

        // Update rail step indicators
        railSteps.forEach((step) => {
          const stepNum = parseInt(step.dataset.step, 10);
          if (stepNum === currentStageIndex) {
            step.classList.add('is-active');
          } else {
            step.classList.remove('is-active');
          }
        });

        // Update semantic .is-active class on stages
        stages.forEach((stg, idx) => {
          if (idx + 1 === currentStageIndex) {
            stg.classList.add('is-active');
          } else {
            stg.classList.remove('is-active');
          }
        });
      }
    }
  });

  // Stage 1 -> Stage 2:
  // Immediate, responsive crossfade where Stage 2 reaches full 100% opacity early and holds
  scrollyTl
    .to(stage1, { autoAlpha: 0, y: -24, duration: 0.28, ease: 'power2.inOut' }, 0.04)
    .set(stage1, { pointerEvents: 'none' }, 0.32)
    .fromTo(stage2, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.28, ease: 'power2.inOut' }, 0.16)
    .set(stage2, { pointerEvents: 'auto' }, 0.44)
    .to({}, { duration: 0.56 }, 0.44); // Hold stage 2 fully visible and steady until 1.0

  // Single-Scroll Gesture Navigation
  // User scrolls once (wheel or swipe) -> smoothly transitions directly to the next slide
  let isNavigating = false;
  let touchStartY = null;

  function handleHeroWheel(e) {
    const containerRect = heroContainer.getBoundingClientRect();
    // Only intercept when hero container is pinned/visible in viewport
    if (containerRect.top > 50 || containerRect.bottom < 100) return;

    // Swallow residual wheel events during active transition
    if (isNavigating) {
      e.preventDefault();
      return;
    }

    const deltaY = e.deltaY;
    if (Math.abs(deltaY) < 15) return;

    const scrollableDistance = heroContainer.offsetHeight - window.innerHeight;
    if (scrollableDistance <= 0) return;
    const currentProgress = Math.max(0, Math.min(1, -containerRect.top / scrollableDistance));

    // If on Slide 1 and scrolling down: 1 scroll immediately navigates to Slide 2
    if (currentProgress < 0.30 && deltaY > 0) {
      isNavigating = true;
      e.preventDefault();
      scrollToHeroProgress(0.65, () => {
        setTimeout(() => { isNavigating = false; }, 350);
      });
    }
    // If on Slide 2 and scrolling up: 1 scroll returns to Slide 1
    else if (currentProgress >= 0.35 && currentProgress <= 0.85 && deltaY < 0) {
      isNavigating = true;
      e.preventDefault();
      scrollToHeroProgress(0.0, () => {
        setTimeout(() => { isNavigating = false; }, 350);
      });
    }
    // If on Slide 2 and scrolling down: standard scroll unpins hero and enters #about naturally
  }

  window.addEventListener('wheel', handleHeroWheel, { passive: false });

  // Touch gesture swipe support for mobile/tablets
  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (touchStartY === null || !e.changedTouches || e.changedTouches.length === 0) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;
    touchStartY = null;

    if (Math.abs(deltaY) < 40) return;

    const containerRect = heroContainer.getBoundingClientRect();
    if (containerRect.top > 50 || containerRect.bottom < 100) return;

    const scrollableDistance = heroContainer.offsetHeight - window.innerHeight;
    if (scrollableDistance <= 0) return;
    const currentProgress = Math.max(0, Math.min(1, -containerRect.top / scrollableDistance));

    if (currentProgress < 0.30 && deltaY > 0) {
      if (isNavigating) return;
      isNavigating = true;
      scrollToHeroProgress(0.65, () => {
        setTimeout(() => { isNavigating = false; }, 350);
      });
    } else if (currentProgress >= 0.35 && currentProgress <= 0.85 && deltaY < 0) {
      if (isNavigating) return;
      isNavigating = true;
      scrollToHeroProgress(0.0, () => {
        setTimeout(() => { isNavigating = false; }, 350);
      });
    }
  }, { passive: true });

  // Click-to-Advance Interactive Orbital HUD
  if (hud) {
    hud.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentStageIndex === 1) scrollToHeroProgress(0.65);
      else scrollToHeroProgress(1.05);
    });

    hud.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        hud.click();
      }
    });
  }

  // Interactive Rail Steps (Clicking 01 or 02 navigates directly)
  railSteps.forEach((step) => {
    step.addEventListener('click', (e) => {
      e.preventDefault();
      const stepNum = parseInt(step.dataset.step, 10);
      if (stepNum === 1) scrollToHeroProgress(0.0);
      else if (stepNum === 2) scrollToHeroProgress(0.65);
    });
  });
}

/**
 * Ambient Atmospheric Particle Canvas
 * Provides a rich, subtle, organic light field that feels like moving cinematic smoke and embers
 */
function initAmbientCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  let animationId;
  let width, height;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Generate light orbs
  const particles = Array.from({ length: 28 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 180 + 80,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.3,
    alpha: Math.random() * 0.15 + 0.05
  }));

  function render() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -p.radius) p.x = width + p.radius;
      if (p.x > width + p.radius) p.x = -p.radius;
      if (p.y < -p.radius) p.y = height + p.radius;
      if (p.y > height + p.radius) p.y = -p.radius;

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      grad.addColorStop(0, `rgba(236, 100, 48, ${p.alpha})`);
      grad.addColorStop(0.6, `rgba(236, 100, 48, ${p.alpha * 0.3})`);
      grad.addColorStop(1, 'rgba(8, 8, 8, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    animationId = requestAnimationFrame(render);
  }

  render();
}
