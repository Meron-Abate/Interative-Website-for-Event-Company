/**
 * ETERNAL STUDIO — HERO CINEMATIC SCROLLYTELLING
 * Full-screen uninterrupted background video with 4-stage pinned narrative transitions,
 * interactive progress pill, and vertical rail tracking.
 */

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
  }

  // Identify Stages & Controls
  const stage1 = heroContainer.querySelector('.hero-stage--1');
  const stage2 = heroContainer.querySelector('.hero-stage--2');
  const stage3 = heroContainer.querySelector('.hero-stage--3');
  const stage4 = heroContainer.querySelector('.hero-stage--4');
  const stages = [stage1, stage2, stage3, stage4].filter(Boolean);

  const pill = heroContainer.querySelector('.hero-scroll-pill');
  const pillFill = heroContainer.querySelector('.hero-pill-fill');
  const pillCurrent = heroContainer.querySelector('.hero-pill-current');

  const rail = heroContainer.querySelector('.hero-progress-rail');
  const railFill = heroContainer.querySelector('.hero-rail-fill');
  const railDot = heroContainer.querySelector('.hero-rail-dot');
  const railSteps = heroContainer.querySelectorAll('.hero-rail-step');

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
  if (stage3) gsap.set(stage3, { autoAlpha: 0, y: 30, pointerEvents: 'none' });
  if (stage4) gsap.set(stage4, { autoAlpha: 0, y: 30, pointerEvents: 'none' });

  // Initial Entrance Animation on Page Load
  if (window.scrollY < 40) {
    const entranceTl = gsap.timeline({ delay: 0.15 });

    entranceTl.to('.hero-media-wrapper', {
      opacity: 1,
      duration: 1.2,
      ease: 'power2.out'
    })
    .from('.hero-stage--1 .hero-stage-tag', {
      opacity: 0,
      y: 16,
      duration: 0.7,
      ease: 'power3.out'
    }, '-=0.8')
    .from('.hero-stage--1 .hero-stage-headline', {
      opacity: 0,
      y: 28,
      duration: 1.0,
      ease: 'power4.out'
    }, '-=0.5')
    .from('.hero-stage--1 .hero-stage-col--right', {
      opacity: 0,
      y: 20,
      duration: 0.9,
      ease: 'power3.out'
    }, '-=0.7')
    .from('.hero-scroll-pill', {
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
  function scrollToHeroProgress(targetProgress) {
    const containerRect = heroContainer.getBoundingClientRect();
    const currentScroll = window.scrollY;
    const startY = currentScroll + containerRect.top;
    const scrollableDistance = heroContainer.offsetHeight - window.innerHeight;

    if (targetProgress > 1) {
      const aboutEl = document.getElementById('about');
      if (aboutEl) {
        aboutEl.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    const targetY = startY + (targetProgress * scrollableDistance);
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }

  // Active stage tracker for click-to-advance
  let currentStageIndex = 1;

  // Master Scrollytelling Scrub Timeline
  const scrollyTl = gsap.timeline({
    scrollTrigger: {
      trigger: heroContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;

        // Update bottom pill fill line
        if (pillFill) {
          const fillScale = Math.min(1, Math.max(0.12, 0.12 + p * 0.88));
          pillFill.style.transform = `scaleX(${fillScale})`;
        }

        // Update right rail height & glowing dot position
        if (railFill) railFill.style.height = `${p * 100}%`;
        if (railDot) railDot.style.top = `${p * 100}%`;

        // Determine current stage index based on progress
        if (p >= 0.74) {
          currentStageIndex = 4;
        } else if (p >= 0.48) {
          currentStageIndex = 3;
        } else if (p >= 0.22) {
          currentStageIndex = 2;
        } else {
          currentStageIndex = 1;
        }

        // Update pill counter display
        if (pillCurrent) {
          pillCurrent.textContent = `0${currentStageIndex}`;
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

  // Stage 1 -> Stage 2 (Transition around 0.18 - 0.28)
  scrollyTl
    .to(stage1, { autoAlpha: 0, y: -26, duration: 0.08, ease: 'power1.inOut' }, 0.18)
    .set(stage1, { pointerEvents: 'none' }, 0.22)
    .fromTo(stage2, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.08, ease: 'power1.inOut' }, 0.22)
    .set(stage2, { pointerEvents: 'auto' }, 0.26)

  // Stage 2 -> Stage 3 (Transition around 0.44 - 0.52)
    .to(stage2, { autoAlpha: 0, y: -26, duration: 0.08, ease: 'power1.inOut' }, 0.44)
    .set(stage2, { pointerEvents: 'none' }, 0.48)
    .fromTo(stage3, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.08, ease: 'power1.inOut' }, 0.48)
    .set(stage3, { pointerEvents: 'auto' }, 0.52)

  // Stage 3 -> Stage 4 (Transition around 0.70 - 0.78)
    .to(stage3, { autoAlpha: 0, y: -26, duration: 0.08, ease: 'power1.inOut' }, 0.70)
    .set(stage3, { pointerEvents: 'none' }, 0.74)
    .fromTo(stage4, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.08, ease: 'power1.inOut' }, 0.74)
    .set(stage4, { pointerEvents: 'auto' }, 0.78);

  // Click-to-Advance Interactive Bottom Pill
  if (pill) {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentStageIndex === 1) scrollToHeroProgress(0.35);
      else if (currentStageIndex === 2) scrollToHeroProgress(0.60);
      else if (currentStageIndex === 3) scrollToHeroProgress(0.86);
      else scrollToHeroProgress(1.05);
    });

    pill.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pill.click();
      }
    });
  }

  // Interactive Rail Steps (Clicking 01, 02, 03, 04 navigates directly)
  railSteps.forEach((step) => {
    step.addEventListener('click', (e) => {
      e.preventDefault();
      const stepNum = parseInt(step.dataset.step, 10);
      if (stepNum === 1) scrollToHeroProgress(0.02);
      else if (stepNum === 2) scrollToHeroProgress(0.35);
      else if (stepNum === 3) scrollToHeroProgress(0.60);
      else if (stepNum === 4) scrollToHeroProgress(0.86);
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
      grad.addColorStop(0, `rgba(255, 90, 54, ${p.alpha})`);
      grad.addColorStop(0.6, `rgba(255, 90, 54, ${p.alpha * 0.3})`);
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
