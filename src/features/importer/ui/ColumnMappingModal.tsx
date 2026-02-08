/** Stub: mapeamento manual removido — mapeamento automático é usado. */
import React from 'react';

export interface ColumnMappingForm {
  date: string;
  description: string;
  amount: string;
  type?: string;
}

interface ColumnMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headers: string[];
  onConfirm: (form: ColumnMappingForm) => void;
}

export const ColumnMappingModal = (_props: ColumnMappingModalProps) => null;
