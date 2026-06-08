import React from 'react';

const block = 'bg-gray-200 dark:bg-slate-700 rounded';

const CourseCardSkeleton: React.FC = () => (
  <div className="card h-full" aria-hidden="true">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1 space-y-2">
        <div className={`${block} h-5 w-3/4`} />
        <div className={`${block} h-3 w-1/3`} />
      </div>
      <div className={`${block} h-6 w-16`} />
    </div>
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
      <div className={`${block} h-3 w-24 mb-2`} />
      <div className={`${block} h-8 w-28 mb-4`} />
      <div className={`${block} h-4 w-full mb-3`} />
      <div className={`${block} h-4 w-2/3`} />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="page-container">
    <div className="content-wrapper max-w-6xl" role="status" aria-label="Loading courses">
      <span className="sr-only">Loading courses…</span>
      <div className="flex justify-between items-center gap-3 mb-8" aria-hidden="true">
        <div className="space-y-2">
          <div className={`${block} h-8 w-48`} />
          <div className={`${block} h-4 w-64`} />
        </div>
        <div className={`${block} h-10 w-32`} />
      </div>
      <div className="animate-pulse motion-reduce:animate-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

export const CourseDetailSkeleton: React.FC = () => (
  <div className="page-container">
    <div className="content-wrapper max-w-4xl" role="status" aria-label="Loading course details">
      <span className="sr-only">Loading course details…</span>
      <div className="animate-pulse motion-reduce:animate-none" aria-hidden="true">
        <div className={`${block} h-4 w-36 mb-6`} />

        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-2">
            <div className={`${block} h-9 w-56`} />
            <div className={`${block} h-4 w-32`} />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`${block} h-9 w-32`} />
            <div className={`${block} h-9 w-36`} />
            <div className={`${block} h-9 w-28`} />
          </div>
        </div>

        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col items-center dark:bg-blue-950 dark:border-blue-900">
              <div className={`${block} h-3 w-24 self-start mb-3`} />
              <div className={`${block} h-28 w-full max-w-[240px] rounded-t-full`} />
              <div className={`${block} h-6 w-20 mt-3`} />
            </div>
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-slate-700/50 dark:border-slate-700 space-y-2">
                <div className={`${block} h-3 w-28`} />
                <div className={`${block} h-8 w-24`} />
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-slate-700/50 dark:border-slate-700 space-y-3">
                <div className={`${block} h-3 w-32`} />
                <div className={`${block} h-4 w-full`} />
              </div>
            </div>
          </div>
          <div className={`${block} h-4 w-48 mb-3`} />
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`${block} h-3 w-full`} />
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex justify-between items-center">
            <div className={`${block} h-6 w-44`} />
            <div className={`${block} h-9 w-32`} />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-slate-700">
              <div className="space-y-2">
                <div className={`${block} h-4 w-40`} />
                <div className={`${block} h-3 w-20`} />
              </div>
              <div className={`${block} h-8 w-20`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
