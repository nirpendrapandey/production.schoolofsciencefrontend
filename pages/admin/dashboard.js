/**
 * pages/admin/dashboard.js
 * Full admin dashboard logic.
 */

// ── Auth Guard ────────────────────────────────────────────────────────────────
if (!Auth.requireAuth('admin', 'login.html')) {
  throw new Error('Not authorized');
}

const user = Auth.getUser();
if (user) {
  document.getElementById('admin-avatar').textContent = Utils.getInitials(user.name);
}

function doLogout() {
  if (confirm('Logout from Admin Panel?')) {
    Auth.logout('../../index.html');
  }
}
window.doLogout = doLogout;

// ── Section Navigation ────────────────────────────────────────────────────────
function showSection(sectionId) {
  document.querySelectorAll('.admin-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));

  const section = document.getElementById(`section-${sectionId}`);
  if (section) section.classList.add('active');

  const btn = document.querySelector(`[data-section="${sectionId}"]`);
  if (btn) btn.classList.add('active');

  // Load data for section
  const loaders = {
    dashboard:  loadDashboardStats,
    students:   loadStudents,
    teachers:   loadTeachers,
    homework:   loadHomework,
    results:    loadResults,
    notices:    loadNotices,
    gallery:    loadGallery,
    faculty:    loadFaculty,
    facilities: loadFacilities,
    messages:   loadMessages,
    admitcard:  loadAdmitCardConfig,
  };

  if (loaders[sectionId]) loaders[sectionId]();
}

document.querySelectorAll('.sidebar-item').forEach(btn => {
  btn.addEventListener('click', () => showSection(btn.dataset.section));
});

function toggleAddForm(formId) {
  const form = document.getElementById(formId);
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}
window.toggleAddForm = toggleAddForm;

// ── Dashboard Stats ───────────────────────────────────────────────────────────
async function loadDashboardStats() {
  try {
    const res = await API.get('/dashboard');
    if (!res.success) return;

    const { counts, recentHomework, recentNotices } = res.data;

    document.getElementById('stat-students').textContent   = counts.totalStudents;
    document.getElementById('stat-teachers').textContent   = counts.totalTeachers;
    document.getElementById('stat-homework').textContent   = counts.totalHomework;
    document.getElementById('stat-notices').textContent    = counts.totalNotices;
    document.getElementById('stat-today-att').textContent  = counts.todayAttendance;

    // Recent homework
    const rhContainer = document.getElementById('recent-homework');
    rhContainer.innerHTML = recentHomework.length > 0
      ? recentHomework.map(hw => `
          <div class="activity-item">
            <div class="activity-dot"></div>
            <span><strong>${hw.title}</strong> – Class ${hw.class}</span>
            <span class="activity-time">${Utils.formatDate(hw.createdAt)}</span>
          </div>`).join('')
      : '<div style="padding:20px;text-align:center;color:var(--color-text-muted);">No homework yet</div>';

    // Recent notices
    const rnContainer = document.getElementById('recent-notices');
    rnContainer.innerHTML = recentNotices.length > 0
      ? recentNotices.map(n => `
          <div class="activity-item">
            <div class="activity-dot" style="background:var(--color-primary);"></div>
            <span>${n.title}</span>
            <span class="activity-time">${Utils.formatDate(n.createdAt)}</span>
          </div>`).join('')
      : '<div style="padding:20px;text-align:center;color:var(--color-text-muted);">No notices yet</div>';
  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

// ── Students ──────────────────────────────────────────────────────────────────
let allStudents = [];

async function loadStudents() {
  const cls = document.getElementById('student-class-filter')?.value || '';
  const url = cls ? `/users?role=student&class=${cls}` : '/users?role=student';
  try {
    const res = await API.get(url);
    allStudents = res.success ? res.data : [];
    renderStudentsTable(allStudents);
  } catch { renderStudentsTable([]); }
}

function filterStudents() {
  const q = (document.getElementById('student-search')?.value || '').toLowerCase();
  const filtered = allStudents.filter(s => s.name.toLowerCase().includes(q));
  renderStudentsTable(filtered);
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('students-table-body');
  if (!tbody) return;
  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--color-text-muted);">No students found</td></tr>';
    return;
  }
  tbody.innerHTML = students.map(s => `
    <tr>
      <td><strong>${s.name}</strong></td>
      <td>${s.rollNumber || '—'}</td>
      <td>${s.class ? `Class ${s.class}` : '—'}</td>
      <td>${s.fatherName || '—'}</td>
      <td>${s.phone || '—'}</td>
      <td><span class="badge badge-${s.isActive ? 'success' : 'error'}">${s.isActive ? 'Active' : 'Inactive'}</span></td>
      <td style="display:flex;gap:6px;">
        <button class="table-action-btn tbl-toggle" onclick="toggleUser('${s._id}', this)">
          ${s.isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button class="table-action-btn tbl-delete" onclick="deleteUser('${s._id}')">Delete</button>
      </td>
    </tr>`).join('');
}



// ── Teachers ──────────────────────────────────────────────────────────────────
async function loadTeachers() {
  try {
    const res = await API.get('/users?role=teacher');
    const teachers = res.success ? res.data : [];
    const tbody = document.getElementById('teachers-table-body');
    if (!tbody) return;
    if (teachers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--color-text-muted);">No teachers found. Click "+ Add Teacher" to add one.</td></tr>';
      return;
    }
    tbody.innerHTML = teachers.map(t => `
      <tr>
        <td><strong>${t.name}</strong></td>
        <td>${t.username}</td>
        <td>${t.assignments?.classTeacherOf ? `<span class="badge badge-success">Class ${t.assignments.classTeacherOf}</span>` : '<span style="color:var(--color-text-muted)">None</span>'}</td>
        <td style="max-width:180px;white-space:normal;font-size:12px;">${
          t.assignments?.teachingAssignments?.length > 0 
            ? t.assignments.teachingAssignments.map(a => `<b>C${a.class}:</b> ${a.subject}`).join(', ')
            : '—'
        }</td>
        <td>${t.phone || '—'}</td>
        <td><span class="badge badge-${t.isActive ? 'success' : 'error'}">${t.isActive ? 'Active' : 'Inactive'}</span></td>
        <td style="display:flex;gap:6px;">
          <button class="table-action-btn tbl-toggle" onclick="toggleUser('${t._id}', this)">
            ${t.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button class="table-action-btn tbl-delete" onclick="deleteUser('${t._id}')">Delete</button>
        </td>
      </tr>`).join('');
  } catch {}
}

