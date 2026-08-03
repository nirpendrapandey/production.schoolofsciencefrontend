/**
 * assets/js/components.js
 * Injects shared header and bottom navigation into every page.
 * Include this script on every page to avoid copy-pasting HTML.
 */

const Components = {
  /**
   * School info constants
   */
  SCHOOL: {
    name:      'School Of Science',
    principal: 'Shri Ramakant Pandey',
    tagline:   'Education for Every Child',
    logo:      '🏫',
  },

  /**
   * Render and inject the header into #app-header element.
   * @param {object} options
   * @param {boolean} options.showBack - show back button instead of logo
   * @param {string}  options.title    - page title (when showBack is true)
   */
  renderHeader(options = {}) {
    const el = document.getElementById('app-header');
    if (!el) return;

    const logoUrl = this._getAssetPath('assets/logo.png');

    if (options.showBack) {
      el.innerHTML = `
        <header class="app-header">
          <div class="container">
            <a href="javascript:history.back()" class="back-btn" id="back-btn">&#8592;</a>
            <div class="header-info">
              <div class="header-school-name">${options.title || this.SCHOOL.name}</div>
              <div class="header-principal">${this.SCHOOL.name}</div>
            </div>
          </div>
        </header>
      `;
    } else {
      el.innerHTML = `
        <header class="app-header">
          <div class="container">
            <img src="${logoUrl}" alt="School Logo" class="header-logo" onerror="this.outerHTML='<div class=&quot;header-logo-placeholder&quot;>🏫</div>';" />
            <div class="header-info">
              <div class="header-school-name">${this.SCHOOL.name}</div>
              <div class="header-tagline">${this.SCHOOL.tagline}</div>
            </div>
          </div>
        </header>
      `;
    }
  },

  /**
   * Render and inject the bottom navigation bar.
   * @param {string} activePage - 'home' | 'homework' | 'notices' | 'profile'
   */
  renderBottomNav(activePage = 'home') {
    const el = document.getElementById('bottom-nav');
    if (!el) return;

    const isStudent = (() => {
      try {
        const u = JSON.parse(localStorage.getItem('sos_user') || 'null');
        return u && u.role === 'student';
      } catch { return false; }
    })();

    const navItems = [
      { id: 'home',     icon: '🏠', label: 'Home',     href: '/index.html' },
      { id: 'homework', icon: '📚', label: 'Homework',  href: '/pages/homework/index.html' },
      { id: 'notices',  icon: '📢', label: 'Notices',   href: '/pages/notices/index.html' },
      ...(isStudent ? [{ id: 'fees', icon: '💰', label: 'Fees', href: '/pages/student/dashboard.html#fees' }] : []),
      { id: 'profile',  icon: '👤', label: 'Profile',   href: this._getProfileLink() },
    ];

    el.innerHTML = `
      <nav class="bottom-nav" role="navigation" aria-label="Main navigation">
        <div class="bottom-nav-container">
          ${navItems.map((item) => `
            <a href="${item.href}"
               class="bottom-nav-item ${activePage === item.id ? 'active' : ''}"
               id="nav-${item.id}"
               aria-label="${item.label}">
              <span class="bottom-nav-icon">${item.icon}</span>
              <span class="bottom-nav-label">${item.label}</span>
            </a>
          `).join('')}
        </div>
      </nav>
    `;
  },

  /** Determine profile link based on logged-in user's role */
  _getProfileLink() {
    try {
      const user = JSON.parse(localStorage.getItem('sos_user') || 'null');
      if (!user) return '/pages/student/login.html';
      if (user.role === 'student') return '/pages/student/dashboard.html';
      if (user.role === 'teacher') return '/pages/teacher/dashboard.html';
      if (user.role === 'admin')   return '/pages/admin/dashboard.html';
    } catch (_) {}
    return '/pages/student/login.html';
  },

  /**
   * Render a stat card used in dashboards.
   */
  statCard(icon, label, value, colorClass = '') {
    return `
      <div class="stat-card ${colorClass}">
        <div class="stat-icon">${icon}</div>
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
      </div>
    `;
  },

  /**
   * Render faculty card HTML.
   */
  facultyCard(member) {
    const initials = Utils.getInitials(member.name);
    const photoUrl = member.photoUrl ? Utils.resolveUrl(member.photoUrl) : null;

    return `
      <div class="faculty-card card">
        <div class="faculty-photo">
          ${photoUrl
            ? `<img src="${photoUrl}" alt="${member.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
            : ''}
          <div class="faculty-initials" style="${photoUrl ? 'display:none' : ''}">${initials}</div>
        </div>
        <div class="faculty-info">
          <div class="faculty-name">${member.name}</div>
          <div class="faculty-subject">${member.subject}</div>
          <div class="faculty-qual">${member.qualification}</div>
        </div>
      </div>
    `;
  },

  /** Resolves relative path to assets dynamically */
  _getAssetPath(subPath) {
    const isSubpage = window.location.pathname.includes('/pages/') || window.location.href.includes('/pages/');
    const prefix = isSubpage ? '../../' : '';
    return prefix + subPath;
  }
};

window.Components = Components;
