/**
 * pages/admin/login.js
 */

document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in as admin
  if (Auth.isLoggedIn() && Auth.hasRole('admin')) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form      = document.getElementById('login-form');
  const loginBtn  = document.getElementById('login-btn');
  const errorEl   = document.getElementById('error-msg');
  const toggleBtn = document.getElementById('toggle-password');
  const pwdInput  = document.getElementById('password');

  if (toggleBtn && pwdInput) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = pwdInput.type === 'password';
      pwdInput.type = isPassword ? 'text' : 'password';
      toggleBtn.textContent = isPassword ? '🙈' : '👁️';
    });
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      showError('Please enter both username and password.');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Authenticating...';

    const res = await Auth.login(username, password);

    if (res.success) {
      const user = Auth.getUser();
      if (user.role !== 'admin') {
        Auth.clearSession();
        showError('Access denied. This panel is for administrators only.');
        loginBtn.disabled = false;
        loginBtn.textContent = '🔐 Secure Login';
        return;
      }

      Utils.showToast('Welcome, Admin!', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
    } else {
      showError(res.message || 'Invalid credentials.');
      loginBtn.disabled = false;
      loginBtn.textContent = '🔐 Secure Login';
    }
  });
});
