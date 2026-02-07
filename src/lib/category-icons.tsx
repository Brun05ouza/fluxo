import {
  Utensils,
  Car,
  Home,
  Play,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Zap,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Alimentação: Utensils,
  Transporte: Car,
  Casa: Home,
  Lazer: Play,
  Saúde: HeartPulse,
  Educação: GraduationCap,
  Assinaturas: Play,
  Trabalho: Briefcase,
  Extra: ShoppingBag,
  Outros: Zap,
};

export function getCategoryIcon(category: string): LucideIcon {
  return iconMap[category] || Zap;
}
