import React from 'react';
import { SunIcon, MoonIcon } from './icons';
import { useTheme } from '../useTheme';

export const ThemeToggle: React.FC = () => {
  const [theme, toggleTheme] = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex items-center justify-center p-2 rounded text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
};
