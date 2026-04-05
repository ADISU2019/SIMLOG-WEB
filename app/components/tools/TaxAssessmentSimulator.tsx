// tools/TaxAssessmentSimulator.tsx
// ETHIOPIAN CUSTOMS TAX ASSESSMENT SIMULATOR
// PURPOSE:
// This component provides a reusable tax simulation tool for SIMLOG-WEB.
//
// WHAT THIS COMPONENT DOES:
// - accepts CIF, exchange rate, HS code, and country of origin
// - converts foreign-currency CIF into ETB
// - runs the reusable Ethiopian customs tax calculator
// - displays customs duty, VAT, surtax, total tax, and total payable
// - shows the assumptions used in the simulation
//
// MAIN SECTIONS IN THIS COMPONENT:
// 1. Simulator inputs
// 2. Calculate action
// 3. Simulation results
// 4. Assumptions and notes

"use client";

import { useState } from "react";
import { simulateTax } from "@/utils/taxCalculator";

type TaxSimulationResult = {
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
};

export default function TaxAssessmentSimulator() {
  const [cif, setCif] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [hsCode, setHsCode] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState("");

  const [result, setResult] = useState<TaxSimulationResult | null>(null);

  const simulate = () => {
    try {
      setError("");
      setResult(null);

      if (!cif || !exchangeRate || !hsCode) {
        setError("Please fill CIF, Exchange Rate, and HS Code.");
        return;
      }

      const cifNumber = Number(cif);
      const exchangeRateNumber = Number(exchangeRate);

      if (Number.isNaN(cifNumber) || cifNumber <= 0) {
        setError("CIF value must be a valid number greater than zero.");
        return;
      }

      if (Number.isNaN(exchangeRateNumber) || exchangeRateNumber <= 0) {
        setError("Exchange rate must be a valid number greater than zero.");
        return;
      }

      const cifValueInEtb = cifNumber * exchangeRateNumber;

      const taxResult = simulateTax({
        cif: cifValueInEtb,
        commodityCode: hsCode,
        countryOfOrigin: country,
        currency: "ETB",
        exchangeRate: exchangeRateNumber,
      });

      setResult(taxResult);
    } catch (simulationError) {
      console.error("Tax simulation error:", simulationError);
      setError(
        simulationError instanceof Error
          ? simulationError.message
          : "Failed to run tax simulation."
      );
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-xl">
      <div className="mb-6">
        <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-700">
          Tax Simulation Tool
        </p>
        <h2 className="text-2xl font-extrabold text-slate-900">
          Ethiopian Customs Tax Simulator
        </h2>
        <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-600">
          Enter the shipment inputs below to estimate customs duty, VAT,
          surtax, and total payable amount.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
            HS Code
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="HS Code (e.g. 0901.11)"
            value={hsCode}
            onChange={(e) => setHsCode(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
            Country of Origin
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Country of Origin"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
            Exchange Rate (ETB)
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Exchange Rate"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
            CIF Value (Foreign Currency)
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="CIF Value in Foreign Currency"
            value={cif}
            onChange={(e) => setCif(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-base font-semibold text-rose-700">{error}</p>
        </div>
      ) : null}

      <button
        onClick={simulate}
        className="mt-6 w-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-lg font-extrabold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700"
      >
        Calculate Tax
      </button>

      {result && (
        <div className="mt-8 space-y-6">
          <div>
            <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
              Simulation Result
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Estimated Customs Charges
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
                Customs Duty
              </p>
              <p className="mt-2 text-3xl font-extrabold text-blue-900">
                {result.customsDuty.toFixed(2)} ETB
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Rate used: {(result.customsDutyRate * 100).toFixed(0)}%
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                VAT
              </p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-900">
                {result.vat.toFixed(2)} ETB
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Rate used: {(result.vatRate * 100).toFixed(0)}%
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-violet-100 bg-violet-50 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-violet-700">
                Surtax
              </p>
              <p className="mt-2 text-3xl font-extrabold text-violet-900">
                {result.surtax.toFixed(2)} ETB
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Rate used: {(result.surtaxRate * 100).toFixed(0)}%
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">
                Total Tax
              </p>
              <p className="mt-2 text-3xl font-extrabold text-amber-900">
                {result.totalTax.toFixed(2)} ETB
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Total payable: {result.totalPayable.toFixed(2)} ETB
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
              CIF Used in ETB
            </p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {result.cif.toFixed(2)} ETB
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Assumptions Used
            </p>
            <div className="space-y-3">
              {result.assumptions.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-extrabold text-blue-700">
                    {index + 1}
                  </div>
                  <p className="text-sm font-semibold leading-relaxed text-slate-700">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}