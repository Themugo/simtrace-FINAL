import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, SlidersHorizontal, Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  density?: 'compact' | 'comfortable' | 'spacious';
  pageSize?: number;
  searchable?: boolean;
  onRowClick?: (item: T) => void;
  emptyText?: string;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  density = 'comfortable',
  pageSize = 5,
  searchable = true,
  onRowClick,
  emptyText = 'No data records found',
  className = '',
}: TableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDensity, setActiveDensity] = useState(density);

  // Filter
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some(
        (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  // Sort
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const paddingY = {
    compact: 'py-2 px-3 text-xs',
    comfortable: 'py-3.5 px-4 text-xs',
    spacious: 'py-5 px-5 text-sm',
  }[activeDensity];

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg ${className}`}>
      {/* Top Table Control Bar */}
      {(searchable || true) && (
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 bg-slate-950/60">
          {searchable && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search table data..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-sky-500 transition"
              />
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="hidden sm:inline">Density:</span>
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              {(['compact', 'comfortable', 'spacious'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setActiveDensity(d)}
                  className={`px-2 py-1 rounded text-[10px] capitalize transition ${
                    activeDensity === d ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider select-none">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`py-3 px-4 font-bold ${
                    col.sortable ? 'cursor-pointer hover:text-white transition' : ''
                  } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                >
                  <div
                    className={`inline-flex items-center gap-1.5 ${
                      col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                    }`}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-slate-500">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
                          )
                        ) : (
                          <SlidersHorizontal className="w-3 h-3 opacity-40" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-slate-400 text-xs">
                  {emptyText}
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-slate-800/50' : 'hover:bg-slate-800/30'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`${paddingY} text-slate-200 ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.cell(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div>
          Showing <span className="text-white font-bold">{Math.min(sortedData.length, (currentPage - 1) * pageSize + 1)}</span> to{' '}
          <span className="text-white font-bold">{Math.min(sortedData.length, currentPage * pageSize)}</span> of{' '}
          <span className="text-white font-bold">{sortedData.length}</span> records
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span>
            Page <strong className="text-white">{currentPage}</strong> / {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
