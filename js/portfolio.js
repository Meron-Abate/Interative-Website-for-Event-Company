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

  const isDesktop = window.innerWidth >= 992 && !window.matchMedia('(pointer: coarse)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isDesktop && !prefersReducedMotion && typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
    function getScrollAmount() {
      const wrapperWidth = horizontalWrapper.scrollWidth;
      return -(wrapperWidth - window.innerWidth + 120);
    }

    const tween = window.gsap.to(horizontalWrapper, {
      x: getScrollAmount,
      ease: 'none'
    });

    window.ScrollTrigger.create({
      trigger: portfolioSection,
      start: 'top top',
      end: () => `+=${Math.abs(getScrollAmount())}`,
      pin: true,
      animation: tween,
      scrub: 1,
      invalidateOnRefresh: true
    });

    // Subtly parallax card images inside horizontal track
    const cardImages = horizontalWrapper.querySelectorAll('.portfolio-card-media img');
    cardImages.forEach((img) => {
      window.gsap.fromTo(img, 
        { scale: 1.15, xPercent: -5 },
        {
          scale: 1,
          xPercent: 5,
          ease: 'none',
          scrollTrigger: {
            trigger: portfolioSection,
            start: 'top top',
            end: () => `+=${Math.abs(getScrollAmount())}`,
            scrub: true
          }
        }
      );
    });
  }
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
