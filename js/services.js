/**
 * ETERNAL STUDIO — SERVICES INTERACTION MODULE
 * 1. Full-width editorial services accordion (existing section left visually untouched)
 * 2. Interactive Service Details Section (editorial showcase viewer with smooth scroll & cinematic transitions)
 */

import { getLenis } from './smooth-scroll.js';

const SERVICES_DATA = [
  {
    id: 1,
    number: "01",
    title: "Full-Service Event Management",
    description: "We manage the creative and operational requirements of your event, covering planning, creative direction, spatial design, branding, decor, logistics and on-site coordination. Our team delivers corporate events, conferences, exhibitions, product launches, brand activations and live productions.",
    image: "assets/images/services/service-03.jpg",
    imageAlt: "Full-Service Event Management & Stage Architecture",
    badge: "STAGE ARCHITECTURE • PLANNING",
    ctaText: "INQUIRE EVENT MANAGEMENT",
    ctaLink: "/contact/?service=management",
    capabilities: [
      "Event Strategy & Planning",
      "Creative Direction & Concept Development",
      "Spatial Design & Stage Architecture",
      "Event Branding & Decor",
      "Conference & Exhibition Management",
      "Product Launches & Brand Activations",
      "Logistics Coordination",
      "On-Site Event Management",
      "Printed Materials & Event Displays"
    ]
  },
  {
    id: 2,
    number: "02",
    title: "Technical Equipment & Structural Setup",
    description: "We provide technical production support for event organizers who need specialist equipment, technical expertise and on-site execution. We provide LED screens, professional sound, stage lighting, video systems, live switching, multi-camera production and live streaming, alongside staging, structural setups and custom event environments.",
    image: "assets/images/services/service-05.jpg",
    imageAlt: "Technical Equipment, Audio, Lighting & Structural Setup",
    badge: "LED SYSTEMS • PRO AUDIO • RIGGING",
    ctaText: "INQUIRE TECHNICAL PRODUCTION",
    ctaLink: "/contact/?service=technical",
    capabilities: [
      "LED Screen Systems (Sub-2mm Fine Pitch)",
      "Professional Line-Array Sound Systems",
      "Stage & Architectural Intelligent Lighting",
      "Video & Display Distribution Networks",
      "Live Switching & Vision Mixing",
      "4K Multi-Camera Production",
      "Live Streaming & Low-Latency Broadcast",
      "Ground-Support Stage & Structural Truss Setup",
      "Certified Technical Installation & Operation",
      "Custom Fabrication & Stage Backdrops"
    ]
  },
  {
    id: 3,
    number: "03",
    title: "Equipment Rentals (Dry Hire)",
    description: "Our dry hire service is designed for companies, event managers and technical teams that already have their own crew but require professional event equipment. Our rental offering includes LED screens, sound systems, stage lighting, video equipment, staging and other event production equipment, available according to your event requirements.",
    image: "assets/images/services/service-06.jpg",
    imageAlt: "Equipment Rentals, Sound, Lighting & Staging Hardware",
    badge: "CERTIFIED INVENTORY • MODULAR GEAR",
    ctaText: "INQUIRE EQUIPMENT RENTALS",
    ctaLink: "/contact/?service=rentals",
    capabilities: [
      "High-Definition LED Screen Rental",
      "Professional Audio Consoles & Wireless Mics",
      "Line-Array Speaker Systems & Subwoofers",
      "Moving Heads, Profile & Wash Lighting Fixtures",
      "4K Production Switchers & Recorders",
      "Modular Staging & Ground-Support Trussing",
      "Power Distribution & Signal Management",
      "Pre-Configured Technical Equipment Packages",
      "Flight-Cased Preparation & Warehouse Testing",
      "Flexible Short & Long-Term Dry Hire Solutions"
    ]
  }
];

export function initServices() {
  initServiceStack();
}

/**
 * EXPANDABLE STACKED SERVICE SHOWCASE
 * - Service 01 expanded by default; 02 & 03 collapsed.
 * - Smooth in-place 700-1000ms cubic-bezier(0.16, 1, 0.3, 1) drawer animation.
 * - Image reveal: opacity: 0 -> 1, scale: 1.04 -> 1, translateY: 20px -> 0.
 * - ZERO auto-scroll: all scrolling is 100% managed by the user.
 */
export function initServiceStack() {
  const section = document.querySelector('.service-stack-section');
  if (!section) return;

  const items = section.querySelectorAll('.service-stack-item');
  if (!items.length) return;

  let activeId = 1;

  function openItem(targetId) {
    if (targetId === activeId) return;

    const currentItem = section.querySelector(`.service-stack-item[data-service-id="${activeId}"]`);
    const nextItem = section.querySelector(`.service-stack-item[data-service-id="${targetId}"]`);
    if (!nextItem) return;

    activeId = targetId;

    // 1. Smoothly shrink previously expanded item
    if (currentItem && currentItem !== nextItem) {
      const curHeader = currentItem.querySelector('.service-stack-header');
      const curIcon = currentItem.querySelector('.service-stack-toggle-icon');
      if (curHeader) curHeader.setAttribute('aria-expanded', 'false');
      if (curIcon) curIcon.textContent = '+';
      currentItem.classList.remove('is-expanded');
    }

    // 2. Smoothly expand target item
    nextItem.classList.add('is-expanded');
    const nextHeader = nextItem.querySelector('.service-stack-header');
    const nextIcon = nextItem.querySelector('.service-stack-toggle-icon');
    if (nextHeader) nextHeader.setAttribute('aria-expanded', 'true');
    if (nextIcon) nextIcon.textContent = '−';

    // 3. Optional: If header is scrolled out of view above top, gently bring it into view
    const rect = nextItem.getBoundingClientRect();
    const navHeight = 90;
    if (rect.top < navHeight) {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      const targetScroll = currentScroll + rect.top - navHeight;
      if (window.lenis) {
        window.lenis.scrollTo(targetScroll, { duration: 0.6 });
      } else {
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    }

    // 4. Refresh ScrollTrigger after transition finishes
    if (typeof window.ScrollTrigger !== 'undefined') {
      setTimeout(() => {
        window.ScrollTrigger.refresh();
      }, 720);
    }
  }

  function toggleItem(targetId) {
    if (targetId === activeId) {
      // Keep open: always maintain an active open service for the user
      return;
    }
    openItem(targetId);
  }

  items.forEach((item) => {
    const serviceId = parseInt(item.getAttribute('data-service-id'), 10);
    const header = item.querySelector('.service-stack-header');
    const toggleWrap = item.querySelector('.service-stack-toggle-wrap');
    if (!header) return;

    function handleClick(e) {
      if (e.target.closest('.service-stack-cta-btn')) return;
      e.preventDefault();
      e.stopPropagation();
      toggleItem(serviceId);
    }

    header.addEventListener('click', handleClick);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(e);
      }
    });

    if (toggleWrap) {
      toggleWrap.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleItem(serviceId);
      });
    }
  });
}
