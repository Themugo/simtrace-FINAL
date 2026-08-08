import React from 'react';
import { ArrowUpRight, ArrowDownRight, MoreVertical, Activity } from 'lucide-react';
import { MODULE_THEMES, SimTraceModule } from '../../lib/design-tokens';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  icon?: React.ReactNode;
  module?: SimTraceModule;
  sparklineData?: number[];
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'positive',
  description,
  icon,
  module = 'device-dna',
  sparklineData = [12, 19, 15, 25, 22, 30, 28, 38],
  onClick,
  className = '',
}) => {
  const theme = MODULE_THEMES[module] || MODULE_THEMES['device-dna'];

  const changeColors = {
    positive: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    negative: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    neutral: 'text-slate-400 bg-slate-800 border-slate-700',
  }[changeType];

  // SVG Sparkline path renderer
  const maxVal = Math.max(...sparklineData, 1);
  const minVal = Math.min(...sparklineData, 0);
  const range = maxVal - minVal || 1;
  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * 100;
      const y = 30 - ((val - minVal) / range) * 26;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div
      onClick={onClick}
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-slate-700 hover:shadow-xl' : ''
      } ${className}`}
      style={{ borderTop: `2px solid ${theme.primaryHex}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 tracking-tight flex items-center gap-1.5">
            {title}
          </span>
          <div className="text-2xl font-black text-white font-mono tracking-tight">{value}</div>
        </div>

        {icon ? (
          <div
            className="p-2.5 rounded-xl border flex items-center justify-center shrink-0 shadow"
            style={{
              backgroundColor: theme.badgeBg,
              borderColor: theme.borderAccent,
              color: theme.primaryHex,
            }}
          >
            {icon}
          </div>
        ) : (
          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400">
            <Activity className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        {change && (
          <div
            className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold flex items-center gap-1 ${changeColors}`}
          >
            {changeType === 'positive' && <ArrowUpRight className="w-3 h-3" />}
            {changeType === 'negative' && <ArrowDownRight className="w-3 h-3" />}
            <span>{change}</span>
          </div>
        )}

        {description && <span className="text-[11px] text-slate-400 truncate">{description}</span>}

        {/* Mini Sparkline Chart */}
        <div className="w-16 h-8 shrink-0 ml-auto">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30">
            <polyline
              fill="none"
              stroke={theme.primaryHex}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export const DashboardGrid: React.FC<{ children: React.ReactNode; cols?: 2 | 3 | 4; className?: string }> = ({
  children,
  cols = 4,
  className = '',
}) => {
  const colClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[cols];

  return <div className={`grid gap-4 ${colClasses} ${className}`}>{children}</div>;
};

export const DashboardHeader: React.FC<{
  title: string;
  subtitle?: string;
  badgeText?: string;
  module?: SimTraceModule;
  actions?: React.ReactNode;
}> = ({ title, subtitle, badgeText, module = 'device-dna', actions }) => {
  const theme = MODULE_THEMES[module] || MODULE_THEMES['device-dna'];

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between flex-wrap gap-4 shadow-lg">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="font-black text-white text-xl tracking-tight">{title}</h1>
          {badgeText && (
            <span
              className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg border shadow-sm"
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.primaryHex,
                borderColor: theme.borderAccent,
              }}
            >
              {badgeText}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-400 leading-relaxed">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
};
