import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const GradeGauge: React.FC<{ value: number | null }> = ({ value }) => {
  const reduce = useReducedMotion();
  const cx = 100;
  const cy = 100;
  const r = 80;
  const hasValue = value !== null;
  const v = Math.max(0, Math.min(100, value ?? 0));
  const track = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const arcLength = Math.PI * r;
  const target = arcLength * (1 - v / 100); // dashoffset that reveals fraction v
  const colorClass =
    v >= 90
      ? 'stroke-green-600 dark:stroke-green-400'
      : v >= 80
      ? 'stroke-blue-600 dark:stroke-blue-400'
      : v >= 70
      ? 'stroke-amber-500 dark:stroke-amber-400'
      : 'stroke-red-600 dark:stroke-red-400';

  return (
    <svg
      viewBox="0 0 200 116"
      className="w-full max-w-[240px]"
      role="img"
      aria-label={`Current grade ${hasValue ? `${v.toFixed(2)} percent` : 'not available'}`}
    >
      <path
        d={track}
        fill="none"
        className="stroke-gray-300 dark:stroke-slate-600"
        strokeWidth={14}
        strokeLinecap="round"
      />
      {hasValue && v > 0 && (
        <motion.path
          d={track}
          fill="none"
          className={colorClass}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          initial={{ strokeDashoffset: reduce ? target : arcLength }}
          animate={{ strokeDashoffset: target }}
          transition={{ duration: reduce ? 0 : 0.9, ease: 'easeOut' }}
        />
      )}
      <text
        x="100"
        y="92"
        textAnchor="middle"
        className="fill-slate-900 dark:fill-slate-100"
        fontSize="30"
        fontWeight="700"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {hasValue ? `${v.toFixed(1)}%` : 'N/A'}
      </text>
    </svg>
  );
};

export const GradedSplitBar: React.FC<{ graded: number; remaining: number }> = ({ graded, remaining }) => {
  const reduce = useReducedMotion();
  const total = graded + remaining;
  const g = total > 0 ? (graded / total) * 100 : 0;
  const rem = total > 0 ? (remaining / total) * 100 : 0;

  return (
    <div>
      <div
        className="flex h-4 w-full rounded-full overflow-hidden bg-gray-100 dark:bg-slate-700"
        role="img"
        aria-label={`${graded.toFixed(0)} percent of course weight graded, ${remaining.toFixed(0)} percent remaining`}
      >
        {g > 0 && (
          <motion.div
            className="bg-blue-600 dark:bg-blue-500 h-full"
            initial={{ width: reduce ? `${g}%` : 0 }}
            animate={{ width: `${g}%` }}
            transition={{ duration: reduce ? 0 : 0.6, ease: 'easeOut' }}
          />
        )}
        {rem > 0 && <div className="bg-gray-300 dark:bg-slate-500 h-full" style={{ width: `${rem}%` }} />}
      </div>
      <div className="flex justify-between text-xs mt-2">
        <span className="text-gray-600 dark:text-slate-400 inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
          Graded <span className="font-semibold text-gray-900 dark:text-slate-100 tabular-nums">{graded.toFixed(0)}%</span>
        </span>
        <span className="text-gray-600 dark:text-slate-400 inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-300 dark:bg-slate-600" />
          Remaining <span className="font-semibold text-gray-900 dark:text-slate-100 tabular-nums">{remaining.toFixed(0)}%</span>
        </span>
      </div>
    </div>
  );
};

export const LetterRequirementBars: React.FC<{ requirements: { [key: string]: string } }> = ({
  requirements,
}) => {
  const entries = Object.entries(requirements);

  return (
    <ul className="space-y-2.5">
      {entries.map(([letter, req]) => {
        const pct = parseFloat(req);
        const isPct = !Number.isNaN(pct);
        const secured = req === 'Already secured';
        const impossible = req === 'No longer possible';

        const fill = secured ? 100 : isPct ? Math.max(0, Math.min(100, pct)) : 0;
        const barColor = secured
          ? 'bg-green-500 dark:bg-green-400'
          : impossible
          ? 'bg-red-300'
          : isPct
          ? pct <= 60
            ? 'bg-green-500 dark:bg-green-400'
            : pct <= 85
            ? 'bg-amber-500'
            : 'bg-red-500 dark:bg-red-400'
          : 'bg-gray-300 dark:bg-slate-500';
        const labelColor = secured
          ? 'text-green-700 dark:text-green-400'
          : impossible
          ? 'text-red-700 dark:text-red-400'
          : 'text-gray-700 dark:text-slate-300';
        const label = secured ? 'Secured' : impossible ? 'Not possible' : isPct ? `Need ${req}` : req;

        return (
          <li key={letter} className="flex items-center gap-3">
            <span className="w-5 shrink-0 text-center font-semibold text-gray-900 dark:text-slate-100">{letter}</span>
            <div className="relative flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
                style={{ width: `${fill}%` }}
              />
            </div>
            <span className={`w-32 shrink-0 text-right text-xs font-medium tabular-nums ${labelColor}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
