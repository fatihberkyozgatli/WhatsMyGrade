import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { FormInput } from '../components/FormInputs';
import { useAuth } from '../AuthContext';

export const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      const { token } = response.data;
      login(token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-md card">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
        <p className="text-gray-500 text-sm mb-6">Sign in to your account</p>

        {error && (
          <div role="alert" className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FormInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => setFormData({ ...formData, email: String(value) })}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />

          <FormInput
            label="Password"
            type="password"
            value={formData.password}
            onChange={(value) => setFormData({ ...formData, password: String(value) })}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};
