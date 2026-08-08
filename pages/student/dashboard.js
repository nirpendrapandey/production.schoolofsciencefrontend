/**
 * pages/student/dashboard.js
 */
function showAttendanceModal() {
  const el = document.getElementById('attendance-modal'); if(el) el.style.display = 'block';
}
window.showAttendanceModal = showAttendanceModal;

function closeAttendanceModal() {
  const el = document.getElementById('attendance-modal'); if(el) el.style.display = 'none';
}
window.closeAttendanceModal = closeAttendanceModal;
function showFeesModal() {
  const el = document.getElementById('fees-modal'); if(el) el.style.display = 'block';
}
window.showFeesModal = showFeesModal;

function closeFeesModal() {
  const el = document.getElementById('fees-modal'); if(el) el.style.display = 'none';
}
window.closeFeesModal = closeFeesModal;

function showProfileModal() {
  const el = document.getElementById('profile-modal'); if(el) el.style.display = 'block';
}
window.showProfileModal = showProfileModal;

function closeProfileModal() {
  const el = document.getElementById('profile-modal'); if(el) el.style.display = 'none';
}
window.closeProfileModal = closeProfileModal;

// Global logout function (available for onclick attribute)
function doLogout() {
  if (confirm('Are you sure you want to logout?')) {
    Auth.logout('../../index.html');
  }
}
window.doLogout = doLogout;

function renderHomeworkItem(hw) {
  return `
    <div class="hw-preview">
      <div class="hw-preview-icon">📚</div>
      <div class="hw-preview-info">
        <div class="hw-preview-title">${hw.title}</div>
        <div class="hw-preview-meta">${hw.subject} &nbsp;|&nbsp; Class ${hw.class}</div>
      </div>
      ${Utils.formatDueDate(hw.dueDate)}
    </div>
  `;
}

function renderResultItem(result) {
  const pct = result.percentage || 0;
  const color = pct >= 75 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-error)';
  return `
    <div class="hw-preview" style="margin-bottom:var(--space-3);">
      <div class="hw-preview-icon">📊</div>
      <div class="hw-preview-info">
        <div class="hw-preview-title">${result.subject}</div>
        <div class="hw-preview-meta">${result.examType} &nbsp;|&nbsp; ${Utils.formatDate(result.createdAt)}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:var(--font-size-lg);font-weight:800;color:${color};">${result.grade}</div>
        <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);">${result.marks}/${result.maxMarks}</div>
      </div>
    </div>
  `;
}

function renderNoticeItem(notice) {
  return `
    <div class="notice-preview">
      <div class="notice-preview-title">${notice.title}</div>
      <div class="notice-preview-date">${Utils.formatDate(notice.createdAt)}</div>
    </div>
  `;
}

