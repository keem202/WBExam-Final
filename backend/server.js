const express = require('express');
const cors    = require('cors');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────
app.use(cors());
app.use(express.json());

// ─── In-Memory "Database" ─────────────────────
// (Replace with a real DB like MongoDB/PostgreSQL in production)

let courses = [
  { id: 'CS101',   code: 'CS101',   title: 'Intro to Programming',        dept: 'CS',   instructor: 'Dr. Sara Hassan',   credits: 3, schedule: 'Mon/Wed 9:00–10:30',       seats: 30, registered: 12, color: '#00d4aa' },
  { id: 'CS201',   code: 'CS201',   title: 'Data Structures & Algorithms', dept: 'CS',   instructor: 'Prof. Ahmed Khalil', credits: 4, schedule: 'Tue/Thu 11:00–12:30',      seats: 25, registered: 20, color: '#3b82f6' },
  { id: 'CS301',   code: 'CS301',   title: 'Web Development',              dept: 'CS',   instructor: 'Dr. Layla Nour',     credits: 3, schedule: 'Mon/Wed/Fri 1:00–2:00',    seats: 35, registered: 35, color: '#8b5cf6' },
  { id: 'MATH101', code: 'MATH101', title: 'Calculus I',                   dept: 'MATH', instructor: 'Dr. Omar Farid',     credits: 4, schedule: 'Daily 8:00–9:00',          seats: 50, registered: 38, color: '#f59e0b' },
  { id: 'MATH201', code: 'MATH201', title: 'Linear Algebra',               dept: 'MATH', instructor: 'Prof. Nadia Saleh',  credits: 3, schedule: 'Tue/Thu 9:00–10:30',       seats: 40, registered: 15, color: '#ec4899' },
  { id: 'ENG101',  code: 'ENG101',  title: 'Engineering Mechanics',        dept: 'ENG',  instructor: 'Dr. Youssef Amin',   credits: 4, schedule: 'Mon/Wed 2:00–3:30',        seats: 30, registered: 27, color: '#10b981' },
  { id: 'ENG201',  code: 'ENG201',  title: 'Circuit Analysis',             dept: 'ENG',  instructor: 'Prof. Mona Ibrahim', credits: 3, schedule: 'Tue/Fri 10:00–11:30',      seats: 28, registered: 10, color: '#f97316' },
  { id: 'BUS101',  code: 'BUS101',  title: 'Principles of Management',     dept: 'BUS',  instructor: 'Dr. Hana Ramzy',     credits: 3, schedule: 'Mon/Wed/Fri 12:00–1:00',   seats: 60, registered: 42, color: '#06b6d4' },
];

let registrations = [];

// ─── Helper ───────────────────────────────────
function validate(body) {
  const errors = [];
  if (!body.studentId?.trim())   errors.push('studentId is required');
  if (!body.name?.trim())        errors.push('name is required');
  if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
                                 errors.push('valid email is required');
  if (!body.dept?.trim())        errors.push('dept is required');
  if (!body.year)                errors.push('year is required');
  if (!Array.isArray(body.courses) || body.courses.length === 0)
                                 errors.push('at least one course must be selected');
  return errors;
}

// ═══════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════

// GET /api/courses  —  list all courses (optional ?dept= filter)
app.get('/api/courses', (req, res) => {
  const { dept, search } = req.query;
  let result = [...courses];
  if (dept)   result = result.filter(c => c.dept === dept);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)  ||
      c.instructor.toLowerCase().includes(q)
    );
  }
  res.json({ success: true, data: result });
});

// GET /api/courses/:id  —  get single course
app.get('/api/courses/:id', (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  res.json({ success: true, data: course });
});

// GET /api/registrations  —  list all registrations
app.get('/api/registrations', (req, res) => {
  res.json({ success: true, data: registrations, total: registrations.length });
});

// GET /api/registrations/:id  —  single registration
app.get('/api/registrations/:id', (req, res) => {
  const reg = registrations.find(r => r.id === req.params.id);
  if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
  res.json({ success: true, data: reg });
});

// POST /api/registrations  —  create new registration
app.post('/api/registrations', (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ success: false, errors });

  const { studentId, name, email, phone, dept, year, enroll, notes, courseIds } = req.body;
  const selectedCourseIds = req.body.courses;

  // Duplicate student check
  if (registrations.find(r => r.studentId === studentId)) {
    return res.status(409).json({ success: false, message: 'Student already registered' });
  }

  // Validate all selected courses exist and have seats
  const invalidCourses = [];
  const fullCourses    = [];

  for (const cid of selectedCourseIds) {
    const course = courses.find(c => c.id === cid);
    if (!course)                       invalidCourses.push(cid);
    else if (course.registered >= course.seats) fullCourses.push(course.code);
  }

  if (invalidCourses.length) return res.status(400).json({ success: false, message: `Unknown courses: ${invalidCourses.join(', ')}` });
  if (fullCourses.length)    return res.status(400).json({ success: false, message: `These courses are full: ${fullCourses.join(', ')}` });

  // Increment seat counts
  courses = courses.map(c =>
    selectedCourseIds.includes(c.id)
      ? { ...c, registered: c.registered + 1 }
      : c
  );

  const newReg = {
    id:        'REG-' + uuidv4().slice(0, 8).toUpperCase(),
    studentId: req.body.studentId.trim(),
    name:      req.body.name.trim(),
    email:     req.body.email.trim(),
    phone:     req.body.phone?.trim() || '',
    dept:      req.body.dept,
    year:      req.body.year,
    enroll:    req.body.enroll || 'Full-time',
    notes:     req.body.notes?.trim() || '',
    courses:   selectedCourseIds,
    status:    'Active',
    createdAt: new Date().toISOString(),
  };

  registrations.push(newReg);
  res.status(201).json({ success: true, data: newReg, message: 'Registration successful' });
});

// DELETE /api/registrations/:id  —  cancel registration
app.delete('/api/registrations/:id', (req, res) => {
  const idx = registrations.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Registration not found' });

  const reg = registrations[idx];

  // Restore seat counts
  courses = courses.map(c =>
    reg.courses.includes(c.id)
      ? { ...c, registered: Math.max(c.registered - 1, 0) }
      : c
  );

  registrations.splice(idx, 1);
  res.json({ success: true, message: 'Registration cancelled and seats restored' });
});

// DELETE /api/registrations  —  clear all
app.delete('/api/registrations', (req, res) => {
  registrations.forEach(reg => {
    courses = courses.map(c =>
      reg.courses.includes(c.id)
        ? { ...c, registered: Math.max(c.registered - 1, 0) }
        : c
    );
  });
  registrations = [];
  res.json({ success: true, message: 'All registrations cleared' });
});

// GET /api/stats  —  summary stats
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalCourses:        courses.length,
      availableCourses:    courses.filter(c => c.registered < c.seats).length,
      totalRegistrations:  registrations.length,
      departments:         [...new Set(courses.map(c => c.dept))].length,
    }
  });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Start ────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎓 EduReg API running at http://localhost:${PORT}`);
  console.log(`   Routes:`);
  console.log(`   GET    /api/courses`);
  console.log(`   GET    /api/courses/:id`);
  console.log(`   GET    /api/registrations`);
  console.log(`   POST   /api/registrations`);
  console.log(`   DELETE /api/registrations/:id`);
  console.log(`   DELETE /api/registrations`);
  console.log(`   GET    /api/stats\n`);
});

module.exports = app;
