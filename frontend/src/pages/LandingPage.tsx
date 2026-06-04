import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="max-w-3xl mx-auto text-center py-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">WhatsMyGrade</h1>
          <p className="text-2xl font-semibold text-gray-700 mb-4">What do I need to get?</p>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
            Track your course grades in real time. Know your current grade, see your projected final grade, and discover exactly what scores you need on remaining work to reach your target grade.
          </p>

          <div className="flex flex-col items-center gap-3 mb-16">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary text-base px-8"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-base px-8">
                  Sign Up — it's free
                </Link>
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-blue-600 hover:text-blue-700 font-medium rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Log in
                  </Link>
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-left">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Create Courses</h3>
              <p className="text-sm text-gray-500">Add all your courses for the semester and organize your academic work.</p>
            </div>

            <div className="card text-left">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Log Components</h3>
              <p className="text-sm text-gray-500">Define grade components like assignments, exams, and projects with custom weights.</p>
            </div>

            <div className="card text-left">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-sm text-gray-500">View your current and projected grades, and plan ahead for your target scores.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
