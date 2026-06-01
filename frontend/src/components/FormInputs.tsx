import React from 'react';

interface FormInputProps {
  label: string;
  type?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
}) => {
  return (
    <div className="mb-5">
      <label className="label-text">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || '' : e.target.value)}
        placeholder={placeholder}
        className={`input-field ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
      />
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
};

interface FormTextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  rows?: number;
}

export const FormTextArea: React.FC<FormTextAreaProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder,
  rows = 4,
}) => {
  return (
    <div className="mb-5">
      <label className="label-text">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`input-field resize-none ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
      />
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
};
