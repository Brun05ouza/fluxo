import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from './ui';
import { FluxoBrand } from './FluxoBrand';
import { toast } from 'sonner';
import { mapAuthError } from '@/lib/authErrors';
import {
  completeOnboarding,
  parseMoneyBR,
  type OnboardingAnswers,
} from '@/lib/onboardingSubmit';

const loginColors = {
  backgroundDark: '#0A0A0C',
  surfaceDark: '#161618',
  borderDark: '#333333',
  muted: '#888888',
  primary: '#00FF94',
};

const COPY = {
  welcomeTitle: 'Bem-vindo ao Fluxo',
  welcomeSubtitle: 'Vamos configurar seu painel em poucos passos.',
  mainIncome: 'Qual é a sua renda mensal principal (salário ou principal fonte)?',
  extraYn: 'Além disso, você tem outra renda fixa?',
  extraDetail: 'De onde vem essa renda e qual o valor mensal?',
  extraLabelPh: 'Ex.: trabalho autônomo, pensão',
  rentYn: 'Você tem aluguel ou financiamento de moradia?',
  rentAmount: 'Qual o valor mensal do aluguel ou prestação?',
  electricityYn: 'Você paga conta de luz (energia elétrica) todo mês?',
  electricityAmount: 'Quanto costuma pagar de energia por mês?',
  food: 'Quanto você quer dedicar por mês a mercado e refeições?',
  emergencyYn: 'Deseja separar um valor mensal para reserva de emergência?',
  emergencyAmount: 'Qual valor mensal para emergências?',
  leisure: 'Quanto pretende reservar por mês para lazer e entretenimento?',
  yes: 'Sim',
  no: 'Não',
  continue: 'Continuar',
  back: 'Voltar',
  finish: 'Concluir e configurar',
  processingMessages: [
    'Organizando suas contas fixas…',
    'Registrando sua renda e metas…',
    'Criando seus orçamentos mensais…',
    'Quase lá…',
  ],
} as const;

type Phase =
  | 'main_income'
  | 'extra_income_yn'
  | 'extra_income_detail'
  | 'rent_yn'
  | 'rent_amount'
  | 'electricity_yn'
  | 'electricity_amount'
  | 'food_budget'
  | 'emergency_yn'
  | 'emergency_amount'
  | 'leisure_budget'
  | 'processing';

const PHASE_ORDER: Phase[] = [
  'main_income',
  'extra_income_yn',
  'extra_income_detail',
  'rent_yn',
  'rent_amount',
  'electricity_yn',
  'electricity_amount',
  'food_budget',
  'emergency_yn',
  'emergency_amount',
  'leisure_budget',
];

const TOTAL_VISIBLE_STEPS = 8; // steps sem os condicionais opcionais

