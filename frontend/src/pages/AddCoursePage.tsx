import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { FormInput } from '../components/FormInputs';

export const AddCoursePage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    semester: '',
  });
  const [gradingScale, setGradingScale] = useState({
    A: 90,
    B: 80,
    C: 70,
    D: 60,
    F: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

    if (gradingScale.A <= gradingScale.B || gradingScale.B <= gradingScale.C ||
        gradingScale.C <= gradingScale.D || gradingScale.D < 0) {
      setError('Grading scale must be in descending order: A > B > C > D ≥ 0');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/courses', {
        ...formData,
        gradingScale,
      });
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
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-6"
        >
          ← Back to Dashboard
        </button>

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Add Course</h1>
          <p className="text-gray-500 text-sm mb-6">Create a new course to track</p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
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

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Grading Scale</h2>
              <p className="text-xs text-gray-500 mb-4">Set the percentage thresholds for each letter grade</p>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="A (minimum %)"
                  type="number"
                  value={gradingScale.A}
                  onChange={(value) => setGradingScale({ ...gradingScale, A: Number(value) })}
                />
                <FormInput
                  label="B (minimum %)"
                  type="number"
                  value={gradingScale.B}
                  onChange={(value) => setGradingScale({ ...gradingScale, B: Number(value) })}
                />
                <FormInput
                  label="C (minimum %)"
                  type="number"
                  value={gradingScale.C}
                  onChange={(value) => setGradingScale({ ...gradingScale, C: Number(value) })}
                />
                <FormInput
                  label="D (minimum %)"
                  type="number"
                  value={gradingScale.D}
                  onChange={(value) => setGradingScale({ ...gradingScale, D: Number(value) })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
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
