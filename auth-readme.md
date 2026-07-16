# TaskFlow — Authentication Overview

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

## Auth Context

`AuthContext` (`client/src/context/AuthContext.jsx`) provides:
- `user` — current user object `{ _id, name, email, avatar, status, role }`
- `login()`, `register()`, `loginWithGoogle()`, `loginWithOtp()`, `registerWithOtp()`
- `requestOtp()`, `forgotPassword()`, `resetPassword()`
- `logout()`, `setUser()`
- `loading`, `error`
