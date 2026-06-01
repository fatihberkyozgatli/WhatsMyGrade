import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isAuthenticated, onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <button 
          onClick={() => navigate('/')} 
          className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
        >
          WhatsMyGrade
        </button>
        {isAuthenticated && (
          <nav className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Dashboard
            </button>
            <button 
              onClick={() => navigate('/add-course')} 
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Add Course
            </button>
            <button
              onClick={onLogout}
              className="btn-secondary text-sm"
            >
              Logout
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};