async function loadDashboard() {
  // Auth guard
  if (!Auth.requireAuth('student', '../student/login.html')) return;

  const user = Auth.getUser();

  // Welcome strip
  document.getElementById('greeting').textContent = `${Utils.getGreeting()} 🌅`;
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-meta').textContent = `Class ${user.class || '—'} | Roll: ${user.rollNumber || '—'}`;

  // Profile tab
  if (user.photoUrl) {
    document.getElementById('profile-avatar').innerHTML = `<img src="${user.photoUrl}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    document.getElementById('profile-avatar').style.background = 'transparent';
    document.getElementById('profile-avatar').style.border = 'none';
  } else {
    document.getElementById('profile-avatar').textContent = Utils.getInitials(user.name);
  }
  document.getElementById('profile-name').textContent = user.name;
  document.getElementById('pf-username').textContent = user.username;
  document.getElementById('pf-class').textContent = user.class ? `Class ${user.class}` : '—';
  const profileAvatar = document.getElementById('profile-avatar');
  if (profileAvatar) {
    if (user.photoUrl) {
      profileAvatar.innerHTML = `<img src="${user.photoUrl}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
      profileAvatar.style.background = 'transparent';
      profileAvatar.style.border = 'none';
    } else {
      profileAvatar.textContent = Utils.getInitials(user.name);
    }
  }
  
  const profileName = document.getElementById('profile-name');
  if (profileName) profileName.textContent = user.name;
  
  const pfUsername = document.getElementById('pf-username');
  if (pfUsername) pfUsername.textContent = user.username;
  
  const pfClass = document.getElementById('pf-class');
  if (pfClass) pfClass.textContent = user.class ? `Class ${user.class}` : '—';
  
  const pfRoll = document.getElementById('pf-roll');
  if (pfRoll) pfRoll.textContent = user.rollNumber || '—';
  
  const pfPhone = document.getElementById('pf-phone');
  if (pfPhone) pfPhone.textContent = user.phone || '—';

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        Auth.logout('../../index.html');
      }
    });
  }

  // Load homework for student's class
  try {
    const hwRes = await API.get(`/homework?class=${user.class}`);
    const homeworkList = hwRes.success ? hwRes.data : [];

    const statHw = document.getElementById('stat-hw');
    if (statHw) statHw.textContent = homeworkList.length;

    const hwContent = document.getElementById('homework-content');
    if (hwContent) {
      if (homeworkList.length > 0) {
        hwContent.innerHTML = homeworkList.slice(0, 5).map(renderHomeworkItem).join('');
      } else {
        hwContent.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📚</div>
          <div class="empty-state-title">No homework yet</div>
          <div class="empty-state-desc">Your teacher hasn't assigned any homework.</div></div>`;
      }
    }
  } catch {
    const statHw = document.getElementById('stat-hw');
    if (statHw) statHw.textContent = '0';
  }

  // Load attendance summary
  try {
    const attRes = await API.get('/attendance/summary');
    if (attRes.success) {
      const { present, absent, percentage } = attRes.data;
      const statAtt = document.getElementById('stat-att');
      if (statAtt) statAtt.textContent = `${percentage}%`;
      
      const attPresent = document.getElementById('att-present');
      if (attPresent) attPresent.textContent = present;
      
      const attAbsent = document.getElementById('att-absent');
      if (attAbsent) attAbsent.textContent = absent;
      
      const attPct = document.getElementById('att-pct');
      if (attPct) attPct.textContent = `${percentage}%`;
      
      const attBar = document.getElementById('att-bar');
      if (attBar) {
        attBar.style.width = `${percentage}%`;
        attBar.style.background =
          percentage >= 75 ? 'var(--color-success)' :
          percentage >= 50 ? 'var(--color-warning)' : 'var(--color-error)';
      }
    }
  } catch {}

  // Load results
  try {
    const resData = await API.get('/results');
    if (resData.success && resData.data.length > 0) {
      // Calculate average grade
      const avgPct = Math.round(resData.data.reduce((a, r) => a + (r.percentage || 0), 0) / resData.data.length);
      const gradeMap = [[90,'A+'],[80,'A'],[70,'B+'],[60,'B'],[50,'C'],[40,'D'],[0,'F']];
      const grade = (gradeMap.find(([min]) => avgPct >= min) || ['','F'])[1];
      
      const statGrade = document.getElementById('stat-grade');
      if (statGrade) statGrade.textContent = grade;

      const resContent = document.getElementById('results-content');
      if (resContent) resContent.innerHTML = resData.data.slice(0, 5).map(renderResultItem).join('');
    } else {
      const statGrade = document.getElementById('stat-grade');
      if (statGrade) statGrade.textContent = '—';
      
      const resContent = document.getElementById('results-content');
      if (resContent) resContent.innerHTML = `
        <div class="empty-state"><div class="empty-state-icon">📊</div>
        <div class="empty-state-title">No results yet</div>
        <div class="empty-state-desc">Results will appear here once uploaded.</div></div>`;
    }
  } catch {}

  // Load notices
  try {
    const notRes = await API.get('/notices');
    if (notRes.success && notRes.data.length > 0) {
      const notContent = document.getElementById('notices-content');
      if (notContent) notContent.innerHTML = notRes.data.slice(0, 3).map(renderNoticeItem).join('');
    } else {
      const notContent = document.getElementById('notices-content');
      if (notContent) notContent.innerHTML = `
        <div class="empty-state"><div class="empty-state-icon">📢</div>
        <div class="empty-state-title">No notices</div>
        <div class="empty-state-desc">No new announcements at the moment.</div></div>`;
    }
  } catch {}

  // Load Fees (await so data is ready)
  try {
    await loadStudentFees();
  } catch {}
}

