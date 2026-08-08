import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { MODULE_THEMES, SimTraceModule } from '../../lib/design-tokens';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  module?: SimTraceModule;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  module = 'device-dna',
  className = '',
}) => {
  const theme = MODULE_THEMES[module] || MODULE_THEMES['device-dna'];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[90vh]',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop overlay listener */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card Dialog */}
      <div
        className={`relative w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200 ${sizeClasses} ${className}`}
        style={{ borderTop: `3px solid ${theme.primaryHex}` }}
      >
        {/* Header */}
        {(title || description) && (
          <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/50">
            <div className="space-y-1">
              {title && <h2 className="font-bold text-white text-base leading-snug">{title}</h2>}
              {description && <p className="text-xs text-slate-400">{description}</p>}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition shadow"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] flex-1 text-xs text-slate-200 leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
