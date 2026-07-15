import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import { LayoutGrid, Layers, Kanban, CheckCircle } from 'lucide-react';

const AuthLayout = () => {
  const { user } = useAuth();

  // If already logged in, skip auth screens
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen w-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Brand & Marketing panel (Visible on Large screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-emerald-600 via-teal-700 to-indigo-900 text-white p-12 flex-col justify-between overflow-hidden">
        {/* Abstract design elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white filter blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-white filter blur-3xl"></div>
        </div>

        {/* Top Header Logo */}
        <div className="flex items-center space-x-3 z-10">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
            <LayoutGrid className="h-8 w-8 text-emerald-300" />
          </div>
          <span className="text-2xl font-bold tracking-tight">TaskFlow</span>
        </div>

        {/* Center Marketing Section */}
        <div className="space-y-6 z-10 my-auto">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
            Manage Projects, Teams, & Deliverables in Real-Time
          </h1>
          <p className="text-lg text-emerald-100 max-w-lg font-light leading-relaxed">
            The ultimate productivity solution for enterprise environments. Track deadlines, organize tasks using our interactive Kanban boards, and sync with your team effortlessly.
          </p>

          {/* Micro Features list */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500/20 p-1.5 rounded-lg">
                <Kanban className="h-5 w-5 text-emerald-300" />
              </div>
              <span className="text-sm font-medium">Interactive drag & drop Kanban boards</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500/20 p-1.5 rounded-lg">
                <Layers className="h-5 w-5 text-emerald-300" />
              </div>
              <span className="text-sm font-medium">Granular workspaces and sub-tasking</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500/20 p-1.5 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-300" />
              </div>
              <span className="text-sm font-medium">Real-time chat & notifications</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-sm text-emerald-200/60 z-10 font-light">
          © {new Date().getFullYear()} TaskFlow Inc. All rights reserved.
        </div>
      </div>

      {/* Auth Forms panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="absolute top-6 right-6 z-10">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
