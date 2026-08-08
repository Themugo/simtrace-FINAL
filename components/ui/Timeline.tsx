import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Shield, User, FileText } from 'lucide-react';
import { MODULE_THEMES, SimTraceModule } from '../../lib/design-tokens';

export interface TimelineItem {
  id: string;
  title: string;
  timestamp: string;
  description?: string;
  status?: 'completed' | 'active' | 'pending' | 'alert';
  actor?: string;
  badge?: string;
  module?: SimTraceModule;
}

export interface TimelineProps {
  items: TimelineItem[];
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  items,
  orientation = 'vertical',
  className = '',
}) => {
  if (orientation === 'horizontal') {
    return (
      <div className={`flex items-start gap-4 overflow-x-auto p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg ${className}`}>
        {items.map((item, idx) => {
          const theme = MODULE_THEMES[item.module || 'device-dna'];

          const statusColors = {
            completed: 'bg-emerald-500 text-slate-950 border-emerald-400',
            active: 'bg-sky-500 text-slate-950 border-sky-400 animate-pulse',
            pending: 'bg-slate-800 text-slate-400 border-slate-700',
            alert: 'bg-rose-500 text-slate-950 border-rose-400',
          }[item.status || 'completed'];

          return (
            <div key={item.id} className="flex-1 min-w-[200px] flex flex-col relative">
              {/* Connector Line */}
              {idx < items.length - 1 && (
                <div className="absolute top-3 left-6 right-0 h-0.5 bg-slate-800 z-0" />
              )}

              <div className="flex items-center gap-2 z-10 mb-2">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${statusColors}`}>
                  {idx + 1}
                </div>
                <span className="text-[10px] font-mono text-slate-400">{item.timestamp}</span>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl space-y-1">
                <div className="font-bold text-white text-xs">{item.title}</div>
                {item.description && <div className="text-[11px] text-slate-400">{item.description}</div>}
                {item.actor && (
                  <div className="text-[10px] font-mono text-cyan-400 pt-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> {item.actor}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical Timeline
  return (
    <div className={`relative space-y-6 before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800 ${className}`}>
      {items.map((item) => {
        const theme = MODULE_THEMES[item.module || 'device-dna'];

        const nodeIcons = {
          completed: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          active: <Clock className="w-4 h-4 text-sky-400 animate-pulse" />,
          pending: <Clock className="w-4 h-4 text-slate-500" />,
          alert: <AlertTriangle className="w-4 h-4 text-rose-400" />,
        }[item.status || 'completed'];

        return (
          <div key={item.id} className="relative flex items-start gap-4 pl-9">
            {/* Node circle */}
            <div className="absolute left-1 top-0.5 p-1 bg-slate-950 border border-slate-800 rounded-full shadow z-10">
              {nodeIcons}
            </div>

            {/* Event Card */}
            <div className="flex-1 bg-slate-900 border border-slate-800/90 rounded-2xl p-4 shadow-md space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  {item.title}
                  {item.badge && (
                    <span
                      className="px-2 py-0.5 text-[9px] font-mono font-bold rounded"
                      style={{
                        backgroundColor: theme.badgeBg,
                        color: theme.primaryHex,
                        border: `1px solid ${theme.borderAccent}`,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </h4>

                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {item.timestamp}
                </span>
              </div>

              {item.description && <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>}

              {item.actor && (
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300">
                    <User className="w-3 h-3 text-sky-400" /> Operator: <strong>{item.actor}</strong>
                  </span>
                  <span>ID: {item.id}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
