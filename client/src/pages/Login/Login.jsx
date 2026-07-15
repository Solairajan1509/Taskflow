import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, KeyRound, AlertCircle, Loader } from 'lucide-react';
import GoogleLoginButton from '../../components/GoogleLoginButton';

const Login = () => {
  const { login, loginWithGoogle, requestOtp, loginWithOtp, error: authError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
  });

  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const { email, password, otp } = formData;

  const handleChange = (e) => {
    const updatedData = { ...formData, [e.target.name]: e.target.value };
    if (e.target.name === 'email' && otpSent) {
      updatedData.otp = '';
      setOtpSent(false);
      setSuccessMessage('');
    }
    setFormData(updatedData);
    if (localError) setLocalError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (!email) {
      setLocalError('Please enter your email address');
      return;
    }

    if (password) {
      setIsSubmitting(true);
      try {
        await login(email, password);
        navigate('/');
      } catch (err) {
        setLocalError(err.message || 'Login failed. Please check your credentials.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!otpSent) {
      setIsSubmitting(true);
      try {
        await requestOtp(email, 'login');
        setOtpSent(true);
        setSuccessMessage(`OTP code sent successfully to ${email}.`);
      } catch (err) {
        setLocalError(err.message || 'Failed to send OTP.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!otp) {
      setLocalError('Please enter the verification OTP');
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithOtp(email, otp);
      navigate('/');
    } catch (err) {
      setLocalError(err.message || 'OTP verification failed.');
    } finally {
      setIsSubmitting(false);
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
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/50 p-8 md:p-10 transition-all duration-300 transform hover:scale-[1.01]">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          <span>Welcome back</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Sign in with password, or leave password blank to request an email OTP.
        </p>
      </div>

      {/* Alerts box */}
      {(localError || authError) && (
        <div className="flex items-center space-x-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 text-sm mb-6 animate-pulse">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-semibold">{localError || authError}</span>
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

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
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
              placeholder="e.g. you@gmail.com"
              className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
              required
            />
          </div>
        </div>

        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Password (optional)
            </label>
            <span className="text-xs text-slate-400 dark:text-slate-500">Leave blank for OTP</span>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-5 w-5" />
            </span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
            />
          </div>
          <div className="flex justify-end mt-1.5">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {otpSent && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Verification Code
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
                  className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                  required={otpSent}
                  maxLength={6}
                />
              </div>
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
              <KeyRound className="h-5 w-5" />
              <span>
                {otpSent ? 'Verify & Sign In' : password ? 'Sign In' : 'Send OTP to Email'}
              </span>
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
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
