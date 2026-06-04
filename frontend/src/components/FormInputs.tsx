import React, { useId, useState } from 'react';

interface FormInputProps {
  label: string;
  type?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  autoComplete,
}) => {
  const id = useId();
  const errorId = `${id}-error`;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="mb-5">
      <label htmlFor={id} className="label-text">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) =>
            onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)
          }
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          inputMode={type === 'number' ? 'decimal' : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`input-field ${isPassword ? 'pr-12' : ''} ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-red-500 text-xs mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
};
