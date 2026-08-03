// Teacher login uses the same logic as student login
// The shared login.js auto-detects the role from URL path
// Just copy the student login.js here or use a shared script path
document.addEventListener('DOMContentLoaded', () => {
  const isTeacher = window.location.pathname.includes('/teacher/');
  const role = isTeacher ? 'teacher' : 'student';
  const dashboardUrl = isTeacher ? 'dashboard.html' : '../student/dashboard.html';

  if (Auth.isLoggedIn() && Auth.hasRole(role)) {
    window.location.href = dashboardUrl;
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
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }

  function hideError() {
    if (!errorEl) return;
    errorEl.style.display = 'none';
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      showError('Please enter both username and password.');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    const res = await Auth.login(username, password);

    if (res.success) {
      const user = Auth.getUser();
      if (user.role !== role && user.role !== 'admin') {
        Auth.clearSession();
        showError(`This login is for ${role}s only.`);
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login as Teacher';
        return;
      }

      Utils.showToast(`Welcome, ${user.name.split(' ')[0]}! 🎉`, 'success');
      setTimeout(() => {
        if (user.role === 'admin') {
          window.location.href = '../admin/dashboard.html';
        } else {
          window.location.href = dashboardUrl;
        }
      }, 500);
    } else {
      showError(res.message || 'Invalid username or password.');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login as Teacher';
    }
  });
});
