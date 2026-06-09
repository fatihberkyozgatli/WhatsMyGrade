import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { InfoIcon } from './icons';

interface HelpContent {
  title: string;
  intro: string;
  tips: string[];
}

const getHelpContent = (pathname: string): HelpContent => {
  if (pathname.startsWith('/course/')) {
    return {
      title: 'Working on a course',
      intro: 'Everything you do here updates your projected grade instantly.',
      tips: [
        'Add components manually, or type a grade in plain English in the "Log a grade" box.',
        'Ask Grade Coach what you need for a grade, whether an A is still possible, or which component matters most.',
        'Grade Coach can also set up components, change weights, remove them, and log your grades from the chat.',
        'Run Scenario to test hypothetical grades, or Edit Grading Scale to set your own letter cutoffs.',
      ],
    };
  }
  if (pathname.startsWith('/dashboard')) {
    return {
      title: 'Your dashboard',
      intro: 'Each card shows where a course stands and what it would take to climb.',
      tips: [
        'Click a card to manage components and scores.',
        'Add a course manually or upload a syllabus to auto-fill it.',
        'The status badge reflects your current standing.',
      ],
    };
  }
  if (pathname.startsWith('/add-course')) {
    return {
      title: 'Adding a course',
      intro: 'Start from scratch or let the syllabus parser do the typing.',
      tips: [
        'Manual entry lets you name the course and add components yourself.',
        'Upload a PDF syllabus to extract components and weights automatically.',
        'You can edit anything after it is created.',
      ],
    };
  }
  if (pathname === '/login') {
    return {
      title: 'Signing in',
      intro: 'Welcome back. Sign in to pick up where you left off.',
      tips: [
        'Use the email and password you registered with.',
        'New here? Create an account in seconds.',
        'Your grade data stays private to your account.',
      ],
    };
  }
  if (pathname === '/register') {
    return {
      title: 'Creating your account',
      intro: 'Set up an account to start tracking your grades.',
      tips: [
        'Fill in your name, email, and a password.',
        'Everything you enter is private to you.',
        'Grades here are estimates to plan with, not official records.',
      ],
    };
  }
  return {
    title: 'Welcome to WhatsMyGrade',
    intro: 'Track every course, project your final grade, and know exactly what you need.',
    tips: [
      'Create an account to save your courses.',
      'Add grades as you get them to watch your projection update.',
      'See the score you need on what is left for any letter grade.',
    ],
  };
};

export const HelpMenu: React.FC = () => {
  const location = useLocation();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open]);

  const content = getHelpContent(location.pathname);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label="Help"
        className={`inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors ${
          open
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400'
        }`}
      >
        <InfoIcon className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            role="dialog"
            aria-label={content.title}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -6 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] origin-top-right rounded-lg border border-gray-200 bg-white p-4 shadow-lg z-50 dark:border-slate-700 dark:bg-slate-800"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{content.title}</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{content.intro}</p>
            <ul className="mt-3 space-y-2">
              {content.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-slate-300">
                  <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
