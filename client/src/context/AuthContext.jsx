import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user session on start
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (err) {
        console.error('Session loading failed:', err.response?.data?.message || err.message);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        status: data.status,
        role: data.role,
      });
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid email or password';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Request OTP to be sent to email for login or registration
  const requestOtp = async (email, purpose) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/send-otp', { email, purpose });
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to request OTP';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (payload, name, avatar) => {
    setError(null);
    setLoading(true);
    try {
      let body;
      if (typeof payload === 'string' && !name && !avatar) {
        body = { idToken: payload };
      } else if (typeof payload === 'string' && name) {
        body = { email: payload, name, avatar };
      } else if (typeof payload === 'object' && payload !== null) {
        body = payload;
      } else {
        throw new Error('Invalid Google login payload');
      }

      const { data } = await api.post('/auth/google-login', body);
      localStorage.setItem('token', data.token);
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        status: data.status,
        role: data.role,
      });
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Google authentication failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Login with OTP verification
  const loginWithOtp = async (email, otp) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-login-otp', { email, otp });
      localStorage.setItem('token', data.token);
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        status: data.status,
        role: data.role,
      });
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid OTP code';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Register with OTP verification
  const registerWithOtp = async (name, email, password, otp) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-register-otp', { name, email, password, otp });
      localStorage.setItem('token', data.token);
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        status: data.status,
        role: data.role,
      });
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to verify OTP code';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        status: data.status,
        role: data.role,
      });
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password – send reset OTP
  const forgotPassword = async (email) => {
    setError(null);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to send password reset OTP';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Reset Password – verify OTP and update password
  const resetPassword = async (email, otp, newPassword) => {
    setError(null);
    try {
      const { data } = await api.post('/auth/reset-password', { email, otp, newPassword });
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to reset password';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        loginWithGoogle,
        requestOtp,
        sendOtp: requestOtp,
        loginWithOtp,
        registerWithOtp,
        register,
        forgotPassword,
        resetPassword,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