// ── Fees Section ─────────────────────────────────────────────────────────────
const FEE_MONTHS = [
  { num: 4,  name: 'April' },   { num: 5,  name: 'May' },
  { num: 6,  name: 'June' },    { num: 7,  name: 'July' },
  { num: 8,  name: 'August' },  { num: 9,  name: 'September' },
  { num: 10, name: 'October' }, { num: 11, name: 'November' },
  { num: 12, name: 'December' },{ num: 1,  name: 'January' },
  { num: 2,  name: 'February' },{ num: 3,  name: 'March' },
];

let _studentFees = [];

async function loadStudentFees() {
  const feesDiv = document.getElementById('fees-content');
  const yearSelect = document.getElementById('student-fee-year');

  // Initialize year options if empty
  if (yearSelect.options.length === 0) {
    const baseYear = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    for (let i = 0; i < 3; i++) {
      const y = baseYear - i;
      yearSelect.options.add(new Option(`${y}–${String(y + 1).slice(-2)}`, y));
    }
    // Check if there are any specific parameters for testing/admin usage, otherwise leave default
  }

  const currentYear = parseInt(yearSelect.value);

  feesDiv.innerHTML = '<div class="skeleton" style="height:80px;border-radius:12px;margin-bottom:12px;"></div><div class="skeleton" style="height:80px;border-radius:12px;margin-bottom:12px;"></div>';

  try {
    const res = await API.get('/fees');
    if (!res.success) throw new Error(res.message);
    _studentFees = res.data || [];
  } catch {
    _studentFees = [];
  }

  // Build fee map: key = month-year (use String() to handle DB returning month as string)
  const feeMap = {};
  _studentFees.forEach(f => { feeMap[`${String(f.month)}-${f.year}`] = f; });

  let paidCount = 0;

  const cards = FEE_MONTHS.map(({ num, name }) => {
    const feeYear = num >= 4 ? currentYear : currentYear + 1;
    const fee     = feeMap[`${String(num)}-${feeYear}`];
    const isPaid  = fee && fee.payment_status === 'paid';
    if (isPaid) paidCount++;

    return `
      <div style="background:${isPaid ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'white'};
        border:2px solid ${isPaid ? '#86efac' : '#e2e8f0'};
        border-radius:12px;padding:14px 16px;margin-bottom:10px;
        display:flex;align-items:center;gap:12px;">
        <div style="font-size:22px;">${isPaid ? '✅' : '⏳'}</div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:14px;color:#0f172a;">${name} ${feeYear}</div>
          <div style="font-size:12px;color:${isPaid ? '#15803d' : '#dc2626'};font-weight:600;">
            ${isPaid ? `Paid on ${fmtFeeDate(fee.payment_date)}` : 'Payment Pending'}
          </div>
          ${isPaid ? `<div style="font-size:11px;color:#94a3b8;">🧾 ${fee.receipt_number || '—'}</div>` : ''}
        </div>
        <div style="text-align:right;">
          <div style="font-size:16px;font-weight:800;color:#1e3a8a;">₹${Number(fee?.amount || 0).toLocaleString('en-IN')}</div>
          ${isPaid
            ? '<div style="font-size:11px;color:#15803d;margin-top:4px;font-weight:700;">Paid</div>'
            : '<div style="font-size:11px;color:#94a3b8;margin-top:4px;">Due</div>'
          }
        </div>
      </div>`;
  }).join('');

  feesDiv.innerHTML = cards;
  document.getElementById('fee-stat-paid').textContent = paidCount;
  document.getElementById('fee-stat-due').textContent  = 12 - paidCount;
}

function fmtFeeDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}





