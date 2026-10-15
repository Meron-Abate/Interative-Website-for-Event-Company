/**
 * ETERNAL STUDIO — SERVICES (expanding vertical panels)
 * Each service owns a full-height column. Hovering (mouse), focusing (keyboard) or
 * tapping (touch) a column widens it to reveal the photo and full details; the
 * others narrow to their title. One panel is always open.
 */

export function initServicePanels() {
  const row = document.querySelector('[data-svp]');
  if (!row) return;

  const panels = [...row.querySelectorAll('.svp')];
  if (!panels.length) return;

  let active = Math.max(0, panels.findIndex((p) => p.classList.contains('is-active')));
  let hoverTimer = null;

  function activate(index) {
    if (index === active) return;
    active = index;
    panels.forEach((panel, i) => {
      const on = i === index;
      panel.classList.toggle('is-active', on);
      panel.querySelector('.svp-trigger').setAttribute('aria-expanded', String(on));
    });
  }

  panels.forEach((panel, i) => {
    const trigger = panel.querySelector('.svp-trigger');

    // Mouse: expand on hover, with a short intent delay so sweeping across doesn't flicker
    panel.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => activate(i), 90);
    });
    panel.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') clearTimeout(hoverTimer);
    });

    // Keyboard and touch
    trigger.addEventListener('click', () => activate(i));
    trigger.addEventListener('focus', () => activate(i));
  });
}
