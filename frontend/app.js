// ─── API Config ───────────────────────────────────────────────────────────────
// Change this to your deployed backend URL when hosting online
// e.g. 'https://edureg-backend.onrender.com'
const API_BASE = 'https://wbexam-final-00q5.onrender.com/api';


// ─── State ────────────────────────────────────────────────────────────────────
let allCourses = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function api(path, options = {}) {
  try {
    const res = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.errors?.join(', ') || 'Request failed');
    return data;
  } catch (err) {
    throw err;
  }
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  const map = { home: 0, courses: 1, register: 2, dashboard: 3 };
  document.querySelectorAll('.nav-tab')[map[id]].classList.add('active');
  if (id === 'home')      loadStats();
  if (id === 'courses')   loadCourses();
  if (id === 'register')  loadFormCourses();
  if (id === 'dashboard') loadDashboard();
}

// ─── Stats ────────────────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const { data } = await api('/stats');
    document.getElementById('stat-courses').textContent       = data.availableCourses;
    document.getElementById('stat-registrations').textContent = data.totalRegistrations;
    document.getElementById('stat-departments').textContent   = data.departments;
  } catch {
    ['stat-courses', 'stat-registrations', 'stat-departments']
      .forEach(id => document.getElementById(id).textContent = '—');
  }
}

// ─── Courses Page ─────────────────────────────────────────────────────────────
async function loadCourses() {
  const grid = document.getElementById('courses-grid');
  grid.innerHTML = '<div class="loading">Loading courses</div>';
  try {
    const { data } = await api('/courses');
    allCourses = data;
    renderCourses();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Could not load courses. Is the backend running?</p></div>`;
  }
}

function renderCourses() {
  const grid   = document.getElementById('courses-grid');
  const search = document.getElementById('courseSearch')?.value.toLowerCase() || '';
  const dept   = document.getElementById('deptFilter')?.value || '';

  const filtered = allCourses.filter(c => {
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search) ||
      c.code.toLowerCase().includes(search)  ||
      c.instructor.toLowerCase().includes(search);
    const matchDept = !dept || c.dept === dept;
    return matchSearch && matchDept;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><p>No courses match your filter.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(c => {
    const pct       = Math.round((c.registered / c.seats) * 100);
    const isFull    = c.registered >= c.seats;
    const fillClass = pct >= 100 ? 'full' : pct >= 75 ? 'warn' : '';
    return `
    <div class="course-card" style="--card-accent:${c.color}">
      <div class="course-tag">${c.dept} · ${c.credits} Credits</div>
      <div class="course-title">${c.title}</div>
      <div class="course-instructor">👤 ${c.instructor}</div>
      <div class="course-meta">
        <span>📅 ${c.schedule}</span>
        <span>🪑 ${c.seats - c.registered} seats left</span>
      </div>
      <div class="seats-bar">
        <div class="seats-fill ${fillClass}" style="width:${Math.min(pct,100)}%"></div>
      </div>
      <div class="course-footer">
        <span class="seats-label">${c.registered}/${c.seats} enrolled</span>
        ${isFull
          ? `<span class="status-pill status-waitlist">Full</span>`
          : `<button class="btn btn-primary btn-sm" onclick="quickRegister('${c.id}')">Enroll →</button>`}
      </div>
    </div>`;
  }).join('');
}

function quickRegister(courseId) {
  showPage('register');
  setTimeout(() => {
    const cb = document.querySelector(`#f-courses input[value="${courseId}"]`);
    if (cb) { cb.checked = true; cb.closest('.check-item').classList.add('selected'); }
  }, 200);
}

// ─── Register Form ────────────────────────────────────────────────────────────
async function loadFormCourses() {
  const wrap = document.getElementById('f-courses');
  wrap.innerHTML = '<div class="loading">Loading courses</div>';
  try {
    const { data } = await api('/courses');
    allCourses = data;
    wrap.innerHTML = data.map(c => `
      <label class="check-item" onclick="toggleCheck(this)">
        <input type="checkbox" value="${c.id}" ${c.registered >= c.seats ? 'disabled' : ''}/>
        <span>${c.code} – ${c.title}${c.registered >= c.seats ? ' (Full)' : ''}</span>
      </label>`).join('');
  } catch {
    wrap.innerHTML = '<p style="color:var(--danger);font-size:.85rem">Could not load courses. Is the backend running?</p>';
  }
}

function toggleCheck(label) {
  const cb = label.querySelector('input');
  if (cb.disabled) return;
  setTimeout(() => label.classList.toggle('selected', cb.checked), 0);
}

function selectRadio(label) {
  document.querySelectorAll('.radio-item').forEach(r => r.classList.remove('selected'));
  label.classList.add('selected');
}

// Validation
function clearError(id) {
  const el = document.getElementById('err-' + id); if (el) el.textContent = '';
  const inp = document.getElementById('f-' + id);  if (inp) inp.classList.remove('error');
}
function setError(id, msg) {
  const el = document.getElementById('err-' + id); if (el) el.textContent = msg;
  const inp = document.getElementById('f-' + id);  if (inp) inp.classList.add('error');
}

