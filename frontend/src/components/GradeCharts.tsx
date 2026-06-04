import React from 'react';

// Lightweight, dependency-free SVG/CSS grade visualizations.
// a11y per ui-ux-pro-max: numeric value is always visible as text; meaning is
// never carried by color alone (every element has a text label / aria-label).

/** Semicircular gauge for the current grade. Fill grows left→right (low→high). */
export const GradeGauge: React.FC<{ value: number | null }> = ({ value }) => {
  const cx = 100;
  const cy = 100;
  const r = 80;
  const hasValue = value !== null;
  const v = Math.max(0, Math.min(100, value ?? 0));
  // Top semicircle: left (cx-r, cy) → right (cx+r, cy); sweep-flag 1 = over the top.
  const track = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  // Reveal a fraction of the (fixed, correct) arc via dashoffset — robust across values.
  const arcLength = Math.PI * r;
  const color = !hasValue
    ? '#cbd5e1'
    : v >= 90
    ? '#16a34a' // green
    : v >= 80
    ? '#2563eb' // blue
    : v >= 70
    ? '#d97706' // amber
    : '#dc2626'; // red

  return (
    <svg
      viewBox="0 0 200 116"
      className="w-full max-w-[240px]"
      role="img"
      aria-label={`Current grade ${hasValue ? `${v.toFixed(2)} percent` : 'not available'}`}
    >
      <path d={track} fill="none" stroke="#cbd5e1" strokeWidth={14} strokeLinecap="round" />
      {hasValue && v > 0 && (
        <path
          d={track}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={arcLength * (1 - v / 100)}
        />
      )}
      <text
        x="100"
        y="92"
        textAnchor="middle"
        fill="#0f172a"
        fontSize="30"
        fontWeight="700"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {hasValue ? `${v.toFixed(1)}%` : 'N/A'}
      </text>
    </svg>
  );
};

/** 100% stacked bar showing graded vs remaining weight (normalized to fill). */
export const GradedSplitBar: React.FC<{ graded: number; remaining: number }> = ({ graded, remaining }) => {
  const total = graded + remaining;
  const g = total > 0 ? (graded / total) * 100 : 0;
  const rem = total > 0 ? (remaining / total) * 100 : 0;

  return (
    <div>
      <div
        className="flex h-4 w-full rounded-full overflow-hidden bg-gray-100"
        role="img"
        aria-label={`${graded.toFixed(0)} percent of course weight graded, ${remaining.toFixed(0)} percent remaining`}
      >
        {g > 0 && <div className="bg-blue-600 h-full" style={{ width: `${g}%` }} />}
        {rem > 0 && <div className="bg-gray-300 h-full" style={{ width: `${rem}%` }} />}
      </div>
      <div className="flex justify-between text-xs mt-2">
        <span className="text-gray-600 inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
          Graded <span className="font-semibold text-gray-900 tabular-nums">{graded.toFixed(0)}%</span>
        </span>
        <span className="text-gray-600 inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-300" />
          Remaining <span className="font-semibold text-gray-900 tabular-nums">{remaining.toFixed(0)}%</span>
        </span>
      </div>
    </div>
  );
};

/** Bullet-style bar grid: score needed on remaining work per letter grade. */
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
        // For a required score, higher = harder, so color by difficulty.
        const barColor = secured
          ? 'bg-green-500'
          : impossible
          ? 'bg-red-300'
          : isPct
          ? pct <= 60
            ? 'bg-green-500'
            : pct <= 85
            ? 'bg-amber-500'
            : 'bg-red-500'
          : 'bg-gray-300';
        const labelColor = secured ? 'text-green-700' : impossible ? 'text-red-700' : 'text-gray-700';
        const label = secured ? 'Secured' : impossible ? 'Not possible' : isPct ? `Need ${req}` : req;

        return (
          <li key={letter} className="flex items-center gap-3">
            <span className="w-5 shrink-0 text-center font-semibold text-gray-900">{letter}</span>
            <div className="relative flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div className={`absolute inset-y-0 left-0 rounded-full ${barColor}`} style={{ width: `${fill}%` }} />
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
