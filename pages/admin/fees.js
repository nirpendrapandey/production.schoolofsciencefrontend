/**
 * pages/admin/fees.js
 * Fee Management – search student by roll no, mark monthly fees paid/unpaid,
 * generate downloadable receipt.
 */

// ── Auth Guard ────────────────────────────────────────────────────────────────
if (!Auth.requireAuth('admin', 'login.html')) {
  throw new Error('Not authorized');
}

const user = Auth.getUser();
if (user) {
  document.getElementById('admin-avatar').textContent = getInitials(user.name);
}

document.addEventListener('DOMContentLoaded', () => {
  const yearSelect = document.getElementById('year-select');
  if (yearSelect) {
    yearSelect.innerHTML = ''; // clear hardcoded
    const baseYear = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    for (let i = 0; i < 3; i++) {
      const y = baseYear - i;
      yearSelect.options.add(new Option(`${y}–${String(y + 1).slice(-2)}`, y));
    }
  }
});

// ── Constants ────────────────────────────────────────────────────────────────
const MONTHS = [
  { num: 4,  name: 'April' },
  { num: 5,  name: 'May' },
  { num: 6,  name: 'June' },
  { num: 7,  name: 'July' },
  { num: 8,  name: 'August' },
  { num: 9,  name: 'September' },
  { num: 10, name: 'October' },
  { num: 11, name: 'November' },
  { num: 12, name: 'December' },
  { num: 1,  name: 'January' },
  { num: 2,  name: 'February' },
  { num: 3,  name: 'March' },
];

let currentStudent = null;
let currentFees    = [];  // fee records from API

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => { t.classList.remove('show'); }, 3000);
}

function fmtDate(iso) {
  if (!iso) return '–';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtAmount(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

// ── Get Selected Year ─────────────────────────────────────────────────────────
function getYear() {
  return parseInt(document.getElementById('year-select').value);
}

// ── Search Student ────────────────────────────────────────────────────────────
async function searchStudent() {
  const roll = document.getElementById('roll-input').value.trim();
  if (!roll) { showToast('Roll number daalo!', 'error'); return; }

  const btn = document.getElementById('search-btn');
  btn.innerHTML = '<span class="spinner"></span> Searching...';
  btn.disabled = true;

  try {
    const res = await API.get(`/students/search?q=${encodeURIComponent(roll)}`);
    if (!res.success || !res.data || res.data.length === 0) {
      showToast('Student nahi mila', 'error');
      hideStudentUI();
      return;
    }
    
    // Try to find exact roll match, otherwise pick first
    let student = res.data.find(s => String(s.roll_number) === String(roll)) || res.data[0];
    
    const feeRes = await API.get(`/fees?student=${student.id}`);
    
    currentStudent = student;
    currentFees    = feeRes.success ? feeRes.data : [];

    showStudentCard(currentStudent);
    renderMonths();
    showToast(`${currentStudent.name} mil gaya! ✅`, 'success');

  } catch (err) {
    showToast('Network error', 'error');
  } finally {
    btn.innerHTML = 'Search Student';
    btn.disabled = false;
  }
}

// Allow Enter key and Auto-search (debounce)
let searchTimeout = null;
document.getElementById('roll-input').addEventListener('keyup', e => {
  if (e.key === 'Enter') {
    clearTimeout(searchTimeout);
    searchStudent();
  } else {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const val = e.target.value.trim();
      if (val.length > 0) {
        searchStudent();
      }
    }, 600); // 600ms debounce
  }
});

// ── Show Student Card ─────────────────────────────────────────────────────────
function showStudentCard(s) {
  const className = s.classes ? `Class ${s.classes.class_name}` : '—';
  const section   = s.sections ? ` – Section ${s.sections.section_name}` : '';

  document.getElementById('stu-initials').textContent = getInitials(s.name);
  document.getElementById('stu-name').textContent     = s.name;
  document.getElementById('stu-meta').textContent     = `${className}${section} | ${s.admission_number || '—'}`;
  document.getElementById('stu-roll').textContent     = s.roll_number   || '—';
  document.getElementById('stu-adm').textContent      = s.admission_number || '—';
  document.getElementById('stu-class').textContent    = className;
  document.getElementById('stu-mobile').textContent   = s.mobile        || '—';
  document.getElementById('stu-father').textContent   = s.father_name   || '—';
  document.getElementById('stu-mother').textContent   = s.mother_name   || '—';

  document.getElementById('student-card').classList.add('visible');
  document.getElementById('fee-config').classList.add('visible');
  document.getElementById('fee-section').classList.add('visible');
  document.getElementById('fee-summary').classList.add('visible');
}

