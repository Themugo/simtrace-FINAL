import React from 'react';
import { MODULE_THEMES, SimTraceModule } from '../../lib/design-tokens';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'surface' | 'bordered' | 'glass' | 'interactive' | 'module';
  module?: SimTraceModule;
  noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      module = 'device-dna',
      noPadding = false,
      children,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const theme = MODULE_THEMES[module] || MODULE_THEMES['device-dna'];

    let variantClasses = '';
    let customStyle: React.CSSProperties = {};

    switch (variant) {
      case 'default':
        variantClasses = 'bg-slate-900 border border-slate-800 shadow-md';
        break;
      case 'surface':
        variantClasses = 'bg-slate-950 border border-slate-800 shadow-sm';
        break;
      case 'bordered':
        variantClasses = 'bg-slate-900/50 border-2 border-slate-700/80 shadow-md';
        break;
      case 'glass':
        variantClasses = 'bg-slate-900/60 backdrop-blur-md border border-slate-700/50 shadow-xl';
        break;
      case 'interactive':
        variantClasses = 'bg-slate-900 border border-slate-800 hover:border-slate-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer';
        break;
      case 'module':
        variantClasses = 'bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden';
        customStyle = {
          borderTop: `2px solid ${theme.primaryHex}`,
        };
        break;
    }

    return (
      <div
        ref={ref}
        className={`rounded-2xl transition-all duration-150 ${noPadding ? 'p-0' : 'p-5'} ${variantClasses} ${className}`}
        style={{ ...customStyle, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 pb-3 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', children, ...props }, ref) => (
    <h3 ref={ref} className={`font-bold text-white text-base tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', children, ...props }, ref) => (
    <p ref={ref} className={`text-xs text-slate-400 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`pt-1 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`flex items-center pt-4 border-t border-slate-800/80 mt-4 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';
