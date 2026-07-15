# TaskFlow — Setup Guide

## Prerequisites

- Node.js 18+
- MongoDB running (local or Atlas)
- Gmail account with App Password (for OTP/notification emails)
- (Optional) Google Cloud project for OAuth

## Quick Start

```bash
# 1. Install dependencies
npm run install-all

# 2. Configure .env at project root
# See .env file — set MONGO_URI, GMAIL_USER, GMAIL_APP_PASSWORD

# 3. Start both servers
npm run dev

# 4. Open browser
http://localhost:5173
```

## Authentication Setup

### Email OTP (Works Immediately)

1. Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `.env`
2. Get Gmail App Password:
   - Enable 2-Factor Authentication on your Google Account
   - Visit [App Passwords](https://myaccount.google.com/apppasswords)
   - Generate a password for Mail on Windows Computer
   - Copy the 16-char password to `GMAIL_APP_PASSWORD`
3. Users can login/register with email + OTP code

### Google OAuth (Optional)

1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Create project → APIs & Services → Credentials
3. Create OAuth client ID (Web application)
4. Add `http://localhost:5173` to Authorized JavaScript origins
5. Copy Client ID to `VITE_GOOGLE_CLIENT_ID` in `.env`
6. Copy Client Secret to `GOOGLE_CLIENT_SECRET` in `.env`
7. Restart dev server

## Admin Setup

To create the first admin account:

```bash
curl -X POST http://localhost:5000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"admin","email":"admin@example.com","password":"yourpassword"}'
```

Or use Postman: `POST /api/auth/create-admin`. This endpoint only works once (no admin check). After creation, log in at `/login` — the sidebar shows the Admin link.

## Feature Setup

| Feature | Required Config |
|---------|----------------|
| Email OTP | `GMAIL_USER` + `GMAIL_APP_PASSWORD` |
| Google Login | `VITE_GOOGLE_CLIENT_ID` |
| Notifications | `GMAIL_USER` + `GMAIL_APP_PASSWORD` (auto, same as OTP) |
| File Uploads | `CLOUDINARY_*` vars |
| Real-time | Auto (socket.io) |
| Dark Mode | Auto (localStorage) |

## Role Management

### Project Roles
Users who create a project become **Owner** (also gets `project_leader` role). The owner can promote members to `project_leader` via the database. Leaders can create and assign tasks and invite members.

| Role | Permissions |
|------|------------|
| Owner | Full control — create/assign tasks, invite, manage project |
| Project Leader | Create/assign tasks, invite members |
| Team Member | View tasks and projects only |

### System Admin Role
Promote a user to admin via the database directly:
```
db.users.updateOne({ email: "user@example.com" }, { $set: { role: "admin" } })
```

Or use the one-time `POST /api/auth/create-admin` endpoint.

## Build for Production

```bash
npm run build --prefix client
# Output: client/dist/ — minified + obfuscated (code is unreadable in DevTools)
```

## Troubleshooting

### Google button not showing
- Ensure `VITE_GOOGLE_CLIENT_ID` is set in `.env`
- Restart dev server
- Check browser console for errors

### OTP / notification email not received
- Check spam folder
- Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` are correct
- Gmail App Password must have no spaces
- Dev mode uses Ethereal (mock) if no Gmail config — check console for preview URL

### White screen after login
- Check browser console for JS errors
- Ensure backend is running on port 5000
- Verify `VITE_API_URL` in `.env`
