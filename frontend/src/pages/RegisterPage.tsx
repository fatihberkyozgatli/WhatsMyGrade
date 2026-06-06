import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { FormInput } from '../components/FormInputs';
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
    <div className="page-container flex py-8 px-4">
      <div className="w-full max-w-md card m-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">Create account</h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">Join WhatsMyGrade to track your grades</p>

        {error && (
          <div role="alert" className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-950 dark:border-red-900 dark:text-red-300">
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

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-500 dark:text-slate-400 text-sm mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
