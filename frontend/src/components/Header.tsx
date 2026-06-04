import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `font-medium transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
    isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
  }`;

export const Header: React.FC<HeaderProps> = ({ isAuthenticated, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const headerRef = useRef<HTMLElement>(null);

  // Dismiss the mobile menu on Escape or a click outside the header.
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
    <header ref={headerRef} className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          WhatsMyGrade
        </Link>

        {isAuthenticated && (
          <>
            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-4">
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/add-course" className={navLinkClass}>
                Add Course
              </NavLink>
              <button onClick={onLogout} className="btn-secondary text-sm">
                Logout
              </button>
            </nav>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label="Toggle navigation menu"
              className="sm:hidden inline-flex items-center justify-center p-2 rounded text-gray-600 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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

      {/* Mobile nav dropdown */}
      {isAuthenticated && menuOpen && (
        <nav id="mobile-nav" className="sm:hidden border-t border-gray-200 px-4 py-3 flex flex-col gap-3">
          <NavLink to="/dashboard" onClick={closeMenu} className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/add-course" onClick={closeMenu} className={navLinkClass}>
            Add Course
          </NavLink>
          <button
            onClick={() => {
              closeMenu();
              onLogout();
            }}
            className="btn-secondary text-sm self-start"
          >
            Logout
          </button>
        </nav>
      )}
    </header>
  );
};
