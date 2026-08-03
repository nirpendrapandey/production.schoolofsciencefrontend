/**
 * pages/faculty/faculty.js
 * Fetches and renders faculty cards.
 */

// Default demo faculty for when backend is not connected
const DEFAULT_FACULTY = [
  { name: 'Shri Ramakant Pandey', subject: 'Physics', qualification: 'M.Sc. Physics, B.Ed.', photoUrl: null },
  { name: 'Mrs. Sunita Sharma',   subject: 'Mathematics', qualification: 'M.Sc. Mathematics, B.Ed.', photoUrl: null },
  { name: 'Mr. Anil Kumar',       subject: 'Chemistry', qualification: 'M.Sc. Chemistry, B.Ed.', photoUrl: null },
  { name: 'Mrs. Priya Singh',     subject: 'English', qualification: 'M.A. English, B.Ed.', photoUrl: null },
  { name: 'Mr. Ravi Gupta',       subject: 'Biology', qualification: 'M.Sc. Biology, B.Ed.', photoUrl: null },
  { name: 'Mrs. Kavita Joshi',    subject: 'History & Civics', qualification: 'M.A. History, B.Ed.', photoUrl: null },
  { name: 'Mr. Suresh Yadav',     subject: 'Computer Science', qualification: 'B.Tech CSE, M.Sc.IT', photoUrl: null },
  { name: 'Mrs. Rekha Mishra',    subject: 'Hindi', qualification: 'M.A. Hindi, B.Ed.', photoUrl: null },
];

function renderFacultyCard(member) {
  const initials = Utils.getInitials(member.name);
  const photoUrl = member.photoUrl ? Utils.resolveUrl(member.photoUrl) : null;

  return `
    <div class="faculty-card card">
      <div class="faculty-photo-wrap">
        <div class="faculty-avatar">
          ${photoUrl
            ? `<img src="${photoUrl}" alt="${member.name}" loading="lazy"
                 onerror="this.style.display='none';this.parentElement.textContent='${initials}';" />`
            : initials}
        </div>
      </div>
      <div class="faculty-details">
        <div class="faculty-name">${member.name}</div>
        <div class="faculty-subject">${member.subject}</div>
        <div class="faculty-qual">${member.qualification}</div>
      </div>
    </div>
  `;
}

async function loadFaculty() {
  const list = document.getElementById('faculty-list');
  if (!list) return;

  try {
    const res = await API.get('/faculty');

    if (res.success && res.data && res.data.length > 0) {
      list.innerHTML = res.data.map(renderFacultyCard).join('');
    } else {
      // Fallback to default faculty
      list.innerHTML = DEFAULT_FACULTY.map(renderFacultyCard).join('');
    }
  } catch (err) {
    list.innerHTML = DEFAULT_FACULTY.map(renderFacultyCard).join('');
  }
}

document.addEventListener('DOMContentLoaded', loadFaculty);
