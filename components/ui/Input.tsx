import React, { useState } from 'react';
import { Search, Eye, EyeOff, X, UploadCloud } from 'lucide-react';

// Common Input Container props
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  shortcut?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      clearable = false,
      onClear,
      shortcut,
      className = '',
      value,
      onChange,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>{label}</span>
            {shortcut && (
              <span className="font-mono text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                {shortcut}
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full bg-slate-950 border text-slate-100 placeholder-slate-500 text-sm rounded-xl px-3.5 py-2.5 transition-all duration-150 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon || clearable ? 'pr-10' : ''} ${
              error ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-800'
            } ${className}`}
            {...props}
          />

          {clearable && value && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 p-1 text-slate-400 hover:text-slate-200 transition"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {!clearable && rightIcon && (
            <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs font-medium text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

// Select Component
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, options, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-slate-300">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full bg-slate-950 border text-slate-100 text-sm rounded-xl px-3.5 py-2.5 transition-all duration-150 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 cursor-pointer ${
            error ? 'border-rose-500' : 'border-slate-800'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-slate-900 text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="text-xs font-medium text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = 'Select';

// Textarea Component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className = '', id, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-slate-300">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={`w-full bg-slate-950 border text-slate-100 placeholder-slate-500 text-sm rounded-xl p-3.5 transition-all duration-150 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 min-h-[90px] ${
            error ? 'border-rose-500' : 'border-slate-800'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs font-medium text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// Search Input Component
export const SearchInput: React.FC<InputProps> = (props) => {
  return (
    <Input
      leftIcon={<Search className="w-4 h-4" />}
      shortcut="⌘K"
      placeholder="Search records, IMEI, telemetry..."
      {...props}
    />
  );
};

// Password Input Component
export const PasswordInput: React.FC<InputProps> = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      type={showPassword ? 'text' : 'password'}
      rightIcon={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="pointer-events-auto p-1 text-slate-400 hover:text-slate-200 transition"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
      {...props}
    />
  );
};

// Dropzone Input Component
export interface DropzoneProps {
  label?: string;
  description?: string;
  onFileDrop?: (files: FileList) => void;
  accept?: string;
}

export const DropzoneInput: React.FC<DropzoneProps> = ({
  label = 'Upload Evidence File or Firmware Package',
  description = 'Drag and drop files here or click to browse (MAX 50MB)',
  onFileDrop,
  accept,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileDrop?.(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
        isDragOver
          ? 'border-sky-400 bg-sky-500/10'
          : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
      }`}
    >
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-sky-400 shadow">
        <UploadCloud className="w-6 h-6" />
      </div>
      <div className="font-semibold text-xs text-white">{label}</div>
      <div className="text-[11px] text-slate-400">{description}</div>
      <input
        type="file"
        accept={accept}
        className="hidden"
        id="file-dropzone-input"
        onChange={(e) => e.target.files && onFileDrop?.(e.target.files)}
      />
      <label
        htmlFor="file-dropzone-input"
        className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg cursor-pointer transition"
      >
        Select File
      </label>
    </div>
  );
};
