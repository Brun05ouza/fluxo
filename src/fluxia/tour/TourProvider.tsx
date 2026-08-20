import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { TourPlaybook, TourStep } from './tourTypes';
import { getPlaybookByIntent } from './playbooks';

interface TourContextValue {
  isActive: boolean;
  playbook: TourPlaybook | null;
  currentStepIndex: number;
  currentStep: TourStep | null;
  startTour: (playbookId: string) => void;
  next: () => void;
  prev: () => void;
  exit: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

const RETRY_MS = 100;
const RETRY_MAX = 50;

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [playbook, setPlaybook] = useState<TourPlaybook | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const targetRef = useRef<Element | null>(null);

  const currentStep = playbook?.steps[currentStepIndex] ?? null;

  const scrollToElement = useCallback((el: Element) => {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const waitForElement = useCallback(
    (selector: string): Promise<Element | null> =>
      new Promise((resolve) => {
        const attr = selector.startsWith('[') ? selector : `[data-tour="${selector}"]`;
        const find = () => document.querySelector(attr);
        let attempts = 0;
        const tick = () => {
          const el = find();
          if (el) {
            resolve(el);
            return;
          }
          attempts++;
          if (attempts >= RETRY_MAX) {
            resolve(null);
            return;
          }
          setTimeout(tick, RETRY_MS);
        };
        tick();
      }),
    []
  );

  const syncToStep = useCallback(
    async (step: TourStep) => {
      if (step.route && location.pathname !== step.route) {
        navigate(step.route);
      }

      if (
        step.selector === 'fluxia-tx-mindful' ||
        step.selector === 'fluxia-tx-recorrente' ||
        step.selector === 'fluxia-tx-tags' ||
        step.selector === 'fluxia-tx-observacao'
      ) {
        window.dispatchEvent(new CustomEvent('fluxia-tour-expand-tx-details'));
      }
      if (step.selector === 'fluxia-budgets-form') {
        window.dispatchEvent(new CustomEvent('fluxia-tour-open-budget-form'));
      }

      const el = await waitForElement(step.selector);
      if (el) {
        targetRef.current = el;
        scrollToElement(el);
      } else {
        targetRef.current = null;
      }
    },
    [navigate, location.pathname, waitForElement, scrollToElement]
  );

  useEffect(() => {
    if (!currentStep) return;
    syncToStep(currentStep);
  }, [currentStep, syncToStep]);

  const exit = useCallback(() => {
    setPlaybook(null);
    setCurrentStepIndex(0);
    targetRef.current = null;
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && playbook) exit();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [playbook, exit]);

  const startTour = useCallback((playbookId: string) => {
    const pb = getPlaybookByIntent(playbookId);
    if (!pb || pb.steps.length === 0) return;
    setPlaybook(pb);
    setCurrentStepIndex(0);
    window.dispatchEvent(new CustomEvent('fluxia-tour-expand-sidebar'));

    const resolvedId = pb.id;
    if (resolvedId === 'NOVA_TRANSACAO' || playbookId === 'NOVA_TRANSACAO') {
      window.dispatchEvent(new CustomEvent('fluxia-tour-open-drawer', { detail: { drawer: 'transaction' } }));
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('fluxia-tour-expand-tx-details'));
      }, 350);
    }
  }, []);

  const next = useCallback(() => {
    if (!playbook) return;
    if (currentStepIndex >= playbook.steps.length - 1) {
      setPlaybook(null);
      setCurrentStepIndex(0);
      targetRef.current = null;
      return;
    }
    setCurrentStepIndex((i) => i + 1);
  }, [playbook, currentStepIndex]);

  const prev = useCallback(() => {
    if (currentStepIndex <= 0) return;
    setCurrentStepIndex((i) => i - 1);
  }, [currentStepIndex]);

  const value: TourContextValue = {
    isActive: !!playbook && playbook.steps.length > 0,
    playbook,
    currentStepIndex,
    currentStep,
    startTour,
    next,
    prev,
    exit,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
      {value.isActive && currentStep && (
        <TourOverlay
          step={currentStep}
          total={playbook!.steps.length}
          currentIndex={currentStepIndex + 1}
          onNext={next}
          onPrev={prev}
          onExit={exit}
          targetRef={targetRef}
        />
      )}
    </TourContext.Provider>
  );
}

interface TourOverlayProps {
  step: TourStep;
  total: number;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
  targetRef: React.MutableRefObject<Element | null>;
}

const SPOTLIGHT_PADDING = 24;
const VIEWPORT_MARGIN = 16;

type TooltipPos = { left: number; top: number; maxHeight: number; placement: TourStep['placement'] };

