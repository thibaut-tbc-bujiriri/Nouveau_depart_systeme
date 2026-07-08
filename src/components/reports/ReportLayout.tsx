import React from 'react';
import { ReportHeader } from './ReportHeader';
import { ReportFooter } from './ReportFooter';
import { ReportActions } from './ReportActions';
import type { Profile } from '@/types';

interface ReportLayoutProps {
  title: string;
  scope: 'global' | 'extension' | 'department' | 'personal';
  branchName?: string;
  departmentName?: string;
  period?: string;
  currentUser: Profile;
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
  onExportCSV,
  isLoading = false,
  children,
}: ReportLayoutProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-5xl mx-auto print:border-none print:shadow-none print:p-0 print-container">
      {/* Official Header */}
      <ReportHeader
        title={title}
        scope={scope}
        branchName={branchName}
        departmentName={departmentName}
        period={period}
        currentUser={currentUser}
      />

      {/* Export Actions Toolbar */}
      <ReportActions onExportCSV={onExportCSV} isLoading={isLoading} />

      {/* Report Body Content */}
      <div className="my-6 min-h-[200px] print:my-4 print:min-h-0">
        {children}
      </div>

      {/* Official Footer */}
      <ReportFooter />
    </div>
  );
}
