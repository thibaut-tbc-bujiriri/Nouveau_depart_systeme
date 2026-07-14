import type { TeachingProgram, TeachingProgramSession } from '@/services/teachingPrograms.service';

const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function toDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatShortDate(dateValue: string) {
  const date = toDate(dateValue);
  if (!date) return 'Non renseigné';
  return `${String(date.getDate()).padStart(2, '0')} ${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatFullDate(date: Date) {
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

function formatHour(session: TeachingProgramSession) {
  if (session.startTime && session.endTime) {
    return `${session.startTime.slice(0, 5).replace(':', 'h')} - ${session.endTime.slice(0, 5).replace(':', 'h')}`;
  }

  if (session.durationMinutes) {
    return `${session.durationMinutes}'`;
  }

  return 'Non renseigné';
}

function weekOrdinal(index: number) {
  if (index === 0) return '1ère';
  return `${index + 1}ème`;
}

function getWeekRanges(year: number, month: number) {
  const ranges: Array<{ start: Date; end: Date }> = [];
  const lastDay = new Date(year, month, 0).getDate();
  let cursor = new Date(year, month - 1, 1);

  while (cursor.getMonth() === month - 1) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    const daysUntilSunday = (7 - end.getDay()) % 7;
    end.setDate(Math.min(end.getDate() + daysUntilSunday, lastDay));
    ranges.push({ start, end });
    cursor = new Date(end);
    cursor.setDate(cursor.getDate() + 1);
  }

  return ranges;
}

function groupSessionsByWeek(program: TeachingProgram) {
  const ranges = getWeekRanges(program.year, program.month);
  return ranges.map((range, index) => ({
    label: `${weekOrdinal(index)} semaine : Du ${formatFullDate(range.start)} au ${formatFullDate(range.end)}`,
    sessions: program.sessions.filter((session) => {
      const date = toDate(session.sessionDate);
      return date ? date >= range.start && date <= range.end : false;
    }),
  })).filter((group) => group.sessions.length > 0);
}

interface TeachingProgramReportProps {
  program: TeachingProgram | null;
}

export function TeachingProgramReport({ program }: TeachingProgramReportProps) {
  if (!program) {
    return <div className="bg-white p-8 text-center text-sm text-slate-500">Aucune donnée. Aucun programme des enseignements n’est disponible pour cette période.</div>;
  }

  const groups = groupSessionsByWeek(program);

  return (
    <section className="teaching-program-report-body">
      <table className="teaching-program-table">
        <thead>
          <tr>
            <th>JOUR</th>
            <th>DATE</th>
            <th>ORATEUR</th>
            <th>OFFICIANT</th>
            <th>HEURE OU DURÉE</th>
          </tr>
        </thead>
        <tbody>
          {groups.length === 0 ? (
            <tr>
              <td colSpan={5} className="teaching-program-empty">Aucune donnée</td>
            </tr>
          ) : groups.map((group) => (
            <>
              <tr key={group.label} className="teaching-program-week-row">
                <td colSpan={5}>{group.label}</td>
              </tr>
              {group.sessions.map((session) => {
                const date = toDate(session.sessionDate);
                return (
                  <tr key={session.id}>
                    <td>{date ? dayNames[date.getDay()] : 'Non renseigné'}</td>
                    <td>{formatShortDate(session.sessionDate)}</td>
                    <td>
                      <strong>{session.activityType.toLowerCase().includes('intercession') ? 'Intercession' : session.speakerName}</strong>
                      {session.notes ? <span className="teaching-program-note"> {session.notes}</span> : null}
                    </td>
                    <td>{session.officiantName || 'Non renseigné'}</td>
                    <td>{formatHour(session)}</td>
                  </tr>
                );
              })}
            </>
          ))}
        </tbody>
      </table>

      <footer className="teaching-program-signature">
        <p className="teaching-program-sign-name">{program.signatoryName}</p>
        <p>{program.signatoryTitle}</p>
        <div className="teaching-program-sign-line" />
      </footer>
    </section>
  );
}
