# TaskFlow — Client

React + Vite frontend for the TaskFlow project management system (port 5173).

## Routes

| Path | Page | Access |
|------|------|--------|
| `/login` | Sign in with email/password, OTP, or Google | Public |
| `/register` | Create account with email OTP or Google | Public |
| `/forgot-password` | Reset password via email OTP | Public |
| `/` | Dashboard (stats, charts, activity) | Auth required |
| `/projects` | Manage projects, invite members, view files | Auth required |
| `/tasks` | View/create tasks, assign members, comments, team chat, file attachments | Auth required |
| `/kanban` | Drag & drop Kanban board | Auth required |
| `/calendar` | Calendar view with tasks | Auth required |
| `/team` | Team members & invite | Auth required |
| `/settings` | User settings (profile name edit) | Auth required |
| `/admin` | Admin dashboard (stats, users, activity) | Admin only |
| `/404` | Not found | Public |

## Auth Methods

- **Google OAuth** — one-click sign in (requires `VITE_GOOGLE_CLIENT_ID`)
- **Email + Password** — standard login
- **Email OTP** — passwordless login/register via 6-digit code

## File Management

| Feature | Details |
|---------|---------|
| Upload | Drag/click to upload, 50MB limit via multer |
| Preview | Images inline, PDFs in iframe modal |
| Download | Direct download link |
| Rename | Inline editing with save/cancel |
| Verify/Reject | Project leaders approve team member uploads |
| Status badges | Verified (green), Pending (leader view), Awaiting (member view) |
| Storage | Cloudinary (primary) / local disk fallback (server/uploads/) |

## Profile

- **Edit name** via Settings page (`/settings`)
- Changes propagate immediately to sidebar, dashboard, and all UI
- Server endpoint: `PUT /api/auth/profile` (protected)

## Global Features

- **Theme Toggle** — Light / Dark / System mode on every page
- **Notifications** — bell icon with real-time updates (in-app + email)
- **Global Search** — search projects, tasks, people
- **Team Chat** — sidebar on Tasks page per project
- **Responsive** — auto-scales on mobile, tablet, desktop
- **DevTools Protection** — blocks F12, right-click, Ctrl+Shift+I/J/C, detects DevTools open

## Tech Stack

- React 19, React Router 7, Vite
- Tailwind CSS (dark mode via class)
- Chart.js + react-chartjs-2 (dashboard)
- FullCalendar (calendar view)
- socket.io-client (real-time)
- react-hot-toast (notifications)
- @hello-pangea/dnd (Kanban drag & drop)
- Lucide React (icons)
