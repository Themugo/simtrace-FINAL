import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { MODULE_THEMES, SimTraceModule } from '../../lib/design-tokens';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error' | 'module';
  styleType?: 'solid' | 'soft' | 'bordered' | 'banner';
  module?: SimTraceModule;
  title?: string;
  description: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  styleType = 'soft',
  module = 'device-dna',
  title,
  description,
  icon,
  action,
  onDismiss,
  className = '',
}) => {
  const theme = MODULE_THEMES[module] || MODULE_THEMES['device-dna'];

  const defaultIcons = {
    info: <Info className="w-5 h-5 text-sky-400" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    module: <Info className="w-5 h-5" style={{ color: theme.primaryHex }} />,
  };

  const alertIcon = icon || defaultIcons[variant];

  let bgClasses = '';
  let borderClasses = '';
  let textClasses = '';
  let customStyle: React.CSSProperties = {};

  if (variant === 'module') {
    customStyle = {
      backgroundColor: theme.badgeBg,
      borderColor: theme.borderAccent,
      color: '#f1f5f9',
    };
  } else {
    const config = {
      info: {
        soft: 'bg-sky-500/10 border-sky-500/30 text-sky-200',
        solid: 'bg-sky-600 text-white border-sky-500',
        bordered: 'bg-slate-900 border-2 border-sky-500 text-sky-200',
        banner: 'bg-sky-950 border-b border-sky-800 text-sky-100',
      },
      success: {
        soft: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
        solid: 'bg-emerald-600 text-white border-emerald-500',
        bordered: 'bg-slate-900 border-2 border-emerald-500 text-emerald-200',
        banner: 'bg-emerald-950 border-b border-emerald-800 text-emerald-100',
      },
      warning: {
        soft: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
        solid: 'bg-amber-600 text-white border-amber-500',
        bordered: 'bg-slate-900 border-2 border-amber-500 text-amber-200',
        banner: 'bg-amber-950 border-b border-amber-800 text-amber-100',
      },
      error: {
        soft: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
        solid: 'bg-rose-600 text-white border-rose-500',
        bordered: 'bg-slate-900 border-2 border-rose-500 text-rose-200',
        banner: 'bg-rose-950 border-b border-rose-800 text-rose-100',
      },
    }[variant][styleType];

    bgClasses = config;
    borderClasses = 'border';
  }

  return (
    <div
      className={`p-4 rounded-xl flex items-start gap-3 relative shadow-md transition-all ${borderClasses} ${bgClasses} ${className}`}
      style={customStyle}
    >
      <div className="shrink-0 mt-0.5">{alertIcon}</div>

      <div className="flex-1 space-y-1">
        {title && <h4 className="font-bold text-sm leading-none">{title}</h4>}
        <div className="text-xs leading-relaxed opacity-90">{description}</div>
        {action && <div className="pt-2">{action}</div>}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 opacity-70 hover:opacity-100 transition rounded-lg hover:bg-black/20"
          title="Dismiss Alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
