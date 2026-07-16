# TaskFlow — Authentication Overview

> Combined with: Full Website Guide

---

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

---

## Supported Methods

| Method | Routes | Description |
|--------|--------|-------------|
| Email + Password | `POST /api/auth/register`, `POST /api/auth/login` | Standard email/password auth with bcrypt hashing |
| Email OTP | `POST /api/auth/send-otp`, `POST /api/auth/verify-register-otp`, `POST /api/auth/verify-login-otp` | Passwordless login/register via 6-digit OTP sent to email |
| Google OAuth | `POST /api/auth/google-login` | One-click sign in via Google Identity Services |

## Token-Based Sessions

- JWT token stored in `localStorage` as `token`
- Token auto-attached to every API request via Axios interceptor (`client/src/services/api.js`)
- Token validated on each protected route via `protect` middleware
- Session restored on app load via `GET /api/auth/me`

## Auth Middleware

| Middleware | File | Purpose |
|------------|------|---------|
| `protect` | `server/middleware/authMiddleware.js` | Verifies JWT from `Authorization: Bearer <token>` header, attaches `req.user` |
| `authorize(...roles)` | Same file | Restricts route to specific roles (e.g. `admin`) |

## Client-Side Guards

| Component | File | Behavior |
|-----------|------|----------|
| `PrivateRoute` | `client/src/components/PrivateRoute.jsx` | Redirects to `/login` if no user in AuthContext |
| `AuthLayout` | `client/src/layouts/AuthLayout.jsx` | Wraps login/register/forgot-password pages — redirects to `/` if already logged in |

## Auth Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register with name, email, password |
| POST | `/api/auth/login` | Public | Login with email, password |
| POST | `/api/auth/send-otp` | Public | Send 6-digit OTP to email |
| POST | `/api/auth/verify-register-otp` | Public | Verify OTP + register account |
| POST | `/api/auth/verify-login-otp` | Public | Verify OTP + login |
| POST | `/api/auth/google-login` | Public | Google OAuth login/register |
| POST | `/api/auth/forgot-password` | Public | Send password reset OTP |
| POST | `/api/auth/reset-password` | Public | Verify OTP + set new password |
| GET | `/api/auth/me` | Private | Get current user profile |
| PUT | `/api/auth/profile` | Private | Update profile name |
| POST | `/api/auth/create-admin` | Public (once) | Seed initial admin account |

## Auth Flow

```
User                              Client                                Server
────                              ──────                                ──────
                                  │                                     │
  1. Email + Password             │                                     │
     [email + password] ──────→ POST /api/auth/login ────────────────→ bcrypt.compare()
     ← JWT ◀──────────────────── ← { token, user } ◀────────────────── ← generateToken(id)
                                  │                                     │
  2. Email OTP (Login)           │                                     │
     [email] ──────────────────→ POST /api/auth/send-otp ────────────→ Generate 6-digit
     ← OTP sent ◀─────────────── ← 200 OK ◀─────────────────────────── ← Store in Otp (300s)
     [otp] ────────────────────→ POST /api/auth/verify-login-otp ────→ Validate OTP
     ← JWT ◀──────────────────── ← { token, user } ◀────────────────── ← generateToken(id)
                                  │                                     │
  3. Email OTP (Register)        │                                     │
     [email] ──────────────────→ POST /api/auth/send-otp ────────────→ Generate 6-digit
     ← OTP sent ◀─────────────── ← 200 OK ◀─────────────────────────── ← Store in Otp (300s)
     [otp + name + pwd] ───────→ POST /api/auth/verify-register-otp ─→ Validate OTP
     ← JWT ◀──────────────────── ← { token, user } ◀────────────────── ← bcrypt + create user
                                  │                                     │
  4. Google OAuth                │                                     │
     [Google One Tap] ─────────→ POST /api/auth/google-login ────────→ Verify Google token
     ← JWT ◀──────────────────── ← { token, user } ◀────────────────── ← findOrCreate user
                                  │                                     │
  5. Session Restore             │                                     │
     App Load ─────────────────→ GET /api/auth/me ───────────────────→ protect middleware
     ← user ◀─────────────────── ← { user } ◀──────────────────────── ← verify JWT → find user
                                  │                                     │
  6. Profile Update              │                                     │
     [new name] ───────────────→ PUT /api/auth/profile ──────────────→ protect middleware
     ← updated user ◀────────── ← { user } ◀───────────────────────── ← update & return
```

**Route Guard Flow:**
```
Request → protect middleware → verify Bearer token → attach req.user → controller
  ├─ Invalid/missing token → 401 Unauthorized → redirect to /login
  └─ Valid token → authorize(roles) middleware
       ├─ Insufficient role → 403 Forbidden
       └─ Role matches → route handler
```

## Auth Context

`AuthContext` (`client/src/context/AuthContext.jsx`) provides:
- `user` — current user object `{ _id, name, email, avatar, status, role }`
- `login()`, `register()`, `loginWithGoogle()`, `loginWithOtp()`, `registerWithOtp()`
- `requestOtp()`, `forgotPassword()`, `resetPassword()`
- `logout()`, `setUser()`
- `loading`, `error`
