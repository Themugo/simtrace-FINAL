import React from 'react';
import { SearchX, Inbox, RefreshCw } from 'lucide-react';
import { MODULE_THEMES, SimTraceModule } from '../../lib/design-tokens';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  module?: SimTraceModule;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  tags?: string[];
  onTagClick?: (tag: string) => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Discovered',
  description = 'There are currently no telemetry logs, device declarations, or case files matching your operational query filters.',
  icon,
  module = 'device-dna',
  primaryAction,
  secondaryAction,
  tags,
  onTagClick,
  className = '',
}) => {
  const theme = MODULE_THEMES[module] || MODULE_THEMES['device-dna'];

  return (
    <div
      className={`bg-slate-900/60 border border-slate-800 border-dashed rounded-3xl p-10 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6 shadow-xl space-y-4 ${className}`}
    >
      <div
        className="p-4 rounded-2xl border flex items-center justify-center shadow-lg"
        style={{
          backgroundColor: theme.badgeBg,
          borderColor: theme.borderAccent,
          color: theme.primaryHex,
        }}
      >
        {icon || <SearchX className="w-8 h-8" />}
      </div>

      <div className="space-y-1.5">
        <h3 className="font-bold text-white text-base tracking-tight">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md">{description}</p>
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3 pt-2">
          {primaryAction}
          {secondaryAction}
        </div>
      )}

      {tags && tags.length > 0 && (
        <div className="pt-4 border-t border-slate-800/80 w-full space-y-2">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Suggested Quick Queries
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick?.(tag)}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-mono rounded-lg transition"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
