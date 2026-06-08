import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { RotatingText } from './RotatingText';
import { GradeGauge, GradedSplitBar } from './GradeCharts';
import { BookIcon } from './icons';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children, footer }) => {
  const reduce = useReducedMotion();
  const enter = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: 'easeOut' as const },
      };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-slate-900">
      <div className="flex flex-col px-6 py-8 sm:px-10 lg:px-16">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <BookIcon className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-slate-100">WhatsMyGrade</span>
        </Link>

        <div className="flex flex-1 items-center py-8">
          <motion.div {...enter} className="mx-auto w-full max-w-md">
            <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">{title}</h1>
            <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">{subtitle}</p>
            {children}
            {footer}
          </motion.div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12"
      >
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-12 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative w-full max-w-sm text-center text-white">
          <h2 className="text-3xl font-bold leading-tight text-white xl:text-4xl">What do I need to get?</h2>
          <div className="mt-2 h-[1.4em] overflow-hidden text-2xl font-semibold text-blue-100">
            <RotatingText items={['an A', 'a 90%', 'a 3.7 GPA', 'that scholarship', 'to just pass']} />
          </div>

          <div className="mt-10 rounded-2xl bg-white p-5 text-left shadow-2xl dark:bg-slate-800">
            <div className="mb-1 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">Biology 101</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Spring 2025</p>
              </div>
              <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                Excellent
              </span>
            </div>
            <div className="flex flex-col items-center">
              <GradeGauge value={88} />
            </div>
            <p className="mb-3 mt-1 text-center text-sm text-gray-600 dark:text-slate-300">
              Need <span className="font-semibold text-gray-900 dark:text-slate-100">74% on the Final</span> for an{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">A</span>
            </p>
            <GradedSplitBar graded={70} remaining={30} />
          </div>

          <p className="mt-8 text-sm text-blue-100">
            Track every course, project your final grade, and know exactly what you need.
          </p>
        </div>
      </div>
    </div>
  );
};
