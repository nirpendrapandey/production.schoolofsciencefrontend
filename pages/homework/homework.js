/**
 * pages/homework/homework.js
 */

let allHomework = [];
let currentClass = 'All';

function renderHomework(list) {
  const container = document.getElementById('homework-list');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <div class="empty-state-title">No homework found</div>
        <div class="empty-state-desc">No assignments for the selected class right now.</div>
      </div>`;
    return;
  }

  container.innerHTML = list.map(hw => `
    <div class="hw-card">
      <div class="hw-card-header">
        <div>
          <span class="hw-subject-badge">${hw.subject}</span>
          <span class="hw-class-badge" style="margin-left:6px;">Class ${hw.class}</span>
        </div>
        ${Utils.formatDueDate(hw.dueDate)}
      </div>
      <div class="hw-title">${hw.title}</div>
      <div class="hw-desc">${Utils.truncate(hw.description, 120)}</div>
      <div class="hw-meta">
        <span class="hw-teacher">📝 ${hw.postedBy?.name || 'Teacher'}</span>
        ${hw.attachments && hw.attachments.length > 0
          ? `<a href="${Utils.resolveUrl(hw.attachments[0].fileUrl)}" class="hw-attachment" target="_blank">
               📎 Download (${hw.attachments.length})
             </a>`
          : ''}
      </div>
    </div>
  `).join('');
}

function applyClassFilter(cls) {
  currentClass = cls;
  document.querySelectorAll('.class-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.class === cls);
  });
  const filtered = cls === 'All' ? allHomework : allHomework.filter(hw => hw.class === cls);
  renderHomework(filtered);
}

async function loadHomework() {
  const container = document.getElementById('homework-list');
  container.innerHTML = `
    <div class="hw-card"><div class="skeleton" style="height:80px;"></div></div>
    <div class="hw-card"><div class="skeleton" style="height:80px;"></div></div>
    <div class="hw-card"><div class="skeleton" style="height:80px;"></div></div>
  `;

  try {
    const res = await API.get('/homework');
    if (res.success && res.data) {
      allHomework = res.data;
    } else {
      allHomework = [];
    }
  } catch {
    allHomework = [];
  }

  renderHomework(allHomework);
}

document.addEventListener('DOMContentLoaded', () => {
  loadHomework();

  document.getElementById('class-filter').addEventListener('click', (e) => {
    const chip = e.target.closest('.class-chip');
    if (chip) applyClassFilter(chip.dataset.class);
  });
});
