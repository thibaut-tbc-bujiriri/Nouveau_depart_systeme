import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Array<DataTableColumn<T>>;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'Aucune donnee disponible.',
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-slate-50/90">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={keyExtractor(item)}
                  className={cn(
                    'border-t border-slate-100 transition-colors hover:bg-slate-50/80',
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/20',
                  )}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={cn('px-4 py-3 align-middle text-slate-700', column.className)}>
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

export function LoadingState({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

