import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  KeyRound,
  Lock,
  AlertCircle,
  Loader,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

const STEPS = { EMAIL: 'email', OTP: 'otp', SUCCESS: 'success' };

const ForgotPassword = () => {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ─── Step 1: send OTP ─────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email address'); return; }
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setSuccessMsg(`A 6-digit reset code has been sent to ${email}`);
      setStep(STEPS.OTP);
    } catch (err) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Step 2: verify OTP + reset password ──────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp) { setError('Please enter the verification code'); return; }
    if (!newPassword) { setError('Please enter your new password'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setIsSubmitting(true);
    try {
      await resetPassword(email, otp, newPassword);
      setStep(STEPS.SUCCESS);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Shared alert components ───────────────────────────────────────────────
  const ErrorAlert = () =>
    error ? (
      <div className="flex items-center space-x-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 text-sm mb-6 animate-pulse">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <span className="font-semibold">{error}</span>
      </div>
    ) : null;

  const SuccessAlert = ({ msg }) =>
    msg ? (
      <div className="flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-sm mb-6">
        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
        <span className="font-medium">{msg}</span>
      </div>
    ) : null;

  // ─── Shared input classes ──────────────────────────────────────────────────
  const inputCls =
    'w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200';
  const btnCls =
    'w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-3.5 text-sm font-bold shadow-lg shadow-emerald-600/20 dark:shadow-none flex items-center justify-center space-x-2 transition-all duration-250 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/50 p-8 md:p-10 transition-all duration-300 transform hover:scale-[1.01]">

      {/* ── Step 1: Email ── */}
      {step === STEPS.EMAIL && (
        <>
          <div className="mb-8">
            <div className="flex items-center justify-center w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl mb-5 mx-auto">
              <ShieldCheck className="h-7 w-7 text-orange-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-center">
              Forgot Password?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
              No worries! Enter your email and we'll send you a reset code.
            </p>
          </div>

          <ErrorAlert />

          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@gmail.com"
                  className={inputCls}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className={btnCls}>
              {isSubmitting ? (
                <><Loader className="h-5 w-5 animate-spin" /><span>Sending code…</span></>
              ) : (
                <><Mail className="h-5 w-5" /><span>Send Reset Code</span></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50 text-center">
            <Link
              to="/login"
              className="inline-flex items-center space-x-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </>
      )}

      {/* ── Step 2: OTP + New Password ── */}
      {step === STEPS.OTP && (
        <>
          <div className="mb-8">
            <div className="flex items-center justify-center w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl mb-5 mx-auto">
              <KeyRound className="h-7 w-7 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-center">
              Reset Password
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
              Enter the code sent to <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span> and choose a new password.
            </p>
          </div>

          <ErrorAlert />
          <SuccessAlert msg={successMsg} />

          <form onSubmit={handleReset} className="space-y-5">
            {/* OTP */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Verification Code
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                  placeholder="6-digit code"
                  className={inputCls}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                  placeholder="Min. 6 characters"
                  className={`${inputCls} pr-11`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  placeholder="Re-enter new password"
                  className={`${inputCls} pr-11`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Live match indicator */}
              {confirmPassword && (
                <p className={`mt-1.5 text-xs font-medium ${newPassword === confirmPassword ? 'text-emerald-500' : 'text-red-500'}`}>
                  {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className={btnCls}>
              {isSubmitting ? (
                <><Loader className="h-5 w-5 animate-spin" /><span>Resetting…</span></>
              ) : (
                <><ShieldCheck className="h-5 w-5" /><span>Reset Password</span></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setStep(STEPS.EMAIL); setError(''); setSuccessMsg(''); setOtp(''); setNewPassword(''); setConfirmPassword(''); }}
              className="inline-flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Change email address</span>
            </button>
          </div>
        </>
      )}

      {/* ── Step 3: Success ── */}
      {step === STEPS.SUCCESS && (
        <div className="text-center py-4">
          <div className="flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6 mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            Password Reset! 🎉
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Your password has been successfully updated.<br />
            You can now sign in with your new credentials.
          </p>
          <button
            onClick={() => navigate('/login')}
            className={`${btnCls} mx-auto max-w-xs`}
          >
            <KeyRound className="h-5 w-5" />
            <span>Sign In Now</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
