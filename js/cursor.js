/**
 * ETERNAL STUDIO — CUSTOM MAGNETIC CURSOR
 * Dual-element follower with contextual hover states
 */

export function initCursor() {
  // Only initialize on desktop with fine pointer (no touch screens)
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (!isFinePointer || window.innerWidth < 992) {
    return;
  }

  // Check if cursor elements already exist
  let dot = document.querySelector('.cursor-dot');
  let ring = document.querySelector('.cursor-ring');

  if (!dot) {
    dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);
  }

  if (!ring) {
    ring = document.createElement('div');
    ring.className = 'cursor-ring';
    ring.innerHTML = '<span class="cursor-ring-text">VIEW</span>';
    document.body.appendChild(ring);
  }

  const ringText = ring.querySelector('.cursor-ring-text');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let isMoving = false;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    document.body.classList.remove('cursor-hidden');

    // Immediate sharp dot positioning
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;

    if (!isMoving) {
      isMoving = true;
      requestAnimationFrame(renderRing);
    }
  });

  document.addEventListener('mouseleave', () => {
    document.body.classList.add('cursor-hidden');
  });

  function renderRing() {
    // Smooth trailing inertia for the outer ring
    const factor = 0.18;
    ringX += (mouseX - ringX) * factor;
    ringY += (mouseY - ringY) * factor;

    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

    const diffX = Math.abs(mouseX - ringX);
    const diffY = Math.abs(mouseY - ringY);

    if (diffX > 0.1 || diffY > 0.1) {
      requestAnimationFrame(renderRing);
    } else {
      isMoving = false;
    }
  }

  // Contextual Hover States Delegation
  document.addEventListener('mouseover', (e) => {
    const target = e.target;
    
    // View state on project cards / case study links
    const projectCard = target.closest('[data-cursor="view"], .portfolio-card, .work-archive-card, .case-next-project');
    if (projectCard) {
      setCursorState('cursor--view', 'VIEW');
      return;
    }

    // Drag state on horizontal exhibition
    const dragArea = target.closest('[data-cursor="drag"], .portfolio-horizontal-wrapper');
    if (dragArea) {
      setCursorState('cursor--drag', 'DRAG');
      return;
    }

    // Image state
    const imageElement = target.closest('[data-cursor="image"], .gallery-item');
    if (imageElement) {
      setCursorState('cursor--image', 'LOOK');
      return;
    }

    // Link state on interactive anchors / buttons / toggles
    const linkElement = target.closest('a, button, .service-item, input, textarea, select, [data-cursor="link"]');
    if (linkElement) {
      setCursorState('cursor--link', '');
      return;
    }

    // Default state
    resetCursorState();
  });

  function setCursorState(className, text) {
    document.body.classList.remove('cursor--link', 'cursor--view', 'cursor--drag', 'cursor--image');
    document.body.classList.add(className);
    if (ringText) {
      ringText.textContent = text || '';
    }
  }

  function resetCursorState() {
    document.body.classList.remove('cursor--link', 'cursor--view', 'cursor--drag', 'cursor--image');
    if (ringText) {
      ringText.textContent = '';
    }
  }
}
