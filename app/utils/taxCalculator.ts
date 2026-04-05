// app/utils/taxCalculator.ts
// ETHIOPIAN CUSTOMS TAX CALCULATOR
// PURPOSE:
// This file contains the reusable customs tax calculation logic for SIMLOG-WEB.
//
// WHAT THIS FILE DOES:
// - calculates estimated Ethiopian import taxes from shipment input values
// - applies duty rate by commodity / HS code prefix
// - calculates customs duty
// - calculates VAT
// - calculates surtax
// - returns a structured result that can be used by customer tax pages,
//   declaration preparation pages, and future simulation tools
//
// MAIN FUNCTIONS IN THIS FILE:
// 1. simulateTax()
// 2. getDutyRate()
//
// NOTES:
// - this is still a simplified working simulator
// - duty rates are currently based on HS code prefix examples
// - later you can replace this with a full tariff table and exemption logic
//
// CURRENT FORMULA STYLE:
// customs duty = CIF × duty rate
// VAT = (CIF + customs duty) × VAT rate
// surtax = (CIF + customs duty + VAT) × surtax rate
// total tax = customs duty + VAT + surtax

export interface TaxInput {
  cif: number;
  commodityCode: string;
  countryOfOrigin?: string;
  currency?: string;
  exchangeRate?: number;
}

export interface TaxOutput {
  cif: number;
  customsDutyRate: number;
  vatRate: number;
  surtaxRate: number;
  customsDuty: number;
  vat: number;
  surtax: number;
  totalTax: number;
  totalPayable: number;
  assumptions: string[];
}

/**
 * MAIN TAX SIMULATION FUNCTION
 *
 * This function estimates Ethiopian import-related taxes
 * from a simplified CIF-based input model.
 */
export function simulateTax(input: TaxInput): TaxOutput {
  validateTaxInput(input);

  const cif = normalizeMoney(input.cif);
  const customsDutyRate = getDutyRate(input.commodityCode);
  const vatRate = 0.15;
  const surtaxRate = 0.1;

  const customsDuty = normalizeMoney(cif * customsDutyRate);
  const vatBase = normalizeMoney(cif + customsDuty);
  const vat = normalizeMoney(vatBase * vatRate);

  const surtaxBase = normalizeMoney(cif + customsDuty + vat);
  const surtax = normalizeMoney(surtaxBase * surtaxRate);

  const totalTax = normalizeMoney(customsDuty + vat + surtax);
  const totalPayable = normalizeMoney(cif + totalTax);

  const assumptions = [
    "This is a simplified Ethiopian customs tax simulation.",
    "Duty rate is estimated from the HS code prefix mapping in this file.",
    "VAT is calculated at 15% on CIF plus customs duty.",
    "Surtax is calculated at 10% on CIF plus customs duty plus VAT.",
    "Exemptions, preferential rates, excise tax, withholding tax, and special customs treatments are not yet included.",
  ];

  return {
    cif,
    customsDutyRate,
    vatRate,
    surtaxRate,
    customsDuty,
    vat,
    surtax,
    totalTax,
    totalPayable,
    assumptions,
  };
}

/**
 * DUTY RATE LOOKUP
 *
 * This is a simplified example lookup based on HS code prefixes.
 * Later you can replace this with a full Ethiopian tariff table.
 */
export function getDutyRate(code: string): number {
  const normalizedCode = (code || "").trim();

  if (!normalizedCode) return 0.15;

  // Coffee
  if (normalizedCode.startsWith("0901")) return 0.1;

  // Medical equipment
  if (normalizedCode.startsWith("9018")) return 0.05;

  // Batteries
  if (normalizedCode.startsWith("8507")) return 0.2;

  // Wood / plywood
  if (normalizedCode.startsWith("4412")) return 0.15;

  // Machinery example
  if (normalizedCode.startsWith("8471")) return 0.1;

  // Vehicles example
  if (normalizedCode.startsWith("8703")) return 0.3;

  // Default rate
  return 0.15;
}

/**
 * INPUT VALIDATION
 *
 * Protects the calculator from invalid or missing values.
 */
function validateTaxInput(input: TaxInput): void {
  if (typeof input.cif !== "number" || Number.isNaN(input.cif) || input.cif < 0) {
    throw new Error("CIF must be a valid non-negative number.");
  }

  if (!input.commodityCode || input.commodityCode.trim().length < 4) {
    throw new Error("Commodity code must be provided and should contain at least 4 characters.");
  }
}

/**
 * MONEY NORMALIZER
 *
 * Keeps returned tax values cleaner and more consistent.
 */
function normalizeMoney(value: number): number {
  return Math.round(value * 100) / 100;
}