import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="inline-flex p-4 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500">
          <AlertCircle className="h-12 w-12" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white">Page Not Found</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The page you are looking for does not exist or has been moved. Check the URL or navigate back.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-3 text-sm font-semibold shadow-md transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
