import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const BANKS = [
  {
    name: 'Nubank',
    steps: [
      'Abra o app Nubank',
      'Vá em Extrato',
      'Toque nos três pontinhos',
      'Selecione "Exportar extrato"',
      'Escolha o período e formato CSV',
    ],
  },
  {
    name: 'Inter',
    steps: [
      'Acesse o app ou site do Inter',
      'Vá em Conta → Extrato',
      'Selecione o período',
      'Toque em "Exportar" ou "Download"',
      'Salve o arquivo CSV',
    ],
  },
  {
    name: 'Itaú',
    steps: [
      'Acesse o Internet Banking',
      'Vá em Conta Corrente → Extrato',
      'Selecione o período desejado',
      'Clique em "Exportar"',
      'Escolha CSV ou OFX',
    ],
  },
  {
    name: 'Banco do Brasil',
    steps: [
      'Acesse o BB (app ou site)',
      'Extrato de conta',
      'Selecione o período',
      'Exportar/Download',
      'Salve em CSV ou OFX',
    ],
  },
  {
    name: 'Outros bancos',
    steps: [
      'Procure no app ou site por "Extrato"',
      'Geralmente em Conta ou Movimentação',
      'Busque opções como "Exportar", "Download" ou "Salvar"',
      'Formatos comuns: CSV, OFX, PDF (CSV/OFX funcionam melhor aqui)',
    ],
  },
];

export const ImportHelpAccordion = () => {
  const [open, setOpen] = useState<string | false>(false);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(open ? false : 'help')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <HelpCircle size={18} />
        Onde encontrar meu extrato?
      </button>
      {open && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground mb-4">
            Passos genéricos para exportar extratos. Cada banco pode ter nomes diferentes para as opções.
          </p>
          <Accordion type="single" collapsible className="w-full">
            {BANKS.map((bank) => (
              <AccordionItem key={bank.name} value={bank.name}>
                <AccordionTrigger className="text-sm font-medium">
                  {bank.name}
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    {bank.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
};
