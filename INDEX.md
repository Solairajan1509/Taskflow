# TaskFlow — Documentation Index

> Enterprise Project Management System (MERN Stack)

## Quick Links

| Document | Description |
|----------|-------------|
| [implementation-summary.md](./implementation-summary.md) | Full project architecture, routes, models, tech stack |
| [auth-readme.md](./auth-readme.md) | Authentication methods, endpoints, middleware, context |
| [authentication-setup.md](./authentication-setup.md) | Setup guide for Google OAuth, Gmail OTP, JWT config |
| [client/README.md](./client/README.md) | Client routes, features, and dependencies |

## Getting Started

```bash
# Install dependencies
npm run install-all

# Configure environment
# Edit .env with your credentials (see authentication-setup.md)

# Start development
npm run dev
```

## Prerequisites

- **Node.js** v18+
- **MongoDB** running on `localhost:27017`
- **Gmail account** with app password (for OTP emails)
- **Google Cloud Console project** with OAuth 2.0 Client ID (for Google login)

## Environment (.env)

| Variable | Required | Purpose |
|----------|----------|---------|
| `PORT` | Yes | Server port (default: 5000) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `CLIENT_URL` | Yes | Frontend URL for CORS |
| `CLOUDINARY_*` | No | Cloudinary file storage (falls back to local disk) |
| `GMAIL_USER` | For OTP | Gmail address for sending OTPs |
| `GMAIL_APP_PASSWORD` | For OTP | Gmail app password |
| `VITE_GOOGLE_CLIENT_ID` | For Google auth | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For Google auth | Google OAuth client secret |

## Site Flow / User Journey

```
Visitor                               Authenticated User                    Admin
───────                               ──────────────────                    ─────
  │                                      │                                   │
  ├─ /login                             ├─ / (Dashboard)                    ├─ /admin
  │  ├─ Email+Password ──→ JWT ──→ App  │  ├─ View stats & charts          │  ├─ View all users
  │  ├─ Email OTP ────────→ JWT ──→ App │  ├─ Recent activity              │  ├─ Activity log
  │  └─ Google OAuth ────→ JWT ──→ App │  └─ Click through to Projects     │  └─ System stats
  ├─ /register                          ├─ /projects                        │
  │  ├─ Email+Password ──→ JWT ──→ App │  ├─ CRUD projects                 │
  │  ├─ Email OTP ────────→ JWT ──→ App │  ├─ Invite members               │
  │  └─ Google OAuth ────→ JWT ──→ App │  └─ File Mgmt (Upload/Verify)     │
  ├─ /forgot-password                   ├─ /tasks                           │
  │  ├─ Send OTP → Reset → Login       │  ├─ CRUD tasks                    │
  └─ /404 → back to /login             │  ├─ Comments                      │
                                       │  ├─ File attachments              │
                                       │  └─ Team Chat (Socket.IO)         │
                                       ├─ /kanban (Drag & drop)            │
                                       ├─ /calendar (Calendar view)        │
                                       ├─ /team (Members & invites)        │
                                       └─ /settings (Edit profile name)    │
                                                                           │
              ──────────── Global Features ────────────                    │
              Theme Toggle │ Notifications │ Global Search                  │
              DevTools Protection │ Responsive Design                      │
```

### End-to-End Flow
```
npm run dev → Client (:5173) + Server (:5000) start
                  │
User opens http://localhost:5173
                  │
AuthLayout checks token in localStorage
  ├─ No token → Login/Register/Forgot Password
  └─ Token exists → GET /api/auth/me
       ├─ Invalid/expired → Clear token → redirect /login
       └─ Valid → AuthContext populated → MainLayout renders
            │
            React Router checks route:
            ├─ / → Dashboard (Chart.js stats + activity)
            ├─ /projects → Project list → CRUD + File Mgmt
            ├─ /tasks → Task list → Comments + Chat + Files
            ├─ /kanban → @hello-pangea/dnd board
            ├─ /calendar → FullCalendar events
            ├─ /team → Members + Invite
            ├─ /settings → Edit name → PUT /api/auth/profile
            └─ /admin → Admin panel (role check)
```

## Key Features

- **Multi-method auth** — Email/password, OTP, Google OAuth
- **Role-based access** — Admin, project leader, team member
- **File management** — Upload, preview, rename, verify, delete
- **Real-time updates** — Socket.IO for tasks, projects, notifications
- **Kanban board** — Drag-and-drop task management
- **Calendar view** — Task scheduling and deadlines
- **Team chat** — Per-project messaging
- **Global search** — Projects, tasks, and users
- **Theme support** — Light, dark, and system mode
