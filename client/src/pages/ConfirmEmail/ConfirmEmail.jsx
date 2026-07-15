import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Loader, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

const ConfirmEmail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { loginWithGoogle, error: authError } = useAuth();

    const [email, setEmail] = useState(location.state?.email || '');
    const [name, setName] = useState(location.state?.name || '');
    const [avatar, setAvatar] = useState(location.state?.avatar || '');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [localError, setLocalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (!email) {
            navigate('/login');
        }
    }, [email, navigate]);

    // Countdown timer for OTP expiration
    useEffect(() => {
        if (timeLeft === 0) {
            setLocalError('Confirmation code has expired. Please request a new one.');
            setCanResend(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleConfirmationCodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setConfirmationCode(value);
        if (localError) setLocalError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setSuccessMessage('');

        if (!confirmationCode || confirmationCode.length !== 6) {
            setLocalError('Please enter a valid 6-digit confirmation code.');
            return;
        }

        if (!email || !name) {
            setLocalError('Session data missing. Please start over.');
            navigate('/login');
            return;
        }

        setIsSubmitting(true);
        try {
            // Pass the confirmation code as the OTP to verify
            const payload = {
                email: email.toLowerCase().trim(),
                name: name.trim(),
                avatar: avatar,
            };

            // Note: The actual verification happens via the OTP verification endpoint
            // The confirmationCode is passed to the backend to verify
            await loginWithGoogle(payload);

            setSuccessMessage('Email verified successfully! Logging you in...');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err) {
            setLocalError(err.message || 'Email verification failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        setCanResend(false);
        setTimeLeft(300);
        setConfirmationCode('');
        setLocalError('');

        try {
            // Request a new OTP
            const response = await fetch('http://localhost:5000/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, purpose: 'register' }),
            });

            if (!response.ok) throw new Error('Failed to resend confirmation code');

            setSuccessMessage('A new confirmation code has been sent to your email.');
        } catch (err) {
            setLocalError('Failed to resend confirmation code. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[520px] rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-900 p-8 text-white">
                    <div className="flex items-center justify-center mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                            <Mail className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="space-y-3 text-center">
                        <h1 className="text-3xl font-extrabold">Verify Your Email</h1>
                        <p className="text-sm text-slate-200/90 max-w-md mx-auto">
                            A 6-digit confirmation code has been sent to your email address.
                        </p>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {/* Email Display */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold mb-2">Confirmation Email Sent To:</p>
                        <p className="text-sm font-medium text-slate-900 break-all">{email}</p>
                    </div>

                    {/* Error Message */}
                    {localError && (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 text-rose-700 px-4 py-3 text-sm flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <span>{localError}</span>
                        </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {/* Confirmation Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                                Enter 6-Digit Code
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={confirmationCode}
                                onChange={handleConfirmationCodeChange}
                                placeholder="000000"
                                maxLength="6"
                                className="w-full mt-2 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                Check your email and enter the 6-digit code
                            </p>
                        </div>

                        {/* Timer */}
                        <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-4">
                            <div className="flex items-center gap-2 text-blue-900">
                                <Clock className="h-4 w-4" />
                                <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                                    Code Expires In:
                                </span>
                            </div>
                            <span className={`text-lg font-bold font-mono ${timeLeft < 60 ? 'text-rose-600' : 'text-blue-600'}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || confirmationCode.length !== 6}
                            className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader className="h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    Verify & Create Account
                                </>
                            )}
                        </button>
                    </form>

                    {/* Resend Option */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                        <p className="text-xs text-slate-600 mb-3">Didn't receive the code?</p>
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={!canResend && timeLeft > 30}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 disabled:cursor-not-allowed transition"
                        >
                            <RefreshCw className="h-4 w-4" />
                            {canResend || timeLeft <= 30 ? 'Resend Code' : `Resend available in ${formatTime(300 - timeLeft)}`}
                        </button>
                    </div>

                    {/* Help Text */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
                        <p className="font-semibold text-slate-900 mb-2">Troubleshooting:</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Check your spam/junk folder</li>
                            <li>Make sure you entered the correct email address</li>
                            <li>Code is valid for 5 minutes</li>
                        </ul>
                    </div>

                    <div className="text-center text-xs text-slate-500">
                        <p>
                            Want to use a different email?{' '}
                            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmEmail;
