import React, { useRef, useEffect, useState } from 'react';
import useGoogleOneTap from '../hooks/useGoogleOneTap';
import { Loader, AlertCircle } from 'lucide-react';

export default function GoogleLoginButton({ onCredential, autoPrompt = true, label = 'Continue with Google' }) {
  const btnRef = useRef(null);
  const [rendered, setRendered] = useState(false);
  const { scriptLoaded, error: gisError, renderButton } = useGoogleOneTap({
    onCredential,
    autoPrompt,
  });

  useEffect(() => {
    if (scriptLoaded && btnRef.current && !rendered) {
      renderButton(btnRef.current);
      setRendered(true);
    }
  }, [scriptLoaded, renderButton, rendered]);

  if (gisError) {
    return (
      <div className="w-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700/60 p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 text-sm font-medium mb-2">
          <AlertCircle className="h-4 w-4" />
          <span>Google Sign-In not configured</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Set <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">VITE_GOOGLE_CLIENT_ID</code> in <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">.env</code> (root)
        </p>
      </div>
    );
  }

  return (
    <div ref={btnRef} className="w-full min-h-[48px] flex items-center justify-center">
      {!scriptLoaded && (
        <span className="flex items-center gap-2 text-sm text-slate-400">
          <Loader className="h-4 w-4 animate-spin" /> Loading…
        </span>
      )}
    </div>
  );
}
