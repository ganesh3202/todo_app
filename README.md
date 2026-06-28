# ⚡ TaskFlow — Full-Stack Productivity Platform
### React + Node.js + **MySQL (Sequelize)**

---

## 🚀 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, React Router 6, Recharts  |
| Backend    | Node.js, Express.js                 |
| Database   | **MySQL 8** via **Sequelize ORM**   |
| Auth       | JWT (JSON Web Tokens) + bcryptjs    |
| File Upload| Multer (local disk)                 |
| Styling    | Custom CSS — glassmorphism design   |

---

## ✅ Features

| Feature              | Description                                     |
|---------------------|-------------------------------------------------|
| Auth                 | Register / Login / Profile / Change password   |
| Task Management      | CRUD, priority, due dates, tags, subtasks       |
| Project Management   | Progress tracking, deadlines, task counts       |
| Kanban Board         | Drag & drop between columns                     |
| Calendar View        | Monthly task-due-date view                      |
| Notes / Knowledge    | Notes, code snippets, Q&A, learning resources  |
| Document Manager     | Upload PDF/Word/Excel/Images, drag & drop       |
| AI Assistant         | Natural language task queries                   |
| Analytics Dashboard  | Stats, weekly chart, priority pie               |
| Smart Search         | ⌘K global search                               |
| Dark / Light Mode    | Full theme switching                            |

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── config/         # database.js + testConnection.js
│   │   ├── controllers/    # auth, tasks, projects, notes, dashboard, ai
│   │   ├── middleware/     # JWT auth
│   │   ├── migrations/     # schema.sql (manual setup reference)
│   │   ├── models/         # Sequelize models + associations
│   │   ├── routes/         # Express routes
│   │   └── server.js
│   ├── uploads/            # auto-created on first upload
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/Layout/   # Sidebar, Header, Layout
    │   ├── contexts/            # AuthContext, ThemeContext
    │   ├── pages/               # All page components
    │   ├── services/api.js      # Axios API layer
    │   └── styles/globals.css   # Design system
    ├── public/
    └── package.json
```

---

## ⚙️ Setup

### Prerequisites
- Node.js v18+
- MySQL 8 running locally **or** a hosted MySQL (Railway, PlanetScale, ClearDB)

### Step 1 — Create MySQL database

```sql
CREATE DATABASE taskflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 2 — Configure backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=taskflow
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=any_long_random_string
FRONTEND_URL=http://localhost:3000
```

> **Cloud MySQL?** Just set `DATABASE_URL=mysql://user:pass@host:3306/taskflow` instead.

### Step 3 — Test DB connection

```bash
node src/config/testConnection.js
# ✅ MySQL connection SUCCESS
```

### Step 4 — Install & run

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev      # auto-syncs all MySQL tables on start

# Terminal 2 — Frontend
cd frontend
npm install
npm start
```

Open **http://localhost:3000** → Register → Done! 🎉

> Sequelize runs `sync({ alter: true })` on every start — it creates and updates tables automatically. No manual migrations needed.

---

## 🗄️ MySQL Tables (auto-created)

| Table           | Description                              |
|----------------|------------------------------------------|
| `users`         | Accounts, roles, theme preference        |
| `projects`      | Projects with color, icon, progress      |
| `tasks`         | Tasks with status, priority, tags (JSON) |
| `task_comments` | Comments on tasks                        |
| `notes`         | Notes, code snippets, Q&A, resources     |
| `documents`     | Uploaded file metadata                   |

---

## 🌐 API Endpoints

| Method | Route                    | Description          |
|--------|--------------------------|----------------------|
| POST   | `/api/auth/register`     | Register             |
| POST   | `/api/auth/login`        | Login                |
| GET    | `/api/auth/me`           | Current user         |
| GET    | `/api/tasks`             | List tasks (filters) |
| POST   | `/api/tasks`             | Create task          |
| PUT    | `/api/tasks/:id`         | Update task          |
| DELETE | `/api/tasks/:id`         | Delete task          |
| GET    | `/api/projects`          | List projects        |
| POST   | `/api/projects`          | Create project       |
| GET    | `/api/projects/:id`      | Project + tasks      |
| GET    | `/api/notes`             | List notes           |
| POST   | `/api/notes`             | Create note          |
| POST   | `/api/documents`         | Upload document      |
| GET    | `/api/dashboard/stats`   | Dashboard stats      |
| GET    | `/api/dashboard/calendar`| Calendar events      |
| POST   | `/api/ai/query`          | AI assistant         |

---

## 🚀 Deployment

### Backend → Railway / Render
1. Set env vars in dashboard
2. Start command: `npm start`

### Frontend → Vercel / Netlify
1. Set `REACT_APP_API_URL=https://your-backend.com/api`
2. Build: `npm run build` → publish `build/`

### Database → Railway MySQL / PlanetScale
1. Create free MySQL instance
2. Copy connection string → set as `DATABASE_URL` in backend env

---

## 📝 Resume Points

- Built full-stack MERN→MySQL application with JWT auth and role-based access
- Designed relational MySQL schema with 6 tables, foreign keys, and indexes
- Replaced MongoDB with Sequelize ORM — models, associations, migrations
- Implemented drag-and-drop Kanban board with real-time optimistic updates
- Built natural language AI task assistant
- Created glassmorphism UI with dark/light mode and CSS animations
- Deployed REST API with 20+ endpoints, file upload (Multer), text search
