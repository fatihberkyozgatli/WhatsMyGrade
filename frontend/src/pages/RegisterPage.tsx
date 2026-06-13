import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { FormInput } from '../components/FormInputs';
import { FormAlert } from '../components/FormAlert';
import { AuthLayout } from '../components/AuthLayout';
import { TermsModal } from '../components/TermsModal';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../AuthContext';
import { isValidEmail } from '../utils/validation';

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const setField = (key: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [key]: value });
    if (fieldErrors[key]) setFieldErrors({ ...fieldErrors, [key]: undefined });
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!formData.name.trim()) errors.name = 'Please enter your name';

    if (!formData.email.trim()) errors.email = 'Please enter your email';
    else if (!isValidEmail(formData.email)) errors.email = 'Please enter a valid email address';

    if (!formData.password) errors.password = 'Please enter a password';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';

    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (formData.confirmPassword !== formData.password)
      errors.confirmPassword = "Passwords don't match";

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
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
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
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
      {error && <FormAlert message={error} />}

      <form onSubmit={handleSubmit} noValidate>
        <FormInput
          label="Full Name"
          value={formData.name}
          onChange={(value) => setField('name', String(value))}
          error={fieldErrors.name}
          required
          autoComplete="name"
          placeholder="John Doe"
        />

        <FormInput
          label="Email"
          type="email"
          value={formData.email}
          onChange={(value) => setField('email', String(value))}
          error={fieldErrors.email}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />

        <FormInput
          label="Password"
          type="password"
          value={formData.password}
          onChange={(value) => setField('password', String(value))}
          error={fieldErrors.password}
          required
          autoComplete="new-password"
          placeholder="Enter your password"
        />

        <FormInput
          label="Confirm Password"
          type="password"
          value={formData.confirmPassword}
          onChange={(value) => setField('confirmPassword', String(value))}
          error={fieldErrors.confirmPassword}
          required
          autoComplete="new-password"
          placeholder="Confirm password"
        />

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full inline-flex items-center justify-center gap-2">
          {loading && <Spinner />}
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
