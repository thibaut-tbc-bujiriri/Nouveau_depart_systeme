import { cn } from '@/lib/cn';
import { Camera, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AppButton } from './AppButton';

interface PhotoUploadProps {
  value?: string | null;
  onChange: (file: File | null) => void;
  nameInitial: string;
  label?: string;
  className?: string;
}

export function PhotoUpload({ value, onChange, nameInitial, label = 'Photo', className }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onChange(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const initials = nameInitial
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || '?';

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-4">
        <div
          onClick={handleClick}
          className="relative grid size-20 cursor-pointer place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 transition-colors hover:bg-slate-100/70 overflow-hidden"
        >
          {preview ? (
            <>
              <img src={preview} alt="Aperçu" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute right-1 top-1 rounded-full bg-slate-900/60 p-1 text-white hover:bg-slate-900 transition-colors"
                title="Supprimer la photo"
              >
                <X className="size-3" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-xl font-bold text-slate-400">{initials}</span>
              <Camera className="size-4 text-slate-400" />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <AppButton type="button" size="sm" variant="secondary" onClick={handleClick}>
            <Upload className="mr-1.5 size-3.5" />
            Choisir une image
          </AppButton>
          <p className="text-xs text-slate-400">PNG, JPG, JPEG jusqu'à 5 Mo</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
