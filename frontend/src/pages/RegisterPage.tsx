import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { FormInput } from '../components/FormInputs';
import { AuthLayout } from '../components/AuthLayout';
import { TermsModal } from '../components/TermsModal';
import { useAuth } from '../AuthContext';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      const { token } = response.data;
      login(token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Join WhatsMyGrade to track your grades"
      footer={
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="rounded font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Sign in
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
          label="Full Name"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: String(value) })}
          required
          autoComplete="name"
          placeholder="John Doe"
        />

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
          autoComplete="new-password"
          placeholder="Enter your password"
        />

        <FormInput
          label="Confirm Password"
          type="password"
          value={formData.confirmPassword}
          onChange={(value) => setFormData({ ...formData, confirmPassword: String(value) })}
          required
          autoComplete="new-password"
          placeholder="Confirm password"
        />

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="mt-4 text-center text-xs text-gray-500 dark:text-slate-400">
          By creating an account, you agree to our{' '}
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="rounded font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Terms of Service
          </button>
          . Grades shown are estimates, not official records.
        </p>
      </form>

      <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
    </AuthLayout>
  );
};
