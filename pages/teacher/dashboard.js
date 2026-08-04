/**
 * pages/teacher/dashboard.js
 */

let studentsList = [];

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.dash-tab').forEach(el => el.classList.remove('active'));
  const tabEl = document.getElementById(`tab-${tabId}`);
  if (tabEl) {
    tabEl.classList.add('active');
    const tabBar = document.querySelector('.dashboard-tabs');
    if (tabBar) tabBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const tabBtn = document.querySelector(`[data-tab="${tabId}"]`);
  if (tabBtn) {
    tabBtn.classList.add('active');
    tabBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

function doLogout() {
  if (confirm('Are you sure you want to logout?')) Auth.logout('../../index.html');
}

async function loadStudentsForClass(cls) {
  try {
    const res = await API.get(`/users?role=student&class=${cls}`);
    return res.success ? res.data : [];
  } catch { return []; }
}

async function loadStudentsForAttendance() {
  const cls  = document.getElementById('att-class').value;
  const date = document.getElementById('att-date').value;
  if (!cls || !date) {
    Utils.showToast('Please select class and date', 'warning');
    return;
  }

  const students = await loadStudentsForClass(cls);
  if (students.length === 0) {
    Utils.showToast('No students found for this class', 'warning');
    return;
  }

  studentsList = students;

  const rowsContainer = document.getElementById('student-attendance-rows');
  rowsContainer.innerHTML = students.map(s => `
    <div class="attendance-mark-row" id="att-row-${s._id}">
      <div class="student-avatar">${Utils.getInitials(s.name)}</div>
      <div style="flex:1;min-width:0;">
        <div class="student-name">${s.name}</div>
        <div class="student-meta">Roll: ${s.rollNumber || '—'}</div>
      </div>
      <div class="att-status-btns">
        <button class="att-btn present" onclick="selectAttendance('${s._id}','Present',this)">P</button>
        <button class="att-btn absent"  onclick="selectAttendance('${s._id}','Absent',this)">A</button>
        <button class="att-btn late"    onclick="selectAttendance('${s._id}','Late',this)">L</button>
      </div>
    </div>
  `).join('');

  document.getElementById('attendance-list').style.display = 'block';
}

function selectAttendance(studentId, status, btn) {
  const row = btn.closest('.attendance-mark-row');
  row.querySelectorAll('.att-btn').forEach(b => {
    b.style.opacity = '0.4';
    b.style.fontWeight = '500';
  });
  btn.style.opacity = '1';
  btn.style.fontWeight = '800';
  btn.dataset.selected = 'true';
  row.dataset.status = status;
  row.dataset.studentId = studentId;
}

async function submitAttendance() {
  const cls  = document.getElementById('att-class').value;
  const date = document.getElementById('att-date').value;

  const rows = document.querySelectorAll('.attendance-mark-row');
  const records = [];

  rows.forEach(row => {
    const status    = row.dataset.status;
    const studentId = row.dataset.studentId;
    if (studentId && status) {
      records.push({ student: studentId, status });
    }
  });

  if (records.length === 0) {
    Utils.showToast('Please mark attendance for at least one student', 'warning');
    return;
  }

  const btn = document.getElementById('submit-attendance-btn');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  const res = await API.post('/attendance', { class: cls, date, records });
  if (res.success) {
    Utils.showToast('Attendance submitted successfully!', 'success');
    document.getElementById('attendance-list').style.display = 'none';
  } else {
    Utils.showToast(res.message || 'Failed to submit attendance', 'error');
  }

  btn.disabled = false;
  btn.textContent = 'Submit Attendance';
}

async function loadDashboard() {
  if (!Auth.requireAuth('teacher', '../teacher/login.html')) return;

  const user = Auth.getUser();
  document.getElementById('greeting').textContent = `${Utils.getGreeting()} 🌅`;
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-meta').textContent = `${user.subject || 'Teacher'} | School Of Science`;

  // Profile
  document.getElementById('profile-avatar').textContent = Utils.getInitials(user.name);
  document.getElementById('profile-name').textContent = user.name;
  document.getElementById('pf-username').textContent = user.username;
  document.getElementById('pf-subject').textContent = user.subject || '—';
  document.getElementById('pf-qual').textContent = user.qualification || '—';
  document.getElementById('pf-phone').textContent = user.phone || '—';

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) Auth.logout('../../index.html');
  });

  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('att-date').value = today;
  if (document.getElementById('hw-due')) document.getElementById('hw-due').min = today;

  // RBAC Enforcement
  const isClassTeacher = !!user.classTeacherOf;
  if (!isClassTeacher) {
    // Hide Attendance and Result tabs if not a Class Teacher
    document.querySelector('[data-tab="attendance"]').style.display = 'none';
    document.querySelector('[data-tab="results"]').style.display = 'none';
  } else {
    // Lock Attendance to their assigned class
    const attClass = document.getElementById('att-class');
    if (attClass) {
      attClass.value = user.classTeacherOf;
      attClass.disabled = true; // Lock dropdown
    }

    // Populate Students for Result upload and dynamic UP Board subjects based on class
    const cls = user.classTeacherOf;
    
    // UP Board subjects mapping
    const upBoardSubjects = {
      'Nursery': ['English', 'Hindi', 'Maths', 'Drawing', 'Rhymes'],
      'LKG': ['English', 'Hindi', 'Maths', 'Drawing', 'Rhymes'],
      'UKG': ['English', 'Hindi', 'Maths', 'Drawing', 'Rhymes', 'EVS'],
      '1': ['Hindi', 'English', 'Maths', 'EVS', 'Computer', 'Drawing'],
      '2': ['Hindi', 'English', 'Maths', 'EVS', 'Computer', 'Drawing'],
      '3': ['Hindi', 'English', 'Maths', 'EVS', 'Computer', 'Drawing', 'G.K'],
      '4': ['Hindi', 'English', 'Maths', 'Science', 'Social Science', 'Computer', 'G.K'],
      '5': ['Hindi', 'English', 'Maths', 'Science', 'Social Science', 'Computer', 'G.K'],
      '6': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Computer', 'Sanskrit'],
      '7': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Computer', 'Sanskrit'],
      '8': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Computer', 'Sanskrit'],
      '9': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Drawing'],
      '10': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Drawing'],
      '11': ['General Hindi', 'English', 'Physics', 'Chemistry', 'Mathematics', 'Biology'],
      '12': ['General Hindi', 'English', 'Physics', 'Chemistry', 'Mathematics', 'Biology']
    };

    const subjects = upBoardSubjects[cls] || ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science'];
    const subContainer = document.getElementById('up-board-subjects-container');
    if (subContainer) {
      subContainer.innerHTML = subjects.map(sub => `
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-size:var(--font-size-xs);">${sub}</label>
          <input type="number" class="form-control res-sub-marks" data-subject="${sub}" placeholder="Marks / 100" min="0" max="100" required style="padding: 8px 12px; font-size: var(--font-size-sm);" />
        </div>
      `).join('');
    }

    const resStudentSelect = document.getElementById('res-student');
    if (resStudentSelect) {
      loadStudentsForClass(cls).then(students => {
        resStudentSelect.innerHTML = '<option value="">Select Student</option>' +
          students.map(s => `<option value="${s._id}">${s.name} (Roll: ${s.rollNumber || '—'})</option>`).join('');
      });
    }
  }

  // Populate Homework classes based on assignments
  const hwClass = document.getElementById('hw-class');
  if (hwClass && user.teachingAssignments && user.teachingAssignments.length > 0) {
    const assignedClasses = [...new Set(user.teachingAssignments.map(a => a.class))];
    hwClass.innerHTML = '<option value="">Select Class</option>' + 
      assignedClasses.map(c => `<option value="${c}">Class ${c}</option>`).join('');
  } else if (hwClass) {
    hwClass.innerHTML = '<option value="">No Classes Assigned</option>';
  }

  // Load stats
  try {
    const [hwRes, notRes] = await Promise.all([
      API.get('/homework'),
      API.get('/notices'),
    ]);
    if (hwRes.success) document.getElementById('stat-hw').textContent = hwRes.data.length;
    if (notRes.success) document.getElementById('stat-notices').textContent = notRes.data.length;

    // My homework list
    const myHw = hwRes.success ? hwRes.data.filter(h => h.postedBy?._id === user._id || h.postedBy === user._id) : [];
    const myHwList = document.getElementById('my-homework-list');
    if (myHw.length > 0) {
      myHwList.innerHTML = myHw.slice(0, 5).map(hw => `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--color-border-light);">
          <div style="flex:1;">
            <div style="font-weight:700;font-size:var(--font-size-sm);">${hw.title}</div>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);">Class ${hw.class} | ${hw.subject}</div>
          </div>
          ${Utils.formatDueDate(hw.dueDate)}
        </div>
      `).join('');
    } else {
      myHwList.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-title">No homework posted yet</div></div>`;
    }

    // Notices
    if (notRes.success) {
      document.getElementById('notices-list').innerHTML = notRes.data.slice(0, 3).map(n => `
        <div class="notice-preview" style="margin-bottom:8px;">
          <div class="notice-preview-title">${n.title}</div>
          <div class="notice-preview-date">${Utils.formatDate(n.createdAt)}</div>
        </div>
      `).join('') || `<div class="empty-state"><div class="empty-state-icon">📢</div><div class="empty-state-title">No notices</div></div>`;
    }
  } catch {}

  // Load students for student list tab (default to teacher's class)
  const defaultClass = user.classTeacherOf || '1';
  const classFilter = document.getElementById('student-class-filter');
  if (classFilter) {
    classFilter.value = defaultClass;
    classFilter.addEventListener('change', (e) => loadStudentsList(e.target.value));
  }
  loadStudentsList(defaultClass);

  // Submit attendance
  const attSubmitBtn = document.getElementById('submit-attendance-btn');
  if (attSubmitBtn) attSubmitBtn.addEventListener('click', submitAttendance);

  // Homework form
  const hwForm = document.getElementById('hw-form');
  if (hwForm) {
    hwForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('hw-submit-btn');
      btn.disabled = true;
      btn.textContent = 'Posting...';

      const formData = new FormData();
      formData.append('title',       document.getElementById('hw-title').value.trim());
      formData.append('subject',     document.getElementById('hw-subject').value.trim());
      formData.append('class',       document.getElementById('hw-class').value);
      formData.append('dueDate',     document.getElementById('hw-due').value);
      formData.append('description', document.getElementById('hw-desc').value.trim());
      const file = document.getElementById('hw-file').files[0];
      if (file) formData.append('attachments', file);

      const res = await API.postForm('/homework', formData);
      if (res.success) {
        Utils.showToast('Homework posted successfully!', 'success');
        hwForm.reset();
      } else {
        Utils.showToast(res.message || 'Failed to post homework', 'error');
      }
      btn.disabled = false;
      btn.textContent = 'Post Homework';
    });
  }

  // Result form
  const resultForm = document.getElementById('result-form');

  if (resultForm) {
    resultForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('result-submit-btn');
      btn.disabled = true; btn.textContent = 'Uploading...';

      const studentId = document.getElementById('res-student').value;
      const examType = document.getElementById('res-exam').value;

      const results = [];
      document.querySelectorAll('.res-sub-marks').forEach(input => {
        results.push({
          subject: input.dataset.subject,
          marks: Number(input.value),
          maxMarks: 100
        });
      });

      const res = await API.post('/results', {
        studentId,
        examType,
        results
      });

      if (res.success) {
        Utils.showToast('✅ Result uploaded successfully!', 'success');
        resultForm.reset();
      } else {
        Utils.showToast(res.message || 'Failed to upload result', 'error');
      }
      btn.disabled = false; btn.textContent = 'Upload Result';
    });
  }

  // Notice form
  const noticeForm = document.getElementById('notice-form');
  if (noticeForm) {
    noticeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('notice-submit-btn');
      btn.disabled = true; btn.textContent = 'Posting...';

      const res = await API.post('/notices', {
        title:          document.getElementById('not-title').value.trim(),
        content:        document.getElementById('not-content').value.trim(),
        targetAudience: document.getElementById('not-audience').value,
      });

      if (res.success) {
        Utils.showToast('Notice posted!', 'success');
        noticeForm.reset();
      } else {
        Utils.showToast(res.message || 'Failed to post notice', 'error');
      }
      btn.disabled = false; btn.textContent = 'Post Notice';
    });
  }

  // Teacher Add Student form
  const teacherAddStudentForm = document.getElementById('teacher-add-student-form');
  if (teacherAddStudentForm) {
    teacherAddStudentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('teacher-add-student-btn');
      btn.disabled = true; btn.textContent = 'Adding...';

      const formData = new FormData();
      formData.append('name', document.getElementById('ts-name').value.trim());
      formData.append('username', document.getElementById('ts-username').value.trim());
      formData.append('password', document.getElementById('ts-password').value);
      formData.append('role', 'student');
      formData.append('class', document.getElementById('ts-class').value);
      formData.append('rollNumber', document.getElementById('ts-roll').value.trim());
      formData.append('phone', document.getElementById('ts-phone').value.trim());
      formData.append('fatherName', document.getElementById('ts-father').value.trim());
      formData.append('motherName', document.getElementById('ts-mother').value.trim());
      formData.append('dateOfBirth', document.getElementById('ts-dob').value);
      formData.append('gender', document.getElementById('ts-gender').value);
      formData.append('address', document.getElementById('ts-address').value.trim());
      
      const photoFile = document.getElementById('ts-photo').files[0];
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await API.postForm('/users', formData);

      if (res.success) {
        Utils.showToast('✅ Student added to class successfully!', 'success');
        teacherAddStudentForm.reset();
        showTab('students');
        loadStudentsList(document.getElementById('student-class-filter').value || '1');
      } else {
        Utils.showToast(res.message || 'Failed to add student', 'error');
      }
      btn.disabled = false; btn.textContent = '✅ Add Student to Class';
    });
  }
}

async function loadStudentsList(cls) {
  const list = document.getElementById('students-list');
  if (!list) return;
  list.innerHTML = '<div class="skeleton" style="height:50px;margin-bottom:8px;"></div>'.repeat(3);

  const students = await loadStudentsForClass(cls);
  document.getElementById('stat-students').textContent = students.length;

  if (students.length > 0) {
    list.innerHTML = students.map(s => `
      <div class="student-row">
        <div class="student-avatar">${Utils.getInitials(s.name)}</div>
        <div>
          <div class="student-name">${s.name}</div>
          <div class="student-meta">Roll: ${s.rollNumber || '—'} | Class ${s.class}</div>
        </div>
        <span class="badge badge-${s.isActive ? 'success' : 'error'}" style="margin-left:auto;">
          ${s.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    `).join('');
  } else {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-title">No students in this class</div></div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