// ── Dynamic Assignments Logic ────────────────────────────────────────────────
window.addTeachingAssignmentRow = function() {
  const container = document.getElementById('teaching-assignments-container');
  const row = document.createElement('div');
  row.className = 'teaching-assignment-row';
  row.style.display = 'flex';
  row.style.gap = '10px';
  row.style.marginBottom = '10px';
  row.innerHTML = `
    <select class="form-control ta-class" required style="width:120px;">
      <option value="">Class</option>
      ${[1,2,3,4,5,6,7,8,9,10,11,12].map(c => `<option value="${c}">${c}</option>`).join('')}
    </select>
    <input type="text" class="form-control ta-subject" placeholder="Subject (e.g. Maths)" required style="flex:1;" />
    <button type="button" class="btn btn-outline" style="color:var(--color-error);border-color:var(--color-error);" onclick="this.parentElement.remove()">X</button>
  `;
  container.appendChild(row);
};

document.getElementById('add-teacher-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('add-teacher-btn');
  btn.disabled = true; btn.textContent = 'Adding...';

  // Gather teaching assignments
  const assignmentRows = document.querySelectorAll('.teaching-assignment-row');
  const teachingAssignments = Array.from(assignmentRows).map(row => ({
    class: row.querySelector('.ta-class').value,
    subject: row.querySelector('.ta-subject').value.trim()
  }));

  const res = await API.post('/users', {
    name:          document.getElementById('t-name').value.trim(),
    username:      document.getElementById('t-username').value.trim(),
    password:      document.getElementById('t-password').value,
    role:          'teacher',
    classTeacherOf: document.getElementById('t-class-head').value || null,
    teachingAssignments: JSON.stringify(teachingAssignments),
    qualification: document.getElementById('t-qual').value.trim(),
    phone:         document.getElementById('t-phone').value.trim(),
  });

  if (res.success) {
    Utils.showToast('✅ Teacher added successfully!', 'success');
    document.getElementById('add-teacher-form').reset();
    document.getElementById('teaching-assignments-container').innerHTML = '';
    toggleAddForm('teacher-add-form');
    loadTeachers();
  } else {
    Utils.showToast(res.message || 'Failed to add teacher', 'error');
  }
  btn.disabled = false; btn.textContent = '✅ Add Teacher';
});

