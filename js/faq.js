/**
 * ETERNAL STUDIO — MINIMAL FAQ DIRECTORY MODULE
 * Handles 2-column architectural accordion expansion,
 * aria accessibility states, and global Expand/Collapse All toggle.
 */

export function initFAQ() {
  const dirSection = document.querySelector('.faq-directory-section');
  if (!dirSection) return;

  const items = dirSection.querySelectorAll('.faq-dir-item');
  const toggleAllBtn = dirSection.querySelector('.faq-dir-toggle-all');
  const toggleText = toggleAllBtn ? toggleAllBtn.querySelector('.toggle-text') : null;
  const toggleIcon = toggleAllBtn ? toggleAllBtn.querySelector('.toggle-icon') : null;

  const updateToggleAllButton = () => {
    if (!toggleAllBtn || !toggleText) return;
    const allOpen = Array.from(items).every((item) => item.classList.contains('is-open'));
    if (allOpen) {
      toggleText.textContent = 'COLLAPSE ALL';
      if (toggleIcon) toggleIcon.textContent = '−';
      toggleAllBtn.setAttribute('aria-expanded', 'true');
    } else {
      toggleText.textContent = 'EXPAND ALL';
      if (toggleIcon) toggleIcon.textContent = '+';
      toggleAllBtn.setAttribute('aria-expanded', 'false');
    }
  };

  items.forEach((item) => {
    const trigger = item.querySelector('.faq-dir-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      item.classList.toggle('is-open', !isOpen);
      trigger.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
      updateToggleAllButton();
    });
  });

  if (toggleAllBtn) {
    toggleAllBtn.addEventListener('click', () => {
      const allOpen = Array.from(items).every((item) => item.classList.contains('is-open'));
      const shouldOpen = !allOpen;

      items.forEach((item) => {
        item.classList.toggle('is-open', shouldOpen);
        const trigger = item.querySelector('.faq-dir-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
      });

      updateToggleAllButton();
    });
  }
}
