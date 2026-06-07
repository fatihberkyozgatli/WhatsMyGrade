import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface RotatingTextProps {
  items: string[];
  interval?: number;
  className?: string;
}

const splitChars = (text: string): string[] => Array.from(text);

export const RotatingText: React.FC<RotatingTextProps> = ({ items, interval = 2400, className }) => {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || items.length <= 1) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % items.length), interval);
    return () => clearInterval(id);
  }, [reduce, items.length, interval]);

  const chars = useMemo(() => splitChars(items[index] ?? ''), [items, index]);
  const total = chars.length;

  if (reduce) {
    return (
      <span className={className}>
        <span aria-hidden="true">{items[index]}</span>
        <span className="sr-only">{items.join(', ')}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex ${className ?? ''}`}>
      <span className="sr-only">{items.join(', ')}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={index} aria-hidden="true" className="inline-flex whitespace-pre">
          {chars.map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-110%', opacity: 0 }}
              transition={{
                type: 'spring',
                damping: 18,
                stiffness: 250,
                delay: (total - 1 - i) * 0.02,
              }}
            >
              {ch === ' ' ? ' ' : ch}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
