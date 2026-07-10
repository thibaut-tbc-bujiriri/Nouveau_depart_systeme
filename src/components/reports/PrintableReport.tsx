import { forwardRef, type ReactNode } from 'react';
import { ReportFooter } from './ReportFooter';
import { ReportHeader } from './ReportHeader';
import type { Profile } from '@/types';

interface PrintableReportProps {
  title: string;
  scope: 'global' | 'extension' | 'department' | 'personal';
  branchName?: string;
  departmentName?: string;
  period?: string;
  currentUser: Profile;
  children: ReactNode;
}

/** Official HTML document sent to the browser print engine. */
export const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(function PrintableReport(
  { title, scope, branchName, departmentName, period, currentUser, children },
  ref,
) {
  return (
    <article ref={ref} className="printable-report" aria-label={`Document officiel : ${title}`}>
      <ReportHeader
        title={title}
        scope={scope}
        branchName={branchName}
        departmentName={departmentName}
        period={period}
        currentUser={currentUser}
      />
      <div className="report-document-body">{children}</div>
      <ReportFooter />
    </article>
  );
});
