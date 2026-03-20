import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/app/components/ui/tooltip';
import { cn } from '@/app/components/ui';

const FLUXIA_LOGO = '/flux.ia.png';

interface FluxiaButtonProps {
  onClick: () => void;
  /** Esconde o botão quando o drawer já está aberto */
  hidden?: boolean;
}

export function FluxiaButton({ onClick, hidden }: FluxiaButtonProps) {
  if (hidden) return null;

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            className="fixed bottom-6 right-6 z-[60] focus:outline-none focus:ring-0 transition-transform hover:scale-110 active:scale-95"
            aria-label="Abrir Flux.ia"
          >
            {/* Mobile: FAB compacto */}
            <span className="md:hidden flex items-center gap-2 bg-card border border-border shadow-lg rounded-2xl px-4 py-2.5">
              <img
                src={`${FLUXIA_LOGO}?v=1`}
                alt="Flux.ia"
                className="w-7 h-7 object-contain"
              />
              <span className="text-sm font-semibold">Flux.ia</span>
            </span>

            {/* Desktop: logo grande */}
            <img
              src={`${FLUXIA_LOGO}?v=1`}
              alt="Flux.ia"
              className="hidden md:block w-[140px] h-[140px] object-contain"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          sideOffset={12}
          className={cn(
            'hidden md:flex border-0 shadow-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
            'px-4 py-3 rounded-xl',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-right-2 duration-300',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-right-2 data-[state=closed]:duration-200'
          )}
        >
          <div className="flex items-center gap-2">
            <img
              src={`${FLUXIA_LOGO}?v=1`}
              alt=""
              className="w-6 h-6 object-contain"
              aria-hidden
            />
            <div className="flex flex-col">
              <span className="font-bold text-sm">Flux.ia</span>
              <span className="text-xs opacity-90 font-medium">Seu assistente no Fluxo</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
