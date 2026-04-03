import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { Card } from '@/app/components/ui';
import { EmptyState } from '@/app/components/patterns';
import { emptyStates, hints } from '@/content/microcopy';
import { ImportDropzone } from './ui/ImportDropzone';
import { ImportHelpAccordion } from './ui/ImportHelpAccordion';
import { runImportPipeline } from './pipeline';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';

export const ImportPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchByDateRange } = useTransactions();
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'empty' | 'ready'>('idle');
  const [error, setError] = useState<string | null>(null);

  const fetchExistingTxs = useCallback(
    async (minDate: string, maxDate: string) => {
      return fetchByDateRange(minDate, maxDate);
    },
    [fetchByDateRange]
  );

  const runPipeline = useCallback(
    async (file: File) => {
      setError(null);
      setState('loading');
      const result = await runImportPipeline({
        file,
        fetchExistingTxs,
      });
      if (result.error) {
        setError(result.error);
        setState('error');
        return;
      }
      if (result.rows.length === 0) {
        setError('Nenhuma transação encontrada.');
        setState('empty');
        return;
      }
      setState('ready');
      navigate('/import/preview', { state: { rows: result.rows } });
    },
    [fetchExistingTxs, navigate]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      await runPipeline(file);
    },
    [runPipeline]
  );

  const handleError = useCallback((err: string) => {
    setError(err);
    setState('error');
  }, []);

  const handleReset = useCallback(() => {
    setError(null);
    setState('idle');
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-bold">Importar extrato</h1>
        <p className="text-muted-foreground mt-1">
          {hints.importSecurity}
        </p>
      </div>

      {/* Passos: 1) Envie 2) Revise 3) Confirme */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
          {hints.importSteps[0]}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">2</span>
          {hints.importSteps[1]}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">3</span>
          {hints.importSteps[2]}
        </span>
      </div>

      {state === 'empty' && (
        <EmptyState
          icon={<Upload size={28} className="text-muted-foreground" />}
          title={emptyStates.import.title}
          description={emptyStates.import.description}
          primaryAction={{ label: emptyStates.import.retryCta, onClick: handleReset }}
        />
      )}

      <div data-tour="fluxia-import-dropzone">
        <Card className="p-6 md:p-8">
        <ImportDropzone
          onFileSelect={handleFileSelect}
          onError={handleError}
          onReset={handleReset}
          loading={state === 'loading'}
          error={state === 'error' || state === 'empty' ? error : null}
        />
      </Card>
      </div>

      <div data-tour="fluxia-import-help">
        <ImportHelpAccordion />
      </div>
    </div>
  );
};
