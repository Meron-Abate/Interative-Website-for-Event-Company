/**
 * ETERNAL STUDIO — NAVIGATION & MOBILE DRAWER MODULE
 */

import { scrollToTarget } from './smooth-scroll.js';

export function initNavigation() {
  const header = document.querySelector('.site-header');
  const mobileToggleBtn = document.querySelector('[data-mobile-toggle]');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  const drawerLinks = document.querySelectorAll('.mobile-drawer-link');

  // Scroll Header Transformation
  let lastScrollY = window.pageYOffset;
  window.addEventListener('scroll', () => {
    const currentScrollY = window.pageYOffset;
    if (currentScrollY > 60) {
      header?.classList.add('is-scrolled');
    } else {
      header?.classList.remove('is-scrolled');
    }
    lastScrollY = currentScrollY;
  }, { passive: true });

  // Mobile Menu Drawer Toggle
  if (mobileToggleBtn && mobileDrawer) {
    mobileToggleBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.contains('is-open');
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    drawerLinks.forEach((link) => {
      link.addEventListener('click', () => {
        closeMobileMenu();
      });
    });
  }

  function openMobileMenu() {
    mobileDrawer.classList.add('is-open');
    mobileToggleBtn.setAttribute('aria-expanded', 'true');
    mobileToggleBtn.querySelector('span:last-child').textContent = 'CLOSE';
    document.body.style.overflow = 'hidden';

    if (typeof window.gsap !== 'undefined') {
      window.gsap.fromTo(
        '.mobile-drawer-link',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'power3.out' }
      );
    }
  }

  function closeMobileMenu() {
    mobileDrawer.classList.remove('is-open');
    mobileToggleBtn.setAttribute('aria-expanded', 'false');
    mobileToggleBtn.querySelector('span:last-child').textContent = 'MENU';
    document.body.style.overflow = '';
  }

  // Active Link Highlight
  highlightActiveNav();

  // In-page smooth scrolling anchor links (e.g. href="#about", href="#services", href="/#about")
  document.querySelectorAll('a[href*="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href) return;
      
      const hashIndex = href.indexOf('#');
      if (hashIndex === -1) return;
      
      const hash = href.slice(hashIndex);
      const pathname = href.slice(0, hashIndex);
      
      // If target is on the current page
      const isCurrentPage = !pathname || pathname === '/' || pathname === window.location.pathname;
      if (isCurrentPage && hash.length > 1) {
        const targetEl = document.querySelector(hash);
        if (targetEl) {
          e.preventDefault();
          scrollToTarget(targetEl, -80);
          if (history.pushState) {
            history.pushState(null, null, hash);
          }
        }
      }
    });
  });

  // Handle initial page load with hash (e.g. from redirect to /#about or /#services)
  if (window.location.hash && window.location.hash.length > 1) {
    setTimeout(() => {
      const targetEl = document.querySelector(window.location.hash);
      if (targetEl) {
        scrollToTarget(targetEl, -80);
      }
    }, 400);
  }

  // Local Time Indicators
  updateStudioClocks();
  setInterval(updateStudioClocks, 30000);
}

function highlightActiveNav() {
  function normalizeRoute(path) {
    let p = path.toLowerCase().replace(/\/index\.html$/, '').replace(/\.html$/, '');
    if (p.endsWith('/') && p.length > 1) {
      p = p.slice(0, -1);
    }
    if (p === '/works') p = '/work';
    return p || '/';
  }

  const currentPath = normalizeRoute(window.location.pathname);
  const links = document.querySelectorAll('.nav-link, .mobile-drawer-link');
  
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    
    // Normalize comparison
    try {
      const parsedUrl = new URL(href, window.location.origin);
      if (parsedUrl.hash && parsedUrl.pathname === '/') return; // Ignore homepage anchor links
      const linkPath = normalizeRoute(parsedUrl.pathname);
      const isMatch = (linkPath === currentPath) || 
                      (currentPath.startsWith('/work') && linkPath === '/work');
      if (isMatch) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    } catch {
      // Ignore malformed URLs
    }
  });
}

function updateStudioClocks() {
  const clockAddis = document.querySelector('[data-clock="addis"]');
  const clockNairobi = document.querySelector('[data-clock="nairobi"]');
  const clockLondon = document.querySelector('[data-clock="london"]');

  const now = new Date();

  function formatTime(timeZone) {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(now);
    } catch {
      return '--:--';
    }
  }

  if (clockAddis) clockAddis.textContent = `${formatTime('Africa/Addis_Ababa')} EAT`;
  if (clockNairobi) clockNairobi.textContent = `${formatTime('Africa/Nairobi')} EAT`;
  if (clockLondon) clockLondon.textContent = `${formatTime('Europe/London')} GMT/BST`;
}
