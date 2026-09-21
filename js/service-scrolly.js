/**
 * ETERNAL STUDIO — SERVICE ORBITAL SCROLLYTELLING
 * Pinned GSAP ScrollTrigger section featuring an interactive swinging
 * orbital dial on the left, crossfading narrative copy in the center,
 * and real-time architectural telemetry console on the right.
 */

export function initServiceScrolly() {
  const section = document.querySelector('.service-scrolly-section');
  if (!section) return;

  const wheel = document.getElementById('service-orbit-wheel');
  const nodes = section.querySelectorAll('.orbit-node');
  const panels = section.querySelectorAll('.scrolly-panel');
  const screens = section.querySelectorAll('.console-screen');
  const phaseTag = document.getElementById('console-phase-tag');

  if (!wheel || !nodes.length || !panels.length) return;

  let currentPhase = 1;
  let scrollTriggerInstance = null;

  // Position nodes along orbital arc: 0deg, 40deg, 80deg, 120deg
  const nodeAngles = [0, 40, 80, 120];
  const maxRotation = 120; // wheel rotates from 0deg to -120deg

  const isDesktop = () => window.innerWidth >= 992;

  function setActivePhase(phaseNumber) {
    if (currentPhase === phaseNumber) return;
    currentPhase = phaseNumber;

    // 1. Update orbit nodes
    nodes.forEach((node) => {
      const p = parseInt(node.getAttribute('data-phase'), 10);
      if (p === phaseNumber) {
        node.classList.add('is-active');
      } else {
        node.classList.remove('is-active');
      }
    });

    // 2. Update narrative panels
    panels.forEach((panel) => {
      const p = parseInt(panel.getAttribute('data-panel'), 10);
      if (p === phaseNumber) {
        panel.classList.add('is-active');
      } else {
        panel.classList.remove('is-active');
      }
    });

    // 3. Update console screens
    screens.forEach((screen) => {
      const p = parseInt(screen.getAttribute('data-screen'), 10);
      if (p === phaseNumber) {
        screen.classList.add('is-active');
      } else {
        screen.classList.remove('is-active');
      }
    });

    // 4. Update console header badge
    if (phaseTag) {
      phaseTag.textContent = `PHASE 0${phaseNumber} / 04`;
    }
  }

  function setupScrollTrigger() {
    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;

    // Clean up any existing trigger
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
      scrollTriggerInstance = null;
    }

    if (!isDesktop()) {
      // Mobile / Tablet: Enable interactive tab buttons and swipe/tap
      nodes.forEach((node) => {
        node.style.transform = '';
      });
      if (wheel) wheel.style.transform = '';
      return;
    }

    // GSAP ScrollTrigger Pinning for Desktop
    scrollTriggerInstance = window.ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=240%',
      pin: true,
      anticipatePin: 1,
      scrub: 0.5,
      onUpdate: (self) => {
        const progress = self.progress;

        // Smooth swing of the wheel
        const wheelAngle = -progress * maxRotation;
        window.gsap.set(wheel, { rotation: wheelAngle });

        // Counter-rotate badges so they stay upright
        nodes.forEach((node) => {
          window.gsap.set(node, { rotation: -wheelAngle });
        });

        // Determine active phase (1 to 4)
        const totalPhases = 4;
        const rawIndex = progress * (totalPhases - 1);
        const activeIndex = Math.min(totalPhases - 1, Math.round(rawIndex));
        setActivePhase(activeIndex + 1);
      }
    });
  }

  // Click-to-jump on orbital nodes
  nodes.forEach((node) => {
    node.addEventListener('click', () => {
      const targetPhase = parseInt(node.getAttribute('data-phase'), 10);
      if (!isDesktop() || !scrollTriggerInstance) {
        setActivePhase(targetPhase);
        return;
      }

      const targetProgress = (targetPhase - 1) / 3;
      const st = scrollTriggerInstance;
      const targetScroll = st.start + targetProgress * (st.end - st.start);

      if (window.lenis) {
        window.lenis.scrollTo(targetScroll, { duration: 1 });
      } else {
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    });
  });

  // Initialize
  setupScrollTrigger();

  // Resize handler
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      setupScrollTrigger();
    }, 200);
  }, { passive: true });
}
