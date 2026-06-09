import React, { useState } from 'react';
import api from '../api';
import { Spinner } from './Spinner';

interface QuickGradeEntryProps {
  courseId: string;
  onApply: (componentId: number, score: number) => Promise<void>;
}

interface Proposal {
  componentId: number;
  componentName: string;
  score: number;
}

export const QuickGradeEntry: React.FC<QuickGradeEntryProps> = ({ courseId, onApply }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError('');
    setProposal(null);
    try {
      const res = await api.post(`/grade-entry/${courseId}`, { text: trimmed });
      setProposal(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not read that. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!proposal) return;
    setApplying(true);
    try {
      await onApply(proposal.componentId, proposal.score);
      setProposal(null);
      setText('');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <span
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-blue-500"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
            </svg>
          </span>
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError('');
            }}
            placeholder="Log a grade — e.g. “I got an 85 on my midterm”"
            aria-label="Log a grade in plain language"
            className="input-field !pl-9 text-base sm:text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="btn-primary text-sm inline-flex items-center justify-center gap-2 shrink-0"
        >
          {loading ? <Spinner /> : 'Log'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {proposal && (
        <div className="mt-3 flex flex-col gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-800 dark:text-slate-200">
            Set <span className="font-semibold">{proposal.componentName}</span> to{' '}
            <span className="font-semibold tabular-nums">{proposal.score}%</span>?
          </p>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button onClick={() => setProposal(null)} disabled={applying} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={applying}
              className="btn-primary text-sm inline-flex items-center justify-center gap-2"
            >
              {applying && <Spinner />}
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
