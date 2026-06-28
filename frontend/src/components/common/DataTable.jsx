import { useState } from 'react';
import {
  ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon,
  ArrowDownTrayIcon, FunnelIcon,
} from '@heroicons/react/24/outline';

/**
 * Generic data table used across every module's list page.
 *
 * Props:
 *  - columns: [{ key, header, render?(row) }]
 *  - rows: array of row objects
 *  - meta: { total, page, pageSize, totalPages } | undefined
 *  - loading: boolean
 *  - onPageChange(page)
 *  - onSearch(value)  -- debounced by caller if desired
 *  - filters: optional ReactNode rendered in the toolbar (selects etc.)
 *  - onExport(format)  -- 'csv' | 'excel' | 'pdf'
 *  - onRowClick(row)
 *  - emptyMessage
 */
export default function DataTable({
  columns,
  rows = [],
  meta,
  loading = false,
  onPageChange,
  onSearch,
  searchPlaceholder = 'Search…',
  filters,
  onExport,
  onRowClick,
  emptyMessage = 'No records found.',
  toolbarRight,
}) {
  const [searchValue, setSearchValue] = useState('');

  function handleSearchChange(e) {
    const value = e.target.value;
    setSearchValue(value);
    onSearch?.(value);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {onSearch && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-steel-400" />
            <input
              value={searchValue}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-800 pl-8 pr-3 py-2 text-sm text-steel-900 dark:text-steel-100 placeholder:text-steel-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        )}
        {filters && (
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-steel-400" />
            {filters}
          </div>
        )}
        <div className="flex-1" />
        {toolbarRight}
        {onExport && (
          <div className="flex items-center gap-1 ml-2">
            {['csv', 'excel', 'pdf'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => onExport(fmt)}
                className="inline-flex items-center gap-1 rounded-md border border-steel-300 dark:border-steel-600 px-2.5 py-1.5 text-xs font-medium text-steel-600 dark:text-steel-300 hover:bg-steel-100 dark:hover:bg-steel-700 transition-colors"
              >
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-steel-200 dark:border-steel-700 scrollbar-thin">
        <table className="min-w-full divide-y divide-steel-200 dark:divide-steel-700">
          <thead className="bg-steel-50 dark:bg-steel-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-steel-500 dark:text-steel-400 whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-100 dark:divide-steel-800 bg-white dark:bg-steel-900">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 w-full max-w-[140px] animate-pulse rounded bg-steel-200 dark:bg-steel-700" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-steel-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'cursor-pointer hover:bg-steel-50 dark:hover:bg-steel-800/60' : ''}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-steel-700 dark:text-steel-200 whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-steel-500 dark:text-steel-400">
          <span>
            Page {meta.page} of {meta.totalPages} &middot; {meta.total} total
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              className="rounded-md border border-steel-300 dark:border-steel-600 p-1.5 disabled:opacity-40 hover:bg-steel-100 dark:hover:bg-steel-700"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
              className="rounded-md border border-steel-300 dark:border-steel-600 p-1.5 disabled:opacity-40 hover:bg-steel-100 dark:hover:bg-steel-700"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
