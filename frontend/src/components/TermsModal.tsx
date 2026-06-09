import React from 'react';
import { AlertTriangleIcon } from './icons';
import { LegalModal } from './LegalModal';

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

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => (
  <LegalModal isOpen={isOpen} onClose={onClose} title="Terms of Service" lastUpdated="Last updated June 2026">
    <div className="flex gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900">
      <AlertTriangleIcon className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
      <p className="text-sm text-amber-800 dark:text-amber-200">
        <span className="font-semibold">Grades are estimates, not official records.</span> WhatsMyGrade projects your
        grade from the data you enter to help you plan. Always confirm your actual grades with your instructor or
        registrar.
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
  </LegalModal>
);
