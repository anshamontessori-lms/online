/* =========================================================
   ANSHA MONTESSORI LMS — UTILS.JS
   General utilities: dates, toasts, modals, formatting
   ========================================================= */

// Load Font Awesome 6
(function () {
  if (document.querySelector('link[href*="font-awesome"]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.crossOrigin = 'anonymous';
  l.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
  document.head.appendChild(l);
})();

/* ---- Date helpers ---- */
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function daysAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}
function isOverdue(dateStr) {
  return dateStr && new Date(dateStr) < new Date();
}

/* ---- Toast notifications ---- */
function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ---- Confirm dialog ---- */
function showConfirm(message, onConfirm, title = 'Confirm Action') {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop active';
  backdrop.innerHTML = `
    <div class="modal" style="max-width:400px;">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">×</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--gray-600)">${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cancel</button>
        <button class="btn btn-danger" id="confirm-yes">Confirm</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector('#confirm-yes').onclick = () => {
    backdrop.remove();
    onConfirm();
  };
}

/* ---- Modal helpers ---- */
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
}
function closeAllModals() {
  document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
}
// Close modal on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) closeAllModals();
});

/* ---- String helpers ---- */
function truncate(str, n = 80) {
  return str && str.length > n ? str.slice(0, n) + '…' : (str || '');
}
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
function formatCurrency(amount) {
  return 'Rs. ' + Number(amount).toLocaleString('en-PK');
}

/* ---- Avatar helper ---- */
function avatarHtml(user, size = '') {
  return `<div class="avatar ${size}" style="background:var(--primary-light);color:var(--primary);">${user.avatar || getInitials(user.name)}</div>`;
}

/* ---- Badge helpers ---- */
function roleBadge(role) {
  const map = { admin: 'badge-info', teacher: 'badge-primary', student: 'badge-accent' };
  return `<span class="badge ${map[role] || 'badge-gray'}">${capitalize(role)}</span>`;
}
function statusBadge(status) {
  const map = { active: 'badge-success', completed: 'badge-primary', inactive: 'badge-gray', pending: 'badge-warning', paid: 'badge-success', unpaid: 'badge-danger' };
  return `<span class="badge ${map[status] || 'badge-gray'}">${capitalize(status)}</span>`;
}
function progressBar(pct, color = '') {
  const c = pct >= 100 ? 'success' : pct >= 50 ? '' : 'accent';
  return `<div class="flex items-center gap-2">
    <div class="progress flex-1"><div class="progress-bar ${color || c}" style="width:${pct}%"></div></div>
    <span class="text-xs text-muted">${pct}%</span>
  </div>`;
}

/* ---- Search/filter ---- */
function filterTable(inputId, tableId, colIndices) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', () => {
    const query = input.value.toLowerCase();
    const rows = document.querySelectorAll(`#${tableId} tbody tr`);
    rows.forEach(row => {
      const text = colIndices
        ? colIndices.map(i => row.cells[i]?.textContent || '').join(' ').toLowerCase()
        : row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  });
}

/* ---- Sidebar active state ---- */
function setActiveNav() {
  const page = window.location.pathname.split('/').pop().replace('.html', '');
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href') || '';
    if (href.includes(page)) item.classList.add('active');
  });
}

