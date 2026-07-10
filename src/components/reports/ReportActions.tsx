import { FileText, Printer } from 'lucide-react';
import { AppButton } from '@/components/ui';

interface ReportActionsProps {
  onPrint?: () => void;
  onExportCSV?: () => void;
  isLoading?: boolean;
}

export function ReportActions({
  onPrint,
  onExportCSV,
  isLoading = false,
}: ReportActionsProps) {
  return (
    <div className="flex items-center gap-2 mb-4 print:hidden justify-end">
      {onExportCSV && (
        <AppButton
          onClick={onExportCSV}
          disabled={isLoading}
          variant="secondary"
          size="sm"
          className="font-bold flex items-center gap-1.5"
        >
          <FileText className="size-4" />
          Exporter Excel
        </AppButton>
      )}
      <AppButton
        onClick={onPrint}
        disabled={isLoading}
        size="sm"
        className="font-bold flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white"
      >
        <Printer className="size-4" />
        Imprimer / PDF
      </AppButton>
    </div>
  );
}
