# TaskFlow — Implementation Summary

> Combined with: Feature Summary

---

## Application Flow

```
Public Routes:      /login | /register | /forgot-password
                        ↓ (authenticate)
Protected Routes:      /  |  /projects  |  /tasks  |  /kanban  |  /calendar  |  /team  |  /settings
Admin Only:            /admin
                        ↓
            Dashboard (default after login)
```

## Authentication

- **Email + Password** — standard login with JWT
- **Email OTP** — passwordless login/register via 6-digit code sent to email
- **Google OAuth** — one-click sign in with Google Identity Services
- **Forgot Password** — OTP-based password reset

## Core Features

### Dashboard
- Stats (active projects, completed/overdue tasks, completion %)
- Task breakdown doughnut chart (Chart.js)
- Project progress bar chart
- Recent activity log
- Team member productivity

### Projects
- Create projects with name, description, category
- Invite members by email (owner + project leaders)
- Roles: owner, project_leader, team_member

### Tasks
- Create tasks with title, description, priority, due date
- Assign to team members (leaders only)
- Comments with real-time updates (socket.io)
- Task status tracking
- In-app notification + email on assign and status change

### Kanban
- Drag & drop between To Do / In Progress / Review / Done
- Real-time status updates

### Calendar
- Month view with tasks as events (FullCalendar)
- Click to view task details

### Team
- Member list with avatars, roles, status
- Invite new members

### Admin Dashboard
- **Stats cards**: total users, projects, tasks, completion rate
- **User management**: list all users, delete users (unassigns tasks)
- **Task performance**: per-user task completion stats
- **Recent activity**: full activity feed
- Admin link only visible to users with `role: admin`

### Global UI
- **Theme Toggle**: Light / Dark / System with localStorage persistence
- **Notifications**: real-time bell icon with unread count, mark read
- **Search**: global search for projects, tasks, users
- **Team Chat**: per-project chat in Tasks sidebar
- **Mobile responsive**: viewport meta, touch-friendly, 16px inputs prevent iOS zoom
- **DevTools protection**: blocks F12, right-click, Ctrl+Shift+I/J/C, debugger timer detection, dimension detection, console silenced
- **Build obfuscation**: production build minifies + obfuscates code (hex identifiers, base64 strings, dead code injection)

## Notifications

| Event | In-App (Website) | Email |
|-------|-----------------|-------|
| Project created | ✅ Creator notified | ✅ `sendProjectCreatedEmail` |
| Task assigned (createTask) | ✅ Assignee notified | ✅ `sendTaskAssignedEmail` |
| Task status changed | ✅ Assignee notified (if not self) | ✅ `sendTaskStatusEmail` (all statuses) |
| Task reassigned (updateTask) | ✅ New assignee notified | ✅ `sendTaskAssignedEmail` |
| Project invite | ❌ | ✅ `sendProjectInviteEmail` |
| OTP code | ❌ | ✅ `sendOtpEmail` |
| Welcome | ❌ | ✅ `sendWelcomeEmail` |
| Password reset | ❌ | ✅ `sendPasswordResetEmail` |

## Server Endpoints

### Auth
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/register` | Email + password register |
| POST | `/api/auth/login` | Email + password login |
| POST | `/api/auth/send-otp` | Send OTP email |
| POST | `/api/auth/verify-register-otp` | Verify OTP + create account |
| POST | `/api/auth/verify-login-otp` | Verify OTP + login |
| POST | `/api/auth/google-login` | Google OAuth login |
| POST | `/api/auth/forgot-password` | Send password reset OTP |
| POST | `/api/auth/reset-password` | Verify OTP + reset password |
| POST | `/api/auth/create-admin` | Create initial admin (one-time seed) |
| GET | `/api/auth/me` | Get current user |

### Tasks
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task (leaders only) |
| PATCH | `/api/tasks/:id/status` | Update task status |
| PUT | `/api/tasks/:id` | Update task (reassign, edit) |

### Projects
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project with members |
| POST | `/api/projects/:id/invite` | Invite member |

### Admin
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/stats` | System stats (users, projects, tasks, activity) |
| GET | `/api/admin/users` | List all users |
| DELETE | `/api/admin/users/:id` | Delete user + unassign tasks |

