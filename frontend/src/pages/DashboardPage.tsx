import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../api';
import { Course, GradeCalculationResult } from '../types';
import { CourseCard } from '../components/CourseCard';
import { ConfirmModal } from '../components/ConfirmModal';
import { AddCourseButton } from '../components/AddCourseButton';

export const DashboardPage: React.FC = () => {
  const reduce = useReducedMotion();
  const gridVariants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.05 } },
  };
  const cardVariants = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
      };

  const [courses, setCourses] = useState<Course[]>([]);
  const [gradeData, setGradeData] = useState<{ [key: number]: GradeCalculationResult }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; courseId?: number; courseName?: string }>({
    isOpen: false,
  });

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [coursesResponse, calcResponse] = await Promise.all([
          api.get('/courses'),
          api.get('/calculate'),
        ]);
        if (cancelled) return;
        setCourses(coursesResponse.data);
        setGradeData(calcResponse.data);
      } catch (err: any) {
        if (cancelled) return;
        setError('Failed to load courses');
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDeleteCourse = (courseId: number, courseName: string) => {
    setDeleteModal({ isOpen: true, courseId, courseName });
  };

  const confirmDeleteCourse = async () => {
    if (!deleteModal.courseId) return;

    try {
      await api.delete(`/courses/${deleteModal.courseId}`);
      setCourses(prev => prev.filter(c => c.id !== deleteModal.courseId));
      setDeleteModal({ isOpen: false });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete course');
      setDeleteModal({ isOpen: false });
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center" role="status">
          <div className="animate-spin motion-reduce:animate-none rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-500 dark:text-slate-400">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrapper max-w-6xl">
        <div className="flex justify-between items-start sm:items-center gap-3 mb-8">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Your Courses</h1>
            <p className="text-gray-500 text-sm mt-1 dark:text-slate-400">Track grades and plan your semester</p>
          </div>
          <AddCourseButton className="btn-primary text-sm shrink-0">Add Course</AddCourseButton>
        </div>

        {error && (
          <div role="alert" className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-950 dark:border-red-900 dark:text-red-300">
            {error}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4 dark:text-slate-400">No courses yet. Start by adding your first course.</p>
            <AddCourseButton className="btn-primary text-sm">Add Your First Course</AddCourseButton>
          </div>
        ) : (
          <motion.div
            variants={gridVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {courses.map((course) => (
              <motion.div key={course.id} variants={cardVariants} className="h-full">
                <CourseCard
                  course={course}
                  gradeData={gradeData[course.id]}
                  status={gradeData[course.id]?.status}
                  onDelete={handleDeleteCourse}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteModal.courseName}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmDeleteCourse}
        onCancel={() => setDeleteModal({ isOpen: false })}
      />
    </div>
  );
};
