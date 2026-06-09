import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { FormInput } from '../components/FormInputs';
import { AuthLayout } from '../components/AuthLayout';
import { Spinner } from '../components/Spinner';
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
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account"
      footer={
        <p className="mt-5 text-center text-sm text-gray-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="rounded font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Create one
          </Link>
        </p>
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
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

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full inline-flex items-center justify-center gap-2">
          {loading && <Spinner />}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  );
};
