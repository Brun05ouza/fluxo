import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import { cn } from '@/app/components/ui';

const FLUXIA_LOGO = '/flux.ia.png?v=2';

interface FluxiaButtonProps {
  onClick: () => void;
  /** Esconde o botão quando o drawer já está aberto */
  hidden?: boolean;
}

export function FluxiaButton({ onClick, hidden }: FluxiaButtonProps) {
  if (hidden) return null;

  return (
    <TooltipProvider delayDuration={350}>
      <TooltipPrimitive.Root>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            aria-label="Abrir Flux.ia, seu assistente no Fluxo"
            className={cn(
              'fixed bottom-5 right-5 z-[60] md:bottom-6 md:right-6',
              'transition-transform duration-200 ease-out hover:scale-105 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg',
            )}
          >
            <img
              src={FLUXIA_LOGO}
              alt="Flux.ia"
              className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-md"
            />
          </button>
        </TooltipTrigger>

        <TooltipContent
          side="left"
          align="center"
          sideOffset={10}
          className={cn(
            'hidden md:block',
            'border border-border/80 bg-card text-card-foreground shadow-xl',
            'rounded-xl px-3.5 py-2.5',
            '[&_svg]:hidden',
          )}
        >
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-sm font-semibold tracking-tight">Flux.ia</span>
            <span className="text-xs text-muted-foreground">Seu assistente no Fluxo</span>
          </div>
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
}
