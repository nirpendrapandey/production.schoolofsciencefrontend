/**
 * pages/gallery/gallery.js
 */

let allImages = [];
let currentFilter = 'All';

// Demo images (shown when backend is offline)
const DEMO_IMAGES = [
  { title: 'School Students Group Photo 1', category: 'Classroom', imageUrl: '../../assets/gallery/photo1.png', emoji: '👩‍🎓' },
  { title: 'School Students Group Photo 2', category: 'Classroom', imageUrl: '../../assets/gallery/photo2.png', emoji: '🧑‍🤝‍🧑' },
  { title: 'Morning Assembly Awards Ceremony', category: 'Celebrations', imageUrl: '../../assets/gallery/photo3.png', emoji: '🏆' },
  { title: '24/7 CCTV Monitoring System', category: 'Facilities', imageUrl: '../../assets/gallery/photo4.png', emoji: '📷' },
  { title: 'Morning Assembly Juniors', category: 'Celebrations', imageUrl: '../../assets/gallery/photo5.jpg', emoji: '🎒' },
  { title: 'School Transport Van', category: 'Facilities', imageUrl: '../../assets/gallery/van.png', emoji: '🚌' },
];

function renderGallery(images) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  if (!images || images.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;">
        <div class="empty-state">
          <div class="empty-state-icon">🖼️</div>
          <div class="empty-state-title">No photos yet</div>
          <div class="empty-state-desc">Gallery photos will appear here soon.</div>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = images.map((img, i) => {
    if (img.imageUrl) {
      const src = Utils.resolveUrl(img.imageUrl);
      return `
        <div class="gallery-item" onclick="openLightbox('${src}', '${img.title || ''}')" data-index="${i}">
          <img src="${src}" alt="${img.title || 'Gallery'}" loading="lazy"
               onerror="this.parentElement.innerHTML='<div class=gallery-placeholder><span>${img.emoji || '🖼️'}</span></div>'" />
          ${img.title ? `<div class="gallery-item-overlay"><div class="gallery-item-title">${img.title}</div></div>` : ''}
        </div>
      `;
    } else {
      // Demo placeholder
      return `
        <div class="gallery-placeholder">
          ${img.emoji || '🖼️'}
          <span>${img.title || ''}</span>
        </div>
      `;
    }
  }).join('');
}

function openLightbox(src, caption) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox-caption').textContent = caption || '';
  document.getElementById('lightbox').classList.remove('hidden');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
  document.getElementById('lightbox-img').src = '';
}

function applyFilter(filter) {
  currentFilter = filter;

  // Update active tab
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.filter === filter);
  });

  const filtered = filter === 'All' ? allImages : allImages.filter(img => img.category === filter);
  renderGallery(filtered);
}

async function loadGallery() {
  try {
    const res = await API.get('/gallery');
    if (res.success && res.data && res.data.length > 0) {
      allImages = res.data;
    } else {
      allImages = DEMO_IMAGES;
    }
  } catch {
    allImages = DEMO_IMAGES;
  }

  renderGallery(allImages);
}

document.addEventListener('DOMContentLoaded', () => {
  loadGallery();

  // Filter tabs
  document.getElementById('filter-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (tab) applyFilter(tab.dataset.filter);
  });

  // Lightbox close
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target === document.getElementById('lightbox')) closeLightbox();
  });
});
