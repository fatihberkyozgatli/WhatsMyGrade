import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Course, GradeCalculationResult } from '../types';
import { CourseCard } from '../components/CourseCard';
import { ConfirmModal } from '../components/ConfirmModal';

export const DashboardPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [gradeData, setGradeData] = useState<{ [key: number]: GradeCalculationResult }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; courseId?: number; courseName?: string }>({
    isOpen: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesResponse = await api.get('/courses');
        setCourses(coursesResponse.data);

        const calcResponse = await api.get('/calculate');
        setGradeData(calcResponse.data);
      } catch (err: any) {
        setError('Failed to load courses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteCourse = (courseId: number, courseName: string) => {
    setDeleteModal({ isOpen: true, courseId, courseName });
  };

  const confirmDeleteCourse = async () => {
    if (!deleteModal.courseId) return;

    try {
      await api.delete(`/courses/${deleteModal.courseId}`);
      setCourses(courses.filter(c => c.id !== deleteModal.courseId));
      setDeleteModal({ isOpen: false });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete course');
      setDeleteModal({ isOpen: false });
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrapper max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Courses</h1>
            <p className="text-gray-500 text-sm mt-1">Track grades and plan your semester</p>
          </div>
          <Link to="/add-course" className="btn-primary text-sm">
            Add Course
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No courses yet. Start by adding your first course.</p>
            <Link to="/add-course" className="btn-primary text-sm">
              Add Your First Course
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                gradeData={gradeData[course.id]}
                status={gradeData[course.id]?.status}
                onDelete={handleDeleteCourse}
              />
            ))}
          </div>
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
