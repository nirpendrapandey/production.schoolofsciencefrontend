/**
 * assets/js/utils.js
 * Shared utility functions used across all pages.
 */

const Utils = {
  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {number} duration - ms before auto-dismiss
   */
  showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /** Show full-screen loading overlay */
  showLoader(text = 'Loading...') {
    let loader = document.getElementById('page-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'page-loader';
      loader.className = 'page-loader';
      loader.innerHTML = `
        <div class="spinner"></div>
        <p id="loader-text" style="color:var(--color-text-secondary);font-size:var(--font-size-sm);font-weight:500;">${text}</p>
      `;
      document.body.appendChild(loader);
    }
    loader.classList.remove('hidden');
    document.getElementById('loader-text').textContent = text;
  },

  /** Hide loading overlay */
  hideLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) loader.classList.add('hidden');
  },

  /**
   * Format a date string into readable format.
   * @param {string|Date} date
   * @param {boolean} includeTime
   */
  formatDate(date, includeTime = false) {
    if (!date) return '—';
    const d = new Date(date);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return d.toLocaleDateString('en-IN', options);
  },

  /**
   * Format due date with relative urgency indicator.
   */
  formatDueDate(date) {
    const d    = new Date(date);
    const now  = new Date();
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

    const formatted = this.formatDate(date);
    if (diff < 0)  return `<span class="badge badge-error">Overdue: ${formatted}</span>`;
    if (diff === 0) return `<span class="badge badge-warning">Due Today</span>`;
    if (diff <= 2)  return `<span class="badge badge-warning">Due in ${diff} day${diff > 1 ? 's' : ''}</span>`;
    return `<span class="badge badge-primary">Due: ${formatted}</span>`;
  },

  /**
   * Simple debounce.
   */
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  /**
   * Truncate text with ellipsis.
   */
  truncate(text, maxLength = 80) {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  },

  /**
   * Get greeting based on current hour.
   */
  getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  },

  /**
   * Capitalize first letter of each word.
   */
  titleCase(str) {
    if (!str) return '';
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  },

  /**
   * Resolve upload URL (handles relative paths from backend).
   */
  resolveUrl(path) {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('.') || path.startsWith('/assets') || path.startsWith('assets')) return path;
    return `https://production-schoolofscience-backend.onrender.com${path}`;
  },

  /**
   * Get initials from a name for avatar fallback.
   */
  getInitials(name = '') {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  },
};

window.Utils = Utils;
