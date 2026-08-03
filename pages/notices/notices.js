/**
 * pages/notices/notices.js
 */

const DEMO_NOTICES = [
  {
    title: 'Annual Sports Day – 15 August 2024',
    content: 'All students are requested to participate in the Annual Sports Day celebration. Students must wear their school uniform. Parents are cordially invited.',
    targetAudience: 'All',
    isPinned: true,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Parent-Teacher Meeting',
    content: 'PTM is scheduled for the last Saturday of every month from 10:00 AM to 1:00 PM. All parents are requested to attend.',
    targetAudience: 'All',
    isPinned: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    title: 'Fee Submission Last Date',
    content: 'Students are reminded that the last date for fee submission for this quarter is 31st August 2024. Late fee will be charged after this date.',
    targetAudience: 'Students',
    isPinned: false,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    title: 'Holiday Notice – Independence Day',
    content: 'School will be closed on 15th August 2024 on account of Independence Day. The school will host a flag hoisting ceremony at 8:00 AM.',
    targetAudience: 'All',
    isPinned: false,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

function renderNotice(notice) {
  return `
    <div class="notice-card ${notice.isPinned ? 'pinned' : ''}">
      <div class="notice-header">
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          ${notice.isPinned ? '<span class="notice-pin-badge">📌 Pinned</span>' : ''}
          <span class="notice-audience">${notice.targetAudience}</span>
        </div>
        <span class="notice-date">${Utils.formatDate(notice.createdAt)}</span>
      </div>
      <div class="notice-title">${notice.title}</div>
      <div class="notice-content">${notice.content}</div>
    </div>
  `;
}

async function loadNotices() {
  const list = document.getElementById('notices-list');
  if (!list) return;

  list.innerHTML = `
    <div class="notice-card"><div class="skeleton" style="height:80px;"></div></div>
    <div class="notice-card"><div class="skeleton" style="height:80px;"></div></div>
  `;

  try {
    const res = await API.get('/notices');
    if (res.success && res.data && res.data.length > 0) {
      list.innerHTML = res.data.map(renderNotice).join('');
    } else {
      list.innerHTML = DEMO_NOTICES.map(renderNotice).join('');
    }
  } catch {
    list.innerHTML = DEMO_NOTICES.map(renderNotice).join('');
  }
}

document.addEventListener('DOMContentLoaded', loadNotices);