function clampTooltipPosition(
  targetBox: DOMRect | null,
  preferred: TourStep['placement'],
  tooltipW: number,
  tooltipH: number,
): TooltipPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = VIEWPORT_MARGIN;
  const maxHeight = Math.max(160, vh - margin * 2);
  const cardH = Math.min(tooltipH, maxHeight);
  const cardW = Math.min(tooltipW, vw - margin * 2);
  const pad = 16;

  if (!targetBox) {
    return {
      left: Math.max(margin, (vw - cardW) / 2),
      top: Math.max(margin, (vh - cardH) / 2),
      maxHeight,
      placement: preferred ?? 'bottom',
    };
  }

  const centerX = targetBox.left + targetBox.width / 2;
  const centerY = targetBox.top + targetBox.height / 2;

  const space = {
    top: targetBox.top - margin,
    bottom: vh - targetBox.bottom - margin,
    left: targetBox.left - margin,
    right: vw - targetBox.right - margin,
  };

  const order: NonNullable<TourStep['placement']>[] = [];
  const preferredSide = preferred ?? 'bottom';
  order.push(preferredSide);
  const flips: Record<string, NonNullable<TourStep['placement']>> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  };
  order.push(flips[preferredSide]);
  (['bottom', 'top', 'right', 'left'] as const).forEach((s) => {
    if (!order.includes(s)) order.push(s);
  });

  let placement = preferredSide;
  for (const side of order) {
    const needed = cardH + pad;
    const neededW = cardW + pad;
    if (side === 'top' && space.top >= needed) {
      placement = side;
      break;
    }
    if (side === 'bottom' && space.bottom >= needed) {
      placement = side;
      break;
    }
    if (side === 'left' && space.left >= neededW) {
      placement = side;
      break;
    }
    if (side === 'right' && space.right >= neededW) {
      placement = side;
      break;
    }
  }

  // Se nenhum lado cabe de verdade, escolhe o que tiver mais espaço vertical/horizontal
  if (
    (placement === 'top' && space.top < cardH + pad) ||
    (placement === 'bottom' && space.bottom < cardH + pad) ||
    (placement === 'left' && space.left < cardW + pad) ||
    (placement === 'right' && space.right < cardW + pad)
  ) {
    const ranked = (['bottom', 'top', 'right', 'left'] as const).sort(
      (a, b) => space[b] - space[a],
    );
    placement = ranked[0];
  }

  let left: number;
  let top: number;

  if (placement === 'right') {
    left = targetBox.right + pad;
    top = centerY - cardH / 2;
  } else if (placement === 'left') {
    left = targetBox.left - cardW - pad;
    top = centerY - cardH / 2;
  } else if (placement === 'top') {
    left = centerX - cardW / 2;
    top = targetBox.top - cardH - pad;
  } else {
    left = centerX - cardW / 2;
    top = targetBox.bottom + pad;
  }

  left = Math.max(margin, Math.min(left, vw - cardW - margin));
  top = Math.max(margin, Math.min(top, vh - cardH - margin));

  return { left, top, maxHeight, placement };
}

