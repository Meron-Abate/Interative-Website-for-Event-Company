/**
 * ETERNAL STUDIO — THEME ENGINE
 * Dark / Light Mode with localStorage persistence & system preference fallback
 */

const STORAGE_KEY = 'eternal-theme-preference';

export function initTheme() {
  const toggleBtn = document.querySelector('[data-theme-toggle]');
  
  // Determine initial theme:
  // 1. Saved preference in localStorage
  // 2. System preference
  // 3. Default to 'dark'
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  let currentTheme = 'dark';

  if (savedTheme === 'light' || savedTheme === 'dark') {
    currentTheme = savedTheme;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    currentTheme = 'light';
  }

  applyTheme(currentTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      localStorage.setItem(STORAGE_KEY, newTheme);
    });
  }

  // Listen for system changes if user hasn't set an explicit preference
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? 'light' : 'dark');
      }
    });
  }
}

export function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  updateToggleIcon(theme);

  // Dispatch event for any canvas/media that reacts to theme shifts
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

function updateToggleIcon(theme) {
  const toggleBtns = document.querySelectorAll('[data-theme-toggle]');
  toggleBtns.forEach((btn) => {
    const isLight = theme === 'light';
    btn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    btn.setAttribute('title', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    
    btn.innerHTML = isLight
      ? `<svg class="theme-toggle-icon" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>`
      : `<svg class="theme-toggle-icon" viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.29 1.29c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.29 1.29c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-1.29-1.29zm1.41-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.29 1.29c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.29-1.29zM7.05 18.36l-1.29 1.29a.996.996 0 1 0 1.41 1.41l1.29-1.29c.39-.39.39-1.02 0-1.41-.38-.38-1.02-.38-1.41 0z"/></svg>`;
  });
}
