import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, User, Mail, Lock, AlertCircle, Loader, KeyRound } from 'lucide-react';
import GoogleLoginButton from '../../components/GoogleLoginButton';

const Register = () => {
  const { registerWithOtp, loginWithGoogle, requestOtp, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    otp: '',
  });

  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const getPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    const levels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
    const idx = Math.min(Math.floor(score / 2), 3);
    return { label: levels[idx], color: colors[idx], width: ((idx + 1) / 4) * 100 };
  };

  const { name, email, password, otp } = formData;
  const inviteDetails = new URLSearchParams(location.search);
  const invitedEmail = inviteDetails.get('email');
  const invitedProject = inviteDetails.get('project');
  const invitedBy = inviteDetails.get('inviter');

  useEffect(() => {
    if (invitedEmail) {
      setFormData((prev) => ({ ...prev, email: invitedEmail }));
      setSuccessMessage(
        invitedProject
          ? `You were invited by ${invitedBy || 'your team'} to join ${invitedProject}.`
          : 'You were invited to join a workspace.'
      );
    }
  }, [invitedEmail, invitedProject, invitedBy]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (localError) setLocalError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (!name || !email || !password) {
      setLocalError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    if (!otpSent) {
      setIsSubmitting(true);
      try {
        await requestOtp(email, 'register');
        setOtpSent(true);
        setSuccessMessage('Verification OTP sent successfully to your email.');
      } catch (err) {
        setLocalError(err.message || 'Failed to send verification OTP.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!otp) {
        setLocalError('Please enter the verification OTP');
        return;
      }
      setIsSubmitting(true);
      try {
        await registerWithOtp(name, email, password, otp);
        navigate('/');
      } catch (err) {
        setLocalError(err.message || 'OTP verification or registration failed.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleCredential = useCallback(async (payload) => {
    setLocalError('');
    setSuccessMessage('');
    if (!payload?.idToken) return;
    setIsSubmitting(true);
    try {
      await loginWithGoogle(payload);
      navigate('/');
    } catch (err) {
      setLocalError(err.message || 'Google authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [loginWithGoogle, navigate]);

  return (
    <div className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/50 p-4 sm:p-6 md:p-8 lg:p-10 transition-all duration-300 transform hover:scale-[1.01]">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
          <span>Create account</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Start collaborating on workspaces with <span className="font-semibold text-emerald-600 dark:text-emerald-400">TaskFlow</span>
        </p>
        {invitedProject && (
          <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm text-emerald-700 leading-relaxed">
            <span className="font-semibold">Invitation detected:</span> {invitedBy ? `${invitedBy} invited you` : 'You were invited'} to join {invitedProject}.
          </div>
        )}
      </div>

      {/* Error Alert Box */}
      {(localError || authError) && (
        <div className="flex items-center space-x-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 text-sm mb-6 animate-pulse">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{localError || authError}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-sm mb-6">
          <svg className="h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Name Field */}
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="h-5 w-5" />
            </span>
            <input
              type="text"
              name="name"
              value={name}
              onChange={handleChange}
              disabled={otpSent}
              placeholder="e.g. John Doe"
              className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl py-2.5 pl-11 pr-4 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 disabled:opacity-60"
              required
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-5 w-5" />
            </span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              disabled={otpSent}
              placeholder="e.g. you@gmail.com"
              className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl py-2.5 pl-11 pr-4 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 disabled:opacity-60"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-5 w-5" />
            </span>
            <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  disabled={otpSent}
                  placeholder="Min. 6 characters"
                  className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl py-2.5 pl-11 pr-4 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 disabled:opacity-60"
              required
            />
          </div>
          {password && !otpSent && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${getPasswordStrength(password).color}`}
                  style={{ width: `${getPasswordStrength(password).width}%` }} />
              </div>
              <p className={`text-[11px] font-semibold ${getPasswordStrength(password).color.replace('bg-', 'text-')}`}>
                {getPasswordStrength(password).label}
              </p>
            </div>
          )}
        </div>

        {/* Inline OTP verification block */}
        {otpSent && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 animate-fade-in">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Enter Verification OTP
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="h-5 w-5" />
              </span>
              <input
                type="text"
                name="otp"
                value={otp}
                onChange={handleChange}
                placeholder="6-digit OTP code"
                className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl py-2.5 pl-11 pr-4 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                required={otpSent}
                maxLength={6}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-3.5 text-sm font-bold shadow-lg shadow-emerald-600/20 dark:shadow-none flex items-center justify-center space-x-2 transition-all duration-250 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              <span>Please wait...</span>
            </>
          ) : (
            <>
              <UserPlus className="h-5 w-5" />
              <span>{otpSent ? 'Verify & Create Account' : 'Register & Verify Email'}</span>
            </>
          )}
        </button>
      </form>

      {/* Alternative Social Login */}
      <div className="mt-6 flex flex-col space-y-4">
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-100 dark:border-slate-700"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or continue with</span>
          <div className="flex-grow border-t border-slate-100 dark:border-slate-700"></div>
        </div>

        <GoogleLoginButton onCredential={handleGoogleCredential} />
      </div>

      {/* Redirect Footer */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/50 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
