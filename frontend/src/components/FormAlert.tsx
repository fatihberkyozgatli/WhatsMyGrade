import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface FormAlertProps {
  message: string;
}

export const FormAlert: React.FC<FormAlertProps> = ({ message }) => {
  const reduce = useReducedMotion();

  return (
    <motion.div
      role="alert"
      initial={reduce ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/60 dark:text-red-300"
    >
      <svg
        className="mt-px h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z"
          clipRule="evenodd"
        />
      </svg>
      <span className="leading-snug">{message}</span>
    </motion.div>
  );
};
