/**
 * pages/admin/students.js
 * Advanced student search functionality using the Supabase API.
 */

if (!Auth.requireAuth('admin', 'login.html')) {
    throw new Error('Not authorized');
}
  
const user = Auth.getUser();
if (user) {
    document.getElementById('admin-avatar').textContent = Utils.getInitials(user.name);
}

document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const q = document.getElementById('search-q').value.trim();
    const cls = document.getElementById('search-class').value;
    const tbody = document.getElementById('search-results-table');
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--color-text-muted);">Searching...</td></tr>';
    
    try {
        let url = `/students/search?q=${encodeURIComponent(q)}`;
        if (cls) url += `&class=${encodeURIComponent(cls)}`;
        
        const res = await API.get(url);
        
        if (res.success) {
            const students = res.data;
            if (students.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--color-error);">No students found matching your query.</td></tr>';
                return;
            }
            
            tbody.innerHTML = students.map(s => `
                <tr>
                    <td style="font-weight:700;color:var(--color-primary);">${s.admission_number || '—'}</td>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.class ? `Class ${s.class.class_name}` : '—'}</td>
                    <td>${s.roll_number || '—'}</td>
                    <td>${s.mobile || '—'}</td>
                    <td><span class="badge badge-${s.is_active ? 'success' : 'error'}">${s.is_active ? 'Active' : 'Inactive'}</span></td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--color-error);">${res.message || 'Search failed'}</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--color-error);">Network error during search</td></tr>';
    }
});
