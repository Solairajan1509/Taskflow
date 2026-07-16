# TaskFlow — Authentication Setup Guide

## Environment Variables

Add the following to `.env` at the project root:

```env
# ── JWT ──
JWT_SECRET=your_jwt_secret_here

# ── Google OAuth ──
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ── Gmail SMTP (for OTP emails) ──
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. Navigate to **APIs & Services → Credentials**
4. Create an **OAuth 2.0 Client ID** (Web application)
5. Add `http://localhost:5173` to **Authorized JavaScript origins**
6. Copy **Client ID** → set as `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
7. Client uses Google Identity Services (GIS) — no redirect URI needed for One Tap

## Gmail OTP Setup

1. Enable 2-Factor Authentication on your Google account
2. Go to **Google Account → Security → App Passwords**
3. Generate an app password for "Mail"
4. Copy the 16-character password → set as `GMAIL_APP_PASSWORD`
5. Set `GMAIL_USER` to your Gmail address

## OTP Flow

### Registration
1. User submits email → `POST /auth/send-otp` sends 6-digit code
2. User enters code + name/password → `POST /auth/verify-register-otp`
3. Server validates OTP, creates user, returns JWT

### Login
1. User submits email → `POST /auth/send-otp` sends 6-digit code
2. User enters code → `POST /auth/verify-login-otp`
3. Server validates OTP, logs in user, returns JWT

## JWT Configuration

- **Token expiry**: 30 days (configurable in `authController.js`)
- **Payload**: `{ id: user._id }`
- **Algorithm**: HS256
- **Storage**: Client-side `localStorage`

## Profile Update

Users can update their profile name via `PUT /api/auth/profile` (protected). The endpoint accepts `{ name }` and returns the full user document. The client updates `AuthContext` immediately via `setUser()`.
