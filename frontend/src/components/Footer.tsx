import React from 'react';
import { Link } from 'react-router-dom';
import { GithubIcon, MailIcon } from './icons';

const iconLink =
  'p-2 rounded-md text-gray-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

export const Footer: React.FC = () => {
  return (
    <footer className="shrink-0 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-left">
          <Link
            to="/"
            className="text-base font-semibold text-gray-900 dark:text-slate-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            WhatsMyGrade
          </Link>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            © {new Date().getFullYear()} WhatsMyGrade. Built for students.
          </p>
        </div>

        <div className="flex items-center gap-1">
          <a
            href="https://github.com/fatihberkyozgatli/WhatsMyGrade"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className={iconLink}
          >
            <GithubIcon className="w-5 h-5" />
          </a>
          <a href="mailto:hello@whatsmygrade.app" aria-label="Email" className={iconLink}>
            <MailIcon className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
};
