# TaskFlow — Project Management System

MERN stack app with real-time collaboration, Kanban boards, team chat, admin panel, and more.

## Quick Start

```bash
npm run install-all     # Install all dependencies
npm run dev             # Start both client & server
```

Open `http://localhost:5173`

## App Flow

```
┌──────────────────┐
│  Login / Register │  ← Google OAuth, Email+Password, or Email OTP
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│    Dashboard      │  ← Stats, charts, activity
└───────┬──────────┘
        │
        ├──────────────┬──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Projects    │ │    Tasks     │ │    Admin     │
│ ├─ Members    │ │ ├─ Comments  │ │ ├─ Stats     │
│ ├─ Invite     │ │ ├─ Assign    │ │ ├─ Users     │
│ └─ Roles      │ │ └─ Chat      │ │ └─ Activity  │
└──────────────┘ └──────┬───────┘ └──────────────┘
        │               │
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│    Kanban     │ │   Calendar   │
│  Drag & drop  │ │  Month view  │
└──────────────┘ └──────────────┘
        │
        ▼
┌──────────────┐
│     Team      │
│  └─ Invite    │
└──────────────┘
        │
        ▼
┌──────────────┐
│   Settings    │
└──────────────┘
```

## Key Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Email/password, OTP, or Google |
| `/register` | Register | Email OTP or Google |
| `/` | Dashboard | Stats, charts, activity feed |
| `/projects` | Projects | Create/manage projects, invite |
| `/tasks` | Tasks | Create, assign, comment, chat |
| `/kanban` | Kanban | Drag & drop task board |
| `/calendar` | Calendar | Task calendar view |
| `/team` | Team | Member list, invite |
| `/settings` | Settings | User settings |
| `/admin` | Admin | System stats, user management |

## Features

- **Auth**: Google OAuth, Email+Password, Email OTP, Password Reset
- **Theme**: Light / Dark / System toggle on every page
- **Real-time**: Comments, notifications, chat via socket.io
- **Search**: Global search across projects, tasks, people
- **Roles**: Owner, Project Leader, Team Member (project-level)
- **Admin**: System-level admin role with dashboard, user management, analytics
- **Notifications**: In-app + email for task assign, status change, project created
- **Security**: bcrypt, JWT, CORS, role middleware, DevTools protection
- **Obfuscation**: Production build minifies + obfuscates all code
- **Mobile**: Auto-scales, touch-friendly, responsive design

## Documentation

| File | Purpose |
|------|---------|
| `AUTH_README.md` | Full website guide |
| `AUTHENTICATION_SETUP.md` | Setup & troubleshooting |
| `IMPLEMENTATION_SUMMARY.md` | Technical details & endpoints |
| `client/README.md` | Frontend routes & tech stack |

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Chart.js, FullCalendar
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, Socket.io
- **Auth**: Google OAuth 2.0, bcrypt, OTP email verification
