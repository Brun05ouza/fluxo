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
const RETRY_MAX = 30;

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
  const overlayRef = React.useRef<HTMLDivElement>(null);

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
    return () => {
      ro.disconnect();
      clearInterval(interval);
    };
  }, [step.selector, targetRef]);

  const placement = step.placement ?? 'bottom';
  const spotlightRect = targetBox
    ? {
        x: targetBox.x - SPOTLIGHT_PADDING,
        y: targetBox.y - SPOTLIGHT_PADDING,
        w: targetBox.width + SPOTLIGHT_PADDING * 2,
        h: targetBox.height + SPOTLIGHT_PADDING * 2,
      }
    : null;

  const tooltipPos = React.useMemo(() => {
    if (!targetBox) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    const pad = 16;
    const tooltipW = 360;
    const tooltipH = 180;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left: number;
    let top: number;
    const centerX = targetBox.left + targetBox.width / 2;

    if (placement === 'right') {
      left = Math.min(targetBox.right + pad, vw - tooltipW - 16);
      top = targetBox.top + targetBox.height / 2 - tooltipH / 2;
    } else if (placement === 'left') {
      left = Math.max(targetBox.left - tooltipW - pad, 16);
      top = targetBox.top + targetBox.height / 2 - tooltipH / 2;
    } else if (placement === 'top') {
      left = centerX - tooltipW / 2;
      top = Math.max(targetBox.top - tooltipH - pad, 16);
    } else {
      left = centerX - tooltipW / 2;
      top = targetBox.bottom + pad;
    }

    left = Math.max(16, Math.min(left, vw - tooltipW - 16));
    top = Math.max(16, Math.min(top, vh - tooltipH - 16));

    return { left: `${left}px`, top: `${top}px`, transform: 'none' };
  }, [targetBox, placement]);

  const arrowSide = placement;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] pointer-events-none"
      aria-modal
      aria-label={`Guia: ${step.title}`}
    >
      {/* Camada 1: blur apenas no fundo (máscara igual à camada 2 - hole no spotlight) */}
      <div
        className="absolute inset-0 backdrop-blur-md pointer-events-none"
        aria-hidden
        style={
          spotlightRect
            ? {
                WebkitMaskImage: `radial-gradient(ellipse ${spotlightRect.w / 2}px ${spotlightRect.h / 2}px at ${spotlightRect.x + spotlightRect.w / 2}px ${spotlightRect.y + spotlightRect.h / 2}px, black 0%, black 99%, white 100%)`,
                maskImage: `radial-gradient(ellipse ${spotlightRect.w / 2}px ${spotlightRect.h / 2}px at ${spotlightRect.x + spotlightRect.w / 2}px ${spotlightRect.y + spotlightRect.h / 2}px, black 0%, black 99%, white 100%)`,
              }
            : undefined
        }
      />
      {/* Camada 2: escurecimento com máscara; sem blur para modal e spotlight nítidos */}
      <div
        className="absolute inset-0 bg-black/70 pointer-events-auto"
        style={
          spotlightRect
            ? {
                WebkitMaskImage: `radial-gradient(ellipse ${spotlightRect.w / 2}px ${spotlightRect.h / 2}px at ${spotlightRect.x + spotlightRect.w / 2}px ${spotlightRect.y + spotlightRect.h / 2}px, black 0%, black 99%, white 100%)`,
                maskImage: `radial-gradient(ellipse ${spotlightRect.w / 2}px ${spotlightRect.h / 2}px at ${spotlightRect.x + spotlightRect.w / 2}px ${spotlightRect.y + spotlightRect.h / 2}px, black 0%, black 99%, white 100%)`,
              }
            : undefined
        }
        onClick={onExit}
      />
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
        <defs>
          <mask id="fluxia-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.x}
                y={spotlightRect.y}
                width={spotlightRect.w}
                height={spotlightRect.h}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="black"
          fillOpacity="0.5"
          mask="url(#fluxia-spotlight-mask)"
        />
      </svg>

      {spotlightRect && (
        <div
          className="absolute pointer-events-none ring-2 ring-primary ring-offset-2 rounded-xl transition-all duration-200 shadow-[0_0_0_9999px_rgba(0,0,0,0.01)]"
          style={{
            left: spotlightRect.x,
            top: spotlightRect.y,
            width: spotlightRect.w,
            height: spotlightRect.h,
          }}
        />
      )}

      <div
        className="absolute pointer-events-auto z-10"
        style={tooltipPos}
      >
        <div className="w-[min(90vw,380px)] rounded-xl border-2 border-primary/30 bg-card shadow-2xl p-5 relative isolate backdrop-blur-none">
          {/* Seta direcional apontando para o elemento alvo */}
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

          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-bold text-lg text-foreground">{step.title}</h3>
            <span className="text-sm font-medium text-primary shrink-0 bg-primary/10 px-2 py-0.5 rounded">
              {currentIndex}/{total}
            </span>
          </div>
          <p className="text-base text-muted-foreground mb-5 leading-relaxed">{step.body}</p>
          <div className="flex items-center justify-between gap-3">
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
