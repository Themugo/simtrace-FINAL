import React from 'react';
import { MODULE_THEMES, SimTraceModule } from '../../lib/design-tokens';

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  type?: 'area' | 'bar' | 'line';
  module?: SimTraceModule;
  height?: number;
  className?: string;
  action?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  data,
  type = 'area',
  module = 'device-dna',
  height = 220,
  className = '',
  action,
}) => {
  const theme = MODULE_THEMES[module] || MODULE_THEMES['device-dna'];

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 10);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  // Build SVG path
  const width = 500;
  const svgHeight = height;

  const points = data.map((d, idx) => {
    const x = (idx / (data.length - 1 || 1)) * (width - 40) + 20;
    const y = svgHeight - 30 - ((d.value - minVal) / range) * (svgHeight - 60);
    return { x, y, label: d.label, val: d.value };
  });

  const pathD = points.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
    ''
  );

  const areaD = `${pathD} L ${points[points.length - 1]?.x || width},${svgHeight - 20} L ${
    points[0]?.x || 0
  },${svgHeight - 20} Z`;

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-white text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div className="relative w-full" style={{ height: `${height}px` }}>
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${svgHeight}`}>
          <defs>
            <linearGradient id={`grad-${module}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.primaryHex} stopOpacity="0.4" />
              <stop offset="100%" stopColor={theme.primaryHex} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 0.33, 0.66, 1].map((pct, idx) => {
            const y = (svgHeight - 50) * pct + 20;
            return (
              <line
                key={idx}
                x1="20"
                y1={y}
                x2={width - 20}
                y2={y}
                stroke="#252a3a"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {type === 'area' && <path d={areaD} fill={`url(#grad-${module})`} />}

          {type === 'bar' ? (
            points.map((pt, idx) => {
              const barWidth = Math.max(12, (width - 60) / data.length - 10);
              const barHeight = svgHeight - 30 - pt.y;
              return (
                <rect
                  key={idx}
                  x={pt.x - barWidth / 2}
                  y={pt.y}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  fill={theme.primaryHex}
                  opacity="0.85"
                />
              );
            })
          ) : (
            <path
              d={pathD}
              fill="none"
              stroke={theme.primaryHex}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Point nodes */}
          {type !== 'bar' &&
            points.map((pt, idx) => (
              <g key={idx} className="group cursor-pointer">
                <circle cx={pt.x} cy={pt.y} r="5" fill={theme.primaryHex} />
                <circle cx={pt.x} cy={pt.y} r="2" fill="#0c0e14" />
              </g>
            ))}

          {/* X-Axis Labels */}
          {points.map((pt, idx) => (
            <text
              key={idx}
              x={pt.x}
              y={svgHeight - 5}
              fill="#94a3b8"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {pt.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};
