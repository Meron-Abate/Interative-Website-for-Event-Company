/**
 * ETERNAL STUDIO — HERO CINEMATIC SEQUENCE
 * Staggered editorial headline reveal & video/ambient canvas fallback
 */

export function initHero() {
  const heroSection = document.querySelector('.hero-section');
  if (!heroSection) return;

  const video = heroSection.querySelector('video');
  const canvas = heroSection.querySelector('.hero-ambient-canvas');

  // Video Autoplay & Fallback Handling
  if (video) {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        console.info('[Hero] Video autoplay blocked or media not found; activating ambient cinematic canvas.');
        if (canvas) initAmbientCanvas(canvas);
      });
    }
  } else if (canvas) {
    initAmbientCanvas(canvas);
  }

  // GSAP Cinematic Entrance Timeline
  if (typeof window.gsap !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      window.gsap.set('.hero-pretitle, .hero-headline-line span, .hero-actions', {
        opacity: 1,
        y: 0,
        transform: 'none'
      });
      return;
    }

    const tl = window.gsap.timeline({ delay: 0.2 });

    tl.to('.hero-media-wrapper', {
      opacity: 1,
      duration: 1.4,
      ease: 'power2.out'
    })
    .to('.hero-pretitle', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.8')
    .to('.hero-headline-line span', {
      y: '0%',
      opacity: 1,
      stagger: 0.12,
      duration: 1.1,
      ease: 'power4.out'
    }, '-=0.5')
    .to('.hero-actions', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.4');
  } else {
    // Fallback if GSAP is unavailable
    document.querySelectorAll('.hero-pretitle, .hero-headline-line span, .hero-actions').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }
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

  window.addEventListener('resize', resize);
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
