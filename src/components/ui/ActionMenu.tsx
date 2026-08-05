import { cn } from '@/lib/cn';
import { MoreVertical, Eye, Edit, Trash2, Power, CheckCircle2, RefreshCw, FileText, Key, Shield, User, Settings } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface ActionMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: string;
  disabled?: boolean;
}

interface ActionMenuProps {
  items: Array<ActionMenuItem | null | false | undefined>;
  label?: string;
}

function getDefaultActionIcon(label: string, variant?: string): ReactNode {
  const l = label.toLowerCase();
  if (variant === 'danger' || l.includes('supprimer') || l.includes('révoquer') || l.includes('effacer')) {
    return <Trash2 className="size-4 text-rose-500 shrink-0" />;
  }
  if (l.includes('voir') || l.includes('détail') || l.includes('consulter') || l.includes('aperçu')) {
    return <Eye className="size-4 text-slate-500 shrink-0" />;
  }
  if (l.includes('modifier') || l.includes('éditer') || l.includes('changer') || l.includes('renommer')) {
    return <Edit className="size-4 text-blue-500 shrink-0" />;
  }
  if (l.includes('désactiver') || l.includes('suspendre')) {
    return <Power className="size-4 text-amber-500 shrink-0" />;
  }
  if (l.includes('activer') || l.includes('réactiver') || l.includes('valider')) {
    return <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />;
  }
  if (l.includes('régénérer') || l.includes('renouveler') || l.includes('recharger') || l.includes('réinitialiser')) {
    return <RefreshCw className="size-4 text-teal-500 shrink-0" />;
  }
  if (l.includes('rapport') || l.includes('imprimer') || l.includes('télécharger') || l.includes('export') || l.includes('pdf')) {
    return <FileText className="size-4 text-indigo-500 shrink-0" />;
  }
  if (l.includes('carte') || l.includes('passkey') || l.includes('mot de passe') || l.includes('clé')) {
    return <Key className="size-4 text-[#009688] shrink-0" />;
  }
  if (l.includes('rôle') || l.includes('permission') || l.includes('accès')) {
    return <Shield className="size-4 text-purple-500 shrink-0" />;
  }
  if (l.includes('profil') || l.includes('utilisateur') || l.includes('membre')) {
    return <User className="size-4 text-sky-500 shrink-0" />;
  }
  return <Settings className="size-4 text-slate-400 shrink-0" />;
}

export function ActionMenu({ items, label = 'Actions' }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const enabledItems = items.filter((item): item is ActionMenuItem => Boolean(item && !item.disabled));

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
        setPanelPosition(null);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (enabledItems.length === 0) {
    return <span className="text-[var(--on-surface-variant)]">-</span>;
  }

  const toggleMenu = () => {
    if (isOpen) {
      setIsOpen(false);
      setPanelPosition(null);
      return;
    }

    const rect = triggerRef.current?.getBoundingClientRect();
    setPanelPosition(rect ? { top: rect.bottom + 6, left: Math.max(8, rect.right - 165) } : null);
    setIsOpen(true);
  };

  return (
    <div ref={ref} className="action-menu relative inline-block">
      <button ref={triggerRef} type="button" className="action-menu-trigger p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer" onClick={toggleMenu} aria-label={label}>
        <MoreVertical className="size-4" />
      </button>
      {isOpen ? (
        <div className="action-menu-panel z-50 min-w-[160px] space-y-1 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl animate-fadeIn" style={panelPosition ?? undefined}>
          {enabledItems.map((item) => {
            const icon = item.icon ?? getDefaultActionIcon(item.label, item.variant);
            return (
              <button
                key={item.label}
                type="button"
                className={cn(
                  'action-menu-item flex items-center gap-2.5 px-3 py-2 text-xs font-semibold w-full text-left rounded-lg transition-colors cursor-pointer select-none',
                  item.variant === 'danger'
                    ? 'action-menu-item-danger text-rose-600 hover:bg-rose-50'
                    : 'text-slate-700 hover:bg-slate-50',
                )}
                onClick={() => {
                  setIsOpen(false);
                  setPanelPosition(null);
                  item.onClick();
                }}
              >
                <span className="action-menu-icon flex items-center justify-center shrink-0">{icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
