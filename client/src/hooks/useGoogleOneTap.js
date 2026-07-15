import { useEffect, useRef, useState, useCallback } from 'react';

const SCRIPT_ID = 'gis-script';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export default function useGoogleOneTap({ onCredential, nonce, autoPrompt = true } = {}) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [promptMoment, setPromptMoment] = useState(null);
  const [error, setError] = useState(null);
  const buttonRef = useRef(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  const handleCredential = useCallback((response) => {
    if (response?.credential) {
      callbackRef.current?.({ idToken: response.credential });
    }
  }, []);

  useEffect(() => {
    if (!CLIENT_ID) {
      setError('Google Client ID not configured (VITE_GOOGLE_CLIENT_ID)');
      return;
    }

    const initGIS = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
        cancel_on_tap_outside: false,
        ...(nonce ? { nonce } : {}),
      });
      setScriptLoaded(true);
    };

    if (document.getElementById(SCRIPT_ID)) {
      initGIS();
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGIS;
    document.body.appendChild(script);

    return () => {
      window.google?.accounts?.id?.cancel?.();
    };
  }, [handleCredential, nonce]);

  useEffect(() => {
    if (!scriptLoaded || !autoPrompt) return;
    const timer = setTimeout(() => {
      try {
        window.google?.accounts?.id?.prompt?.((moment) => {
          setPromptMoment(moment);
        });
      } catch {
        // skipped
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [scriptLoaded, autoPrompt]);

  const renderButton = useCallback((el) => {
    if (!el || !scriptLoaded) return;
    buttonRef.current = el;
    window.google?.accounts?.id?.renderButton?.(el, {
      theme: 'outline',
      size: 'large',
      width: el.clientWidth || '100%',
      text: 'continue_with',
    });
  }, [scriptLoaded]);

  return { scriptLoaded, promptMoment, error, renderButton };
}
