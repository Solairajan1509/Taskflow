import React, { useEffect, useRef, useState } from 'react';
import { Mail, User, Loader, CheckCircle, AlertCircle, RefreshCw, Clock, ChevronRight, Plus } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   Simulated "known accounts" — in a real app these would come from
   localStorage / a cookie set after each successful login.
   We read them from localStorage key: "tf_known_accounts" (JSON array).
───────────────────────────────────────────────────────────────────────────── */
const loadKnownAccounts = () => {
  try {
    return JSON.parse(localStorage.getItem('tf_known_accounts') || '[]');
  } catch {
    return [];
  }
};

const saveKnownAccount = (email, name, avatar) => {
  const accounts = loadKnownAccounts();
  const exists = accounts.find((a) => a.email === email);
  if (!exists) {
    accounts.unshift({ email, name, avatar });
    localStorage.setItem('tf_known_accounts', JSON.stringify(accounts.slice(0, 5)));
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   Avatar helper — initials circle
───────────────────────────────────────────────────────────────────────────── */
const Avatar = ({ name, email, size = 'md' }) => {
  const initials = (name || email || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const colors = [
    'bg-emerald-500', 'bg-teal-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500',
  ];
  const color = colors[(email?.charCodeAt(0) || 0) % colors.length];
  const sz = size === 'lg' ? 'h-14 w-14 text-xl' : 'h-10 w-10 text-sm';

  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════════════
   Main Component
═════════════════════════════════════════════════════════════════════════════ */
const GoogleSignIn = () => {
  const buttonRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  // steps: 'picker' | 'email-form' | 'verify-otp' | 'success'
  const [step, setStep] = useState('picker');
  const [knownAccounts, setKnownAccounts] = useState([]);
  const [formData, setFormData] = useState({ email: '', name: '' });
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);

  /* Load known accounts on mount */
  useEffect(() => {
    setKnownAccounts(loadKnownAccounts());
  }, []);

  /* OTP countdown */
  useEffect(() => {
    if (step !== 'verify-otp') return;
    if (timeLeft === 0) {
      setError('Code expired — please request a new one.');
      return;
    }
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, step]);

  /* Google Identity Services */
  useEffect(() => {
    if (!clientId || !buttonRef.current) return;
    const init = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (!credential) return setError('Google sign-in failed.');
          sendToOpener(credential);
        },
        ux_mode: 'popup',
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline', size: 'large', width: '100%', text: 'continue_with',
      });
    };

    const scriptId = 'gis-script';
    if (document.getElementById(scriptId)) { init(); return; }
    const s = document.createElement('script');
    s.id = scriptId;
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = init;
    document.body.appendChild(s);
    return () => window.google?.accounts?.id?.cancel?.();
  }, [clientId, step]);

  /* ── Helpers ── */
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const sendToOpener = (payload) => {
    if (!window.opener) return setError('Cannot communicate with the main window. Please retry.');
    window.opener.postMessage({ type: 'GOOGLE_IDENTITY_RESPONSE', payload }, window.location.origin);
    window.close();
  };

  const clearError = () => setError('');

  /* ── Pick an existing account ── */
  const handlePickAccount = (account) => {
    // Log in directly via the backend using the stored email (OTP login)
    setFormData({ email: account.email, name: account.name });
    handleSendOtp(account.email);
  };

  /* ── Send OTP ── */
  const handleSendOtp = async (emailOverride) => {
    const email = (emailOverride || formData.email).toLowerCase().trim();
    if (!email) return setError('Please enter your email address.');
    clearError();
    setIsSubmitting(true);
    try {
      // Try login first; if not found, try register
      let res = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'login' }),
      });

      if (!res.ok) {
        const d = await res.json();
        // Not registered — switch to register OTP
        if (res.status === 404) {
          res = await fetch('http://localhost:5000/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, purpose: 'register' }),
          });
          if (!res.ok) {
            const d2 = await res.json();
            throw new Error(d2.message || 'Failed to send code');
          }
          setFormData((p) => ({ ...p, email, _purpose: 'register' }));
        } else {
          throw new Error(d.message || 'Failed to send code');
        }
      } else {
        setFormData((p) => ({ ...p, email, _purpose: 'login' }));
      }

      setOtp('');
      setTimeLeft(300);
      setStep('verify-otp');
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Verify OTP ── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return setError('Please enter the full 6-digit code.');
    clearError();
    setIsSubmitting(true);

    const email = formData.email.toLowerCase().trim();
    const purpose = formData._purpose || 'login';
    const endpoint = purpose === 'register'
      ? 'http://localhost:5000/api/auth/verify-register-otp'
      : 'http://localhost:5000/api/auth/verify-login-otp';

    const body = purpose === 'register'
      ? { name: formData.name || email.split('@')[0], email, password: '', role: 'team_member', otp }
      : { email, otp };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');

      // Save to known accounts
      saveKnownAccount(data.email, data.name, data.avatar);

      // Pass token back to opener
      sendToOpener({ email: data.email, name: data.name, avatar: data.avatar, token: data.token });
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Resend OTP ── */
  const handleResend = () => handleSendOtp(formData.email);

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[420px] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-800 px-8 pt-8 pb-6 text-white text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {step === 'verify-otp' ? 'Verify your email' : 'Sign in to TaskFlow'}
          </h1>
          <p className="text-sm text-white/70 mt-1">
            {step === 'picker' && (knownAccounts.length > 0 ? 'Choose an account to continue' : 'Enter your email to continue')}
            {step === 'email-form' && 'Enter your email address'}
            {step === 'verify-otp' && `Code sent to ${formData.email}`}
          </p>
        </div>

        <div className="px-6 py-6 space-y-4">

          {/* Error alert */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ══ STEP: Account Picker ══ */}
          {step === 'picker' && (
            <>
              {/* Real Google button (if clientId configured) */}
              {clientId && (
                <div className="mb-2">
                  <div ref={buttonRef} className="w-full" />
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                </div>
              )}

              {/* Known accounts list */}
              {knownAccounts.length > 0 && (
                <div className="space-y-2">
                  {knownAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handlePickAccount(acc)}
                      disabled={isSubmitting}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all duration-150 text-left group disabled:opacity-50"
                    >
                      <Avatar name={acc.name} email={acc.email} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{acc.name || acc.email}</p>
                        <p className="text-xs text-slate-500 truncate">{acc.email}</p>
                      </div>
                      {isSubmitting
                        ? <Loader className="h-4 w-4 text-slate-400 animate-spin flex-shrink-0" />
                        : <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 flex-shrink-0 transition-colors" />
                      }
                    </button>
                  ))}
                </div>
              )}

              {/* Use a different / new account */}
              <button
                onClick={() => { clearError(); setStep('email-form'); }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all duration-150 text-left group"
              >
                <div className="h-10 w-10 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Plus className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">
                    {knownAccounts.length > 0 ? 'Use another account' : 'Continue with email'}
                  </p>
                  <p className="text-xs text-slate-400">Sign in or create a new account</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 ml-auto flex-shrink-0 transition-colors" />
              </button>
            </>
          )}

          {/* ══ STEP: Email Form ══ */}
          {step === 'email-form' && (
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }}
              className="space-y-4"
            >
              {/* Name (optional — used if registering) */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Full Name <span className="text-slate-300 normal-case font-normal">(for new accounts)</span>
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={(e) => { setFormData((p) => ({ ...p, name: e.target.value })); clearError(); }}
                    placeholder="Your name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address *</label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => { setFormData((p) => ({ ...p, email: e.target.value })); clearError(); }}
                    placeholder="you@gmail.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { clearError(); setStep('picker'); }}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting
                    ? <><Loader className="h-4 w-4 animate-spin" />Sending…</>
                    : <><Mail className="h-4 w-4" />Send Code</>
                  }
                </button>
              </div>
            </form>
          )}

          {/* ══ STEP: Verify OTP ══ */}
          {step === 'verify-otp' && (
            <>
              {/* Account display */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <Avatar name={formData.name} email={formData.email} />
                <div className="min-w-0">
                  {formData.name && <p className="text-sm font-semibold text-slate-800 truncate">{formData.name}</p>}
                  <p className="text-xs text-slate-500 truncate">{formData.email}</p>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">6-Digit Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); clearError(); }}
                    placeholder="000000"
                    className="w-full mt-1.5 py-4 text-center text-2xl font-bold tracking-[0.6em] rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                    autoFocus
                  />
                </div>

                {/* Timer */}
                <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-semibold">Expires in</span>
                  </div>
                  <span className={`text-base font-bold font-mono ${timeLeft < 60 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {fmt(timeLeft)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otp.length !== 6}
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting
                    ? <><Loader className="h-4 w-4 animate-spin" />Verifying…</>
                    : <><CheckCircle className="h-4 w-4" />Verify & Continue</>
                  }
                </button>
              </form>

              {/* Resend */}
              <div className="text-center">
                <button
                  onClick={handleResend}
                  disabled={timeLeft > 240}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 disabled:cursor-not-allowed transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {timeLeft > 240 ? `Resend in ${fmt(timeLeft - 240)}` : 'Resend code'}
                </button>
              </div>

              {/* Change email */}
              <div className="text-center">
                <button
                  onClick={() => { clearError(); setStep('email-form'); }}
                  className="text-xs text-slate-400 hover:text-slate-600 transition"
                >
                  ← Use a different email
                </button>
              </div>
            </>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 pt-1">
            Your data is secure and private. TaskFlow uses industry-standard encryption.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleSignIn;
