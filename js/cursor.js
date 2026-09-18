/**
 * ETERNAL STUDIO — CONCENTRIC CIRCLE CURSOR
 * 1:1 Synchronous positioning with zero drift or lag
 */

export function initCursor() {
  // Only initialize on desktop with fine pointer (no touch screens)
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (!isFinePointer || window.innerWidth < 992) {
    return;
  }

  // Remove any legacy spotlight element from DOM
  const oldSpotlight = document.querySelector('.cursor-spotlight');
  if (oldSpotlight) oldSpotlight.remove();

  // Create or retrieve cursor elements
  let dot = document.querySelector('.cursor-dot');
  if (!dot) {
    dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);
  }

  let ring = document.querySelector('.cursor-ring');
  if (!ring) {
    ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(ring);
  }

  // Pure circle: remove any inner camera/reticle HTML elements
  ring.innerHTML = '';

  // Start hidden and positioned offscreen until user interacts with pointer
  document.body.classList.add('cursor-hidden');
  const offscreen = 'translate3d(-100px, -100px, 0) translate(-50%, -50%)';
  dot.style.transform = offscreen;
  ring.style.transform = offscreen;

  window.addEventListener('mousemove', (e) => {
    document.body.classList.remove('cursor-hidden');
    const transformStr = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    dot.style.transform = transformStr;
    ring.style.transform = transformStr;
  }, { passive: true });

  window.addEventListener('mousedown', () => {
    document.body.classList.add('cursor-pressed');
  });

  window.addEventListener('mouseup', () => {
    document.body.classList.remove('cursor-pressed');
  });

  document.addEventListener('mouseleave', () => {
    document.body.classList.add('cursor-hidden');
  });

  // Contextual Hover States Delegation
  document.addEventListener('mouseover', (e) => {
    const target = e.target;
    
    // View state on project cards / case study links
    const projectCard = target.closest('[data-cursor="view"], .portfolio-card, .work-archive-card, .case-next-project');
    if (projectCard) {
      setCursorState('cursor--view');
      return;
    }

    // Drag state on horizontal exhibition
    const dragArea = target.closest('[data-cursor="drag"], .portfolio-horizontal-wrapper');
    if (dragArea) {
      setCursorState('cursor--drag');
      return;
    }

    // Link state on interactive anchors / buttons / toggles
    const linkElement = target.closest('a, button, .service-item, input, textarea, select, [data-cursor="link"]');
    if (linkElement) {
      setCursorState('cursor--link');
      return;
    }

    // Default state
    resetCursorState();
  });

  function setCursorState(className) {
    document.body.classList.remove('cursor--link', 'cursor--view', 'cursor--drag');
    document.body.classList.add(className);
  }

  function resetCursorState() {
    document.body.classList.remove('cursor--link', 'cursor--view', 'cursor--drag');
  }
}
