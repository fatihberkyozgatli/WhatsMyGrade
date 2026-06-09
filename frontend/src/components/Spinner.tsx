import React from 'react';

export const Spinner: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <span
    className={`inline-block animate-spin motion-reduce:animate-none rounded-full border-2 border-current border-t-transparent ${className}`}
    aria-hidden="true"
  />
);
