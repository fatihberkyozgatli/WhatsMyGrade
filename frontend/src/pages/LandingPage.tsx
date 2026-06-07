import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { RotatingText } from '../components/RotatingText';
import { GradeGauge, GradedSplitBar } from '../components/GradeCharts';
import { BookIcon, ListChecksIcon, TrendingUpIcon } from '../components/icons';

const HeroPreview: React.FC = () => (
  <div className="relative mx-auto w-full max-w-sm">
    <div
      className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-blue-400/30 via-cyan-300/20 to-transparent blur-3xl dark:from-blue-500/20 dark:via-cyan-400/10"
      aria-hidden="true"
    />
    <div className="card shadow-xl text-left">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Biology 101</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">Spring 2025</p>
        </div>
        <span className="px-2.5 py-1 rounded text-xs font-medium border bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900">
          Excellent
        </span>
      </div>
      <div className="flex flex-col items-center">
        <GradeGauge value={88} />
      </div>
      <p className="mt-1 mb-4 text-center text-sm">
        <span className="text-gray-600 dark:text-slate-300">Need </span>
        <span className="font-semibold text-gray-900 dark:text-slate-100">74% on the Final</span>
        <span className="text-gray-600 dark:text-slate-300"> for an </span>
        <span className="font-semibold text-blue-600 dark:text-blue-400">A</span>
      </p>
      <GradedSplitBar graded={70} remaining={30} />
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const fadeUp = (delay = 0) =>
    reduce
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: 'easeOut' as const, delay },
        };

  const cardsContainer = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08 } },
  };
  const cardItem = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
      };

  const features = [
    { icon: BookIcon, title: 'Create Courses', body: 'Add every course for the semester and organize your academic work in one place.' },
    { icon: ListChecksIcon, title: 'Log Components', body: 'Define assignments, exams, and projects with custom weights — and grade them as you go.' },
    { icon: TrendingUpIcon, title: 'Track Progress', body: 'See your current and projected grade, and the exact score you need to hit your target.' },
  ];

  return (
    <div className="page-container flex items-center">
      <div className="content-wrapper relative w-full">

        <div className="hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

        <div className="py-4 lg:py-6 grid lg:grid-cols-2 gap-8 items-center">
          <motion.div {...fadeUp()} className="text-center lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
              WhatsMyGrade
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight pb-1 mb-2 bg-gradient-to-br from-gray-900 to-blue-700 dark:from-slate-100 dark:to-blue-300 bg-clip-text text-transparent">
              What do I need to get?
            </h1>
            <div className="text-2xl sm:text-3xl font-semibold text-blue-600 dark:text-blue-400 mb-6 h-[1.4em] overflow-hidden">
              <RotatingText items={['an A', 'a 90%', 'a 3.7 GPA', 'that scholarship', 'to just pass']} />
            </div>
            <p className="text-gray-500 dark:text-slate-400 text-lg max-w-xl mx-auto lg:mx-0 mb-8">
              Track your course grades in real time. Know your current grade, see your projected final, and discover exactly what scores you need to reach your target.
            </p>

            <div className="flex flex-col items-center lg:items-start gap-3">
              {isAuthenticated ? (
                <button onClick={() => navigate('/dashboard')} className="btn-primary text-base px-8">
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-base px-8">
                    Sign Up — it's free
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      Log in
                    </Link>
                  </p>
                </>
              )}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.15)}>
            <HeroPreview />
          </motion.div>
        </div>

        <motion.div
          variants={cardsContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 pb-4 pt-5 border-t border-gray-100 dark:border-slate-800"
        >
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} variants={cardItem} className="flex items-start gap-3 text-left">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{f.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{f.body}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};
