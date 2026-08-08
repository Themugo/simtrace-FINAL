import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
          error ? 'border-error-500' : 'border-neutral-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-error-600">{error}</p>}
      {helperText && !error && <p className="text-sm text-neutral-500">{helperText}</p>}
    </div>
  );
};
