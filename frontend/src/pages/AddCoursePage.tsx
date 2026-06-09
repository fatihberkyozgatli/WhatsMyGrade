import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { FormInput } from '../components/FormInputs';
import { ArrowLeftIcon } from '../components/icons';
import { Spinner } from '../components/Spinner';
import { useToast } from '../ToastContext';

export const AddCoursePage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    semester: '',
  });
  const [gradingScale, setGradingScale] = useState<{
    A: number | '';
    B: number | '';
    C: number | '';
    D: number | '';
    F: number;
  }>({
    A: 90,
    B: 80,
    C: 70,
    D: 60,
    F: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Course name is required');
      return;
    }
    if (!formData.semester.trim()) {
      setError('Semester is required');
      return;
    }

    const { A, B, C, D } = gradingScale;
    if (A === '' || B === '' || C === '' || D === '') {
      setError('All grading scale thresholds are required');
      return;
    }
    if (A > 100 || A <= B || B <= C || C <= D || D < 0) {
      setError('Grading scale must descend within 0–100: 100 ≥ A > B > C > D ≥ 0');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/courses', {
        ...formData,
        gradingScale,
      });
      toast.success('Course created');
      navigate(`/course/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="content-wrapper max-w-2xl">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium mb-6 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">Add Course</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Create a new course to track</p>

          {error && (
            <div role="alert" className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-950 dark:border-red-900 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormInput
              label="Course Name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: String(value) })}
              required
              placeholder="e.g., Introduction to Biology"
            />

            <FormInput
              label="Semester"
              value={formData.semester}
              onChange={(value) => setFormData({ ...formData, semester: String(value) })}
              required
              placeholder="e.g., Spring 2025"
            />

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-4">Grading Scale</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Set the percentage thresholds for each letter grade</p>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="A (minimum %)"
                  type="number"
                  value={gradingScale.A}
                  onChange={(value) => setGradingScale({ ...gradingScale, A: value as number | '' })}
                />
                <FormInput
                  label="B (minimum %)"
                  type="number"
                  value={gradingScale.B}
                  onChange={(value) => setGradingScale({ ...gradingScale, B: value as number | '' })}
                />
                <FormInput
                  label="C (minimum %)"
                  type="number"
                  value={gradingScale.C}
                  onChange={(value) => setGradingScale({ ...gradingScale, C: value as number | '' })}
                />
                <FormInput
                  label="D (minimum %)"
                  type="number"
                  value={gradingScale.D}
                  onChange={(value) => setGradingScale({ ...gradingScale, D: value as number | '' })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                {loading && <Spinner />}
                {loading ? 'Creating...' : 'Create Course'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
