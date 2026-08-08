import React from 'react';
import { MODULE_THEMES, SimTraceModule } from '../../lib/design-tokens';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'ok' | 'danger' | 'warn' | 'info' | 'indigo' | 'purple' | 'module' | 'dot' | 'neutral' | 'outline';
  module?: SimTraceModule;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  module = 'device-dna',
  size = 'md',
  icon,
  children,
  className = '',
  style,
  ...props
}) => {
  const theme = MODULE_THEMES[module] || MODULE_THEMES['device-dna'];

  const sizeClasses = {
    xs: 'px-1.5 py-0.2 text-[9px] gap-1 rounded',
    sm: 'px-2 py-0.5 text-[10px] gap-1 rounded-md',
    md: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg',
    lg: 'px-3 py-1.5 text-xs gap-2 rounded-xl',
  }[size];

  let variantStyle: React.CSSProperties = {};
  let variantClasses = '';

  switch (variant) {
    case 'ok':
      variantClasses = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold';
      break;
    case 'danger':
      variantClasses = 'bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold';
      break;
    case 'warn':
      variantClasses = 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold';
      break;
    case 'info':
      variantClasses = 'bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold';
      break;
    case 'indigo':
      variantClasses = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold';
      break;
    case 'purple':
      variantClasses = 'bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold';
      break;
    case 'neutral':
      variantClasses = 'bg-slate-800 text-slate-300 border border-slate-700 font-medium';
      break;
    case 'outline':
      variantClasses = 'bg-transparent text-slate-300 border border-slate-700 font-medium';
      break;
    case 'dot':
      variantClasses = 'bg-slate-900 border border-slate-800 text-slate-200 font-mono';
      break;
    case 'module':
      variantStyle = {
        backgroundColor: theme.badgeBg,
        color: theme.primaryHex,
        border: `1px solid ${theme.borderAccent}`,
      };
      variantClasses = 'font-bold font-mono';
      break;
    default:
      variantClasses = 'bg-slate-800 text-slate-200 font-semibold';
      break;
  }

  return (
    <span
      className={`inline-flex items-center justify-center font-mono whitespace-nowrap select-none ${sizeClasses} ${variantClasses} ${className}`}
      style={{ ...variantStyle, ...style }}
      {...props}
    >
      {variant === 'dot' && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
