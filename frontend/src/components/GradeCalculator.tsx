import React from 'react';
import { motion } from 'framer-motion';
import { GradeCalculationResult, GradeScale } from '../types';
import { GradeGauge, GradedSplitBar, LetterRequirementBars } from './GradeCharts';
import { formatGradePercent } from '../utils/formatters';

interface GradeCalculatorProps {
  result: GradeCalculationResult;
  compact?: boolean;
  scale?: GradeScale;
}

export const GradeCalculator: React.FC<GradeCalculatorProps> = ({ result, compact = false, scale }) => {
  if (!result) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-500 dark:text-slate-400">Unable to load grade calculations</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent':
        return 'text-green-700 dark:text-green-300';
      case 'Good':
        return 'text-blue-700 dark:text-blue-300';
      case 'At Risk':
        return 'text-yellow-800 dark:text-yellow-300';
      case 'Needs Improvement':
        return 'text-red-700 dark:text-red-300';
      default:
        return 'text-gray-700 dark:text-slate-300';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Excellent':
        return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900';
      case 'Good':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900';
      case 'At Risk':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-900';
      case 'Needs Improvement':
        return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-slate-700 dark:border-slate-600';
    }
  };

  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 40, mass: 1 }}
    >
      {result.weightWarning && (
        <div role="alert" className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm dark:bg-yellow-950 dark:border-yellow-900 dark:text-yellow-300">
          {result.weightWarning}
        </div>
      )}

      <div className={compact ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6 mb-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'}>
        <motion.div 
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col items-center dark:bg-blue-950 dark:border-blue-900"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 40, mass: 1, delay: 0.1 }}
        >
          <p className="text-xs text-blue-700 font-medium uppercase tracking-wide mb-2 self-start dark:text-blue-300">Current Grade</p>
          <GradeGauge value={result.currentGrade} scale={scale} />
          <span
            className={`mt-1 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBg(result.status)} ${getStatusColor(result.status)}`}
          >
            {result.status}
          </span>
        </motion.div>

        <motion.div 
          className="flex flex-col gap-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 40, mass: 1, delay: 0.2 }}
        >
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-slate-700/50 dark:border-slate-700">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2 dark:text-slate-400">Maximum Obtainable</p>
            <p className="text-3xl font-semibold text-gray-700 tabular-nums dark:text-slate-200">
              {formatGradePercent(result.projectedFinalGrade, 2)}
            </p>
            <p className="text-xs text-gray-400 mt-1 dark:text-slate-500">if you ace all remaining work</p>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-slate-700/50 dark:border-slate-700">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3 dark:text-slate-400">Course Completion</p>
            <GradedSplitBar graded={result.percentageGraded} remaining={result.percentageRemaining} />
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 40, mass: 1, delay: 0.3 }}
      >
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide dark:text-slate-100">Score Needed Per Letter Grade</h3>
        <LetterRequirementBars requirements={result.requiredByLetterGrade} />
      </motion.div>
    </motion.div>
  );
};
