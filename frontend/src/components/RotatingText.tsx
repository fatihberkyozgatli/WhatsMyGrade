import React, { useEffect, useState } from 'react';

// Lightweight rotating text (no framer-motion): CSS fade/slide between words.
// Respects prefers-reduced-motion (stays static) and announces the full phrase
// to screen readers once instead of spamming on every rotation.
const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
};

interface RotatingTextProps {
  items: string[];
  interval?: number;
  className?: string;
}

export const RotatingText: React.FC<RotatingTextProps> = ({ items, interval = 2200, className }) => {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduced || items.length <= 1) return;
    let swapTimer: number;
    const id = window.setInterval(() => {
      setVisible(false); // fade out
      swapTimer = window.setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setVisible(true); // fade in next
      }, 250);
    }, interval);
    return () => {
      clearInterval(id);
      clearTimeout(swapTimer);
    };
  }, [reduced, items.length, interval]);

  return (
    <span className={className}>
      <span
        aria-hidden="true"
        className={`inline-block transition-all duration-200 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
      >
        {items[index]}
      </span>
      {/* Read the options once, not on every rotation. */}
      <span className="sr-only">{items.join(', ')}</span>
    </span>
  );
};