// ── Shared user actions ───────────────────────────────────────────────────────
async function toggleUser(id, btn) {
  const res = await API.patch(`/users/${id}/toggle-active`);
  if (res.success) {
    Utils.showToast(res.message, 'success');
    loadStudents(); loadTeachers();
  } else {
    Utils.showToast(res.message || 'Error', 'error');
  }
}

async function deleteUser(id) {
  if (!confirm('Permanently delete this user? This cannot be undone.')) return;
  const res = await API.delete(`/users/${id}`);
  if (res.success) {
    Utils.showToast('User deleted', 'success');
    loadStudents(); loadTeachers();
  } else {
    Utils.showToast(res.message || 'Delete failed', 'error');
  }
}

window.toggleUser = toggleUser;
window.deleteUser = deleteUser;
window.filterStudents = filterStudents;
window.loadStudents = loadStudents;

// ── Homework ──────────────────────────────────────────────────────────────────
async function loadHomework() {
  try {
    const res = await API.get('/homework');
    const list = res.success ? res.data : [];
    const tbody = document.getElementById('homework-table-body');
    if (!tbody) return;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--color-text-muted);">No homework found</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(hw => `
      <tr>
        <td><strong>${hw.title}</strong></td>
        <td>${hw.subject}</td>
        <td>Class ${hw.class}</td>
        <td>${Utils.formatDate(hw.dueDate)}</td>
        <td>${hw.postedBy?.name || '—'}</td>
        <td>
          <button class="table-action-btn tbl-delete" onclick="deleteHomework('${hw._id}')">Delete</button>
        </td>
      </tr>`).join('');
  } catch {}
}

async function deleteHomework(id) {
  if (!confirm('Delete this homework?')) return;
  const res = await API.delete(`/homework/${id}`);
  if (res.success) { Utils.showToast('Deleted', 'success'); loadHomework(); }
  else Utils.showToast(res.message || 'Error', 'error');
}
window.deleteHomework = deleteHomework;

// ── Results ───────────────────────────────────────────────────────────────────
async function loadResults() {
  const cls  = document.getElementById('results-class-filter')?.value || '';
  const exam = document.getElementById('results-exam-filter')?.value || '';
  let url = '/results';
  const params = [];
  if (cls)  params.push(`class=${cls}`);
  if (exam) params.push(`examType=${encodeURIComponent(exam)}`);
  if (params.length) url += '?' + params.join('&');

  try {
    const res = await API.get(url);
    const list = res.success ? res.data : [];
    const tbody = document.getElementById('results-table-body');
    if (!tbody) return;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--color-text-muted);">No results found</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(r => `
      <tr>
        <td><strong>${r.student?.name || '—'}</strong></td>
        <td>Class ${r.class}</td>
        <td>${r.subject}</td>
        <td>${r.examType}</td>
        <td>${r.marks}/${r.maxMarks} (${r.percentage}%)</td>
        <td><span class="badge badge-${r.percentage >= 50 ? 'success' : 'error'}">${r.grade}</span></td>
        <td>
          <button class="table-action-btn tbl-delete" onclick="deleteResult('${r._id}')">Delete</button>
        </td>
      </tr>`).join('');
  } catch {}
}

async function deleteResult(id) {
  if (!confirm('Delete this result?')) return;
  const res = await API.delete(`/results/${id}`);
  if (res.success) { Utils.showToast('Deleted', 'success'); loadResults(); }
  else Utils.showToast(res.message || 'Error', 'error');
}
window.deleteResult = deleteResult;
window.loadResults  = loadResults;

// ── Notices ───────────────────────────────────────────────────────────────────
async function loadNotices() {
  try {
    const res = await API.get('/notices');
    const list = res.success ? res.data : [];
    const container = document.getElementById('notices-admin-list');
    if (!container) return;
    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📢</div><div class="empty-state-title">No notices yet</div></div>`;
      return;
    }
    container.innerHTML = list.map(n => `
      <div class="admin-notice-card">
        <div class="admin-notice-info">
          ${n.isPinned ? '<span class="badge badge-accent" style="margin-bottom:6px;">📌 Pinned</span><br/>' : ''}
          <div class="admin-notice-title">${n.title}</div>
          <div class="admin-notice-content">${Utils.truncate(n.content, 120)}</div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:6px;">
            ${n.targetAudience} | ${Utils.formatDate(n.createdAt)}
          </div>
        </div>
        <div class="admin-notice-actions">
          <button class="table-action-btn tbl-toggle" onclick="togglePin('${n._id}')">
            ${n.isPinned ? 'Unpin' : '📌 Pin'}
          </button>
          <button class="table-action-btn tbl-delete" onclick="deleteNotice('${n._id}')">Delete</button>
        </div>
      </div>`).join('');
  } catch {}
}

