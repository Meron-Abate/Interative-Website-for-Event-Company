/**
 * ETERNAL STUDIO — PORTFOLIO & WORK ARCHIVE MODULE
 * Horizontal exhibition scroll on desktop & vanilla category filter system
 */

export function initPortfolio() {
  initHorizontalScroll();
  initWorkFilter();
}

/**
 * Pinned Horizontal Scroll on Homepage
 */
function initHorizontalScroll() {
  const portfolioSection = document.querySelector('.portfolio-section[data-horizontal]');
  const horizontalWrapper = document.querySelector('.portfolio-horizontal-wrapper');
  
  if (!portfolioSection || !horizontalWrapper) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;

  // Use ScrollTrigger matchMedia for responsive activation on all viewports >= 768px
  const mm = window.ScrollTrigger.matchMedia();

  mm.add("(min-width: 768px)", () => {
    function getScrollAmount() {
      const wrapperWidth = horizontalWrapper.scrollWidth;
      return -(wrapperWidth - window.innerWidth + 80);
    }

    const tween = window.gsap.to(horizontalWrapper, {
      x: getScrollAmount,
      ease: 'none'
    });

    const pinTrigger = window.ScrollTrigger.create({
      trigger: portfolioSection,
      start: 'top top',
      end: () => `+=${Math.abs(getScrollAmount())}`,
      pin: true,
      animation: tween,
      scrub: 0.5,
      invalidateOnRefresh: true
    });

    // Subtly parallax card images inside horizontal track
    const cardImages = horizontalWrapper.querySelectorAll('.portfolio-card-media img');
    const parallaxTweens = [];

    cardImages.forEach((img) => {
      const pTween = window.gsap.fromTo(img, 
        { scale: 1.12, xPercent: -4 },
        {
          scale: 1,
          xPercent: 4,
          ease: 'none',
          scrollTrigger: {
            trigger: portfolioSection,
            start: 'top top',
            end: () => `+=${Math.abs(getScrollAmount())}`,
            scrub: 0.5
          }
        }
      );
      parallaxTweens.push(pTween);
    });

    return () => {
      tween.kill();
      pinTrigger.kill();
      parallaxTweens.forEach(pt => {
        if (pt.scrollTrigger) pt.scrollTrigger.kill();
        pt.kill();
      });
      window.gsap.set(horizontalWrapper, { clearProps: 'transform' });
      cardImages.forEach(img => window.gsap.set(img, { clearProps: 'all' }));
    };
  });
}

/**
 * Category Filtering Engine for work.html
 */
function initWorkFilter() {
  const filterButtons = document.querySelectorAll('[data-filter]');
  const projectCards = document.querySelectorAll('[data-category]');

  if (!filterButtons.length || !projectCards.length) return;

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedCategory = btn.getAttribute('data-filter');

      // Update active filter button state
      filterButtons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      // Filter project cards with smooth fade
      projectCards.forEach((card) => {
        const cardCategory = card.getAttribute('data-category');
        const matches = selectedCategory === 'all' || cardCategory === selectedCategory;

        if (matches) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 20);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            if (card.style.opacity === '0') {
              card.style.display = 'none';
            }
          }, 300);
        }
      });

      // Refresh ScrollTrigger calculations after reflow
      if (typeof window.ScrollTrigger !== 'undefined') {
        setTimeout(() => window.ScrollTrigger.refresh(), 350);
      }
    });
  });
}