function TourOverlay({
  step,
  total,
  currentIndex,
  onNext,
  onPrev,
  onExit,
  targetRef,
}: TourOverlayProps) {
  const [targetBox, setTargetBox] = React.useState<DOMRect | null>(null);
  const [tooltipSize, setTooltipSize] = React.useState({ w: 380, h: 220 });
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updateBox = () => {
      const el = targetRef.current;
      if (el) {
        setTargetBox(el.getBoundingClientRect());
      } else {
        setTargetBox(null);
      }
    };

    updateBox();
    const ro = new ResizeObserver(updateBox);
    const el = targetRef.current;
    if (el) ro.observe(el);

    const interval = setInterval(updateBox, 100);
    const onWin = () => updateBox();
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, true);
    return () => {
      ro.disconnect();
      clearInterval(interval);
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin, true);
    };
  }, [step.selector, targetRef]);

  React.useLayoutEffect(() => {
    const node = tooltipRef.current;
    if (!node) return;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      setTooltipSize((prev) => {
        if (Math.abs(prev.w - rect.width) < 1 && Math.abs(prev.h - rect.height) < 1) {
          return prev;
        }
        return { w: rect.width, h: rect.height };
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [step.id, step.body, step.title, currentIndex]);

  const preferredPlacement = step.placement ?? 'bottom';
  const tooltipPos = React.useMemo(
    () =>
      clampTooltipPosition(targetBox, preferredPlacement, tooltipSize.w, tooltipSize.h),
    [targetBox, preferredPlacement, tooltipSize.w, tooltipSize.h],
  );

  const arrowSide = tooltipPos.placement;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] pointer-events-none"
      aria-modal
      aria-label={`Guia: ${step.title}`}
    >
      {/* Quadro em 4 painéis — deixa buraco real no centro, campo sempre visível */}
      {targetBox ? (
        <>
          {(() => {
            const spotlightRect = {
              x: targetBox.x - SPOTLIGHT_PADDING,
              y: targetBox.y - SPOTLIGHT_PADDING,
              w: targetBox.width + SPOTLIGHT_PADDING * 2,
              h: targetBox.height + SPOTLIGHT_PADDING * 2,
            };
            return (
              <>
                <div
                  className="absolute top-0 left-0 right-0 backdrop-blur-md bg-black/60 pointer-events-none"
                  style={{ height: Math.max(0, spotlightRect.y) }}
                />
                <div
                  className="absolute left-0 backdrop-blur-md bg-black/60 pointer-events-none"
                  style={{ top: spotlightRect.y, width: Math.max(0, spotlightRect.x), height: spotlightRect.h }}
                />
                <div
                  className="absolute backdrop-blur-md bg-black/60 pointer-events-none"
                  style={{ top: spotlightRect.y, left: spotlightRect.x + spotlightRect.w, right: 0, height: spotlightRect.h }}
                />
                <div
                  className="absolute left-0 right-0 bottom-0 backdrop-blur-md bg-black/60 pointer-events-none"
                  style={{ top: spotlightRect.y + spotlightRect.h }}
                />
                <div
                  className="absolute top-0 left-0 right-0 bg-black/70 pointer-events-auto"
                  style={{ height: Math.max(0, spotlightRect.y) }}
                  onClick={onExit}
                />
                <div
                  className="absolute left-0 bg-black/70 pointer-events-auto"
                  style={{ top: spotlightRect.y, width: Math.max(0, spotlightRect.x), height: spotlightRect.h }}
                  onClick={onExit}
                />
                <div
                  className="absolute bg-black/70 pointer-events-auto"
                  style={{ top: spotlightRect.y, left: spotlightRect.x + spotlightRect.w, right: 0, height: spotlightRect.h }}
                  onClick={onExit}
                />
                <div
                  className="absolute left-0 right-0 bottom-0 bg-black/70 pointer-events-auto"
                  style={{ top: spotlightRect.y + spotlightRect.h }}
                  onClick={onExit}
                />
                <div
                  className="absolute pointer-events-none ring-2 ring-primary ring-offset-2 ring-offset-transparent rounded-xl"
                  style={{
                    left: spotlightRect.x,
                    top: spotlightRect.y,
                    width: spotlightRect.w,
                    height: spotlightRect.h,
                  }}
                />
              </>
            );
          })()}
        </>
      ) : (
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-md pointer-events-auto"
          onClick={onExit}
        />
      )}

      <div
        className="absolute pointer-events-auto z-10"
        style={{
          left: tooltipPos.left,
          top: tooltipPos.top,
          maxWidth: `min(90vw, 380px)`,
          maxHeight: tooltipPos.maxHeight,
        }}
      >
        <div
          ref={tooltipRef}
          className="w-[min(90vw,380px)] max-h-[inherit] overflow-y-auto rounded-xl border-2 border-primary/30 bg-card shadow-2xl p-5 relative isolate backdrop-blur-none"
        >
          {arrowSide === 'right' && targetBox && (
            <div
              className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-card"
              style={{ marginRight: -1 }}
              aria-hidden
            />
          )}
          {arrowSide === 'left' && targetBox && (
            <div
              className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[12px] border-l-card"
              style={{ marginLeft: -1 }}
              aria-hidden
            />
          )}
          {arrowSide === 'top' && targetBox && (
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-card"
              style={{ marginTop: -1 }}
              aria-hidden
            />
          )}
          {arrowSide === 'bottom' && targetBox && (
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[12px] border-b-card"
              style={{ marginBottom: -1 }}
              aria-hidden
            />
          )}

          <div className="flex items-start gap-3 mb-3">
            <img
              src="/flux.ia.png?v=2"
              alt=""
              className="w-12 h-12 object-contain shrink-0 -mt-0.5"
              aria-hidden
            />
            <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
              <h3 className="font-bold text-lg text-foreground leading-snug">{step.title}</h3>
              <span className="text-sm font-medium text-primary shrink-0 bg-primary/10 px-2 py-0.5 rounded">
                {currentIndex}/{total}
              </span>
            </div>
          </div>
          <p className="text-base text-muted-foreground mb-5 leading-relaxed pl-0 sm:pl-[3.75rem]">{step.body}</p>
          <div className="flex items-center justify-between gap-3 sm:pl-[3.75rem]">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onPrev}
                disabled={currentIndex <= 1}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={onNext}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {currentIndex >= total ? 'Concluir' : 'Próximo'}
              </button>
            </div>
            <button
              type="button"
              onClick={onExit}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
