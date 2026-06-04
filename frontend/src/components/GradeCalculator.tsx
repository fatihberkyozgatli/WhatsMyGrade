import React from 'react';
import { GradeCalculationResult } from '../types';

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
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 font-medium uppercase tracking-wide mb-2">Current Grade</p>
          <p className="text-4xl font-bold text-blue-600 tabular-nums">
            {result.currentGrade !== null ? `${result.currentGrade.toFixed(2)}%` : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-2 tabular-nums">{result.percentageGraded.toFixed(1)}% Graded</p>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Maximum Obtainable</p>
          <p className="text-3xl font-semibold text-gray-700 tabular-nums">
            {result.projectedFinalGrade !== null ? `${result.projectedFinalGrade.toFixed(2)}%` : 'N/A'}
          </p>
          <p className="text-xs text-gray-400 mt-2 tabular-nums">{result.percentageRemaining.toFixed(1)}% Remaining</p>
        </div>
      </div>

      <div className={`text-center p-4 rounded-lg mb-6 border ${getStatusBg(result.status)}`}>
        <p className={`text-lg font-semibold ${getStatusColor(result.status)}`}>{result.status}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">To Achieve Each Letter Grade</h3>
        <div className="space-y-2">
          {Object.entries(result.requiredByLetterGrade).map(([grade, requirement]) => (
            <div key={grade} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
              <span className="font-semibold text-gray-900">{grade}</span>
              <span className={`text-sm font-medium tabular-nums ${
                requirement === 'Already secured' ? 'text-green-700' :
                requirement === 'No longer possible' ? 'text-red-700' :
                'text-gray-600'
              }`}>
                {requirement}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
