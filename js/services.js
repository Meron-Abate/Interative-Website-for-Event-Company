/**
 * ETERNAL STUDIO — SERVICES INTERACTION MODULE
 * Full-width editorial services accordion with inline pills, scroll reveal & hover expansion
 */

export function initServices() {
  initServicesFull();
}

/**
 * 02 // FULL-WIDTH EDITORIAL SERVICES ACCORDION & HOVER/SCROLL INTERACTION (HOW WE CAN HELP)
 */
export function initServicesFull() {
  const fullSection = document.querySelector('.services-full-section');
  if (!fullSection) return;

  const rows = fullSection.querySelectorAll('.service-row');
  if (!rows.length) return;

  let activeRow = null;

  function openRow(targetRow) {
    if (!targetRow) return;
    activeRow = targetRow;
    rows.forEach((row) => {
      const header = row.querySelector('.service-row-header');
      if (row === targetRow) {
        row.classList.add('is-open');
        if (header) header.setAttribute('aria-expanded', 'true');
      } else {
        row.classList.remove('is-open');
        if (header) header.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 1. Hover-To-Open Interaction on Desktop & Click fallback for Touch/Keyboard
  rows.forEach((row) => {
    const header = row.querySelector('.service-row-header');

    // Hover triggers row expansion effortlessly without needing clicks
    row.addEventListener('mouseenter', () => {
      openRow(row);
    });

    // Touch & Keyboard accessibility
    if (header) {
      header.addEventListener('click', () => {
        openRow(row);
      });

      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openRow(row);
        }
      });
    }
  });

  // 2. Scroll-Triggered Initial Open: When scrolling into section, open Row 01
  if (typeof window.ScrollTrigger !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Header subtle entrance reveal
    const headerTitle = fullSection.querySelector('.services-full-title');
    if (headerTitle && typeof window.gsap !== 'undefined' && !prefersReducedMotion) {
      window.gsap.from(headerTitle, {
        scrollTrigger: {
          trigger: fullSection,
          start: 'top 80%'
        },
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out'
      });
    }

    // Scroll trigger to open the first service automatically
    window.ScrollTrigger.create({
      trigger: fullSection,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        // Open first service row so visitors immediately see it's an interactive dropdown
        if (!activeRow) {
          openRow(rows[0]);
        }
      }
    });

    // If page is already scrolled past this threshold on initial load
    const rect = fullSection.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.7) {
      openRow(rows[0]);
    }
  } else {
    // Fallback if ScrollTrigger is not present
    openRow(rows[0]);
  }
}
