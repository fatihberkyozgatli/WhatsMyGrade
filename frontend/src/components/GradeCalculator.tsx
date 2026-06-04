import React from 'react';
import { GradeCalculationResult } from '../types';
import { GradeGauge, GradedSplitBar, LetterRequirementBars } from './GradeCharts';

interface GradeCalculatorProps {
  result: GradeCalculationResult;
}

export const GradeCalculator: React.FC<GradeCalculatorProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-500">Unable to load grade calculations</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent':
        return 'text-green-700';
      case 'Good':
        return 'text-blue-700';
      case 'At Risk':
        return 'text-yellow-700';
      case 'Needs Improvement':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Excellent':
        return 'bg-green-50 border-green-200';
      case 'Good':
        return 'bg-blue-50 border-blue-200';
      case 'At Risk':
        return 'bg-yellow-50 border-yellow-200';
      case 'Needs Improvement':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="card">
      {result.weightWarning && (
        <div role="alert" className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          {result.weightWarning}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col items-center">
          <p className="text-xs text-blue-700 font-medium uppercase tracking-wide mb-2 self-start">Current Grade</p>
          <GradeGauge value={result.currentGrade} />
          <span
            className={`mt-1 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBg(result.status)} ${getStatusColor(result.status)}`}
          >
            {result.status}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Maximum Obtainable</p>
            <p className="text-3xl font-semibold text-gray-700 tabular-nums">
              {result.projectedFinalGrade !== null ? `${result.projectedFinalGrade.toFixed(2)}%` : 'N/A'}
            </p>
            <p className="text-xs text-gray-400 mt-1">if you ace all remaining work</p>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Course Completion</p>
            <GradedSplitBar graded={result.percentageGraded} remaining={result.percentageRemaining} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Score Needed Per Letter Grade</h3>
        <LetterRequirementBars requirements={result.requiredByLetterGrade} />
      </div>
    </div>
  );
};
