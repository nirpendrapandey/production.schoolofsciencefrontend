/**
 * pages/facilities/facilities.js
 */

const DEFAULT_FACILITIES = [
  { icon: '🚌', name: 'School Transport (2 Vans)', description: 'Safe and secure school van facilities for student commute' },
  { icon: '📷', name: '24x7 CCTV Security',  description: 'Complete round-the-clock camera surveillance for campus safety' },
  { icon: '🚻', name: 'Separate Toilets',  description: 'Clean, hygienic, and separate toilet facilities for boys and girls' },
  { icon: '🏫', name: 'Well-Furnished Classrooms', description: 'Spacious, well-ventilated, and fully furnished classrooms with comfortable benches' },
  { icon: '💧', name: 'Purified Drinking Water', description: 'RO purified safe drinking water systems installed for all students' },
  { icon: '⚡', name: '24x7 Power Backup', description: 'Uninterrupted electricity supply with generator backup for classrooms' },
  { icon: '🔬', name: 'Science Labs', description: 'Equipped practical laboratories for Physics, Chemistry, and Biology experiments' },
  { icon: '💻', name: 'Computer Education', description: 'Practical computer classes to build essential digital and computer literacy' },
  { icon: '⚽', name: 'Sports & Athletics', description: 'Healthy physical development with active sports, outdoor activities, and games' },
  { icon: '🤝', name: 'Parent-Teacher Meetings (PTM)', description: 'Regular PTM meetings to discuss student academic progress and collaborate with parents' },
];

function renderFacility(facility) {
  return `
    <div class="facility-card">
      <div class="facility-icon-wrap">${facility.icon}</div>
      <div class="facility-name">${facility.name}</div>
      <div class="facility-desc">${facility.description || ''}</div>
    </div>
  `;
}

async function loadFacilities() {
  const list = document.getElementById('facilities-list');
  if (!list) return;

  try {
    const res = await API.get('/facilities');
    if (res.success && res.data && res.data.length > 0) {
      list.innerHTML = res.data.map(f => renderFacility({ icon: f.icon, name: f.name, description: f.description })).join('');
    } else {
      list.innerHTML = DEFAULT_FACILITIES.map(renderFacility).join('');
    }
  } catch {
    list.innerHTML = DEFAULT_FACILITIES.map(renderFacility).join('');
  }
}

document.addEventListener('DOMContentLoaded', loadFacilities);
