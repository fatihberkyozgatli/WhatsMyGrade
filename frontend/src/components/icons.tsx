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

export const SunIcon: React.FC<IconProps> = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const MoonIcon: React.FC<IconProps> = (props) => (
  <svg {...base} {...props}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

export const BookIcon: React.FC<IconProps> = (props) => (
  <svg {...base} {...props}>
    <path d="M12 7C10.5 6 8 5.5 4 5.5v12c4 0 6.5.5 8 1.5 1.5-1 4-1.5 8-1.5v-12c-4 0-6.5.5-8 1.5z" />
    <path d="M12 7v12" />
  </svg>
);

export const ListChecksIcon: React.FC<IconProps> = (props) => (
  <svg {...base} {...props}>
    <path d="M10 6h10M10 12h10M10 18h10" />
    <path d="M3.5 6l1.3 1.3L7.5 4.7M3.5 12l1.3 1.3L7.5 10.7M3.5 18l1.3 1.3L7.5 16.7" />
  </svg>
);

export const TrendingUpIcon: React.FC<IconProps> = (props) => (
  <svg {...base} {...props}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M17 7h4v4" />
  </svg>
);

export const MailIcon: React.FC<IconProps> = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

export const GithubIcon: React.FC<IconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05A9.36 9.36 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
  </svg>
);
