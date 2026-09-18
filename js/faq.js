/**
 * ETERNAL STUDIO — INTERACTIVE FAQ MODULE
 * Handles stage-rigging hanging cards with pendulum swinging physics,
 * drag-to-scroll carousel, category filtering, and arrow controls.
 */

export function initFAQ() {
  const faqSection = document.querySelector('.faq-section');
  if (!faqSection) return;

  const track = faqSection.querySelector('.faq-cards-track');
  const cards = faqSection.querySelectorAll('.faq-card');
  const prevBtn = faqSection.querySelector('.faq-nav-btn--prev');
  const nextBtn = faqSection.querySelector('.faq-nav-btn--next');
  const filterPills = faqSection.querySelectorAll('.faq-filter-pill');

  if (!track || !cards.length) return;

  // 1. Dynamic Pendulum Swing Physics on Mouse Interaction
  cards.forEach((card) => {
    const restDeg = parseFloat(card.dataset.restDeg || 0);
    let rafId = null;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to +0.5
      // Dynamic tilt: swings based on cursor position
      const dynamicTilt = relativeX * 8;
      const targetDeg = restDeg * 0.25 + dynamicTilt;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        card.style.transform = `rotate(${targetDeg}deg) translateY(-10px) scale(1.025)`;
      });
    });

    card.addEventListener('mouseleave', () => {
      if (rafId) cancelAnimationFrame(rafId);
      card.style.transform = `rotate(${restDeg}deg) translateY(0) scale(1)`;
    });

    // Reset on touch devices
    card.addEventListener('touchend', () => {
      card.style.transform = `rotate(${restDeg}deg) translateY(0) scale(1)`;
    });
  });

  // 2. Drag to Scroll with Inertia Support
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let moved = false;

  track.addEventListener('mousedown', (e) => {
    // Only left click
    if (e.button !== 0) return;
    isDown = true;
    moved = false;
    track.classList.add('is-dragging');
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });

  track.addEventListener('mouseleave', () => {
    isDown = false;
    track.classList.remove('is-dragging');
  });

  track.addEventListener('mouseup', () => {
    isDown = false;
    track.classList.remove('is-dragging');
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag sensitivity
    if (Math.abs(walk) > 5) moved = true;
    track.scrollLeft = scrollLeft - walk;
    updateNavButtons();
  });

  // Prevent click triggering when dragging
  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  });

  // 3. Arrow Navigation Controls
  const getScrollStep = () => {
    const firstCard = cards[0];
    return firstCard ? firstCard.offsetWidth + 24 : 360;
  };

  const updateNavButtons = () => {
    if (!prevBtn || !nextBtn) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    prevBtn.disabled = track.scrollLeft <= 5;
    nextBtn.disabled = track.scrollLeft >= maxScroll - 5;
  };

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
    });
  }

  track.addEventListener('scroll', updateNavButtons, { passive: true });
  updateNavButtons();

  // 4. Category Filtering
  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      filterPills.forEach((p) => p.classList.remove('is-active'));
      pill.classList.add('is-active');

      const category = pill.dataset.filter;

      cards.forEach((card) => {
        const cardCategory = card.dataset.category;
        if (category === 'all' || cardCategory === category) {
          card.classList.remove('is-hidden');
          card.style.display = '';
        } else {
          card.classList.add('is-hidden');
          card.style.display = 'none';
        }
      });

      // Reset track scroll to start
      track.scrollTo({ left: 0, behavior: 'smooth' });
      setTimeout(updateNavButtons, 200);
    });
  });

  // 5. Keyboard Accessibility
  faqSection.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
    } else if (e.key === 'ArrowLeft') {
      track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
    }
  });
}
