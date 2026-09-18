/**
 * ETERNAL STUDIO — ABOUT SECTION PINNED SCROLLYTELLING
 * Scroll-pinned narrative illumination with circular indicator and smooth word scrub
 */

export function initAbout() {
  const aboutSection = document.querySelector('.about-section');
  const scrollyContainer = document.querySelector('.about-scrolly-container') || aboutSection;
  const scrollyPin = document.querySelector('.about-scrolly-pin');
  const statement = document.querySelector('.about-statement');
  const railFill = aboutSection.querySelector('.about-rail-fill');
  const railDot = aboutSection.querySelector('.about-rail-dot');
  const railSteps = aboutSection.querySelectorAll('.about-rail-step');

  if (!aboutSection || !statement) return;

  // Specific keywords to highlight in vivid fiery orange (#EC6430) matching reference
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
    return;
  }

  if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
    // Determine pinning scroll distance based on device screen height
    const getPinDistance = () => {
      const isMobile = window.innerWidth < 768;
      return isMobile ? Math.max(window.innerHeight * 1.3, 700) : Math.max(window.innerHeight * 1.5, 950);
    };

    window.ScrollTrigger.create({
      id: 'about-scrolly',
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

        // Vertical progress rail update (matching hero section)
        if (railFill) railFill.style.height = `${progress * 100}%`;
        if (railDot) railDot.style.top = `${progress * 100}%`;

        // Update rail step indicators (01 -> 02)
        const currentStep = progress >= 0.5 ? 2 : 1;
        railSteps.forEach((step) => {
          const stepNum = parseInt(step.dataset.step, 10);
          if (stepNum === currentStep) {
            step.classList.add('is-active');
          } else {
            step.classList.remove('is-active');
          }
        });
      }
    });

    // Step navigation click handlers
    railSteps.forEach((step) => {
      step.addEventListener('click', (e) => {
        e.preventDefault();
        const stepNum = parseInt(step.dataset.step, 10);
        const targetProgress = stepNum === 2 ? 0.85 : 0;
        const st = window.ScrollTrigger.getById('about-scrolly');
        if (st) {
          const scrollPos = st.start + (st.end - st.start) * targetProgress;
          window.scrollTo({ top: scrollPos, behavior: 'smooth' });
        }
      });
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