/* ---- Build sidebar HTML ---- */
function buildSidebar(user) {
  const adminNav = `
    <div class="nav-section-title">Main</div>
    <a href="dashboard.html" class="nav-item"><span class="nav-icon"><i class="fa-solid fa-gauge-high"></i></span> Dashboard</a>
    <a href="students.html"  class="nav-item"><span class="nav-icon"><i class="fa-solid fa-user-graduate"></i></span> Students</a>
    <a href="teachers.html"  class="nav-item"><span class="nav-icon"><i class="fa-solid fa-chalkboard-user"></i></span> Teachers</a>
    <div class="nav-section-title">Academic</div>
    <a href="courses.html"   class="nav-item"><span class="nav-icon"><i class="fa-solid fa-book-open"></i></span> Courses</a>
    <a href="lessons.html"   class="nav-item"><span class="nav-icon"><i class="fa-solid fa-video"></i></span> Lessons & PDFs</a>
    <a href="results.html"   class="nav-item"><span class="nav-icon"><i class="fa-solid fa-trophy"></i></span> Exam Results</a>
    <a href="fees.html"      class="nav-item"><span class="nav-icon"><i class="fa-solid fa-coins"></i></span> Fee Management</a>
    <a href="reports.html"   class="nav-item"><span class="nav-icon"><i class="fa-solid fa-chart-line"></i></span> Reports</a>`;

  const teacherNav = `
    <div class="nav-section-title">Main</div>
    <a href="dashboard.html"    class="nav-item"><span class="nav-icon"><i class="fa-solid fa-gauge-high"></i></span> Dashboard</a>
    <a href="courses.html"      class="nav-item"><span class="nav-icon"><i class="fa-solid fa-book-open"></i></span> My Courses</a>
    <div class="nav-section-title">Content</div>
    <a href="lessons.html"      class="nav-item"><span class="nav-icon"><i class="fa-solid fa-video"></i></span> Lessons</a>
    <a href="quizzes.html"      class="nav-item"><span class="nav-icon"><i class="fa-solid fa-circle-question"></i></span> Quizzes</a>
    <a href="assignments.html"  class="nav-item"><span class="nav-icon"><i class="fa-solid fa-file-lines"></i></span> Assignments</a>`;

  const studentNav = `
    <div class="nav-section-title">Main</div>
    <a href="dashboard.html" class="nav-item"><span class="nav-icon"><i class="fa-solid fa-house"></i></span> Dashboard</a>
    <a href="courses.html"   class="nav-item"><span class="nav-icon"><i class="fa-solid fa-compass"></i></span> Browse Courses</a>
    <div class="nav-section-title">My Learning</div>
    <a href="my-courses.html"    class="nav-item"><span class="nav-icon"><i class="fa-solid fa-graduation-cap"></i></span> My Courses</a>
    <a href="assignments.html"   class="nav-item"><span class="nav-icon"><i class="fa-solid fa-file-lines"></i></span> Assignments</a>
    <a href="results.html"       class="nav-item"><span class="nav-icon"><i class="fa-solid fa-trophy"></i></span> My Results</a>
    <a href="profile.html"       class="nav-item"><span class="nav-icon"><i class="fa-solid fa-user-circle"></i></span> Profile & Certs</a>`;

  const navMap = { admin: adminNav, teacher: teacherNav, student: studentNav };

  return `
    <div class="sidebar-logo">
      <div class="logo-icon"><i class="fa-solid fa-school"></i></div>
      <div class="logo-text">
        <h2>Ansha Montessori</h2>
        <p>Teacher Training Institute</p>
      </div>
    </div>
    <div class="sidebar-user">
      <div class="avatar" style="background:var(--primary-light);color:var(--primary);">${user.avatar || getInitials(user.name)}</div>
      <div class="user-info">
        <div class="user-name">${user.name}</div>
        <div class="user-role">${user.role}</div>
      </div>
    </div>
    <nav class="sidebar-nav">${navMap[user.role] || ''}</nav>
    <div class="sidebar-footer">
      <button class="logout-btn" onclick="logout()">
        <i class="fa-solid fa-right-from-bracket"></i> Logout
      </button>
    </div>`;
}

function initPage(role) {
  const user = requireAuth(role);
  if (!user) return null;
  const sidebar = document.getElementById('sidebar');
  if (sidebar) { sidebar.innerHTML = buildSidebar(user); setActiveNav(); }
  const userNameEl = document.getElementById('user-name');
  if (userNameEl) userNameEl.textContent = user.name;
  return user;
}
