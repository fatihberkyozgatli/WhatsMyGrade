import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AddCourseChoiceModal } from './AddCourseChoiceModal';
import { HelpMenu } from './HelpMenu';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `font-medium transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
    isActive
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-gray-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400'
  }`;

export const Header: React.FC<HeaderProps> = ({ isAuthenticated, onLogout }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const headerRef = useRef<HTMLElement>(null);

  const isOnCourseDetail = location.pathname.startsWith('/course/');
  const splitView = isOnCourseDetail && localStorage.getItem('wmg-course-layout') === 'split';

  const handleToggleLayout = () => {
    const current = localStorage.getItem('wmg-course-layout') === 'split';
    const next = current ? 'stacked' : 'split';
    localStorage.setItem('wmg-course-layout', next);
    window.dispatchEvent(new CustomEvent('wmg-layout-toggle', { detail: { view: next } }));
  };

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => document.documentElement.style.setProperty('--app-header-h', `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const handleClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [menuOpen]);

  return (
    <header
      ref={headerRef}
      className="shrink-0 bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-700"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:text-slate-100 dark:hover:text-blue-400"
        >
          WhatsMyGrade
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <AnimatePresence mode="wait">
            {isOnCourseDetail && (
              <motion.button
                key="layout-toggle"
                type="button"
                onClick={handleToggleLayout}
                aria-label={splitView ? 'Switch to stacked layout' : 'Switch to split layout'}
                title={splitView ? 'Stacked view' : 'Split view'}
                className="hidden md:inline-flex items-center justify-center p-2 rounded text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  key={splitView ? 'split' : 'stacked'}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {splitView ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4.5v15M5 5.25h14a.75.75 0 01.75.75v12a.75.75 0 01-.75.75H5a.75.75 0 01-.75-.75V6A.75.75 0 015 5.25z" />
                    </svg>
                  )}
                </motion.div>
              </motion.button>
            )}
          </AnimatePresence>

          <HelpMenu />

          <ThemeToggle />

          {isAuthenticated && (
            <>

              <nav className="hidden sm:flex items-center gap-4">
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <button
                  type="button"
                  onClick={() => setChoiceOpen(true)}
                  className={navLinkClass({ isActive: false })}
                >
                  Add Course
                </button>
                <button onClick={onLogout} className="btn-secondary text-sm">
                  Logout
                </button>
              </nav>

              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
                aria-label="Toggle navigation menu"
                className="sm:hidden inline-flex items-center justify-center p-2 rounded text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {isAuthenticated && menuOpen && (
        <nav
          id="mobile-nav"
          className="sm:hidden border-t border-gray-200 dark:border-slate-700 px-4 py-3 flex flex-col items-center gap-3"
        >
          <NavLink to="/dashboard" onClick={closeMenu} className={navLinkClass}>
            Dashboard
          </NavLink>
          <button
            type="button"
            onClick={() => {
              closeMenu();
              setChoiceOpen(true);
            }}
            className={navLinkClass({ isActive: false })}
          >
            Add Course
          </button>
          <button
            onClick={() => {
              closeMenu();
              onLogout();
            }}
            className="btn-secondary text-sm"
          >
            Logout
          </button>
        </nav>
      )}

      <AddCourseChoiceModal isOpen={choiceOpen} onClose={() => setChoiceOpen(false)} />
    </header>
  );
};
