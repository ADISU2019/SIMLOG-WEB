// app/lib/assessmentEngine.ts
// DECLARATION ASSESSMENT ENGINE
// PURPOSE:
// This file contains the reusable financial assessment logic
// for declaration item totals inside SIMLOG-WEB.
//
// WHAT THIS FILE DOES:
// - calculates CIF totals across declaration items
// - calculates customs duty
// - calculates VAT
// - calculates excise
// - calculates final grand total
// - applies default rates when item-specific rates are missing
//
// USED BY:
// 1. DeclarationWizard.tsx
// 2. AssessmentNotice.tsx
// 3. Future declaration and tax review workflows
//
// IMPORTANT:
// This is a simplified working assessment engine.
// Later it can be extended with:
// - HS-code-based rate lookup
// - exemptions
// - surtax
// - withholding tax
// - country preference rules
// - tariff table integration

import { DeclarationItem } from "@/types/declaration";

export interface AssessmentTotals {
  cif: number;
  duty: number;
  vat: number;
  excise: number;
  grandTotal: number;
}

const defaultDutyRate = 0.1; // 10%
const defaultVATRate = 0.15; // 15%
const defaultExciseRate = 0.05; // 5%

/**
 * MAIN ASSESSMENT FUNCTION
 *
 * Calculates declaration totals from all item lines.
 */
export function calculateTotals(
  items: DeclarationItem[],
  currencyRate: number = 1
): AssessmentTotals {
  let cif = 0;
  let duty = 0;
  let vat = 0;
  let excise = 0;

  const safeItems = Array.isArray(items) ? items : [];

  safeItems.forEach((item) => {
    const itemCIFValue = Number((item as any)?.cifValue ?? 0);
    const itemDutyRate = Number((item as any)?.dutyRate ?? defaultDutyRate);
    const itemVATRate = Number((item as any)?.vatRate ?? defaultVATRate);
    const itemExciseRate = Number(
      (item as any)?.exciseRate ?? defaultExciseRate
    );

    const itemCIFLocal = normalizeMoney(itemCIFValue * currencyRate);
    cif += itemCIFLocal;

    const itemDuty = normalizeMoney(itemCIFLocal * itemDutyRate);
    const itemVAT = normalizeMoney(itemCIFLocal * itemVATRate);
    const itemExcise = normalizeMoney(itemCIFLocal * itemExciseRate);

    duty += itemDuty;
    vat += itemVAT;
    excise += itemExcise;
  });

  cif = normalizeMoney(cif);
  duty = normalizeMoney(duty);
  vat = normalizeMoney(vat);
  excise = normalizeMoney(excise);

  const grandTotal = normalizeMoney(cif + duty + vat + excise);

  return {
    cif,
    duty,
    vat,
    excise,
    grandTotal,
  };
}

/**
 * MONEY NORMALIZER
 *
 * Keeps totals cleaner and safer for UI display.
 */
function normalizeMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}