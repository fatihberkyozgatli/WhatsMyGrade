import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

// Lightweight inline SVG icons (Lucide-style, stroke-based) so we don't ship a
// whole icon library and don't rely on emoji/text glyphs as icons.
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const XIcon: React.FC<IconProps> = (props) => (
  <svg {...base} {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = (props) => (
  <svg {...base} {...props}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);
