/**
 * ETERNAL STUDIO — SERVICES INTERACTION MODULE
 * 1. Full-width editorial services accordion with hover/click expansion
 * 2. Vertical expandable services stack with clear status indicators, rich media & global expand/collapse
 */

export function initServices() {
  initServicesFull();
  initServicesVertical();
}

/**
 * 01 // FULL-WIDTH EDITORIAL SERVICES ACCORDION
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

  rows.forEach((row) => {
    const header = row.querySelector('.service-row-header');

    row.addEventListener('mouseenter', () => {
      openRow(row);
    });

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

  if (typeof window.ScrollTrigger !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    window.ScrollTrigger.create({
      trigger: fullSection,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        if (!activeRow) {
          openRow(rows[0]);
        }
      }
    });

    const rect = fullSection.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.7) {
      openRow(rows[0]);
    }
  } else {
    openRow(rows[0]);
  }
}

/**
 * 02 // VERTICAL EXPANDABLE SERVICES STACK
 */
export function initServicesVertical() {
  const section = document.querySelector('.services-vertical-stack-section');
  if (!section) return;

  const cards = section.querySelectorAll('.service-v-card');
  const toggleAllBtn = section.querySelector('#services-v-toggle-all');
  if (!cards.length) return;

  function updateCardState(card, shouldExpand) {
    const btn = card.querySelector('.service-v-header-btn');
    const pillIcon = card.querySelector('.pill-indicator-icon');
    const pillText = card.querySelector('.pill-indicator-text');

    if (shouldExpand) {
      card.classList.add('is-expanded');
      if (btn) btn.setAttribute('aria-expanded', 'true');
      if (pillIcon) pillIcon.textContent = '−';
      if (pillText) pillText.textContent = 'COLLAPSE DETAILS';
    } else {
      card.classList.remove('is-expanded');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (pillIcon) pillIcon.textContent = '+';
      if (pillText) pillText.textContent = 'EXPAND SERVICE DETAILS';
    }
  }

  function updateGlobalToggleState() {
    if (!toggleAllBtn) return;
    const allExpanded = Array.from(cards).every((c) => c.classList.contains('is-expanded'));
    const toggleIcon = toggleAllBtn.querySelector('.v-toggle-icon');
    const toggleText = toggleAllBtn.querySelector('.v-toggle-text');

    if (allExpanded) {
      toggleAllBtn.setAttribute('aria-expanded', 'true');
      if (toggleIcon) toggleIcon.textContent = '−';
      if (toggleText) toggleText.textContent = 'COLLAPSE ALL SERVICES';
    } else {
      toggleAllBtn.setAttribute('aria-expanded', 'false');
      if (toggleIcon) toggleIcon.textContent = '+';
      if (toggleText) toggleText.textContent = 'EXPAND ALL SERVICES';
    }
  }

  // Click on individual card header button
  cards.forEach((card) => {
    const btn = card.querySelector('.service-v-header-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isCurrentlyExpanded = card.classList.contains('is-expanded');
      updateCardState(card, !isCurrentlyExpanded);
      updateGlobalToggleState();
    });
  });

  // Global Expand / Collapse All
  if (toggleAllBtn) {
    toggleAllBtn.addEventListener('click', () => {
      const isAllExpanded = Array.from(cards).every((c) => c.classList.contains('is-expanded'));
      cards.forEach((card) => {
        updateCardState(card, !isAllExpanded);
      });
      updateGlobalToggleState();
    });
  }

  // Initialize global toggle label based on first card open
  updateGlobalToggleState();
}
