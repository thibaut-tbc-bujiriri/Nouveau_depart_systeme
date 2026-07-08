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

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search on close
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200',
          disabled && 'cursor-not-allowed bg-slate-50 text-slate-400',
        )}
      >
        <span className={cn(!selectedOption && 'text-slate-400 truncate')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="size-4 text-slate-400 shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg animate-in fade-in-50 slide-in-from-top-1 duration-150 flex flex-col">
          {/* Search Input */}
          <div className="flex items-center border-b border-slate-100 px-2.5 py-1.5 shrink-0 bg-slate-50/50">
            <Search className="size-3.5 text-slate-400 shrink-0 mr-1.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 py-1"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="rounded-full p-0.5 hover:bg-slate-200 transition"
              >
                <X className="size-3 text-slate-400" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 max-h-48 py-1 divide-y divide-slate-50">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
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
                      'flex w-full items-center px-3 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 transition-colors',
                      isSelected && 'bg-teal-50 text-teal-700 font-semibold hover:bg-teal-50',
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
