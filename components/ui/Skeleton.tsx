import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'table' | 'chart';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  count = 1,
  className = '',
  style,
  ...props
}) => {
  const baseClasses = 'bg-slate-800/60 animate-pulse rounded-lg';

  if (variant === 'card') {
    return <SkeletonCard className={className} />;
  }

  if (variant === 'table') {
    return <SkeletonTable className={className} count={count} />;
  }

  if (variant === 'chart') {
    return <SkeletonChart className={className} />;
  }

  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full shrink-0',
    rectangular: 'w-full rounded-xl',
    card: '',
    table: '',
    chart: '',
  }[variant];

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`${baseClasses} ${variantClasses} ${className}`}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            ...style,
          }}
          {...props}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 ${className}`}>
    <div className="flex justify-between items-center">
      <Skeleton variant="text" width="40%" height="18px" />
      <Skeleton variant="circular" width="32px" height="32px" />
    </div>
    <Skeleton variant="text" width="70%" height="28px" />
    <Skeleton variant="text" width="90%" height="14px" />
  </div>
);

export const SkeletonText: React.FC<SkeletonProps> = (props) => <Skeleton variant="text" {...props} />;
export const SkeletonAvatar: React.FC<SkeletonProps> = (props) => <Skeleton variant="circular" width="40px" height="40px" {...props} />;

export const SkeletonTable: React.FC<{ className?: string; count?: number }> = ({ className = '', count = 3 }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 ${className}`}>
    <div className="flex justify-between border-b border-slate-800 pb-3">
      <Skeleton width="20%" height="16px" />
      <Skeleton width="15%" height="16px" />
      <Skeleton width="25%" height="16px" />
    </div>
    {Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className="flex justify-between py-2 border-b border-slate-800/40">
        <Skeleton width="30%" height="14px" />
        <Skeleton width="20%" height="14px" />
        <Skeleton width="35%" height="14px" />
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 ${className}`}>
    <div className="flex justify-between">
      <Skeleton width="35%" height="18px" />
      <Skeleton width="15%" height="18px" />
    </div>
    <div className="h-44 flex items-end gap-2 pt-4">
      {[40, 65, 30, 85, 50, 95, 70, 60, 90, 45].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-800/80 animate-pulse rounded-t-lg"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  </div>
);
