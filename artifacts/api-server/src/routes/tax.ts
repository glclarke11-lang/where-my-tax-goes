import { Router, type IRouter } from "express";
import { CalculateTaxBody, CalculateTaxResponse, GetBudgetDataResponse } from "@workspace/api-zod";
import budgetDataRaw from "../data/budgetData.json";

const router: IRouter = Router();

interface CategoryConfig {
  key: string;
  label: string;
  percentage: number;
  color: string;
  description: string;
}

interface BudgetConfig {
  [key: string]: CategoryConfig;
}

function loadBudgetData(): BudgetConfig {
  return budgetDataRaw as unknown as BudgetConfig;
}

function estimateTax(income: number): number {
  const brackets = [
    { min: 0, max: 11000, rate: 0.10 },
    { min: 11001, max: 44725, rate: 0.12 },
    { min: 44726, max: 95375, rate: 0.22 },
    { min: 95376, max: 182050, rate: 0.24 },
    { min: 182051, max: 231250, rate: 0.32 },
    { min: 231251, max: 578125, rate: 0.35 },
    { min: 578126, max: Infinity, rate: 0.37 },
  ];

  let tax = 0;
  for (const bracket of brackets) {
    if (income <= 0) break;
    const taxableInBracket = Math.min(income, bracket.max) - bracket.min + 1;
    if (taxableInBracket <= 0) continue;
    const taxable = Math.min(income - bracket.min + 1, bracket.max - bracket.min + 1);
    if (taxable > 0) {
      tax += taxable * bracket.rate;
    }
  }
  return Math.max(0, tax);
}

router.post("/calculate-tax", (req, res) => {
  const body = CalculateTaxBody.parse(req.body);
  const { income = 0, taxPaid } = body;

  const estimatedTax = taxPaid !== undefined ? taxPaid : estimateTax(income);
  const effectiveRate = income > 0 ? estimatedTax / income : 0;

  const budgetConfig = loadBudgetData();
  const breakdown = Object.values(budgetConfig).map((cat) => ({
    key: cat.key,
    label: cat.label,
    percentage: cat.percentage,
    amount: Math.round(estimatedTax * cat.percentage * 100) / 100,
    color: cat.color,
    description: cat.description,
  }));

  const result = CalculateTaxResponse.parse({
    estimatedTax: Math.round(estimatedTax * 100) / 100,
    income,
    effectiveRate: Math.round(effectiveRate * 10000) / 10000,
    breakdown,
  });

  res.json(result);
});

router.get("/get-budget-data", (_req, res) => {
  const budgetConfig = loadBudgetData();
  const categories = Object.values(budgetConfig).map((cat) => ({
    key: cat.key,
    label: cat.label,
    percentage: cat.percentage,
    amount: 0,
    color: cat.color,
    description: cat.description,
  }));

  const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0);

  const result = GetBudgetDataResponse.parse({
    categories,
    totalPercentage: Math.round(totalPercentage * 100) / 100,
    lastUpdated: new Date().toISOString().split("T")[0],
  });

  res.json(result);
});

export default router;