document.getElementById('add-notice-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('add-notice-btn');
  btn.disabled = true; btn.textContent = 'Posting...';

  const res = await API.post('/notices', {
    title:          document.getElementById('n-title').value.trim(),
    content:        document.getElementById('n-content').value.trim(),
    targetAudience: document.getElementById('n-audience').value,
    isPinned:       document.getElementById('n-pinned').checked,
  });

  if (res.success) {
    Utils.showToast('Notice posted!', 'success');
    document.getElementById('add-notice-form').reset();
    toggleAddForm('notice-add-form');
    loadNotices();
  } else {
    Utils.showToast(res.message || 'Error', 'error');
  }
  btn.disabled = false; btn.textContent = 'Post Notice';
});

async function togglePin(id) {
  const res = await API.patch(`/notices/${id}/pin`);
  if (res.success) { Utils.showToast(res.message, 'success'); loadNotices(); }
}

async function deleteNotice(id) {
  if (!confirm('Delete this notice?')) return;
  const res = await API.delete(`/notices/${id}`);
  if (res.success) { Utils.showToast('Deleted', 'success'); loadNotices(); }
}
window.togglePin    = togglePin;
window.deleteNotice = deleteNotice;

// ── Gallery ───────────────────────────────────────────────────────────────────
async function loadGallery() {
  try {
    const res = await API.get('/gallery');
    const list = res.success ? res.data : [];
    const grid = document.getElementById('admin-gallery-grid');
    if (!grid) return;
    if (list.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;"><div class="empty-state"><div class="empty-state-icon">🖼️</div><div class="empty-state-title">No images uploaded yet</div></div></div>`;
      return;
    }
    grid.innerHTML = list.map(img => `
      <div class="admin-gallery-item">
        <img src="${Utils.resolveUrl(img.imageUrl)}" alt="${img.title || ''}" loading="lazy"
             onerror="this.parentElement.style.background='var(--color-accent-light)'" />
        <button class="admin-gallery-delete" onclick="deleteGalleryImage('${img._id}')">✕</button>
      </div>`).join('');
  } catch {}
}

document.getElementById('gallery-upload-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('gallery-upload-btn');
  btn.disabled = true; btn.textContent = 'Uploading...';

  const file = document.getElementById('g-file').files[0];
  if (!file) { Utils.showToast('Please select an image', 'warning'); btn.disabled = false; btn.textContent = 'Upload Image'; return; }

  const fd = new FormData();
  fd.append('image',    file);
  fd.append('title',    document.getElementById('g-title').value.trim());
  fd.append('category', document.getElementById('g-category').value);

  const res = await API.postForm('/gallery', fd);
  if (res.success) {
    Utils.showToast('Image uploaded!', 'success');
    document.getElementById('gallery-upload-form').reset();
    loadGallery();
  } else {
    Utils.showToast(res.message || 'Upload failed', 'error');
  }
  btn.disabled = false; btn.textContent = 'Upload Image';
});

async function deleteGalleryImage(id) {
  if (!confirm('Delete this image permanently?')) return;
  const res = await API.delete(`/gallery/${id}`);
  if (res.success) { Utils.showToast('Deleted', 'success'); loadGallery(); }
}
window.deleteGalleryImage = deleteGalleryImage;