### Other
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/comments/:taskId` | Task comments |
| DELETE | `/api/comments/:id` | Delete comment |
| GET/POST | `/api/messages/:projectId` | Team chat |
| GET | `/api/notifications/...` | Notifications (list, mark read) |
| GET | `/api/analytics/stats` | Dashboard stats |
| GET | `/api/activities` | Activity feed |
| GET | `/api/search` | Global search |

## Middleware

| Middleware | File | Purpose |
|-----------|------|---------|
| `protect` | `authMiddleware.js` | JWT verification, attaches `req.user` |
| `authorize(...roles)` | `roleMiddleware.js` | Checks system role (`user` / `admin`) |
| `projectRole(...roles)` | `roleMiddleware.js` | Checks project role (`project_leader` / `team_member`) |

## Mail Service

| Function | Trigger |
|----------|---------|
| `sendOtpEmail` | OTP sent for login/register/forgot-password |
| `sendWelcomeEmail` | Successful registration |
| `sendProjectInviteEmail` | Member invited to project |
| `sendPasswordResetEmail` | Password reset OTP requested |
| `sendTaskAssignedEmail` | Task assigned in createTask or reassigned in updateTask |
| `sendTaskStatusEmail` | Task status changed in updateTaskStatus |
| `sendProjectCreatedEmail` | New project created |

## Technologies

- **Frontend**: React 19, Vite, Tailwind CSS, Chart.js, FullCalendar, socket.io-client
- **Backend**: Node.js, Express, MongoDB/Mongoose, JWT, socket.io
- **Auth**: bcrypt, Google OAuth 2.0, OTP-based email verification
- **Email**: Nodemailer (Gmail SMTP or Ethereal dev fallback)
- **Build**: esbuild minification + javascript-obfuscator (hex rename, base64 strings, control flow flattening)

---

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

## System Data Flow

### Request Lifecycle
```
Browser                          Express Server                     MongoDB
──────                          ─────────────                     ───────
  │                                │                                │
  ├─ React Router resolves route   │                                │
  ├─ Axios API call ────────────→ │                                │
  │   Authorization: Bearer JWT   ├─ protect middleware             │
  │                                │   └─ jwt.verify → req.user     │
  │                                ├─ authorize(role) [if admin]    │
  │                                ├─ Controller                    │
  │                                │   └─ Model CRUD ────────────→ │
  │                                │   ← JSON response ◀────────── │
  │  ← Response ◀─────────────── │                                │
  │                                │                                │
  ├─ AuthContext / local state     │                                │
  └─ UI re-render                  │                                │
```

### File Upload Flow
```
User Drags File
     ↓
Multer (memoryStorage) → buffer
     ↓
Cloudinary configured? ──Yes──→ cloudinary.uploader.upload() → { url, public_id }
     │
     No
     ↓
Local disk fallback → fs.writeFileSync(server/uploads/)
     ↓
Save File document to MongoDB → { name, url, fileType, size, uploadedBy, project, verified }
     ↓
Owner is project leader? ──Yes──→ verified = true (green badge)
     │
     No
     ↓
verified = false → Pending (leader sees orange) / Awaiting (member sees yellow)
     ↓
Leader clicks Verify/Reject → PUT file.verified = true/false
```

### Real-Time Flow (Socket.IO)
```
Client Connects ──→ Server (Socket.IO handshake)
     │                    │
     ├─ join room ──────→ │  socket.join(`project:${id}`)
     │                    │  socket.join(`task:${id}`)
     │                    │  socket.join(`user:${id}`)
     │                    │
     │  ← emit event ◀── │  io.to(room).emit('notification', data)
     │                    │  io.to(room).emit('taskUpdated', data)
     │                    │  io.to(room).emit('message', data)
```

### Auth Flow (end-to-end)
```
User → Login Page → Auth Method → JWT → localStorage → Axios interceptor → 
    → Server protect middleware → Controller → Response → AuthContext → UI
```

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
