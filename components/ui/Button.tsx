import React from 'react';
import { MODULE_THEMES, SimTraceModule } from '../../lib/design-tokens';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'module' | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  module?: SimTraceModule;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  shortcut?: string;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      module = 'device-dna',
      isLoading = false,
      leftIcon,
      rightIcon,
      shortcut,
      fullWidth = false,
      children,
      disabled,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const theme = MODULE_THEMES[module] || MODULE_THEMES['device-dna'];

    const sizeClasses = {
      xs: 'px-2 py-1 text-xs gap-1 rounded-md',
      sm: 'px-2.5 py-1.5 text-xs gap-1.5 rounded-lg',
      md: 'px-4 py-2 text-sm gap-2 rounded-xl',
      lg: 'px-5 py-2.5 text-base gap-2.5 rounded-xl',
      xl: 'px-6 py-3 text-lg gap-3 rounded-2xl',
    };

    let variantStyle: React.CSSProperties = {};
    let variantClasses = '';

    switch (variant) {
      case 'primary':
        variantClasses = 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 hover:brightness-110 active:scale-[0.98]';
        break;
      case 'secondary':
        variantClasses = 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 shadow-sm active:scale-[0.98]';
        break;
      case 'outline':
        variantClasses = 'bg-transparent text-slate-200 border border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 active:scale-[0.98]';
        break;
      case 'ghost':
        variantClasses = 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-800/60 active:scale-[0.98]';
        break;
      case 'danger':
        variantClasses = 'bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-600/20 active:scale-[0.98]';
        break;
      case 'success':
        variantClasses = 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 active:scale-[0.98]';
        break;
      case 'glass':
        variantClasses = 'bg-slate-900/60 backdrop-blur-md border border-slate-700/60 text-slate-100 hover:bg-slate-800/80 shadow-lg active:scale-[0.98]';
        break;
      case 'module':
        variantStyle = {
          backgroundColor: theme.primaryHex,
          color: '#0c0e14',
          fontWeight: 700,
          boxShadow: `0 4px 20px ${theme.bgGlow}`,
        };
        variantClasses = 'hover:brightness-110 active:scale-[0.98]';
        break;
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none ${
          fullWidth ? 'w-full' : ''
        } ${sizeClasses[size]} ${variantClasses} ${className}`}
        style={{ ...variantStyle, ...style }}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          leftIcon
        )}

        <span>{children}</span>

        {!isLoading && rightIcon}

        {shortcut && (
          <kbd className="ml-1.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-black/20 text-current/80 border border-current/20 rounded">
            {shortcut}
          </kbd>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