// ── Admit Card Logic ──────────────────────────────────────────────────────────
async function downloadAdmitCard() {
  const btn = document.getElementById('action-admit');
  if(btn) btn.style.opacity = '0.5';

  try {
    // 1. Get Admit Card Config
    const res = await API.get('/admit-card/config');
    if (!res.success || !res.data || !res.data.active) {
      alert('No active exams right now. Admit cards are currently disabled.');
      return;
    }

    const config = res.data;
    const requiredMonths = parseInt(config.requiredMonths) || 0;

    // 2. Load latest fees
    const feeRes = await API.get('/fees');
    let feesList = feeRes.success ? (feeRes.data || []) : [];

    // 3. Count paid months for current academic session
    let maxYear = 0;
    feesList.forEach(f => {
      let y = parseInt(f.year);
      let m = parseInt(f.month);
      let sessionStartYear = m >= 4 ? y : y - 1;
      if (f.payment_status === 'paid' && sessionStartYear > maxYear) {
        maxYear = sessionStartYear;
      }
    });
    let baseYear = maxYear > 0 ? maxYear : (new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1);
    const yearSelect = document.getElementById('student-fee-year');
    if (yearSelect && yearSelect.value) {
      baseYear = parseInt(yearSelect.value);
    }

    let paidCount = 0;

    feesList.forEach(f => {
      const mNum = parseInt(f.month);
      const yNum = parseInt(f.year);
      // April-Dec belongs to baseYear, Jan-March to baseYear+1
      const isCurrentSession = (mNum >= 4 && yNum === baseYear) || (mNum < 4 && yNum === baseYear + 1);
      if (isCurrentSession && f.payment_status === 'paid') {
        paidCount++;
      }
    });

    if (paidCount < requiredMonths) {
      alert(`⚠️ You have paid fees for ${paidCount} months in the ${baseYear}-${String(baseYear+1).slice(-2)} session. Please clear at least ${requiredMonths} months of dues to download the ${config.examName} admit card.`);
      return;
    }

    // 4. Generate Admit Card HTML
    const user = Auth.getUser();
    
    document.getElementById('admit-card-body').innerHTML = `
      <div style="text-align:center;border-bottom:2px solid #1e3a8a;padding-bottom:16px;margin-bottom:20px;">
        <div style="display:flex;align-items:center;justify-content:center;gap:16px;">
          <div style="font-size:32px;">🏫</div>
          <div>
            <div style="font-size:24px;font-weight:900;color:#1e3a8a;letter-spacing:1px;text-transform:uppercase;">School of Science</div>
            <div style="font-size:12px;color:#64748b;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Education for Every Child</div>
          </div>
        </div>
        <div style="margin-top:16px;display:inline-block;background:#1e3a8a;color:white;padding:6px 20px;border-radius:20px;font-size:16px;font-weight:800;letter-spacing:1px;">
          ADMIT CARD – ${config.examName}
        </div>
      </div>

      <div style="display:flex;gap:24px;margin-bottom:24px;">
        <!-- Photo Box -->
        <div style="width:110px;height:140px;border:2px dashed #94a3b8;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#f8fafc;flex-shrink:0;overflow:hidden;">
          ${user.photoUrl 
            ? `<img src="${user.photoUrl}" style="width:100%;height:100%;object-fit:cover;" alt="Student Photo" />`
            : `<div style="text-align:center;color:#94a3b8;font-size:11px;font-weight:600;">
                 <div style="font-size:24px;margin-bottom:4px;">📷</div>
                 Paste Photo
               </div>`
          }
        </div>
        
        <!-- Student Details -->
        <div style="flex:1;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;width:120px;">Student Name</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;font-size:16px;">${user.name}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;">Roll Number</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${user.rollNumber || '—'}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;">Class</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${user.className ? `Class ${user.className}` : '—'}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;">Session</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${baseYear}-${String(baseYear+1).slice(-2)}</td></tr>
          </table>
        </div>
      </div>

      <div style="border:2px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <div style="background:#f1f5f9;padding:10px 16px;font-weight:800;color:#334155;border-bottom:2px solid #e2e8f0;font-size:14px;">
          Instructions to Candidate
        </div>
        <div style="padding:16px;font-size:12px;color:#475569;line-height:1.6;">
          <ul style="margin:0;padding-left:16px;">
            <li style="margin-bottom:6px;">Bring this Admit Card along with your School ID daily during exams.</li>
            <li style="margin-bottom:6px;">Electronic devices, calculators, and mobile phones are strictly prohibited.</li>
            <li style="margin-bottom:6px;">Report to the examination hall at least 15 minutes before the commencement.</li>
            <li>Maintain absolute silence during the examination.</li>
          </ul>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;">
        <div style="text-align:center;">
          <div style="width:120px;border-bottom:1px solid #0f172a;margin-bottom:6px;"></div>
          <div style="font-size:11px;font-weight:700;color:#64748b;">Candidate's Signature</div>
        </div>
        
        <div style="text-align:center;position:relative;">
          <div style="position:absolute;top:-40px;left:50%;transform:translateX(-50%) rotate(-10deg);border:2px solid #dc2626;color:#dc2626;padding:4px 12px;border-radius:4px;font-weight:800;font-size:12px;letter-spacing:1px;opacity:0.8;">APPROVED ✓</div>
          <div style="width:120px;border-bottom:1px solid #0f172a;margin-bottom:6px;"></div>
          <div style="font-size:11px;font-weight:700;color:#64748b;">Principal's Signature</div>
        </div>
      </div>
    `;

    const el = document.getElementById('admit-card-modal'); if(el) el.style.display = 'block';

  } catch (err) {
    console.error(err);
    alert('Could not generate Admit Card. Please try again.');
  } finally {
    if(btn) btn.style.opacity = '1';
  }
}




