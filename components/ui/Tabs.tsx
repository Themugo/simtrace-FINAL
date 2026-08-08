import React, { useState } from 'react';
import { MODULE_THEMES, SimTraceModule } from '../../lib/design-tokens';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTabId?: string;
  onChange?: (tabId: string) => void;
  variant?: 'line' | 'pills' | 'cards';
  module?: SimTraceModule;
  className?: string;
  children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTabId,
  onChange,
  variant = 'line',
  module = 'device-dna',
  className = '',
  children,
}) => {
  const [internalActiveId, setInternalActiveId] = useState(tabs[0]?.id || '');
  const currentActiveId = activeTabId !== undefined ? activeTabId : internalActiveId;
  const theme = MODULE_THEMES[module] || MODULE_THEMES['device-dna'];

  const handleSelect = (tabId: string) => {
    if (activeTabId === undefined) {
      setInternalActiveId(tabId);
    }
    onChange?.(tabId);
  };

  return (
    <div className={`space-y-4 w-full ${className}`}>
      {/* Tabs Header Navigation Bar */}
      <div
        className={`flex items-center gap-1 overflow-x-auto select-none ${
          variant === 'line'
            ? 'border-b border-slate-800 pb-0'
            : variant === 'pills'
            ? 'bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 inline-flex'
            : 'gap-2'
        }`}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === currentActiveId;

          if (variant === 'line') {
            return (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => handleSelect(tab.id)}
                className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all relative whitespace-nowrap ${
                  isActive
                    ? 'text-white border-sky-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                style={isActive ? { borderColor: theme.primaryHex } : {}}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          }

          if (variant === 'pills') {
            return (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => handleSelect(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 text-slate-300">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          }

          // Cards variant
          return (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => handleSelect(tab.id)}
              className={`px-4 py-3 text-xs font-semibold rounded-2xl border flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 border-slate-700 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Children or Active Tab Content Container */}
      {children}
    </div>
  );
};

export const TabPanel: React.FC<{ tabId: string; activeTabId: string; children: React.ReactNode }> = ({
  tabId,
  activeTabId,
  children,
}) => {
  if (tabId !== activeTabId) return null;
  return <div className="animate-in fade-in duration-150">{children}</div>;
};
