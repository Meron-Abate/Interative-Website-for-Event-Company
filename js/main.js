/**
 * ETERNAL STUDIO — MASTER APPLICATION BOOTSTRAP
 * Coordinates modules, accessibility, form validation, and stats reveals
 */

import { initSmoothScroll } from './smooth-scroll.js';
import { initTheme } from './theme.js';
import { initCursor } from './cursor.js';
import { initNavigation } from './navigation.js';
import { initHero } from './hero.js';
import { initAbout } from './about.js';
import { initServices } from './services.js';
import { initPortfolio } from './portfolio.js';
import { initFAQ } from './faq.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('%c ETERNAL STUDIO %c Spatial Architecture & Immersive Experiences ', 'background: #EC6430; color: #fff; font-weight: bold; padding: 4px;', 'background: #080808; color: #f1f1f1; padding: 4px;');

  // Initialize Core Systems
  initTheme();
  initSmoothScroll();
  initCursor();
  initNavigation();

  // Page Specific Modules
  initHero();
  initAbout();
  initServices();
  initPortfolio();
  initFAQ();

  // Global Components
  initStatsCounter();
  initContactForm();
  initParallaxEffects();

  // Handle Resize Debounce for ScrollTrigger
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (typeof window.ScrollTrigger !== 'undefined') {
        window.ScrollTrigger.refresh();
      }
    }, 250);
  }, { passive: true });
});

/**
 * Subtle Stats Number Reveal
 */
function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (!statNumbers.length) return;

  if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
    window.gsap.from(statNumbers, {
      scrollTrigger: {
        trigger: '.stats-section',
        start: 'top 80%'
      },
      y: 40,
      opacity: 0,
      stagger: 0.12,
      duration: 1,
      ease: 'power3.out'
    });
  }
}

/**
 * Contact Form Validation & State
 */
function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const feedbackAlert = document.querySelector('.form-feedback-alert');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;

    // Reset error states
    form.querySelectorAll('.form-group').forEach(group => group.classList.remove('has-error'));

    const nameInput = form.querySelector('[name="name"]');
    const emailInput = form.querySelector('[name="email"]');
    const messageInput = form.querySelector('[name="message"]');

    if (nameInput && !nameInput.value.trim()) {
      showError(nameInput, 'Please provide your name or organization.');
      isValid = false;
    }

    if (emailInput) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailInput.value.trim() || !emailPattern.test(emailInput.value.trim())) {
        showError(emailInput, 'Please provide a valid email address.');
        isValid = false;
      }
    }

    if (messageInput && !messageInput.value.trim()) {
      showError(messageInput, 'Please tell us about your vision or brief.');
      isValid = false;
    }

    if (isValid) {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'TRANSMITTING BRIEF...';
      }

      setTimeout(() => {
        form.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'TRANSMIT BRIEF →';
        }
        if (feedbackAlert) {
          feedbackAlert.style.display = 'block';
          feedbackAlert.textContent = 'Thank you. Your project brief has been received. Our executive producers will contact you within 24 hours.';
        }
      }, 1200);
    }
  });

  function showError(inputEl, msg) {
    const group = inputEl.closest('.form-group');
    if (group) {
      group.classList.add('has-error');
      const errEl = group.querySelector('.form-error-msg');
      if (errEl) errEl.textContent = msg;
    }
  }
}

/**
 * Editorial Parallax Effect on Select Imagery
 */
function initParallaxEffects() {
  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 992) return;

  const parallaxImages = document.querySelectorAll('.parallax-img');
  parallaxImages.forEach((img) => {
    window.gsap.fromTo(img,
      { yPercent: -10 },
      {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: img.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      }
    );
  });
}
