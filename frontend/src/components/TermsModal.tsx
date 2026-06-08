import React, { useEffect, useRef } from 'react';
import { XIcon, AlertTriangleIcon } from './icons';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sections: { heading: string; body: string }[] = [
  {
    heading: '1. Acceptance',
    body: 'By creating an account or using WhatsMyGrade, you agree to these terms. If you do not agree, please do not use the service.',
  },
  {
    heading: '2. The service',
    body: 'WhatsMyGrade helps you record course components and scores and projects where your grade is heading. It is a personal planning tool, not a system of record.',
  },
  {
    heading: '3. Your account',
    body: 'You are responsible for keeping your login details safe and for the activity on your account. Use an email you control so you can recover access.',
  },
  {
    heading: '4. Your data',
    body: 'The courses and grades you enter are private to your account. You can edit or delete them at any time, and deleting a course removes its data.',
  },
  {
    heading: '5. No warranty',
    body: 'The service is provided as-is. We work to keep calculations accurate, but we cannot guarantee the service will always be available or error-free.',
  },
  {
    heading: '6. Changes',
    body: 'We may update these terms as the product evolves. Continued use after an update means you accept the revised terms.',
  },
];

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const list = Array.from(focusable).filter((el) => !el.hasAttribute('disabled'));
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        tabIndex={-1}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[85vh] flex flex-col focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 id="terms-title" className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Terms of Service
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Last updated June 2026</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="flex gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900">
            <AlertTriangleIcon className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Grades are estimates, not official records.</span> WhatsMyGrade projects
              your grade from the data you enter to help you plan. Always confirm your actual grades with your
              instructor or registrar.
            </p>
          </div>

          {sections.map((section) => (
            <div key={section.heading}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{section.heading}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{section.body}</p>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">7. Contact</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
              Questions about these terms? Reach us at{' '}
              <a
                href="mailto:hello@whatsmygrade.app"
                className="rounded font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                hello@whatsmygrade.app
              </a>
              .
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-end">
          <button type="button" onClick={onClose} className="btn-primary text-sm">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
