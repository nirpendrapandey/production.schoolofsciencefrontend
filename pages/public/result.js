let expectedCaptchaResult = 0;
let activeExamType = '';

document.addEventListener('DOMContentLoaded', () => {
  checkResultStatus();
});

async function checkResultStatus() {
  const statusText = document.getElementById('exam-status-text');
  const searchForm = document.getElementById('result-search-form');
  
  try {
    const res = await API.get('/results/config');
    if (res.success && res.data) {
      if (res.data.isPublished && res.data.activeExam) {
        activeExamType = res.data.activeExam;
        statusText.innerHTML = `Enter your Roll Number to check the results for <strong>${activeExamType}</strong>.`;
        searchForm.style.display = 'block';
        generateCaptcha();
      } else {
        statusText.innerHTML = '<span style="color:var(--color-error);font-weight:700;">Results are not currently published or announced by the school administration. Please check back later.</span>';
        searchForm.style.display = 'none';
      }
    }
  } catch (err) {
    statusText.innerHTML = 'Unable to check result status. Please try again later.';
  }
}

function generateCaptcha() {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  expectedCaptchaResult = num1 + num2;
  document.getElementById('captcha-display').textContent = `${num1} + ${num2} = `;
  document.getElementById('captcha-input').value = '';
}

async function fetchResult(e) {
  e.preventDefault();
  
  const rollNumber = document.getElementById('roll-number').value.trim();
  const captchaInput = parseInt(document.getElementById('captcha-input').value, 10);
  
  if (captchaInput !== expectedCaptchaResult) {
    Utils.showToast('Incorrect captcha! Please try again.', 'error');
    generateCaptcha();
    return;
  }
  
  if (!rollNumber) {
    Utils.showToast('Please enter your roll number.', 'error');
    return;
  }
  
  const btn = document.getElementById('search-btn');
  btn.innerHTML = '<span class="spinner"></span> Searching...';
  btn.disabled = true;
  
  try {
    const res = await API.get(`/results/public?rollNumber=${encodeURIComponent(rollNumber)}&examType=${encodeURIComponent(activeExamType)}`);
    
    if (res.success && res.data) {
      renderMarksheet(res.data);
    } else {
      Utils.showToast(res.message || 'Result not found.', 'error');
      generateCaptcha();
    }
  } catch (err) {
    Utils.showToast('An error occurred while fetching the result.', 'error');
    generateCaptcha();
  } finally {
    btn.innerHTML = 'Check Result';
    btn.disabled = false;
  }
}

function renderMarksheet(data) {
  const student = data.student;
  const summary = data.summary;
  
  // Header
  document.getElementById('ms-exam-name').textContent = data.examType;
  
  // Info
  document.getElementById('ms-name').textContent = `: ${student.name || '—'}`;
  document.getElementById('ms-father').textContent = `: ${student.fatherName || '—'}`;
  document.getElementById('ms-class').textContent = `: ${student.className || '—'}`;
  document.getElementById('ms-roll').textContent = `: ${student.rollNumber || '—'}`;
  document.getElementById('ms-dob').textContent = `: ${Utils.formatDate(student.dateOfBirth) || '—'}`;
  
  const photoEl = document.getElementById('ms-photo');
  if (photoEl) {
    if (student.photoUrl) {
      photoEl.src = student.photoUrl.startsWith('http') ? student.photoUrl : `../../${student.photoUrl}`;
    } else {
      photoEl.src = '../../assets/images/placeholder.jpg';
    }
  }
  
  // Marks Table
  const tbody = document.getElementById('ms-marks-body');
  tbody.innerHTML = '';
  
  data.subjects.forEach(sub => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="subject-name">${sub.subject}</td>
      <td>${sub.maxMarks}</td>
      <td>${sub.marks}</td>
      <td><strong>${sub.grade}</strong></td>
    `;
    tbody.appendChild(tr);
  });
  
  // Summary
  document.getElementById('ms-total-marks').textContent = summary.totalMarks;
  document.getElementById('ms-total-max').textContent = summary.totalMaxMarks;
  document.getElementById('ms-percentage').textContent = `${summary.percentage}%`;
  
  const finalEl = document.getElementById('ms-final-result');
  finalEl.textContent = summary.finalResult;
  if (summary.finalResult === 'PASS') {
    finalEl.className = 'result-pass';
  } else {
    finalEl.className = 'result-fail';
  }
  
  // Show marksheet, hide search
  document.getElementById('search-section').style.display = 'none';
  document.getElementById('marksheet-section').style.display = 'block';
}

function resetSearch() {
  document.getElementById('marksheet-section').style.display = 'none';
  document.getElementById('search-section').style.display = 'block';
  document.getElementById('roll-number').value = '';
  generateCaptcha();
}