function hideStudentUI() {
  document.getElementById('student-card').classList.remove('visible');
  document.getElementById('fee-config').classList.remove('visible');
  document.getElementById('fee-section').classList.remove('visible');
  document.getElementById('fee-summary').classList.remove('visible');
  currentStudent = null;
  currentFees    = [];
}

// ── Render Month Cards ────────────────────────────────────────────────────────
function renderMonths() {
  if (!currentStudent) return;

  const year  = getYear();
  const grid  = document.getElementById('months-grid');
  grid.innerHTML = '';

  let totalPaid    = 0;
  let totalAmount  = 0;
  let paidMonths   = 0;

  // Map fees by month for quick lookup: key = "month-year"
  const feeMap = {};
  currentFees.forEach(f => {
    const key = `${f.month}-${f.year}`;
    feeMap[key] = f;
  });

  MONTHS.forEach(({ num, name }) => {
    // April–Dec belong to `year`, Jan–Mar belong to `year+1`
    const feeYear = num >= 4 ? year : year + 1;
    const key     = `${num}-${feeYear}`;
    const fee     = feeMap[key];
    const isPaid  = fee && fee.payment_status === 'paid';

    if (isPaid) {
      paidMonths++;
      totalAmount += parseFloat(fee.amount || 0);
    }

    const card = document.createElement('div');
    card.className = `month-card ${isPaid ? 'paid' : 'pending'}`;
    card.id        = `month-card-${num}`;
    card.innerHTML = `
      <div class="month-card-top">
        <div class="month-name">${name}</div>
        <span class="month-badge ${isPaid ? 'badge-paid' : 'badge-pending'}">
          ${isPaid ? '✅ Paid' : '⏳ Due'}
        </span>
      </div>
      <div class="month-amount">${fmtAmount(isPaid ? fee.amount : document.getElementById('fee-amount').value)}</div>
      ${isPaid
        ? `<div class="month-paid-date">📅 ${fmtDate(fee.payment_date)}</div>
           <div class="month-receipt">🧾 ${fee.receipt_number || '—'}</div>`
        : '<div class="month-paid-date" style="opacity:0.4;">Payment pending</div><div class="month-receipt"></div>'
      }
      <button class="btn-mark-paid ${isPaid ? 'paid-btn' : 'unpaid'}"
        id="btn-${num}"
        onclick="togglePaid(${num}, ${feeYear}, ${isPaid ? `'${fee.id}'` : 'null'})">
        ${isPaid ? '✅ Paid – Undo karo' : '💳 Mark as Paid'}
      </button>
      ${isPaid ? `<button onclick="showReceipt(${num}, ${feeYear})" style="width:100%;margin-top:6px;padding:7px;background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:8px;color:#1d4ed8;font-size:12px;font-weight:700;cursor:pointer;">📄 Download Receipt</button>` : ''}
    `;
    grid.appendChild(card);
  });

  updateSummary(paidMonths, totalAmount);
}

// ── Update Summary Bar ────────────────────────────────────────────────────────
function updateSummary(paidMonths, totalAmount) {
  const monthlyFee = parseFloat(document.getElementById('fee-amount').value) || 0;
  const pending    = 12 - paidMonths;
  const due        = pending * monthlyFee;

  document.getElementById('sum-paid').textContent    = paidMonths;
  document.getElementById('sum-pending').textContent = pending;
  document.getElementById('sum-amount').textContent  = fmtAmount(totalAmount);
  document.getElementById('sum-due').textContent     = fmtAmount(due);
}

