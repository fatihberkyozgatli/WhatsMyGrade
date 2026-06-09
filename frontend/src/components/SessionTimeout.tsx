import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';

const IDLE_LIMIT_MS = 30 * 60 * 1000;
const WARN_BEFORE_MS = 60 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

export const SessionTimeout: React.FC = () => {
  const { logout } = useAuth();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const warnTimer = useRef<number | undefined>(undefined);
  const countdown = useRef<number | undefined>(undefined);
  const lastActivity = useRef(Date.now());
  const warningActiveRef = useRef(false);
  const stayRef = useRef<HTMLButtonElement>(null);

  const clearTimers = useCallback(() => {
    window.clearTimeout(warnTimer.current);
    window.clearInterval(countdown.current);
  }, []);

  const startWarning = useCallback(() => {
    warningActiveRef.current = true;
    let remaining = Math.ceil(WARN_BEFORE_MS / 1000);
    setSecondsLeft(remaining);
    countdown.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        window.clearInterval(countdown.current);
        logout();
      } else {
        setSecondsLeft(remaining);
      }
    }, 1000);
  }, [logout]);

  const reset = useCallback(() => {
    clearTimers();
    warningActiveRef.current = false;
    setSecondsLeft(null);
    warnTimer.current = window.setTimeout(startWarning, IDLE_LIMIT_MS - WARN_BEFORE_MS);
  }, [clearTimers, startWarning]);

  useEffect(() => {
    reset();
    const onActivity = () => {
      if (warningActiveRef.current) return;
      const now = Date.now();
      if (now - lastActivity.current < 1000) return;
      lastActivity.current = now;
      reset();
    };
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
    };
  }, [reset, clearTimers]);

  const warning = secondsLeft !== null;
  useEffect(() => {
    if (warning) stayRef.current?.focus();
  }, [warning]);

  if (!warning) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      aria-describedby="session-timeout-message"
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-sm w-full p-6">
        <h2 id="session-timeout-title" className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
          Still there?
        </h2>
        <p id="session-timeout-message" className="text-gray-600 dark:text-slate-300 text-sm mb-6">
          You'll be signed out in{' '}
          <span className="font-semibold text-gray-900 dark:text-slate-100 tabular-nums">{secondsLeft}s</span> due to
          inactivity.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={logout} className="btn-secondary text-sm">
            Sign out
          </button>
          <button ref={stayRef} onClick={reset} className="btn-primary text-sm">
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
};
