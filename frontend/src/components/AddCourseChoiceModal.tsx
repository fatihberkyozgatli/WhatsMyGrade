import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface AddCourseChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCourseChoiceModal: React.FC<AddCourseChoiceModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
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
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button');
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
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

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const optionClass =
    'flex flex-col items-start gap-2 p-4 rounded-lg border border-gray-200 dark:border-slate-700 ' +
    'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700/50 text-left transition ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-course-choice-title"
        tabIndex={-1}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-lg w-full focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 id="add-course-choice-title" className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1">
            Add a Course
          </h2>
          <p className="text-gray-600 dark:text-slate-300 text-sm mb-5">
            Choose how you'd like to set it up.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <button type="button" onClick={() => go('/add-course')} className={optionClass}>
              <span className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </span>
              <span className="font-semibold text-gray-900 dark:text-slate-100">Manually Enter</span>
              <span className="text-xs text-gray-500 dark:text-slate-400">Type in the course details yourself.</span>
            </button>

            <button type="button" onClick={() => go('/add-course/upload')} className={optionClass}>
              <span className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </span>
              <span className="font-semibold text-gray-900 dark:text-slate-100">Upload Syllabus</span>
              <span className="text-xs text-gray-500 dark:text-slate-400">Let AI pull the details from a PDF.</span>
            </button>
          </div>

          <div className="mt-5 flex justify-end">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
