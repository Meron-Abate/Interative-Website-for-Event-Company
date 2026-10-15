/**
 * ETERNAL STUDIO — NAVIGATION & MOBILE DRAWER MODULE
 */

import { scrollToTarget, getLenis } from './smooth-scroll.js';

export function initNavigation() {
  const header = document.querySelector('.site-header');
  const mobileToggleBtn = document.querySelector('[data-mobile-toggle]');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  const drawerLinks = document.querySelectorAll('.mobile-drawer-link');
  const heroSection = document.getElementById('hero');

  // Scroll Header Transformation: transparent over the hero video, solid once scrolling
  let lastScrollY = window.pageYOffset;
  function updateHeaderState() {
    const currentScrollY = window.pageYOffset;
    header?.classList.toggle('is-scrolled', currentScrollY > 60);
    if (heroSection) {
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      header?.classList.toggle('is-over-hero', heroBottom > (header?.offsetHeight || 0));
    }
    lastScrollY = currentScrollY;
  }
  window.addEventListener('scroll', updateHeaderState, { passive: true });
  updateHeaderState();

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

    mobileDrawer.querySelectorAll('.mobile-drawer-footer a').forEach((link) => {
      link.addEventListener('click', () => closeMobileMenu());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('is-open')) {
        closeMobileMenu();
        mobileToggleBtn.focus();
      }
    });
  }

  function openMobileMenu() {
    mobileDrawer.classList.add('is-open');
    mobileDrawer.setAttribute('aria-hidden', 'false');
    header?.classList.add('is-menu-open');
    mobileToggleBtn.setAttribute('aria-expanded', 'true');
    mobileToggleBtn.setAttribute('aria-label', 'Close Menu');
    mobileToggleBtn.querySelector(':scope > span:last-child').textContent = 'CLOSE';
    document.body.style.overflow = 'hidden';
    getLenis()?.stop();

    if (typeof window.gsap !== 'undefined') {
      window.gsap.fromTo(
        '.mobile-drawer-link, .mobile-drawer-footer',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.07, duration: 0.6, delay: 0.2, ease: 'power3.out' }
      );
    }
  }

  function closeMobileMenu() {
    mobileDrawer.classList.remove('is-open');
    mobileDrawer.setAttribute('aria-hidden', 'true');
    header?.classList.remove('is-menu-open');
    mobileToggleBtn.setAttribute('aria-expanded', 'false');
    mobileToggleBtn.setAttribute('aria-label', 'Open Menu');
    mobileToggleBtn.querySelector(':scope > span:last-child').textContent = 'MENU';
    document.body.style.overflow = '';
    getLenis()?.start();
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
  // Capture the hash now: the scroll-spy below may rewrite the URL before the timeout runs
  const initialHash = window.location.hash;
  if (initialHash && initialHash.length > 1) {
    setTimeout(() => {
      let targetEl = null;
      try {
        targetEl = document.querySelector(initialHash);
      } catch {
        // Not a valid selector (e.g. an encoded hash); nothing to scroll to
      }
      if (targetEl) {
        scrollToTarget(targetEl, -80);
      }
    }, 400);
  }

  // Local Time Indicators
  updateStudioClocks();
  setInterval(updateStudioClocks, 30000);

  // Section Scroll-Spy (Reflect active section in URL and document title)
  initSectionScrollSpy();
}

function initSectionScrollSpy() {
  // Only activate on homepage where multiple main sections coexist
  const isHomepage = window.location.pathname === '/' || 
                     window.location.pathname.endsWith('/index.html') || 
                     window.location.pathname === '';
  if (!isHomepage) return;

  const sections = [
    { id: 'hero', hash: '', title: 'ETERNAL — Spatial Architecture & Immersive Event Production' },
    { id: 'services', hash: '#services', title: 'Services — How We Can Help | ETERNAL' },
    { id: 'portfolio', hash: '#work', title: 'Selected Work — Portfolio | ETERNAL Studio' },
    { id: 'about', hash: '#about', title: 'About Us — ETERNAL Studio' },
    { id: 'faq', hash: '#faq', title: 'FAQ — ETERNAL Studio' },
    { id: 'footer', hash: '#contact', title: 'Stay Connected — Contact | ETERNAL Studio' }
  ];

  let currentHash = window.location.hash || '';

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const match = sections.find((s) => s.id === entry.target.id);
        if (match && currentHash !== match.hash) {
          currentHash = match.hash;
          const targetUrl = match.hash ? `${window.location.pathname}${match.hash}` : window.location.pathname;
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', targetUrl);
          }
          if (match.title) {
            document.title = match.title;
          }
        }
      }
    });
  }, {
    rootMargin: '-30% 0px -40% 0px',
    threshold: 0.1
  });

  sections.forEach((s) => {
    const el = document.getElementById(s.id);
    if (el) observer.observe(el);
  });
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
