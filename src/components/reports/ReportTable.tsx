import React from 'react';

interface ReportTableProps {
  headers: string[];
  rows: React.ReactNode[][];
  alignments?: ('left' | 'center' | 'right')[];
}

export function ReportTable({ headers, rows, alignments }: ReportTableProps) {
  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  };

  return (
    <div className="overflow-x-auto my-4 print:overflow-visible">
      <table className="w-full border-collapse text-left text-xs text-slate-700 print:text-[11px] border border-slate-200">
        <thead>
          <tr className="bg-slate-800 text-white font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-850 print:border-b print:border-slate-400">
            {headers.map((header, idx) => {
              const align = alignments?.[idx];
              return (
                <th
                  key={idx}
                  className={`p-3 border border-slate-200 print:p-2 print:border-slate-300 ${getAlignmentClass(align)}`}
                >
                  {header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="p-8 text-center text-slate-400 border border-slate-200 font-medium"
              >
                Aucune donnée à afficher.
              </td>
            </tr>
          ) : (
            rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`${
                  rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                } hover:bg-slate-50 transition-colors print:bg-white print:border-b print:border-slate-200`}
              >
                {row.map((cell, cellIdx) => {
                  const align = alignments?.[cellIdx];
                  return (
                    <td
                      key={cellIdx}
                      className={`p-3 border border-slate-200 print:p-2 print:border-slate-300 ${getAlignmentClass(align)}`}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