// ── Toggle Paid / Unpaid ──────────────────────────────────────────────────────
async function togglePaid(month, year, existingFeeId) {
  if (!currentStudent) return;

  const btn       = document.getElementById(`btn-${month}`);
  const isPaid    = btn.classList.contains('paid-btn');
  const amount    = parseFloat(document.getElementById('fee-amount').value) || 0;
  const payMode   = document.getElementById('payment-mode').value;

  btn.disabled     = true;
  btn.innerHTML    = '<span class="spinner"></span>';

  try {
    if (isPaid) {
      // Un-mark as paid
      const res = await API.delete(
        `/fees/mark-paid?student=${currentStudent.id}&month=${month}&year=${year}`
      );
      if (res.success) {
        // Remove from currentFees
        currentFees = currentFees.filter(f => !(f.month === month && f.year === year));
        renderMonths();
        showToast(`${getMonthName(month)} unpaid ho gaya`, 'info');
      } else {
        showToast(res.message || 'Error!', 'error');
      }
    } else {
      // Mark as paid
      const res = await API.post('/fees/mark-paid', {
        studentId: currentStudent.id,
        month, year, amount, paymentMode: payMode
      });
      if (res.success) {
        // Add / update in currentFees
        currentFees = currentFees.filter(f => !(f.month === month && f.year === year));
        currentFees.push(res.data);
        renderMonths();
        showToast(`${getMonthName(month)} – Paid Mark ho gaya! ✅`, 'success');
      } else {
        showToast(res.message || 'Error!', 'error');
      }
    }
  } catch (err) {
    showToast('Network error', 'error');
    btn.disabled  = false;
    btn.innerHTML = isPaid ? '✅ Paid – Undo karo' : '💳 Mark as Paid';
  }
}

function getMonthName(num) {
  return MONTHS.find(m => m.num === num)?.name || num;
}

// ── Show Receipt / Bill ───────────────────────────────────────────────────────
function showReceipt(month, year) {
  const feeYear = month >= 4 ? year : year + 1;
  // Actually year was already adjusted in togglePaid/renderMonths
  const fee     = currentFees.find(f => f.month === month && f.year === feeYear);
  if (!fee) { showToast('Fee record nahi mila', 'error'); return; }

  const s       = currentStudent;
  const className = s.classes ? `Class ${s.classes.class_name}` : '—';

  document.getElementById('receipt-content').innerHTML = `
    <div class="receipt-header">
      <div class="receipt-school">🏫 SCHOOL OF SCIENCE</div>
      <div class="receipt-sub">Shri Ramakant Pandey | A Rural School of Excellence</div>
      <div class="receipt-title">Fee Receipt</div>
    </div>
    <div class="receipt-row"><span>Receipt No.</span><strong>${fee.receipt_number || '—'}</strong></div>
    <div class="receipt-row"><span>Date</span><strong>${fmtDate(fee.payment_date)}</strong></div>
    <hr style="border:none;border-top:1px dashed #ccc;margin:10px 0;">
    <div class="receipt-row"><span>Student Name</span><strong>${s.name}</strong></div>
    <div class="receipt-row"><span>Roll Number</span><strong>${s.roll_number || '—'}</strong></div>
    <div class="receipt-row"><span>Admission No.</span><strong>${s.admission_number || '—'}</strong></div>
    <div class="receipt-row"><span>Class</span><strong>${className}</strong></div>
    <div class="receipt-row"><span>Father's Name</span><strong>${s.father_name || '—'}</strong></div>
    <hr style="border:none;border-top:1px dashed #ccc;margin:10px 0;">
    <div class="receipt-row"><span>Month</span><strong>${getMonthName(month)} ${feeYear}</strong></div>
    <div class="receipt-row"><span>Payment Mode</span><strong>${(fee.payment_mode || 'cash').toUpperCase()}</strong></div>
    <div class="receipt-total">
      <div class="receipt-row"><span>Fee Amount</span><strong>${fmtAmount(fee.amount)}</strong></div>
    </div>
    <div style="text-align:center;margin-top:20px;">
      <div class="receipt-stamp">PAID ✓</div>
    </div>
    <div class="receipt-footer">
      This is a computer-generated receipt.<br>
      School of Science – "${s.roll_number}" – ${getMonthName(month)} ${feeYear}
    </div>
  `;

  document.getElementById('print-receipt').classList.add('visible');
}

function closeReceipt() {
  document.getElementById('print-receipt').classList.remove('visible');
}

// Close receipt on backdrop click (outside paper)
document.getElementById('print-receipt').addEventListener('click', function(e) {
  if (e.target === this) closeReceipt();
});

// ── Re-render on fee amount change ────────────────────────────────────────────
document.getElementById('fee-amount').addEventListener('change', () => {
  if (currentStudent) renderMonths();
});

// ── Expose globals ────────────────────────────────────────────────────────────
window.searchStudent = searchStudent;
window.renderMonths  = renderMonths;
window.togglePaid    = togglePaid;
window.showReceipt   = showReceipt;
window.closeReceipt  = closeReceipt;