function generatePDF(elementId, filename, btnId) {
  const btn = btnId ? document.getElementById(btnId) : null;
  let originalHtml = '';
  if (btn) {
    originalHtml = btn.innerHTML;
    btn.innerHTML = `<div class="action-icon" style="animation: spin 1s linear infinite;">⏳</div><div class="action-title">Downloading...</div>`;
    btn.style.pointerEvents = 'none';
  }

  const printContainer = document.getElementById(elementId);
  printContainer.style.display = 'block'; // Temporarily show it for html2pdf

  function triggerDownload() {
    const opt = {
      margin:       0,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.99 },
      html2canvas:  { scale: 3, useCORS: true, logging: false, scrollY: 0, allowTaint: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(printContainer).save().then(() => {
      printContainer.style.display = 'none'; // Hide again
      if (btn) { btn.innerHTML = originalHtml; btn.style.pointerEvents = 'auto'; }
    }).catch(() => {
      printContainer.style.display = 'none';
      if (btn) { btn.innerHTML = originalHtml; btn.style.pointerEvents = 'auto'; }
    });
  }

  if (typeof html2pdf === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = triggerDownload;
    document.body.appendChild(script);
  } else {
    triggerDownload();
  }
}

async function showConsolidatedMarksheet() {
  const btn = document.getElementById('action-res');
  let originalHtml = '';
  if (btn) {
    originalHtml = btn.innerHTML;
    btn.innerHTML = `<div class="action-icon" style="animation: spin 1s linear infinite;">⏳</div><div class="action-title">Loading...</div>`;
    btn.style.pointerEvents = 'none';
  }

  try {
    // Check global settings first
    const setRes = await API.get('/settings');
    if (setRes.success && setRes.data && !setRes.data.resultsActive) {
      if(btn){ btn.innerHTML = originalHtml; btn.style.pointerEvents = 'auto'; }
      alert('Results are not available at this moment. Please contact the administrator.');
      return;
    }

    const res = await API.get('/results');
    if (!btn) return;
    
    if (!res.success || !res.data || res.data.length === 0) {
      btn.innerHTML = originalHtml;
      btn.style.pointerEvents = 'auto';
      alert('No results available to generate marksheet.');
      return;
    }

    const user = Auth.getUser();
    let totalMarks = 0;
    let totalMaxMarks = 0;

    // UP Board subject code mapping
    const subjectCodes = {
      'Hindi': '001', 'English': '002', 'English Language': '002',
      'Mathematics': '003', 'Science': '004', 'Social Science': '005',
      'Drawing': '006', 'Computer': '007', 'Sanskrit': '008',
      'G.K': '009', 'EVS': '010', 'Rhymes': '011',
      'General Hindi': '001', 'Physics': '012', 'Chemistry': '013',
      'Biology': '014'
    };

    let subjectsHtml = '';

    // Deduplicate by subject name — keep entry with higher marks (handles old duplicate DB records)
    const subjectMap = new Map();
    res.data.forEach(r => {
      const subj = (r.subject || '').trim();
      if (!subjectMap.has(subj) || Number(r.marks || 0) > Number(subjectMap.get(subj).marks || 0)) {
        subjectMap.set(subj, r);
      }
    });
    const uniqueResults = Array.from(subjectMap.values());

    uniqueResults.forEach((r, idx) => {
      const marksObtained = Number(r.marks || 0);
      const maxM = Number(r.maxMarks || 100);
      totalMarks += marksObtained;
      totalMaxMarks += maxM;
      const pct = maxM > 0 ? Math.round((marksObtained / maxM) * 100) : 0;
      // Grade as per UP Board pattern
      let grade = 'F';
      if (pct >= 90) grade = 'A+';
      else if (pct >= 80) grade = 'A';
      else if (pct >= 70) grade = 'B';
      else if (pct >= 60) grade = 'C';
      else if (pct >= 50) grade = 'D';
      else if (pct >= 33) grade = 'E';
      const code = subjectCodes[r.subject] || ('0' + (idx + 1).toString().padStart(2, '0'));
      const subjName = r.subject || ('Subject ' + (idx + 1));
      subjectsHtml += `
        <tr>
          <td>${code}</td>
          <td class="ms-sub-name">${subjName}</td>
          <td>${maxM}</td>
          <td>${marksObtained}</td>
          <td style="font-weight:bold;">${grade}</td>
        </tr>
      `;
    });

    const overallPct = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;
    const finalResult = overallPct >= 33 ? 'PASS' : 'FAIL';
    
    const now = new Date();
    const fullYear = now.getFullYear();

    // Populate template
    document.getElementById('pm-name').textContent = user.name || '—';
    document.getElementById('pm-fname').textContent = (user.fatherName || '—').toUpperCase();
    document.getElementById('pm-roll').textContent = user.rollNumber || '—';
    document.getElementById('pm-class').textContent = user.class ? `Class ${user.class}` : '—';
    // Title line: CLASS 10 (2026)
    const classTitleEl = document.getElementById('pm-class-title');
    if (classTitleEl) classTitleEl.textContent = user.class || '—';
    document.getElementById('pm-year').textContent = fullYear;
    document.getElementById('pm-subjects').innerHTML = subjectsHtml;
    document.getElementById('pm-total').textContent = `${totalMarks}/${totalMaxMarks}`;
    document.getElementById('pm-pct').textContent = overallPct;
    document.getElementById('pm-result').textContent = finalResult;
    document.getElementById('pm-result').style.color = finalResult === 'PASS' ? '#15803d' : '#dc2626';

    btn.innerHTML = originalHtml;
    btn.style.pointerEvents = 'auto';

    generatePDF('print-marksheet', `Marksheet_${user.name.replace(/ /g,'_')}.pdf`, 'action-res');
  } catch (err) {
    if (btn) { btn.innerHTML = originalHtml; btn.style.pointerEvents = 'auto'; }
    console.error(err);
    alert('Could not generate marksheet.');
  }
}
window.showConsolidatedMarksheet = showConsolidatedMarksheet;

async function downloadAdmitCard() {
  const btn = document.getElementById('action-admit');
  let originalHtml = '';
  if (btn) {
    originalHtml = btn.innerHTML;
    btn.innerHTML = `<div class="action-icon" style="animation: spin 1s linear infinite;">⏳</div><div class="action-title">Loading...</div>`;
    btn.style.pointerEvents = 'none';
  }

  try {
    // Check global settings first
    const setRes = await API.get('/settings');
    if (setRes.success && setRes.data && !setRes.data.admitCardsActive) {
      if(btn){ btn.innerHTML = originalHtml; btn.style.pointerEvents = 'auto'; }
      alert('Admit Cards are not available at this moment. Please contact the administrator.');
      return;
    }

    const res = await API.get('/admit-card/config');
    if (!res.success || !res.data || !res.data.active) {
      if(btn){ btn.innerHTML = originalHtml; btn.style.pointerEvents = 'auto'; }
      alert('No active exams right now. Admit cards are currently disabled.');
      return;
    }

    const config = res.data;
    const requiredMonths = parseInt(config.requiredMonths) || 0;

    const feeRes = await API.get('/fees');
    let feesList = feeRes.success ? (feeRes.data || []) : [];

    let baseYear = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    let paidCount = 0;
    feesList.forEach(f => {
      const mNum = parseInt(f.month);
      const yNum = parseInt(f.year);
      const isCurrentSession = (mNum >= 4 && yNum === baseYear) || (mNum < 4 && yNum === baseYear + 1);
      if (isCurrentSession && f.payment_status === 'paid') paidCount++;
    });

    if (paidCount < requiredMonths) {
      if(btn){ btn.innerHTML = originalHtml; btn.style.pointerEvents = 'auto'; }
      alert(`⚠️ You have paid fees for ${paidCount} months in the ${baseYear}-${String(baseYear+1).slice(-2)} session. Please clear at least ${requiredMonths} months of dues to download the ${config.examName} admit card.`);
      return;
    }

    const user = Auth.getUser();
    
    // Populate admit card template
    document.getElementById('pac-exam').textContent = config.examName;
    document.getElementById('pac-name').textContent = (user.name || '—').toUpperCase();
    document.getElementById('pac-fname').textContent = (user.fatherName || '—').toUpperCase();
    document.getElementById('pac-class').textContent = user.class ? `Class ${user.class}` : '—';
    document.getElementById('pac-roll').textContent = user.rollNumber || '—';
    document.getElementById('pac-session').textContent = baseYear;
    // Class title in header: "CLASS 10"
    const pacClassTitle = document.getElementById('pac-class-title');
    if (pacClassTitle) pacClassTitle.textContent = user.class || '—';
    // Enrollment & Center Code (use roll number as placeholder)
    const pacEnroll = document.getElementById('pac-enroll');
    if (pacEnroll) pacEnroll.textContent = '—';
    const pacCenter = document.getElementById('pac-center-code');
    if (pacCenter) pacCenter.textContent = user.rollNumber || '—';

    if(btn){ btn.innerHTML = originalHtml; btn.style.pointerEvents = 'auto'; }

    generatePDF('print-admit-card', `AdmitCard_${user.name.replace(/ /g,'_')}.pdf`, 'action-admit');
  } catch (err) {
    if(btn){ btn.innerHTML = originalHtml; btn.style.pointerEvents = 'auto'; }
    console.error(err);
    alert('Could not generate Admit Card. Please try again.');
  }
}
window.downloadAdmitCard = downloadAdmitCard;

window.showConsolidatedReceipt = function() {
  const btn = document.querySelector('button[onclick="showConsolidatedReceipt()"]');
  let originalHtml = '';
  if (btn) {
    originalHtml = btn.innerHTML;
    btn.innerHTML = '⏳ Generating PDF...';
    btn.style.pointerEvents = 'none';
  }

  const user = Auth.getUser();
  const yearSelect = document.getElementById('student-fee-year');
  let baseYear = yearSelect && yearSelect.value ? parseInt(yearSelect.value) : (new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1);
  
  API.get('/fees').then(res => {
    const feesList = res.success ? (res.data || []) : [];
    
    const monthNames = ["", "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    // Filter paid months in session
    const paidMonths = feesList.filter(f => {
      const mNum = parseInt(f.month);
      const yNum = parseInt(f.year);
      const inSession = (mNum >= 4 && yNum === baseYear) || (mNum < 4 && yNum === baseYear + 1);
      return inSession && f.payment_status === 'paid';
    });

    if (paidMonths.length === 0) {
      if(btn){ btn.innerHTML = originalHtml; btn.style.pointerEvents = 'auto'; }
      alert('You have no paid fees for the selected academic year to generate a receipt.');
      return;
    }

    // Build rows — one row per month as "Monthly Tuition Fee - April 2025" etc.
    let serialNo = 1;
    let totalPaid = 0;
    let rowsHtml = '';

    paidMonths.forEach(f => {
      const mNum = parseInt(f.month);
      const yNum = parseInt(f.year);
      const amount = Number(f.amount || 0);
      totalPaid += amount;
      rowsHtml += `
        <tr>
          <td style="text-align:center;">${serialNo++}</td>
          <td class="ms-sub-name">Monthly Tuition Fee – ${monthNames[mNum]} ${yNum}</td>
          <td style="text-align:right;">${amount.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
        </tr>
      `;
    });

    // Calculate remaining balance: total dues in session - total paid
    const allSessionFees = feesList.filter(f => {
      const mNum = parseInt(f.month);
      const yNum = parseInt(f.year);
      return (mNum >= 4 && yNum === baseYear) || (mNum < 4 && yNum === baseYear + 1);
    });
    const totalDue = allSessionFees.reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const remaining = Math.max(0, totalDue - totalPaid);

    // Receipt number: SS + year + roll + random
    const recNo = `SS${baseYear}-${(user.rollNumber || '000').toString().slice(-3)}-${String(paidMonths.length).padStart(2,'0')}${String(Math.floor(Math.random()*99)+1).padStart(2,'0')}`;
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
    const amtFormatted = `INR ${totalPaid.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    const dueFormatted = `INR ${totalDue.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    const remainFormatted = `INR ${remaining.toLocaleString('en-IN', {minimumFractionDigits:2})}`;

    // Populate template
    document.getElementById('pfs-receipt-no').textContent = recNo;
    document.getElementById('pfs-name').textContent = (user.name || '—').toUpperCase();
    document.getElementById('pfs-fname').textContent = (user.fatherName || '—').toUpperCase();
    document.getElementById('pfs-class').textContent = user.class ? `Class ${user.class}` : '—';
    document.getElementById('pfs-roll').textContent = user.rollNumber || '—';
    document.getElementById('pfs-date').textContent = dateStr;
    document.getElementById('pfs-year').textContent = `${baseYear}-${String(baseYear+1).slice(-2)}`;
    document.getElementById('pfs-rows').innerHTML = rowsHtml;
    document.getElementById('pfs-total').textContent = totalPaid.toLocaleString('en-IN', {minimumFractionDigits:2});
    // Summary fields
    const payable = document.getElementById('pfs-payable');
    if (payable) payable.textContent = dueFormatted;
    const paid = document.getElementById('pfs-paid');
    if (paid) paid.textContent = amtFormatted;
    const paidR = document.getElementById('pfs-paid-right');
    if (paidR) paidR.textContent = amtFormatted;

    if(btn){ btn.innerHTML = originalHtml; btn.style.pointerEvents = 'auto'; }
    generatePDF('print-fee-slip', `FeeReceipt_${user.name.replace(/ /g,'_')}.pdf`, null);
  }).catch(err => {
    if(btn){ btn.innerHTML = originalHtml; btn.style.pointerEvents = 'auto'; }
    console.error(err);
    alert('Failed to generate fee slip.');
  });
};

// Simple number to words logic for fee slip
function numberToWords(num) {
  const a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
  const b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim();
}




window.downloadAdmitCard = downloadAdmitCard;

window.showConsolidatedMarksheet = showConsolidatedMarksheet;


document.addEventListener('DOMContentLoaded', () => {
  loadDashboard().then(() => {
    // Intercept Bottom Nav "Profile" click
    const navProfile = document.querySelector('[href="#profile"]');
    if (navProfile) {
      navProfile.addEventListener('click', (e) => {
        e.preventDefault();
        showProfileModal();
      });
    }

    // Intercept Bottom Nav "Fees" click
    const navFees = document.querySelector('[href="#fees"]');
    if (navFees) {
      navFees.addEventListener('click', (e) => {
        e.preventDefault();
        showFeesModal();
      });
    }

    // Auto-open modal based on URL hash (e.g., #fees, #profile)
    const hash = window.location.hash.replace('#', '');
    if (hash === 'fees') showFeesModal();
    if (hash === 'profile') showProfileModal();
    if (hash === 'results') showConsolidatedMarksheet();
  });
});
