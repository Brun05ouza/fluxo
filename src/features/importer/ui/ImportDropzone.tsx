import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Card, Button, cn } from '@/app/components/ui';

const ACCEPTED_EXT = ['.csv', '.ofx'];

export interface ImportDropzoneProps {
  onFileSelect: (file: File) => void;
  onError?: (error: string) => void;
  onReset?: () => void;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
}

export const ImportDropzone = ({
  onFileSelect,
  onError,
  onReset,
  loading = false,
  error = null,
  disabled = false,
}: ImportDropzoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXT.includes(ext)) {
      return 'Arquivo inválido. Use CSV ou OFX.';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'Arquivo muito grande. Máximo 10MB.';
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const err = validateFile(file);
      if (err) {
        onError?.(err);
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect, onError]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || loading) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <Card
      className={cn(
        'relative border-2 border-dashed transition-all duration-200 min-h-[200px] flex flex-col items-center justify-center p-8',
        isDragOver && !disabled && !loading && 'border-primary bg-primary/5',
        error && 'border-destructive/50 bg-destructive/5',
        disabled && 'opacity-60 pointer-events-none'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {!error && (
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.ofx,text/csv,application/vnd.ms-excel,application/x-ofx"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-0"
          disabled={disabled || loading}
        />
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-12 w-12 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-sm font-medium text-muted-foreground">
            Processando arquivo...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3 rounded-full bg-destructive/10">
            <FileSpreadsheet size={32} className="text-destructive" />
          </div>
          <p className="text-sm font-medium text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground">
            Tente outro arquivo ou formato CSV/OFX.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onReset?.();
            }}
            className="mt-2"
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
          <div
            className={cn(
              'p-4 rounded-full transition-colors',
              isDragOver ? 'bg-primary/20' : 'bg-muted'
            )}
          >
            <Upload size={40} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-lg">Arraste e solte seu extrato aqui</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ou clique para selecionar (CSV ou OFX)
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="pointer-events-auto z-10"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Selecionar arquivo
          </Button>
        </div>
      )}
    </Card>
  );
};
