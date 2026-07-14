import React, { useCallback, useRef } from 'react';
import { ReportActions } from './ReportActions';
import { PrintableReport } from './PrintableReport';
import type { Profile } from '@/types';

interface ReportLayoutProps {
  title: string;
  scope: 'global' | 'extension' | 'department' | 'personal';
  branchName?: string;
  departmentName?: string;
  period?: string;
  currentUser: Profile;
  officeName?: string;
  annualTheme?: string;
  monthYear?: string;
  subtheme?: string;
  onExportCSV?: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function ReportLayout({
  title,
  scope,
  branchName,
  departmentName,
  period,
  currentUser,
  officeName,
  annualTheme,
  monthYear,
  subtheme,
  onExportCSV,
  isLoading = false,
  children,
}: ReportLayoutProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(async () => {
    const report = reportRef.current;
    if (!report) return;

    const images = Array.from(report.querySelectorAll('img'));
    await Promise.all(
      images.map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              image.addEventListener('load', () => resolve(), { once: true });
              image.addEventListener('error', () => resolve(), { once: true });
            }),
      ),
    );

    await document.fonts?.ready;
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-5xl mx-auto report-preview">
      <ReportActions onPrint={handlePrint} onExportCSV={onExportCSV} isLoading={isLoading} />
      <PrintableReport
        ref={reportRef}
        title={title}
        scope={scope}
        branchName={branchName}
        departmentName={departmentName}
        period={period}
        currentUser={currentUser}
        officeName={officeName}
        annualTheme={annualTheme}
        monthYear={monthYear}
        subtheme={subtheme}
      >
        <div className="my-6 min-h-[200px]">{children}</div>
      </PrintableReport>
    </div>
  );
}
