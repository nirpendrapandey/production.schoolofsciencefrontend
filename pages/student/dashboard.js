/**
 * pages/student/dashboard.js
 */

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.dash-tab').forEach(el => el.classList.remove('active'));

  const tabEl = document.getElementById(`tab-${tabId}`);
  if (tabEl) {
    tabEl.classList.add('active');
    // Scroll the tab bar into view so user can see the opened section
    const tabBar = document.querySelector('.dashboard-tabs');
    if (tabBar) {
      tabBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const tabBtn = document.querySelector(`[data-tab="${tabId}"]`);
  if (tabBtn) {
    tabBtn.classList.add('active');
    // Scroll the active tab button into view inside the tab bar
    tabBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

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
  document.getElementById('pf-roll').textContent = user.rollNumber || '—';
  document.getElementById('pf-phone').textContent = user.phone || '—';

  // Logout button
  document.getElementById('logout-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      Auth.logout('../../index.html');
    }
  });

  // Load homework for student's class
  try {
    const hwRes = await API.get(`/homework?class=${user.class}`);
    const homeworkList = hwRes.success ? hwRes.data : [];

    document.getElementById('stat-hw').textContent = homeworkList.length;

    const hwContent = document.getElementById('homework-content');
    if (homeworkList.length > 0) {
      hwContent.innerHTML = homeworkList.slice(0, 5).map(renderHomeworkItem).join('');
    } else {
      hwContent.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📚</div>
        <div class="empty-state-title">No homework yet</div>
        <div class="empty-state-desc">Your teacher hasn't assigned any homework.</div></div>`;
    }
  } catch { document.getElementById('stat-hw').textContent = '0'; }

  // Load attendance summary
  try {
    const attRes = await API.get('/attendance/summary');
    if (attRes.success) {
      const { present, absent, percentage } = attRes.data;
      document.getElementById('stat-att').textContent = `${percentage}%`;
      document.getElementById('att-present').textContent = present;
      document.getElementById('att-absent').textContent = absent;
      document.getElementById('att-pct').textContent = `${percentage}%`;
      document.getElementById('att-bar').style.width = `${percentage}%`;
      document.getElementById('att-bar').style.background =
        percentage >= 75 ? 'var(--color-success)' :
        percentage >= 50 ? 'var(--color-warning)' : 'var(--color-error)';
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
      document.getElementById('stat-grade').textContent = grade;

      document.getElementById('results-content').innerHTML =
        resData.data.slice(0, 5).map(renderResultItem).join('');
    } else {
      document.getElementById('stat-grade').textContent = '—';
      document.getElementById('results-content').innerHTML = `
        <div class="empty-state"><div class="empty-state-icon">📊</div>
        <div class="empty-state-title">No results yet</div>
        <div class="empty-state-desc">Results will appear here once uploaded.</div></div>`;
    }
  } catch {}

  // Load notices
  try {
    const notRes = await API.get('/notices');
    if (notRes.success && notRes.data.length > 0) {
      document.getElementById('notices-content').innerHTML =
        notRes.data.slice(0, 3).map(renderNoticeItem).join('');
    } else {
      document.getElementById('notices-content').innerHTML = `
        <div class="empty-state"><div class="empty-state-icon">📢</div>
        <div class="empty-state-title">No notices</div></div>`;
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

function showConsolidatedReceipt() {
  const yearSelect = document.getElementById('student-fee-year');
  const selectedYearLabel = yearSelect.options[yearSelect.selectedIndex]?.text || '';
  const currentYear = parseInt(yearSelect.value);
  
  // Find all paid fees for the selected academic year
  const paidFees = [];
  let totalAmount = 0;
  
  FEE_MONTHS.forEach(({ num, name }) => {
    const feeYear = num >= 4 ? currentYear : currentYear + 1;
    const mStr = String(num);
    const fee = _studentFees.find(f => String(f.month) === mStr && parseInt(f.year) === feeYear && f.payment_status === 'paid');
    
    if (fee) {
      paidFees.push({ monthName: name, year: feeYear, ...fee });
      totalAmount += Number(fee.amount || 0);
    }
  });

  if (paidFees.length === 0) {
    alert('No paid fees available for the selected session.');
    return;
  }

  const user = Auth.getUser();

  let tableRows = paidFees.map((fee, index) => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:10px 4px;">${index + 1}</td>
      <td style="padding:10px 4px;">${fee.monthName} ${fee.year}</td>
      <td style="padding:10px 4px;">${fee.receipt_number || '—'}</td>
      <td style="padding:10px 4px;">${fmtFeeDate(fee.payment_date)}</td>
      <td style="padding:10px 4px;text-align:right;">₹${Number(fee.amount || 0).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  document.getElementById('fee-receipt-body').innerHTML = `
    <div style="text-align:center;border-bottom:2px dashed #1e3a8a;padding-bottom:16px;margin-bottom:20px;">
      <div style="font-size:24px;font-weight:800;color:#1e3a8a;letter-spacing:1px;">🏫 SCHOOL OF SCIENCE</div>
      <div style="font-size:12px;color:#64748b;margin-bottom:12px;">A Rural School of Excellence</div>
      <div style="display:inline-block;background:#eff6ff;color:#1d4ed8;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:800;text-transform:uppercase;border:1px solid #bfdbfe;">
        Consolidated Fee Statement
      </div>
    </div>
    
    <div style="display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;">
      <div>
        <div style="margin-bottom:6px;"><span style="color:#64748b;margin-right:8px;">Student Name:</span> <strong>${user.name}</strong></div>
        <div style="margin-bottom:6px;"><span style="color:#64748b;margin-right:8px;">Roll Number:</span> <strong>${user.rollNumber || '—'}</strong></div>
      </div>
      <div style="text-align:right;">
        <div style="margin-bottom:6px;"><span style="color:#64748b;margin-right:8px;">Session:</span> <strong>${selectedYearLabel}</strong></div>
        <div style="margin-bottom:6px;"><span style="color:#64748b;margin-right:8px;">Date:</span> <strong>${fmtFeeDate(new Date().toISOString())}</strong></div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
      <thead>
        <tr style="background:#f1f5f9;border-bottom:2px solid #cbd5e1;text-align:left;">
          <th style="padding:10px 4px;font-weight:700;">#</th>
          <th style="padding:10px 4px;font-weight:700;">Month</th>
          <th style="padding:10px 4px;font-weight:700;">Receipt No.</th>
          <th style="padding:10px 4px;font-weight:700;">Paid On</th>
          <th style="padding:10px 4px;font-weight:700;text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div style="border-top:2px solid #1e3a8a;padding-top:16px;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:12px;color:#64748b;max-width:200px;">
        <div style="margin-bottom:4px;">Payment Mode: <strong>Mixed/Various</strong></div>
        <div>Total Months Paid: <strong>${paidFees.length}</strong></div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Total Amount Received</div>
        <div style="font-size:22px;font-weight:800;color:#1e3a8a;">₹${totalAmount.toLocaleString('en-IN')}</div>
      </div>
    </div>
    
    <div style="text-align:center;margin-top:30px;position:relative;">
      <span style="display:inline-block;border:3px solid #15803d;color:#15803d;padding:8px 24px;border-radius:6px;font-size:18px;font-weight:800;transform:rotate(-5deg);letter-spacing:2px;opacity:0.8;">PAID IN FULL ✓</span>
    </div>
    
    <div style="text-align:center;margin-top:30px;font-size:11px;color:#94a3b8;border-top:1px dashed #e2e8f0;padding-top:16px;">
      This is a computer-generated consolidated receipt and does not require a physical signature.<br>
      School of Science – Education for Every Child
    </div>
  `;

  document.getElementById('fee-receipt-modal').style.display = 'block';
}

function closeFeeReceipt() {
  document.getElementById('fee-receipt-modal').style.display = 'none';
}

window.showConsolidatedReceipt = showConsolidatedReceipt;
window.closeFeeReceipt = closeFeeReceipt;
window.showTab = showTab;

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
    let baseYear = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
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

    document.getElementById('admit-card-modal').style.display = 'block';

  } catch (err) {
    console.error(err);
    alert('Could not generate Admit Card. Please try again.');
  } finally {
    if(btn) btn.style.opacity = '1';
  }
}

function closeAdmitCard() {
  document.getElementById('admit-card-modal').style.display = 'none';
}

async function showConsolidatedMarksheet() {
  try {
    const res = await API.get('/results');
    if (!res.success || !res.data || res.data.length === 0) {
      alert('⚠️ No results found to generate marksheet.');
      return;
    }

    const user = Auth.getUser();
    const results = res.data;
    
    // Grab the first examType from the results list
    const examType = results[0].examType || 'Examination';

    // Filter results for this examType
    const examResults = results.filter(r => r.examType === examType);

    let totalMarks = 0;
    let totalMaxMarks = 0;

    const subjectsHtml = examResults.map(r => {
      totalMarks += Number(r.marks || 0);
      totalMaxMarks += Number(r.maxMarks || 0);
      return `
        <tr>
          <td class="subject-name">${r.subject}</td>
          <td>${r.maxMarks}</td>
          <td>${r.marks}</td>
          <td><strong>${r.grade}</strong></td>
        </tr>
      `;
    }).join('');

    const overallPct = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;
    const finalResult = overallPct >= 40 ? 'PASS' : 'FAIL';
    
    const photoUrl = user.photoUrl ? user.photoUrl : '../../assets/images/placeholder.jpg';

    document.getElementById('student-marksheet-body').innerHTML = `
      <div class="marksheet">
        <div class="marksheet-content">
          <div class="marksheet-header">
            <div class="marksheet-emblem">
              <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" stroke="#1E3A8A" stroke-width="4" fill="#FFF8E1"/>
                <path d="M50 20 L25 40 L50 60 L75 40 Z" fill="#1E3A8A"/>
                <path d="M35 50 L35 70 Q50 82 65 70 L65 50" stroke="#1E3A8A" stroke-width="3" fill="none"/>
                <circle cx="50" cy="40" r="6" fill="#F7C948"/>
              </svg>
            </div>
            <h1>School Of Science</h1>
            <h3>Rural India's Finest School</h3>
            <div class="marksheet-sub-title">Affiliated to Board of High School & Intermediate Education, U.P.</div>
            <h4>${examType} Marksheet</h4>
          </div>
          
          <div class="student-info">
            <table class="info-table">
              <tr>
                <td class="info-label">Student Name</td>
                <td>: ${user.name}</td>
              </tr>
              <tr>
                <td class="info-label">Father's Name</td>
                <td>: ${user.fatherName || '—'}</td>
              </tr>
              <tr>
                <td class="info-label">Class</td>
                <td>: Class ${user.class || '—'}</td>
              </tr>
              <tr>
                <td class="info-label">Roll Number</td>
                <td>: ${user.rollNumber || '—'}</td>
              </tr>
              <tr>
                <td class="info-label">Date of Birth</td>
                <td>: ${user.dateOfBirth ? Utils.formatDate(user.dateOfBirth) : '—'}</td>
              </tr>
            </table>
          </div>

          <table class="marks-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Max Marks</th>
                <th>Marks Obtained</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${subjectsHtml}
            </tbody>
          </table>

          <div class="marksheet-summary">
            <div>Total Marks: <span style="color:var(--color-primary)">${totalMarks}</span> / <span>${totalMaxMarks}</span></div>
            <div>Percentage: <span style="color:var(--color-primary)">${overallPct}%</span></div>
            <div class="${finalResult === 'PASS' ? 'result-pass' : 'result-fail'}">${finalResult}</div>
          </div>

          <div class="signatures">
            <div class="sig-line">
              Class Teacher Signature
              <div class="sig-title">School Of Science</div>
            </div>
            <div class="sig-line">
              Principal & Director
              <div class="sig-title">Shri Ramakant Pandey</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('marksheet-modal').style.display = 'block';

  } catch (err) {
    console.error(err);
    alert('Could not load marksheet. Please try again.');
  }
}

function closeMarksheetModal() {
  document.getElementById('marksheet-modal').style.display = 'none';
}

window.downloadAdmitCard = downloadAdmitCard;
window.closeAdmitCard = closeAdmitCard;
window.showConsolidatedMarksheet = showConsolidatedMarksheet;
window.closeMarksheetModal = closeMarksheetModal;

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard().then(() => {
    // Auto-open tab based on URL hash (e.g., #fees, #results)
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['homework', 'attendance', 'results', 'notices', 'fees', 'profile'];
    if (hash && validTabs.includes(hash)) {
      showTab(hash);
    }
  });
});
