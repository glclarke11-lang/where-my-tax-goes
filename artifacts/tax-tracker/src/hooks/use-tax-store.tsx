import React, { createContext, useContext, useState, ReactNode } from "react";
import type { TaxInput, TaxResult } from "@workspace/api-client-react/src/generated/api.schemas";

// We redefine minimal types internally just in case barrel exports have issues
export interface LocalTaxInput {
  income?: number;
  taxPaid?: number;
}

export interface LocalSpendingCategory {
  key: string;
  label: string;
  percentage: number;
  amount: number;
  color: string;
  description: string;
}

export interface LocalTaxResult {
  estimatedTax: number;
  income: number;
  effectiveRate: number;
  breakdown: LocalSpendingCategory[];
}

interface TaxContextType {
  input: LocalTaxInput | null;
  setInput: (input: LocalTaxInput | null) => void;
  result: LocalTaxResult | null;
  setResult: (result: LocalTaxResult | null) => void;
}

const TaxContext = createContext<TaxContextType | undefined>(undefined);

export function TaxProvider({ children }: { children: ReactNode }) {
  const [input, setInput] = useState<LocalTaxInput | null>(null);
  const [result, setResult] = useState<LocalTaxResult | null>(null);

  return (
    <TaxContext.Provider value={{ input, setInput, result, setResult }}>
      {children}
    </TaxContext.Provider>
  );
}

export function useTaxStore() {
  const context = useContext(TaxContext);
  if (context === undefined) {
    throw new Error("useTaxStore must be used within a TaxProvider");
  }
  return context;
}
