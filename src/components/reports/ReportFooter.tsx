interface ReportFooterProps {
  systemName?: string;
}

export function ReportFooter({ systemName = 'Centre de Supervision CECND' }: ReportFooterProps) {
  const generatedTimeStr = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="border-t border-slate-200 mt-8 pt-4 text-[10px] text-slate-500 font-semibold flex items-center justify-between print:mt-6 print:pt-2">
      <div>
        <span>{systemName} • Généré le : {generatedTimeStr}</span>
      </div>
      
      <div className="text-center italic">
        <span>Document généré automatiquement par le système.</span>
      </div>

      <div className="text-right">
        {/* Standard print stylesheets can bind to page counters */}
        <span className="print:inline hidden">Page <span className="after:content-[counter(page)]" /></span>
        <span className="print:hidden">Document Officiel</span>
      </div>
    </div>
  );
}
