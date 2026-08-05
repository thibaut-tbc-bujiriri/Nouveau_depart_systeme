import { cn } from '@/lib/cn';
import { ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface AppComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function AppCombobox({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  disabled = false,
  className,
}: AppComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const closeCombobox = () => {
    setIsOpen(false);
    setSearch('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeCombobox();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (val: string) => {
    onChange(val);
    closeCombobox();
  };

  const toggleCombobox = () => {
    if (isOpen) {
      closeCombobox();
      return;
    }
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggleCombobox}
        className={cn(
          'app-field flex h-9 w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 text-left text-[var(--text-base)] text-[var(--on-surface)] outline-none transition focus:border-[#6675e9] focus:ring-0',
          disabled && 'cursor-not-allowed bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]',
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-[var(--on-surface-variant)]')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="ml-2 size-4 shrink-0 text-[var(--on-surface-variant)]" />
      </button>

      {isOpen ? (
        <div className="absolute z-50 mt-1 flex max-h-60 w-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--outline)] bg-[var(--surface-container-lowest)] shadow-[var(--shadow-card)]">
          <div className="flex shrink-0 items-center border-b border-[var(--outline)] bg-[var(--surface-container-low)] px-3 py-2">
            <Search className="mr-2 size-3.5 shrink-0 text-[var(--on-surface-variant)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full border-0 bg-transparent py-0 text-[var(--text-sm)] text-[var(--on-surface)] outline-none placeholder:text-[var(--on-surface-variant)] focus:border-0"
              autoFocus
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="grid size-5 place-items-center rounded-[var(--radius-full)] bg-transparent text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]"
              >
                <X className="size-3" />
              </button>
            ) : null}
          </div>

          <div className="max-h-48 flex-1 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-center text-[var(--text-sm)] text-[var(--on-surface-variant)]">
                Aucun résultat
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'flex w-full items-center px-3 py-2 text-left text-[var(--text-sm)] text-[var(--on-surface)] transition-colors hover:bg-[var(--surface-container-low)]',
                      isSelected && 'bg-[var(--surface-container-low)] font-medium text-[var(--primary)]',
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
