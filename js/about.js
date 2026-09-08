/**
 * ETERNAL STUDIO — ABOUT SECTION PINNED SCROLLYTELLING
 * Scroll-pinned narrative illumination with circular indicator and smooth word scrub
 */

export function initAbout() {
  const aboutSection = document.querySelector('.about-section');
  const scrollyContainer = document.querySelector('.about-scrolly-container') || aboutSection;
  const scrollyPin = document.querySelector('.about-scrolly-pin');
  const statement = document.querySelector('.about-statement');
  const ctaWrap = document.querySelector('.about-cta-wrap');
  const progressCircle = document.querySelector('.indicator-progress');
  const indicatorDot = document.querySelector('.indicator-dot');

  if (!aboutSection || !statement) return;

  // Specific keywords to highlight in vivid fiery orange (#FF5A36) matching reference
  const accentList = ['PRECISION', 'SPATIAL', 'GLOBAL', 'ARCHITECTURAL', 'UNFORGETTABLE', 'CONNECTION'];

  // Split words if not already wrapped
  if (!statement.querySelector('.word')) {
    const text = statement.innerHTML.trim();
    const wrappedWords = text.split(/\s+/).map((word) => {
      const clean = word.toUpperCase().replace(/[^A-Z]/g, '');
      const isAccent = accentList.includes(clean);
      const accentClass = isAccent ? 'is-accent' : '';
      return `<span class="word ${accentClass}">${word}</span>`;
    }).join(' ');
    statement.innerHTML = wrappedWords;
  }

  const words = statement.querySelectorAll('.word');
  const totalWords = words.length;

  // Reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    words.forEach(w => w.classList.add('is-active'));
    if (ctaWrap) ctaWrap.classList.add('is-revealed');
    return;
  }

  if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
    // Circumference for r=14 circle: 2 * PI * 14 ≈ 87.96
    const circumference = 87.96;
    if (progressCircle) {
      progressCircle.style.strokeDasharray = `${circumference}`;
      progressCircle.style.strokeDashoffset = `${circumference}`;
    }

    // Determine pinning scroll distance based on device screen height
    const getPinDistance = () => {
      const isMobile = window.innerWidth < 768;
      return isMobile ? Math.max(window.innerHeight * 1.3, 700) : Math.max(window.innerHeight * 1.5, 950);
    };

    window.ScrollTrigger.create({
      trigger: scrollyContainer,
      pin: scrollyPin || true,
      start: 'top top',
      end: () => `+=${getPinDistance()}`,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const progress = self.progress;

        // Illumination scrub: all words finish illuminating by ~86% progress
        // This ensures all text is 100% revealed before the section unpins
        const scrubProgress = Math.min(progress / 0.86, 1);
        const activeCount = Math.floor(scrubProgress * totalWords);

        for (let i = 0; i < totalWords; i++) {
          if (i <= activeCount) {
            words[i].classList.add('is-active');
          } else {
            words[i].classList.remove('is-active');
          }
        }

        // Circular progress ring update
        if (progressCircle) {
          const offset = circumference * (1 - progress);
          progressCircle.style.strokeDashoffset = Math.max(0, offset);
        }

        // Rotating dot update
        if (indicatorDot) {
          const angle = progress * 360 - 90;
          indicatorDot.style.transform = `rotate(${angle}deg) translate(14px) rotate(${-angle}deg)`;
        }

        // Smooth reveal of "LEARN MORE" pill button
        if (ctaWrap) {
          if (progress >= 0.80) {
            ctaWrap.classList.add('is-revealed');
          } else {
            ctaWrap.classList.remove('is-revealed');
          }
        }
      }
    });

    // Reveal architectural pillar cards below the pinned scrollytelling section
    if (document.querySelector('.about-pillars-grid')) {
      window.gsap.from('.pillar-card', {
        scrollTrigger: {
          trigger: '.about-pillars-grid',
          start: 'top 85%'
        },
        y: 35,
        opacity: 0,
        stagger: 0.15,
        duration: 0.9,
        ease: 'power3.out'
      });
    }
  } else {
    // Fallback: activate all words immediately
    words.forEach(w => w.classList.add('is-active'));
    if (ctaWrap) ctaWrap.classList.add('is-revealed');
  }
}