export const FirstAccessOnboarding = ({
  userId,
  onComplete,
}: {
  userId: string;
  /** Estável para não re-disparar o efeito de processamento */
  onComplete: () => void;
}) => {
  const [phase, setPhase] = useState<Phase>('main_income');
  const [mainIncomeRaw, setMainIncomeRaw] = useState('');
  const [hasExtraIncome, setHasExtraIncome] = useState<boolean | null>(null);
  const [extraLabel, setExtraLabel] = useState('');
  const [extraAmountRaw, setExtraAmountRaw] = useState('');
  const [hasRent, setHasRent] = useState<boolean | null>(null);
  const [rentAmountRaw, setRentAmountRaw] = useState('');
  const [hasElectricity, setHasElectricity] = useState<boolean | null>(null);
  const [electricityAmountRaw, setElectricityAmountRaw] = useState('');
  const [foodBudgetRaw, setFoodBudgetRaw] = useState('');
  const [hasEmergency, setHasEmergency] = useState<boolean | null>(null);
  const [emergencyAmountRaw, setEmergencyAmountRaw] = useState('');
  const [leisureBudgetRaw, setLeisureBudgetRaw] = useState('');
  const [processingLine, setProcessingLine] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const answers = useMemo((): OnboardingAnswers => {
    return {
      mainIncome: parseMoneyBR(mainIncomeRaw),
      hasExtraIncome: hasExtraIncome === true,
      extraLabel,
      extraAmount: parseMoneyBR(extraAmountRaw),
      hasRent: hasRent === true,
      rentAmount: parseMoneyBR(rentAmountRaw),
      hasElectricity: hasElectricity === true,
      electricityAmount: parseMoneyBR(electricityAmountRaw),
      foodBudget: parseMoneyBR(foodBudgetRaw),
      hasEmergency: hasEmergency === true,
      emergencyAmount: parseMoneyBR(emergencyAmountRaw),
      leisureBudget: parseMoneyBR(leisureBudgetRaw),
    };
  }, [
    mainIncomeRaw,
    hasExtraIncome,
    extraLabel,
    extraAmountRaw,
    hasRent,
    rentAmountRaw,
    hasElectricity,
    electricityAmountRaw,
    foodBudgetRaw,
    hasEmergency,
    emergencyAmountRaw,
    leisureBudgetRaw,
  ]);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (phase !== 'processing') return;

    let cancelled = false;
    let line = 0;
    const msgInterval = window.setInterval(() => {
      line = (line + 1) % COPY.processingMessages.length;
      setProcessingLine(line);
    }, 750);

    const done = window.setTimeout(async () => {
      window.clearInterval(msgInterval);
      if (cancelled) return;
      const { error: err } = await completeOnboarding(userId, answersRef.current);
      if (cancelled) return;
      if (err) {
        toast.error(mapAuthError(err));
        setError(mapAuthError(err));
        setPhase('leisure_budget');
        return;
      }
      await Promise.resolve(onCompleteRef.current?.());
    }, 2800);

    return () => {
      cancelled = true;
      window.clearInterval(msgInterval);
      window.clearTimeout(done);
    };
  }, [phase, userId]);

  const validateAndNext = () => {
    setError(null);
    switch (phase) {
      case 'main_income': {
        const v = parseMoneyBR(mainIncomeRaw);
        if (v <= 0) {
          setError('Informe um valor maior que zero para sua renda principal.');
          return;
        }
        setPhase('extra_income_yn');
        break;
      }
      case 'extra_income_yn':
        if (hasExtraIncome === null) {
          setError('Selecione Sim ou Não.');
          return;
        }
        setPhase(hasExtraIncome ? 'extra_income_detail' : 'rent_yn');
        break;
      case 'extra_income_detail': {
        if (!extraLabel.trim()) {
          setError('Descreva brevemente a origem da renda.');
          return;
        }
        const ex = parseMoneyBR(extraAmountRaw);
        if (ex <= 0) {
          setError('Informe o valor mensal da outra renda.');
          return;
        }
        setPhase('rent_yn');
        break;
      }
      case 'rent_yn':
        if (hasRent === null) {
          setError('Selecione Sim ou Não.');
          return;
        }
        setPhase(hasRent ? 'rent_amount' : 'electricity_yn');
        break;
      case 'rent_amount': {
        const v = parseMoneyBR(rentAmountRaw);
        if (v <= 0) {
          setError('Informe o valor do aluguel ou prestação.');
          return;
        }
        setPhase('electricity_yn');
        break;
      }
      case 'electricity_yn':
        if (hasElectricity === null) {
          setError('Selecione Sim ou Não.');
          return;
        }
        setPhase(hasElectricity ? 'electricity_amount' : 'food_budget');
        break;
      case 'electricity_amount': {
        const v = parseMoneyBR(electricityAmountRaw);
        if (v <= 0) {
          setError('Informe o valor médio da conta de energia.');
          return;
        }
        setPhase('food_budget');
        break;
      }
      case 'food_budget': {
        const v = parseMoneyBR(foodBudgetRaw);
        if (v <= 0) {
          setError('Informe quanto pretende gastar com alimentação por mês.');
          return;
        }
        setPhase('emergency_yn');
        break;
      }
      case 'emergency_yn':
        if (hasEmergency === null) {
          setError('Selecione Sim ou Não.');
          return;
        }
        setPhase(hasEmergency ? 'emergency_amount' : 'leisure_budget');
        break;
      case 'emergency_amount': {
        const v = parseMoneyBR(emergencyAmountRaw);
        if (v <= 0) {
          setError('Informe o valor da reserva de emergência.');
          return;
        }
        setPhase('leisure_budget');
        break;
      }
      case 'leisure_budget': {
        const v = parseMoneyBR(leisureBudgetRaw);
        if (v < 0) {
          setError('Informe um valor válido (ou 0 se não quiser orçar lazer agora).');
          return;
        }
        setPhase('processing');
        break;
      }
      default:
        break;
    }
  };

  const goBack = () => {
    setError(null);
    switch (phase) {
      case 'extra_income_yn':
        setPhase('main_income');
        break;
      case 'extra_income_detail':
        setPhase('extra_income_yn');
        break;
      case 'rent_yn':
        setPhase(hasExtraIncome ? 'extra_income_detail' : 'extra_income_yn');
        break;
      case 'rent_amount':
        setPhase('rent_yn');
        break;
      case 'electricity_yn':
        setPhase(hasRent ? 'rent_amount' : 'rent_yn');
        break;
      case 'electricity_amount':
        setPhase('electricity_yn');
        break;
      case 'food_budget':
        setPhase(hasElectricity ? 'electricity_amount' : 'electricity_yn');
        break;
      case 'emergency_yn':
        setPhase('food_budget');
        break;
      case 'emergency_amount':
        setPhase('emergency_yn');
        break;
      case 'leisure_budget':
        setPhase(hasEmergency ? 'emergency_amount' : 'emergency_yn');
        break;
      default:
        break;
    }
  };

  const showBack = phase !== 'main_income' && phase !== 'processing';

  const currentStep = phase === 'processing' ? TOTAL_VISIBLE_STEPS : Math.max(1, PHASE_ORDER.indexOf(phase) + 1);
  const progressPercent = Math.round((currentStep / TOTAL_VISIBLE_STEPS) * 100);

  const inputClass =
    'w-full h-14 rounded-lg px-4 text-white placeholder-gray-600 focus:outline-none transition-all duration-200 font-mono text-sm border focus:ring-1 focus:ring-[#00FF94] focus:border-[#00FF94]';

  const renderBody = () => {
    if (phase === 'processing') {
      return (
        <div className="flex flex-col items-center gap-6 py-8">
          <Loader2 className="h-12 w-12 animate-spin text-[#00FF94]" aria-hidden />
          <p className="text-center text-base text-white min-h-[3rem]">
            {COPY.processingMessages[processingLine]}
          </p>
          <p className="text-sm" style={{ color: loginColors.muted }}>
            Ajustando contas, renda e orçamentos no seu painel…
          </p>
        </div>
      );
    }

    if (phase === 'main_income') {
      return (
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed" style={{ color: loginColors.muted }}>
            {COPY.welcomeSubtitle}
          </p>
          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: loginColors.muted }}>
            Valor mensal (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={mainIncomeRaw}
            onChange={(e) => setMainIncomeRaw(e.target.value)}
            className={inputClass}
            style={{ background: loginColors.backgroundDark, borderColor: loginColors.borderDark }}
            autoFocus
          />
        </div>
      );
    }

    if (phase === 'extra_income_yn') {
      return <YesNo value={hasExtraIncome} onChange={setHasExtraIncome} />;
    }

    if (phase === 'extra_income_detail') {
      return (
        <div className="flex flex-col gap-4">
          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: loginColors.muted }}>
            Origem
          </label>
          <input
            type="text"
            placeholder={COPY.extraLabelPh}
            value={extraLabel}
            onChange={(e) => setExtraLabel(e.target.value)}
            className={inputClass}
            style={{ background: loginColors.backgroundDark, borderColor: loginColors.borderDark }}
            autoFocus
          />
          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: loginColors.muted }}>
            Valor mensal (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={extraAmountRaw}
            onChange={(e) => setExtraAmountRaw(e.target.value)}
            className={inputClass}
            style={{ background: loginColors.backgroundDark, borderColor: loginColors.borderDark }}
          />
        </div>
      );
    }

    if (phase === 'rent_yn') {
      return <YesNo value={hasRent} onChange={setHasRent} />;
    }

    if (phase === 'rent_amount') {
      return (
        <div className="flex flex-col gap-4">
          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: loginColors.muted }}>
            Valor mensal (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={rentAmountRaw}
            onChange={(e) => setRentAmountRaw(e.target.value)}
            className={inputClass}
            style={{ background: loginColors.backgroundDark, borderColor: loginColors.borderDark }}
            autoFocus
          />
        </div>
      );
    }

    if (phase === 'electricity_yn') {
      return <YesNo value={hasElectricity} onChange={setHasElectricity} />;
    }

    if (phase === 'electricity_amount') {
      return (
        <div className="flex flex-col gap-4">
          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: loginColors.muted }}>
            Valor médio mensal (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={electricityAmountRaw}
            onChange={(e) => setElectricityAmountRaw(e.target.value)}
            className={inputClass}
            style={{ background: loginColors.backgroundDark, borderColor: loginColors.borderDark }}
            autoFocus
          />
        </div>
      );
    }

    if (phase === 'food_budget') {
      return (
        <div className="flex flex-col gap-4">
          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: loginColors.muted }}>
            Orçamento mensal (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={foodBudgetRaw}
            onChange={(e) => setFoodBudgetRaw(e.target.value)}
            className={inputClass}
            style={{ background: loginColors.backgroundDark, borderColor: loginColors.borderDark }}
            autoFocus
          />
        </div>
      );
    }

    if (phase === 'emergency_yn') {
      return <YesNo value={hasEmergency} onChange={setHasEmergency} />;
    }

    if (phase === 'emergency_amount') {
      return (
        <div className="flex flex-col gap-4">
          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: loginColors.muted }}>
            Valor mensal (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={emergencyAmountRaw}
            onChange={(e) => setEmergencyAmountRaw(e.target.value)}
            className={inputClass}
            style={{ background: loginColors.backgroundDark, borderColor: loginColors.borderDark }}
            autoFocus
          />
        </div>
      );
    }

    if (phase === 'leisure_budget') {
      return (
        <div className="flex flex-col gap-4">
          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: loginColors.muted }}>
            Orçamento mensal (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={leisureBudgetRaw}
            onChange={(e) => setLeisureBudgetRaw(e.target.value)}
            className={inputClass}
            style={{ background: loginColors.backgroundDark, borderColor: loginColors.borderDark }}
            autoFocus
          />
        </div>
      );
    }

    return null;
  };

  const titleForPhase = (): string => {
    switch (phase) {
      case 'main_income':
        return COPY.welcomeTitle;
      case 'extra_income_yn':
        return COPY.extraYn;
      case 'extra_income_detail':
        return COPY.extraDetail;
      case 'rent_yn':
        return COPY.rentYn;
      case 'rent_amount':
        return COPY.rentAmount;
      case 'electricity_yn':
        return COPY.electricityYn;
      case 'electricity_amount':
        return COPY.electricityAmount;
      case 'food_budget':
        return COPY.food;
      case 'emergency_yn':
        return COPY.emergencyYn;
      case 'emergency_amount':
        return COPY.emergencyAmount;
      case 'leisure_budget':
        return COPY.leisure;
      default:
        return '';
    }
  };

  const isYesNo =
    phase === 'extra_income_yn' ||
    phase === 'rent_yn' ||
    phase === 'electricity_yn' ||
    phase === 'emergency_yn';

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4"
      style={{
        background: 'rgba(10, 10, 12, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        className="w-full max-w-[480px] rounded-xl shadow-2xl flex flex-col gap-6 relative overflow-hidden p-8 md:p-10"
        style={{
          background: 'rgba(22, 22, 24, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00FF9480] to-transparent" />

        <div className="flex justify-center pb-2">
          <FluxoBrand logoSize="md" textSize="2xl" className="[&_.fluxo-brand-text]:text-white" />
        </div>

        {phase !== 'processing' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs" style={{ color: loginColors.muted }}>
              <span>Passo {currentStep} de {TOTAL_VISIBLE_STEPS}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: loginColors.borderDark }}>
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%`, background: loginColors.primary }}
              />
            </div>
          </div>
        )}

        {phase !== 'processing' && (
          <div className="flex flex-col gap-2">
            {phase === 'main_income' ? (
              <>
                <h2 id="onboarding-title" className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  {COPY.welcomeTitle}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: loginColors.muted }}>
                  {COPY.welcomeSubtitle}
                </p>
                <h3 className="text-lg font-semibold text-white pt-2">{COPY.mainIncome}</h3>
              </>
            ) : (
              <h2 id="onboarding-title" className="text-xl md:text-2xl font-bold tracking-tight text-white">
                {titleForPhase()}
              </h2>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {renderBody()}

        {phase !== 'processing' && (
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex gap-3">
              {showBack && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 gap-2 border-gray-600 text-white hover:bg-white/5"
                  onClick={goBack}
                >
                  <ArrowLeft size={18} />
                  {COPY.back}
                </Button>
              )}
              <Button
                type="button"
                className={`flex-1 h-12 gap-2 font-semibold ${showBack ? '' : 'w-full'}`}
                style={{ background: loginColors.primary, color: '#0A0A0C' }}
                onClick={validateAndNext}
              >
                {phase === 'leisure_budget' ? COPY.finish : COPY.continue}
                {phase !== 'leisure_budget' && <ArrowRight size={18} />}
              </Button>
            </div>
            {isYesNo && (
              <p className="text-xs text-center" style={{ color: loginColors.muted }}>
                Toque em Continuar após escolher Sim ou Não
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function YesNo({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4 pt-1">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`h-14 rounded-lg border text-sm font-semibold transition-all ${
            value === true
              ? 'border-[#00FF94] bg-[#00FF94]/15 text-[#00FF94]'
              : 'border-gray-600 text-white hover:border-gray-500'
          }`}
          style={{ borderColor: value === true ? '#00FF94' : undefined }}
        >
          {COPY.yes}
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`h-14 rounded-lg border text-sm font-semibold transition-all ${
            value === false
              ? 'border-[#00FF94] bg-[#00FF94]/15 text-[#00FF94]'
              : 'border-gray-600 text-white hover:border-gray-500'
          }`}
        >
          {COPY.no}
        </button>
      </div>
    </div>
  );
}
