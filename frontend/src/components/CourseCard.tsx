import React from 'react';
import { Course, GradeCalculationResult } from '../types';
import { Link } from 'react-router-dom';
import { XIcon } from './icons';
import { formatGradePercent, formatGrade } from '../utils/formatters';

interface CourseCardProps {
  course: Course;
  gradeData?: GradeCalculationResult;
  status?: string;
  onDelete?: (courseId: number, courseName: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, gradeData, status, onDelete }) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Excellent':
        return 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950 dark:border-green-900';
      case 'Good':
        return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950 dark:border-blue-900';
      case 'At Risk':
        return 'text-yellow-800 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-950 dark:border-yellow-900';
      case 'Needs Improvement':
        return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950 dark:border-red-900';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-slate-300 dark:bg-slate-700 dark:border-slate-600';
    }
  };

  const getHighestAchievableGrade = (): { grade: string; required: string } | null => {
    if (!gradeData?.requiredByLetterGrade) return null;

    const grades = ['A', 'B', 'C', 'D'];
    for (const grade of grades) {
      const required = gradeData.requiredByLetterGrade[grade];
      if (required && !isNaN(parseFloat(required))) {
        return { grade, required };
      }
    }
    return null;
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(course.id, course.name);
    }
  };

  const achievableGrade = getHighestAchievableGrade();
  const displayGrade = gradeData?.currentGrade;

  const ungradedComponents = gradeData?.components?.filter(c => !c.graded).map(c => c.name) || [];
  const ungradedList = ungradedComponents.length > 0 ? ungradedComponents.join(' & ') : null;

  return (
    <div className="card hover:shadow-lg relative h-full">
      <Link
        to={`/course/${course.id}`}
        aria-label={`View ${course.name}`}
        className="absolute inset-0 rounded-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      />
      <div className="relative pointer-events-none">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 line-clamp-2 min-h-[3.5rem]" title={course.name}>{course.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5 dark:text-slate-400">{course.semester}</p>
          </div>
          <div className="flex items-start gap-2">
            {status && (
              <span className={`px-2.5 py-1 rounded text-xs font-medium border ${getStatusColor(status)}`}>
                {status}
              </span>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="pointer-events-auto inline-flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-300 dark:bg-red-950 dark:hover:bg-red-900 font-semibold p-1.5 rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label={`Delete ${course.name}`}
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {displayGrade !== undefined && displayGrade !== null && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide dark:text-slate-400">Current Grade</p>
              <div className="text-3xl font-semibold text-blue-600 dark:text-blue-400 tabular-nums">{formatGradePercent(displayGrade, 2)}</div>
            </div>

            {gradeData && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600 dark:text-slate-400">Graded:</span>
                  <span className="font-semibold text-gray-900 dark:text-slate-100 tabular-nums">{formatGrade(gradeData.percentageGraded, 0)}%</span>
                  <span className="text-gray-400 dark:text-slate-600">|</span>
                  <span className="text-gray-600 dark:text-slate-400">Ungraded:</span>
                  <span className="font-semibold text-gray-900 dark:text-slate-100 tabular-nums">{formatGrade(gradeData.percentageRemaining, 0)}%</span>
                </div>

                <div className="text-sm pt-2 border-t border-gray-100 dark:border-slate-700 min-h-[3rem]">
                  {achievableGrade ? (
                    <p className="text-gray-700 dark:text-slate-300 line-clamp-2">
                      <span className="font-semibold">Need {achievableGrade.required}</span>
                      {ungradedList && (
                        <span className="text-gray-600 dark:text-slate-400"> from <span className="font-medium">{ungradedList}</span></span>
                      )}
                      <span className="text-gray-600 dark:text-slate-400"> for </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{achievableGrade.grade}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
