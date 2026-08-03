/**
 * pages/contact/contact.js
 */

document.addEventListener('DOMContentLoaded', () => {
  const form      = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const successEl = document.getElementById('success-msg');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name    = document.getElementById('contact-name').value.trim();
    const phone   = document.getElementById('contact-phone').value.trim();
    const subject = document.getElementById('contact-subject').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name) {
      Utils.showToast('Please enter your name', 'error');
      return;
    }
    if (!message) {
      Utils.showToast('Please write a message', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const res = await API.post('/contact', { name, phone, subject, message });

      if (res.success) {
        successEl.classList.remove('hidden');
        form.reset();
        Utils.showToast('Message sent successfully!', 'success');
        setTimeout(() => successEl.classList.add('hidden'), 5000);
      } else {
        Utils.showToast(res.message || 'Failed to send message', 'error');
      }
    } catch {
      Utils.showToast('Network error. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
});
