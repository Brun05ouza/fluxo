export type TourStepPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface TourStep {
  id: string;
  route?: string;
  selector: string;
  title: string;
  body: string;
  placement?: TourStepPlacement;
}

export interface TourPlaybook {
  id: string;
  title: string;
  triggers: string[];
  steps: TourStep[];
}
