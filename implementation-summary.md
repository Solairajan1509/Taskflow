# TaskFlow — Implementation Summary

## Architecture

```
taskflow/
├── client/          # React + Vite frontend (port 5173)
├── server/          # Express + MongoDB backend (port 5000)
├── .env             # Shared environment variables
└── package.json     # Root scripts (concurrently runs both)
```

## Server (MVC)

```
server/
├── models/          # Mongoose schemas (10 models)
├── controllers/     # Route handler logic
├── routes/          # Express route definitions
├── middleware/      # Auth & error handling
└── uploads/         # Local file storage (Cloudinary fallback)
```

### Models
- **User** — name, email, password (bcrypt), avatar, role (user/admin), status, team ref
- **Project** — name, description, owner, members[] (with role), status, dates, category
- **Task** — project ref, title, description, assignedTo, priority, status, dueDate, labels
- **File** — name, url, fileType, size, project/task refs, uploadedBy, verified, verifiedBy
- **Comment** — task ref, user ref, content
- **Message** — sender, recipient, project, content, readBy[]
- **Notification** — recipient, sender, type, title, message, isRead, link
- **ActivityLog** — user, action, project/task refs, description
- **Team** — name, description, leader, members[], projects[]
- **Otp** — email, otp, purpose, auto-expire (300s)

### Auth
- Email/password, email OTP, Google OAuth
- JWT tokens with 30-day expiry
- Profile name update via `PUT /api/auth/profile`

### File Uploads
- Multer memory storage → Cloudinary (if configured) or local disk
- Auto-verified for project leaders, pending verification for team members
- Verify/reject by project leaders
- Rename by file owner or project leader
- Preview (images/PDF), download, delete

### Real-Time
- Socket.IO for instant updates
- Rooms: `project:{id}`, `task:{id}`, `user:{id}`

## Client (React)

```
client/src/
├── pages/           # 14 route pages
├── components/      # Reusable UI (FileUpload, ThemeToggle, GoogleLoginButton)
├── context/         # AuthContext, SocketContext
├── services/        # Axios API services
└── layouts/         # MainLayout (authenticated), AuthLayout (public)
```

### Routes

| Path | Page | Access |
|------|------|--------|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/forgot-password` | Forgot Password | Public |
| `/` | Dashboard | Auth |
| `/projects` | Projects | Auth |
| `/tasks` | Tasks | Auth |
| `/kanban` | Kanban Board | Auth |
| `/calendar` | Calendar | Auth |
| `/team` | Team | Auth |
| `/settings` | Settings | Auth |
| `/admin` | Admin Dashboard | Admin |
| `/404` | Not Found | Public |

### Features
- Dark/light/system theme toggle
- Global search (projects, tasks, users)
- Notifications with real-time updates
- Team chat per project
- Drag-and-drop Kanban
- Calendar view with task events
- DevTools protection

## Running the Project

```bash
npm run dev          # Starts both server + client concurrently
npm run server       # Server only (nodemon)
npm run client       # Client only (Vite)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, React Router 7, Tailwind CSS |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB + Mongoose |
| Auth | JWT, bcrypt, Google OAuth, Nodemailer (OTP) |
| File Storage | Cloudinary (primary) / Local disk (fallback) |
| Real-Time | Socket.IO (rooms for projects/tasks/users) |
| Charts | Chart.js + react-chartjs-2 |
| Calendar | FullCalendar |
| Drag & Drop | @hello-pangea/dnd |
