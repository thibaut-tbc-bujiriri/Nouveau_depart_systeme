/**
 * Export data to CSV format (compatible with Excel, supporting French accents via UTF-8 BOM).
 */
export function exportToCSV(filename: string, headers: string[], rows: string[][]): void {
  // UTF-8 BOM to ensure Excel opens accented French characters properly
  const BOM = '\uFEFF';
  const csvContent = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.endsWith('.csv') ? filename : `${filename}.csv`}`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Trigger the browser's built-in print interface.
 * When combined with CSS print styles, this generates beautiful, native PDFs.
 */
export function exportToPDF(): void {
  window.print();
}
