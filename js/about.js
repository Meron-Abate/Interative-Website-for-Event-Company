/**
 * ETERNAL STUDIO — ABOUT SECTION WORD SCRUB REVEAL
 * Progressive scroll-driven text luminance using GSAP ScrollTrigger
 */

export function initAbout() {
  const aboutSection = document.querySelector('.about-section');
  const statement = document.querySelector('.about-statement');
  if (!aboutSection || !statement) return;

  // Split words if not already wrapped
  if (!statement.querySelector('.word')) {
    const text = statement.innerHTML.trim();
    // Replace whitespace/newlines with wrapped spans
    const wrappedWords = text.split(/\s+/).map((word) => {
      const isAccent = ['CONNECT', 'MOVE', 'STAY', 'PEOPLE.', 'BRANDS.', 'YOU.'].includes(word.toUpperCase());
      const accentClass = isAccent ? 'is-accent' : '';
      return `<span class="word ${accentClass}">${word}</span>`;
    }).join(' ');
    statement.innerHTML = wrappedWords;
  }

  const words = statement.querySelectorAll('.word');

  if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      words.forEach(w => w.classList.add('is-active'));
      return;
    }

    window.gsap.timeline({
      scrollTrigger: {
        trigger: aboutSection,
        start: 'top 75%',
        end: 'bottom 40%',
        scrub: 0.8,
        onUpdate: (self) => {
          const progress = self.progress;
          const totalWords = words.length;
          const activeIndex = Math.floor(progress * totalWords);

          words.forEach((word, idx) => {
            if (idx <= activeIndex) {
              word.classList.add('is-active');
            } else {
              word.classList.remove('is-active');
            }
          });
        }
      }
    });

    // Reveal metadata grid below statement
    window.gsap.from('.about-meta-item', {
      scrollTrigger: {
        trigger: '.about-meta-grid',
        start: 'top 85%'
      },
      y: 40,
      opacity: 0,
      stagger: 0.15,
      duration: 0.9,
      ease: 'power3.out'
    });
  } else {
    // Fallback: activate all words
    words.forEach(w => w.classList.add('is-active'));
  }
}
