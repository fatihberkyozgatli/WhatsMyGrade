import React from 'react';
import { LegalModal } from './LegalModal';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sections: { heading: string; body: string }[] = [
  {
    heading: '1. What we collect',
    body: 'Your account details (name and email) and the course data you enter — courses, components, weights, and the grades you record.',
  },
  {
    heading: '2. How we use it',
    body: 'Only to run the service: to sign you in and to calculate and display your grade projections. We do not use your data for advertising.',
  },
  {
    heading: '3. Sharing',
    body: 'We do not sell or share your personal data. Your courses and grades are private to your account and are never shown to other users.',
  },
  {
    heading: '4. Security',
    body: 'Passwords are stored hashed, never in plain text, and your data is only accessible through your authenticated session.',
  },
  {
    heading: '5. Your control',
    body: 'You can edit or delete your courses, components, and grades at any time. Deleting a course permanently removes its data.',
  },
  {
    heading: '6. Changes',
    body: 'We may update this policy as the product evolves. Continued use after an update means you accept the revised policy.',
  },
];

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => (
  <LegalModal isOpen={isOpen} onClose={onClose} title="Privacy Policy" lastUpdated="Last updated June 2026">
    {sections.map((section) => (
      <div key={section.heading}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{section.heading}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{section.body}</p>
      </div>
    ))}

    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">7. Contact</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
        Questions about your data? Reach us at{' '}
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
