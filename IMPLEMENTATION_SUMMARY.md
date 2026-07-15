# TaskFlow — Feature Summary

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
