/**
 * ETERNAL STUDIO — SERVICES INTERACTION MODULE
 * Desktop pinned scroll sequence & cursor-lagging preview image
 */

export function initServices() {
  const servicesSection = document.querySelector('.services-section');
  if (!servicesSection) return;

  const serviceItems = servicesSection.querySelectorAll('.service-item');
  const previewImages = servicesSection.querySelectorAll('.service-preview-img');
  const follower = document.querySelector('.service-cursor-follower');

  const isDesktop = window.innerWidth >= 992 && !window.matchMedia('(pointer: coarse)').matches;

  // 1. Desktop Cursor-Following Preview Image with GSAP quickTo
  if (isDesktop && follower && typeof window.gsap !== 'undefined') {
    const xTo = window.gsap.quickTo(follower, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = window.gsap.quickTo(follower, 'y', { duration: 0.35, ease: 'power3.out' });

    window.addEventListener('mousemove', (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    });

    serviceItems.forEach((item) => {
      item.addEventListener('mouseenter', () => {
        const index = item.getAttribute('data-service-index');
        const imgSrc = item.getAttribute('data-service-image');
        
        if (follower && imgSrc) {
          const followerImg = follower.querySelector('img');
          if (followerImg) followerImg.src = imgSrc;
          follower.style.opacity = '1';
          follower.style.transform = 'translate(-50%, -50%) scale(1)';
        }

        activateService(index);
      });

      item.addEventListener('mouseleave', () => {
        if (follower) {
          follower.style.opacity = '0';
          follower.style.transform = 'translate(-50%, -50%) scale(0.85)';
        }
      });
    });
  } else {
    // Touch / Mobile: click/tap to toggle active state
    serviceItems.forEach((item) => {
      item.addEventListener('click', () => {
        const index = item.getAttribute('data-service-index');
        activateService(index);
      });
    });
  }

  function activateService(index) {
    serviceItems.forEach((item) => {
      if (item.getAttribute('data-service-index') === index) {
        item.classList.add('is-active');
      } else {
        item.classList.remove('is-active');
      }
    });

    previewImages.forEach((img) => {
      if (img.getAttribute('data-preview-index') === index) {
        img.classList.add('is-active');
      } else {
        img.classList.remove('is-active');
      }
    });
  }

  // 2. Desktop Scroll-Driven Pinning with GSAP ScrollTrigger
  if (isDesktop && typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    window.ScrollTrigger.create({
      trigger: servicesSection,
      start: 'top top',
      end: `+=${serviceItems.length * 300}`,
      pin: true,
      anticipatePin: 1,
      scrub: 0.5,
      onUpdate: (self) => {
        const step = Math.min(
          serviceItems.length - 1,
          Math.floor(self.progress * serviceItems.length)
        );
        activateService(String(step + 1));
      }
    });
  }
}
