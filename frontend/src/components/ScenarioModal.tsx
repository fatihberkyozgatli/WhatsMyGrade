import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api';
import { GradeComponent, GradeScale, DEFAULT_GRADE_SCALE } from '../types';
import { GradeGauge } from './GradeCharts';
import { XIcon } from './icons';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  components: GradeComponent[];
}

type Mode = 'ungraded' | 'all';

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export const ScenarioModal: React.FC<ScenarioModalProps> = ({ isOpen, onClose, courseId, components }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const [mode, setMode] = useState<Mode>('ungraded');
  const [values, setValues] = useState<Record<number, string>>({});
  const [scale, setScale] = useState<GradeScale | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const init: Record<number, string> = {};
    components.forEach((c) => {
      init[c.id] = c.graded && c.grade !== null ? String(c.grade) : '';
    });
    setValues(init);
    setMode('ungraded');
    setScale(null);

    let cancelled = false;
    api
      .get(`/grade-scale/${courseId}`)
      .then((res) => {
        if (!cancelled) setScale(res.data);
      })
      .catch(() => {
        if (!cancelled) setScale(DEFAULT_GRADE_SCALE);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, courseId, components]);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
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

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus();
    };
  }, [isOpen]);

  const result = useMemo(() => {
    const effective = (c: GradeComponent): number | null => {
      const raw = values[c.id];
      const entered =
        raw !== undefined && raw !== '' && Number.isFinite(parseFloat(raw)) ? clamp(parseFloat(raw)) : null;
      if (mode === 'all') return entered;
      return c.graded && c.grade !== null ? Number(c.grade) : entered;
    };

    let enteredWeight = 0;
    let weightedSum = 0;
    let gradedWeight = 0;
    let gradedSum = 0;
    components.forEach((c) => {
      const w = Number(c.weight);
      const e = effective(c);
      if (e !== null) {
        enteredWeight += w;
        weightedSum += e * w;
      }
      if (c.graded && c.grade !== null) {
        gradedWeight += w;
        gradedSum += Number(c.grade) * w;
      }
    });

    const totalWeight = components.reduce((s, c) => s + Number(c.weight), 0);
    return {
      projected: enteredWeight > 0 ? weightedSum / enteredWeight : null,
      coverage: totalWeight > 0 ? (enteredWeight / totalWeight) * 100 : 0,
      gradedWeight,
      securedAvg: gradedWeight > 0 ? gradedSum / gradedWeight : null,
    };
  }, [components, values, mode]);

  const letterOf = (pct: number | null): string => {
    if (pct === null) return 'N/A';
    const s = scale ?? DEFAULT_GRADE_SCALE;
    const order = Object.entries(s).sort((a, b) => b[1].min - a[1].min);
    for (const [letter, range] of order) {
      if (pct >= range.min) return letter;
    }
    return 'F';
  };

  if (!isOpen) return null;

  const ungraded = components.filter((c) => !(c.graded && c.grade !== null));
  const rows = mode === 'all' ? components : ungraded;
  const projected = result.projected;
  const letter = letterOf(projected);

  const segButton = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      aria-pressed={mode === m}
      className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        mode === m
          ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
          : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scenario-title"
        tabIndex={-1}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[88vh] flex flex-col focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-4 shrink-0 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="scenario-title" className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Run Scenario
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                Try hypothetical scores. Nothing is saved.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div
            className="mt-4 flex w-full sm:w-72 p-1 bg-gray-100 dark:bg-slate-900 rounded-lg"
            role="group"
            aria-label="Scenario mode"
          >
            {segButton('ungraded', 'Test Ungraded')}
            {segButton('all', 'Test All')}
          </div>
        </div>

        <div className="flex flex-col-reverse md:flex-row md:items-start gap-5 p-6 overflow-y-auto">
          <div className="flex-1 min-w-0">
            {mode === 'ungraded' && result.gradedWeight > 0 && result.securedAvg !== null && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-sm">
                Secured <span className="font-semibold tabular-nums">{Math.round(result.gradedWeight)}%</span> of the grade at{' '}
                <span className="font-semibold tabular-nums">{result.securedAvg.toFixed(1)}%</span> average.
              </div>
            )}

            {rows.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400 py-4">
                {mode === 'ungraded'
                  ? 'Every component is graded. Switch to Test All to experiment.'
                  : 'No components yet.'}
              </p>
            ) : (
              <div className="space-y-2">
                {rows.map((c) => {
                  const isGraded = c.graded && c.grade !== null;
                  return (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{c.name}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 tabular-nums">
                          {Number(c.weight)}%{mode === 'all' && isGraded ? ' · graded' : ''}
                        </div>
                      </div>
                      <div className="relative w-24 shrink-0">
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          max="100"
                          step="any"
                          value={values[c.id] ?? ''}
                          onChange={(e) => setValues((v) => ({ ...v, [c.id]: e.target.value }))}
                          placeholder="score"
                          aria-label={`Hypothetical score for ${c.name}`}
                          className="input-field pr-7 py-2"
                        />
                        <span className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 dark:text-slate-500 text-sm">
                          %
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="md:w-56 shrink-0 md:sticky md:top-0">
            <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-2">
                Projected grade
              </p>
              <div className="flex flex-col items-center">
                <GradeGauge value={projected} label="Projected grade" />
              </div>
              <div className="mt-1 text-center" aria-live="polite" aria-atomic="true">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{letter}</span>
                <span className="sr-only">
                  {projected !== null ? ` (projected ${projected.toFixed(1)} percent)` : ' (projected not available)'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 tabular-nums">
                {Math.round(result.coverage)}% of grade entered
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
