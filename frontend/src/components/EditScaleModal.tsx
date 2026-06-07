import React, { useEffect, useRef, useState } from 'react';
import { FormInput } from './FormInputs';
import { GradeScale } from '../types';

interface EditScaleModalProps {
  isOpen: boolean;

  scale: GradeScale | null;
  loading: boolean;
  saving: boolean;

  error: string;
  onSave: (thresholds: { A: number; B: number; C: number; D: number }) => void;
  onCancel: () => void;
}

type ThresholdState = { A: number | ''; B: number | ''; C: number | ''; D: number | '' };

const LETTERS = ['A', 'B', 'C', 'D'] as const;

export const EditScaleModal: React.FC<EditScaleModalProps> = ({
  isOpen,
  scale,
  loading,
  saving,
  error,
  onSave,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  });

  const [thresholds, setThresholds] = useState<ThresholdState>({ A: 90, B: 80, C: 70, D: 60 });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (scale) {
      setThresholds({ A: scale.A.min, B: scale.B.min, C: scale.C.min, D: scale.D.min });
      setValidationError('');
    }
  }, [scale]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancelRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, input, [href], [tabindex]:not([tabindex="-1"])'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { A, B, C, D } = thresholds;
    if (A === '' || B === '' || C === '' || D === '') {
      setValidationError('All grading scale thresholds are required');
      return;
    }
    if (A > 100 || A <= B || B <= C || C <= D || D <= 0) {
      setValidationError('Thresholds must descend within 0–100: 100 ≥ A > B > C > D > 0');
      return;
    }
    setValidationError('');
    onSave({ A, B, C, D });
  };

  const message = validationError || error;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-scale-title"
        tabIndex={-1}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md w-full focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} noValidate className="p-6">
          <h2 id="edit-scale-title" className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1">
            Edit Grading Scale
          </h2>
          <p className="text-gray-600 dark:text-slate-300 text-sm mb-5">
            Set the minimum percentage for each letter grade.
          </p>

          {message && (
            <div
              role="alert"
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-950 dark:border-red-900 dark:text-red-300"
            >
              {message}
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center" role="status">
              <div
                className="animate-spin motion-reduce:animate-none rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-3"
                aria-hidden="true"
              />
              <p className="text-gray-500 dark:text-slate-400 text-sm">Loading current scale…</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {LETTERS.map((letter) => (
                <FormInput
                  key={letter}
                  label={`${letter} (minimum %)`}
                  type="number"
                  value={thresholds[letter]}
                  onChange={(value) =>
                    setThresholds((t) => ({ ...t, [letter]: value as number | '' }))
                  }
                />
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-end mt-6">
            <button type="button" onClick={onCancel} className="btn-secondary text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading || saving} className="btn-primary text-sm">
              {saving ? 'Saving…' : 'Save Scale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
