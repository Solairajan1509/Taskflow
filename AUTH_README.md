# TaskFlow — Full Website Guide

## Overview

TaskFlow is a MERN project management system with real-time collaboration, admin panel, and email notifications.

## Website Flow

```
Login / Register
    ↓
Dashboard ←──────────────┐
    ↓                      │
Projects → Tasks → Kanban │
    ↓        ↓       ↓    │
  Team    Comments  Calendar
    ↓        ↓
  Chat    Notifications
    ↓
Settings
    ↓
Admin (if role=admin) → Logout → Login page
```

## Pages

### 1. Authentication (`/login`, `/register`, `/forgot-password`)
- Google OAuth one-click sign in
- Email + password login
- Email OTP (passwordless) for login and registration
- Forgot password with OTP reset
- Dark/light/system theme toggle available on all auth pages

### 2. Dashboard (`/`)
- Welcome banner with user name
- Stats cards: Active Projects, Completed Tasks, Overdue, Completion %
- Doughnut chart: task breakdown by status
- Bar chart: project progress
- Recent activity feed
- Team productivity by member

### 3. Projects (`/projects`)
- List of owned and member projects
- Create new project (name, description, category)
- Invite members via email (owner and project leaders)
- Project status tracking
- Owner / project_leader / team_member roles

### 4. Tasks (`/tasks`)
- All tasks across projects
- Create task with title, description, priority, due date, duration
- **Project leaders only**: create and assign tasks to team members
- Expand task to view/add/delete comments (real-time via socket)
- Team chat sidebar by project
- In-app + email notification on task assigned / status changed

### 5. Kanban (`/kanban`)
- Drag & drop tasks between columns: To Do → In Progress → Review → Done

### 6. Calendar (`/calendar`)
- Month view with tasks as events
- Click event for task details

### 7. Team (`/team`)
- List of all team members with avatars and status
- Invite new members via email

### 8. Settings (`/settings`)
- User profile and account settings

### 9. Admin (`/admin`) — admin role only
- **Stats cards**: Total Users, Projects, Tasks, Completion Rate
- **User management**: list all users, delete users (unassigns their tasks)
- **Task performance**: per-user task completion stats
- **Recent activity**: full activity feed

### 10. Global Features
- **Theme Toggle**: Light / Dark / System mode (persisted in localStorage)
- **Notifications**: bell icon with real-time unread count, mark read
- **Search**: global search for projects, tasks, and people
- **Mobile responsive**: auto-scales on any device
- **DevTools Protection**: blocks F12, right-click, Ctrl+Shift+I/J/C; detects DevTools

## Role System

### Project Roles

| Role | Create Tasks | Assign Tasks | Invite Members | Manage Project |
|------|-------------|-------------|---------------|----------------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Project Leader | ✅ | ✅ | ✅ | ❌ |
| Team Member | ❌ | ❌ | ❌ | ❌ |

### System Roles

| Role | Scope | Access |
|------|-------|--------|
| `user` | Default for all registered users | Standard app features |
| `admin` | System-wide | Admin dashboard, user management, all data |

## Project Structure

```
taskflow/
├── .env                  ← All config variables
├── client/
│   └── src/
│       ├── pages/
│       │   ├── Login/
│       │   ├── Register/
│       │   ├── ForgotPassword/
│       │   ├── Dashboard/
│       │   ├── Projects/
│       │   ├── Tasks/
│       │   ├── Kanban/
│       │   ├── Calendar/
│       │   ├── Team/
│       │   ├── Settings/
│       │   └── Admin/
│       ├── components/
│       │   ├── GoogleLoginButton.jsx
│       │   └── ThemeToggle.jsx
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── SocketContext.jsx
│       ├── layouts/
│       │   ├── AuthLayout.jsx
│       │   └── MainLayout.jsx
│       └── services/
│           ├── api.js
│           ├── taskApi.js
│           └── notificationApi.js
└── server/
    ├── controllers/
    ├── models/
    ├── routes/
    ├── middleware/
    ├── utils/
    └── config/
```

## Environment Variables

See `.env` at project root. Key vars:

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port |
| `MONGO_URI` | MongoDB connection |
| `JWT_SECRET` | Token signing key |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth (client + server shared) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `GMAIL_USER` | Email sender for OTP/notifications |
| `GMAIL_APP_PASSWORD` | Gmail app password |
| `VITE_API_URL` | Backend URL for frontend |
| `CLIENT_URL` | Frontend URL for CORS |

## Deployment

1. Build client: `cd client && npm run build` (output in `client/dist/`)
2. Set production env vars in `.env` (update `VITE_API_URL`, `CLIENT_URL`, `NODE_ENV`)
3. Start server: `node server/server.js`
4. Serve `client/dist/` via Nginx, Vercel, or any static host
