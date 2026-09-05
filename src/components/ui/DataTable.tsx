import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  /** When onRowClick is set, controls whether a given row is actually clickable — defaults to true for every row. Rows for which this returns false render without the hover/pointer affordance instead of silently no-op'ing on click. */
  isRowClickable?: (row: T) => boolean;
  getRowKey?: (row: T, index: number) => string;
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No data available.',
  onRowClick,
  isRowClickable,
  getRowKey,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto border border-gray-300">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-300 bg-gray-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-10 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const clickable = !!onRowClick && (isRowClickable ? isRowClickable(row) : true);
              return (
                <tr
                  key={getRowKey ? getRowKey(row, idx) : idx}
                  onClick={clickable ? () => onRowClick(row) : undefined}
                  className={`border-b border-gray-200 ${clickable ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-5 py-3.5 text-gray-800 ${col.className ?? ''}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
