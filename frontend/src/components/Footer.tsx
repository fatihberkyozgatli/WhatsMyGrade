import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GithubIcon, MailIcon } from './icons';
import { TermsModal } from './TermsModal';

const iconLink =
  'p-2 rounded-md text-gray-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

export const Footer: React.FC = () => {
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <footer className="shrink-0 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-left">
          <Link
            to="/"
            className="text-base font-semibold text-gray-900 dark:text-slate-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            WhatsMyGrade
          </Link>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            © {new Date().getFullYear()} WhatsMyGrade. Grades are estimates, not official records.
          </p>
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="mt-1 inline-block text-xs font-medium text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Terms of Service
          </button>
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

      <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
    </footer>
  );
};
