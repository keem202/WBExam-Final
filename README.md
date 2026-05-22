# 🎓 EduReg — Student Course Registration System

A full-stack Student Course Registration System built with **HTML/CSS/JS** (frontend) and **Node.js + Express** (backend).

---

## 📁 Project Structure

```
edureg/
├── frontend/
│   ├── index.html    ← Main HTML page
│   ├── style.css     ← All styles
│   └── app.js        ← Frontend logic + API calls
├── backend/
│   ├── server.js     ← Express API server
│   └── package.json  ← Dependencies
└── README.md
```

---

## 🚀 Running Locally

### 1. Start the Backend

```bash
cd backend
npm install
npm start
```

Backend runs at: `http://localhost:3001`

### 2. Open the Frontend

Open `frontend/index.html` directly in your browser — or use Live Server in VS Code.

> ⚠️ Make sure the backend is running before using the frontend.

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses |
| GET | `/api/courses/:id` | Get single course |
| GET | `/api/registrations` | List all registrations |
| POST | `/api/registrations` | Create registration |
| DELETE | `/api/registrations/:id` | Cancel a registration |
| DELETE | `/api/registrations` | Clear all registrations |
| GET | `/api/stats` | Summary statistics |

### POST /api/registrations — Body

```json
{
  "studentId": "STU-2025-001",
  "name": "John Doe",
  "email": "john@university.edu",
  "phone": "+20 123 456 7890",
  "dept": "CS",
  "year": "2",
  "enroll": "Full-time",
  "notes": "No special requests",
  "courses": ["CS101", "MATH101"]
}
```

---

## ☁️ Deployment

### Deploy Backend → Render.com (free)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Copy your Render URL (e.g. `https://edureg-api.onrender.com`)

### Update Frontend API URL

In `frontend/app.js`, line 4 — change:
```js
const API_BASE = 'http://localhost:3001/api';
```
to:
```js
const API_BASE = 'https://your-render-url.onrender.com/api';
```

### Deploy Frontend → GitHub Pages

1. Push to GitHub
2. Go to repo **Settings → Pages**
3. Set source to `main` branch, `/frontend` folder
4. Your site will be live at `https://yourusername.github.io/edureg/`

---

## ✨ Features

- 📚 Browse courses with search + filter by department
- 🪑 Live seat availability with progress bars
- ✏️ Validated registration form (text, dropdown, checkbox, radio, textarea)
- 📋 Dashboard with all registrations in a table
- ❌ Cancel individual registrations (restores seat count)
- 🔔 Toast notifications for all actions
- 📱 Fully responsive design

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | In-memory (swap for MongoDB/PostgreSQL) |
| Deployment | GitHub Pages (frontend), Render (backend) |