// ── Faculty ───────────────────────────────────────────────────────────────────
async function loadFaculty() {
  try {
    const res = await API.get('/faculty');
    const list = res.success ? res.data : [];
    const container = document.getElementById('faculty-admin-list');
    if (!container) return;
    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👩‍🏫</div><div class="empty-state-title">No faculty added yet</div></div>`;
      return;
    }
    container.innerHTML = list.map(f => `
      <div class="admin-faculty-card">
        <div class="admin-faculty-avatar">
          ${f.photoUrl
            ? `<img src="${Utils.resolveUrl(f.photoUrl)}" alt="${f.name}" />`
            : Utils.getInitials(f.name)}
        </div>
        <div style="flex:1;">
          <div style="font-weight:700;">${f.name}</div>
          <div style="font-size:var(--font-size-sm);color:var(--color-primary);">${f.subject}</div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);">${f.qualification}</div>
        </div>
        <button class="table-action-btn tbl-delete" onclick="deleteFaculty('${f._id}')">Delete</button>
      </div>`).join('');
  } catch {}
}

document.getElementById('add-faculty-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('add-faculty-btn');
  btn.disabled = true; btn.textContent = 'Adding...';

  const fd = new FormData();
  fd.append('name',          document.getElementById('f-name').value.trim());
  fd.append('subject',       document.getElementById('f-subject').value.trim());
  fd.append('qualification', document.getElementById('f-qual').value.trim());
  fd.append('bio',           document.getElementById('f-bio').value.trim());
  fd.append('order',         document.getElementById('f-order').value || '0');
  const photo = document.getElementById('f-photo').files[0];
  if (photo) fd.append('photo', photo);

  const res = await API.postForm('/faculty', fd);
  if (res.success) {
    Utils.showToast('Faculty added!', 'success');
    document.getElementById('add-faculty-form').reset();
    toggleAddForm('faculty-add-form');
    loadFaculty();
  } else {
    Utils.showToast(res.message || 'Error', 'error');
  }
  btn.disabled = false; btn.textContent = 'Add Faculty';
});

async function deleteFaculty(id) {
  if (!confirm('Delete this faculty member?')) return;
  const res = await API.delete(`/faculty/${id}`);
  if (res.success) { Utils.showToast('Deleted', 'success'); loadFaculty(); }
}
window.deleteFaculty = deleteFaculty;

// ── Facilities ────────────────────────────────────────────────────────────────
async function loadFacilities() {
  try {
    const res = await API.get('/facilities');
    const list = res.success ? res.data : [];
    const tbody = document.getElementById('facilities-table-body');
    if (!tbody) return;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--color-text-muted);">No facilities found</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(f => `
      <tr>
        <td style="font-size:24px;">${f.icon}</td>
        <td><strong>${f.name}</strong></td>
        <td>${f.description || '—'}</td>
        <td><span class="badge badge-${f.isActive ? 'success' : 'error'}">${f.isActive ? 'Active' : 'Hidden'}</span></td>
        <td>
          <button class="table-action-btn tbl-delete" onclick="deleteFacility('${f._id}')">Delete</button>
        </td>
      </tr>`).join('');
  } catch {}
}

document.getElementById('add-facility-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('add-facility-btn');
  btn.disabled = true; btn.textContent = 'Adding...';

  const res = await API.post('/facilities', {
    name:        document.getElementById('fac-name').value.trim(),
    icon:        document.getElementById('fac-icon').value.trim() || '🏫',
    description: document.getElementById('fac-desc').value.trim(),
  });

  if (res.success) {
    Utils.showToast('Facility added!', 'success');
    document.getElementById('add-facility-form').reset();
    toggleAddForm('facility-add-form');
    loadFacilities();
  } else {
    Utils.showToast(res.message || 'Error', 'error');
  }
  btn.disabled = false; btn.textContent = 'Add Facility';
});

async function deleteFacility(id) {
  if (!confirm('Delete this facility?')) return;
  const res = await API.delete(`/facilities/${id}`);
  if (res.success) { Utils.showToast('Deleted', 'success'); loadFacilities(); }
}
window.deleteFacility = deleteFacility;

// ── Contact Messages ──────────────────────────────────────────────────────────
async function loadMessages() {
  try {
    const res = await API.get('/contact');
    const list = res.success ? res.data : [];
    const tbody = document.getElementById('messages-table-body');
    if (!tbody) return;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--color-text-muted);">No messages yet</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(m => `
      <tr style="background:${m.isRead ? 'transparent' : 'var(--color-accent-light)'}">
        <td><strong>${m.name}</strong></td>
        <td>${m.phone || '—'}</td>
        <td>${m.subject || '—'}</td>
        <td>${Utils.truncate(m.message, 60)}</td>
        <td>${Utils.formatDate(m.createdAt)}</td>
        <td>
          ${!m.isRead
            ? `<button class="table-action-btn tbl-edit" onclick="markRead('${m._id}')">Mark Read</button>`
            : '<span class="badge badge-success">Read</span>'}
        </td>
      </tr>`).join('');
  } catch {}
}

async function markRead(id) {
  const res = await API.patch(`/contact/${id}/read`);
  if (res.success) { Utils.showToast('Marked as read', 'success'); loadMessages(); }
}
window.markRead = markRead;

// ── Admit Card Config ─────────────────────────────────────────────────────────
async function loadAdmitCardConfig() {
  try {
    const res = await API.get('/admit-card/config');
    if (res.success && res.data) {
      document.getElementById('ac-exam').value = res.data.examName || '';
      document.getElementById('ac-months').value = res.data.requiredMonths || '';
      document.getElementById('ac-active').checked = !!res.data.active;
    }
  } catch (err) {
    console.error('Failed to load admit card config:', err);
  }
}

async function saveAdmitCardConfig(e) {
  e.preventDefault();
  const btn = document.getElementById('ac-save-btn');
  btn.innerHTML = '<span class="spinner"></span> Saving...';
  btn.disabled = true;

  const payload = {
    examName: document.getElementById('ac-exam').value.trim(),
    requiredMonths: document.getElementById('ac-months').value,
    active: document.getElementById('ac-active').checked
  };

  try {
    const res = await API.post('/admit-card/config', payload);
    if (res.success) {
      alert('Admit Card configuration saved successfully!');
    } else {
      alert(res.message || 'Failed to save config');
    }
  } catch (err) {
    alert('An error occurred while saving.');
  } finally {
    btn.innerHTML = '💾 Save Configuration';
    btn.disabled = false;
  }
}
window.saveAdmitCardConfig = saveAdmitCardConfig;

// ── Result Config ─────────────────────────────────────────────────────────────
async function loadResultConfig() {
  try {
    const res = await API.get('/results/config');
    if (res.success && res.data) {
      document.getElementById('rc-exam').value = res.data.activeExam || '';
      document.getElementById('rc-active').checked = !!res.data.isPublished;
    }
  } catch (err) {
    console.error('Failed to load result config:', err);
  }
}

async function saveResultConfig(e) {
  e.preventDefault();
  const btn = document.getElementById('rc-save-btn');
  btn.innerHTML = '<span class="spinner"></span> Saving...';
  btn.disabled = true;

  const payload = {
    activeExam: document.getElementById('rc-exam').value.trim(),
    isPublished: document.getElementById('rc-active').checked
  };

  try {
    const res = await API.post('/results/config', payload);
    if (res.success) {
      alert('Public Result configuration saved successfully!');
    } else {
      alert(res.message || 'Failed to save config');
    }
  } catch (err) {
    alert('An error occurred while saving.');
  } finally {
    btn.innerHTML = '💾 Save Result Configuration';
    btn.disabled = false;
  }
}
window.saveResultConfig = saveResultConfig;

// ── System Settings ──────────────────────────────────────────────────────────
async function loadSettings() {
  try {
    const res = await API.get('/settings');
    if (res.success && res.data) {
      document.getElementById('toggle-admit-cards').checked = res.data.admitCardsActive;
      document.getElementById('toggle-results').checked = res.data.resultsActive;
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

async function saveSettings() {
  const admitCardsActive = document.getElementById('toggle-admit-cards').checked;
  const resultsActive = document.getElementById('toggle-results').checked;
  
  try {
    const res = await API.put('/settings', { admitCardsActive, resultsActive });
    if (res.success) {
      alert('Settings saved successfully!');
    } else {
      alert(res.message || 'Failed to save settings');
    }
  } catch (err) {
    console.error('Error saving settings:', err);
    alert('An error occurred while saving settings.');
  }
}
window.saveSettings = saveSettings;

// ── Initialize ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardStats();
  loadAdmitCardConfig();
  loadResultConfig();
  loadSettings();
});
