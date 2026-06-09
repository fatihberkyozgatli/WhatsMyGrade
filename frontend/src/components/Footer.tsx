import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GithubIcon } from './icons';
import { TermsModal } from './TermsModal';
import { PrivacyModal } from './PrivacyModal';

const navLink =
  'text-xs font-medium text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

export const Footer: React.FC = () => {
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <footer className="shrink-0 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            to="/"
            className="text-base font-semibold text-gray-900 dark:text-slate-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            WhatsMyGrade
          </Link>

          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setTermsOpen(true)} className={navLink}>
              Terms
            </button>
            <button type="button" onClick={() => setPrivacyOpen(true)} className={navLink}>
              Privacy
            </button>
            <a href="mailto:hello@whatsmygrade.app" className={navLink}>
              Contact
            </a>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-gray-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} WhatsMyGrade. Grades are estimates, not official records.</p>
          <div className="flex items-center gap-2">
            <p>
              Built by{' '}
              <a
                href="https://fatihberkyozgatli.com/"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-gray-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Fatih Berk Yozgatlı
              </a>
            </p>
            <a
              href="https://github.com/fatihberkyozgatli/WhatsMyGrade"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="p-1 -m-1 rounded-md text-gray-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
      <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </footer>
  );
};
