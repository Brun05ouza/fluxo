import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/app/components/ui/sheet';
import { Button, Input } from '@/app/components/ui';
import { detectIntent } from '../assistant/intentRouter';
import { useTour } from '../tour/TourProvider';
import type { FluxiaMessage, FluxiaResponse } from '../assistant/types';

const FLUXIA_LOGO = '/flux.ia.png?v=1';

const QUICK_ACTIONS = [
  { label: 'Importar extrato', intent: 'IMPORT_EXTRATO' },
  { label: 'Adicionar gasto', intent: 'NOVA_TRANSACAO' },
  { label: 'Criar orçamento', intent: 'CRIAR_ORCAMENTO' },
  { label: 'Ver relatórios', intent: 'VER_RELATORIOS' },
] as const;

interface FluxiaDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FluxiaDrawer({ open, onOpenChange }: FluxiaDrawerProps) {
  const closeDrawer = useCallback(() => onOpenChange(false), [onOpenChange]);
  const navigate = useNavigate();
  const { startTour } = useTour();
  const [messages, setMessages] = useState<FluxiaMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const processResponse = useCallback(
    (response: FluxiaResponse) => {
      if (response.openPage) {
        navigate(response.openPage);
      }
      if (response.hasGuide) {
        closeDrawer();
        startTour(response.intent);
      }
    },
    [navigate, startTour, closeDrawer]
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setInput('');
      const userMsg: FluxiaMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((m) => [...m, userMsg]);

      const response = detectIntent(trimmed);
      const assistantMsg: FluxiaMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        response,
      };
      setMessages((m) => [...m, assistantMsg]);
      processResponse(response);
    },
    [processResponse]
  );

  const handleSend = useCallback(() => sendMessage(input), [input, sendMessage]);

  const handleQuickAction = useCallback(
    (intent: string) => {
      const actions: Record<string, string> = {
        IMPORT_EXTRATO: 'Como faço para importar o extrato do meu banco?',
        NOVA_TRANSACAO: 'Como adiciono um gasto manualmente?',
        CRIAR_ORCAMENTO: 'Como criar orçamento por categoria?',
        VER_RELATORIOS: 'Onde vejo os relatórios?',
      };
      const text = actions[intent] ?? intent;
      sendMessage(text);
    },
    [sendMessage]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <img
              src={FLUXIA_LOGO}
              alt="Flux.ia"
              className="w-16 h-16 rounded-full object-contain bg-muted/30"
            />
            <div>
              <SheetTitle className="text-xl">Flux.ia</SheetTitle>
              <SheetDescription>Seu assistente no Fluxo</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-5 min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <img
                src={FLUXIA_LOGO}
                alt=""
                className="w-20 h-20 object-contain opacity-80 mb-4"
              />
              <p className="text-foreground font-medium">Olá! Como posso te ajudar?</p>
              <p className="text-muted-foreground text-sm mt-1">Pergunte ou escolha uma ação rápida abaixo.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <img
                  src={FLUXIA_LOGO}
                  alt=""
                  className="w-10 h-10 rounded-full object-contain shrink-0 mt-0.5"
                />
              )}
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted/80 rounded-bl-md border border-border/50'
                }`}
              >
                <p>{msg.content}</p>
                {msg.response?.hasGuide && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 border-border/80"
                      onClick={() => {
                        closeDrawer();
                        startTour(msg.response!.intent);
                        if (msg.response?.openPage) navigate(msg.response.openPage!);
                      }}
                    >
                      Me guiar
                    </Button>
                    {msg.response.openPage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 hover:bg-foreground/10"
                      onClick={() => navigate(msg.response!.openPage!)}
                    >
                        Abrir página
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <span className="w-10 shrink-0" aria-hidden />
              )}
            </div>
          ))}
        </div>

        <div className="p-4 pt-3 border-t border-border shrink-0 space-y-3 bg-background/50">
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.intent}
                type="button"
                onClick={() => handleQuickAction(qa.intent)}
                className="px-4 py-2.5 text-sm rounded-xl border border-border/80 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200"
              >
                {qa.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Como posso te ajudar?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              size="md"
              className="h-11 px-5 shrink-0 gap-2"
            >
              <Send size={18} />
              Enviar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