function validateForm() {
  let valid = true;
  ['id','name','email','dept','year','courses','terms'].forEach(clearError);

  if (!document.getElementById('f-id').value.trim())    { setError('id', 'Student ID is required'); valid = false; }
  if (!document.getElementById('f-name').value.trim())  { setError('name', 'Full name is required'); valid = false; }

  const email = document.getElementById('f-email').value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('email', 'Valid email required'); valid = false; }

  if (!document.getElementById('f-dept').value) { setError('dept', 'Select a department'); valid = false; }
  if (!document.getElementById('f-year').value) { setError('year', 'Select academic year'); valid = false; }

  const checked = [...document.querySelectorAll('#f-courses input:checked')];
  if (!checked.length) { setError('courses', 'Select at least one course'); valid = false; }

  if (!document.getElementById('f-terms').checked) { setError('terms', 'You must agree to the terms'); valid = false; }

  return valid;
}

async function submitForm() {
  if (!validateForm()) { toast('Please fix the errors above.', 'error'); return; }

  const btn = document.getElementById('submit-btn');
  btn.textContent = 'Submitting…';
  btn.disabled = true;

  const payload = {
    studentId: document.getElementById('f-id').value.trim(),
    name:      document.getElementById('f-name').value.trim(),
    email:     document.getElementById('f-email').value.trim(),
    phone:     document.getElementById('f-phone').value.trim(),
    dept:      document.getElementById('f-dept').value,
    year:      document.getElementById('f-year').value,
    enroll:    document.querySelector('input[name="enrollment"]:checked')?.value || 'Full-time',
    notes:     document.getElementById('f-notes').value.trim(),
    courses:   [...document.querySelectorAll('#f-courses input:checked')].map(cb => cb.value),
  };

  try {
    const { data } = await api('/registrations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    toast(`✅ Registration ${data.id} submitted for ${data.name}!`, 'success');
    resetForm();
    showPage('dashboard');
  } catch (err) {
    toast(err.message || 'Registration failed. Please try again.', 'error');
  } finally {
    btn.textContent = 'Submit Registration';
    btn.disabled = false;
  }
}

function resetForm() {
  ['id','name','email','phone'].forEach(id => { const el = document.getElementById('f-'+id); if(el) el.value=''; });
  document.getElementById('f-dept').value = '';
  document.getElementById('f-year').value = '';
  document.getElementById('f-notes').value = '';
  document.getElementById('f-terms').checked = false;
  loadFormCourses();
  ['id','name','email','dept','year','courses','terms'].forEach(clearError);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
async function loadDashboard() {
  const wrap = document.getElementById('dashboard-content');
  wrap.innerHTML = '<div class="loading">Loading registrations</div>';
  try {
    const [regsRes, coursesRes] = await Promise.all([api('/registrations'), api('/courses')]);
    const regs    = regsRes.data;
    const courses = coursesRes.data;
    const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));

    if (!regs.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No registrations yet. <a href="#" onclick="showPage('register')" style="color:var(--accent)">Register for a course →</a></p></div>`;
      return;
    }

    wrap.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Reg. ID</th><th>Student</th><th>Dept / Year</th>
            <th>Courses</th><th>Type</th><th>Date</th><th>Status</th><th>Action</th>
          </tr></thead>
          <tbody>
            ${regs.map(r => `
            <tr>
              <td><code style="font-size:.78rem;color:var(--muted)">${r.id}</code></td>
              <td>
                <div style="font-weight:500">${r.name}</div>
                <div style="font-size:.76rem;color:var(--muted)">${r.email}</div>
              </td>
              <td>${r.dept} · Y${r.year}</td>
              <td>${r.courses.map(cid => {
                const c = courseMap[cid];
                return c ? `<span style="display:inline-block;background:rgba(0,212,170,.08);color:var(--accent);font-size:.7rem;border-radius:5px;padding:2px 7px;margin:2px">${c.code}</span>` : '';
              }).join('')}</td>
              <td>${r.enroll}</td>
              <td>${new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
              <td><span class="status-pill status-active">${r.status}</span></td>
              <td><button class="btn btn-danger btn-sm" onclick="confirmDelete('${r.id}')">Cancel</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Could not load registrations. Is the backend running?</p></div>`;
  }
}

function confirmDelete(regId) {
  document.getElementById('modal-title').textContent = 'Cancel Registration';
  document.getElementById('modal-body').textContent  = 'Are you sure you want to cancel this registration? Seat counts will be restored.';
  document.getElementById('modal-confirm-btn').onclick = () => { deleteReg(regId); closeModal(); };
  document.getElementById('confirm-modal').classList.add('open');
}

async function deleteReg(regId) {
  try {
    await api('/registrations/' + regId, { method: 'DELETE' });
    toast('Registration cancelled and seat restored.', 'warning');
    loadDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function confirmClearAll() {
  document.getElementById('modal-title').textContent = 'Clear All Registrations';
  document.getElementById('modal-body').textContent  = 'This will permanently delete ALL registrations and restore all seat counts.';
  document.getElementById('modal-confirm-btn').onclick = () => { clearAllRegs(); closeModal(); };
  document.getElementById('confirm-modal').classList.add('open');
}

async function clearAllRegs() {
  try {
    await api('/registrations', { method: 'DELETE' });
    toast('All registrations cleared.', 'warning');
    loadDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function closeModal() {
  document.getElementById('confirm-modal').classList.remove('open');
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const tc = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast ' + (type === 'error' ? 'error' : type === 'warning' ? 'warning' : '');
  el.innerHTML = `<span>${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌'}</span> ${msg}`;
  tc.appendChild(el);
  setTimeout(() => { el.style.animation = 'slideOut .3s ease forwards'; setTimeout(() => el.remove(), 300); }, 3500);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
loadStats();
