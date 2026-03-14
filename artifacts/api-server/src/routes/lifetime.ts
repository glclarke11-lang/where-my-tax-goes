import { Router, type IRouter } from "express";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { CalculateLifetimeTaxBody, CalculateLifetimeTaxResponse } from "@workspace/api-zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
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
  const dataPath = join(__dirname, "../data/budgetData.json");
  const raw = readFileSync(dataPath, "utf-8");
  return JSON.parse(raw) as BudgetConfig;
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
    if (income <= bracket.min) continue;
    const taxable = Math.min(income, bracket.max) - bracket.min;
    tax += taxable * bracket.rate;
  }
  return Math.max(0, tax);
}

router.post("/lifetime-tax", (req, res) => {
  const body = CalculateLifetimeTaxBody.parse(req.body);
  const { currentAge, retirementAge, startingSalary, currentSalary, annualGrowthRate } = body;

  const yearsWorking = retirementAge - currentAge;
  const budgetConfig = loadBudgetData();
  const categories = Object.values(budgetConfig);

  const yearlyData: Array<{
    age: number;
    year: number;
    income: number;
    tax: number;
    cumulativeTax: number;
  }> = [];

  let cumulativeTax = 0;
  let totalTaxRate = 0;
  const currentYear = new Date().getFullYear();

  // Estimate past salary based on startingSalary growing to currentSalary
  const yearsFromStart = currentAge - 22; // assume started working at 22
  const pastGrowthRate = yearsFromStart > 0
    ? Math.pow(currentSalary / Math.max(startingSalary, 1), 1 / Math.max(yearsFromStart, 1)) - 1
    : 0;

  // Generate past data (from starting work age to current age)
  const workStartAge = Math.max(22, currentAge - yearsFromStart);
  for (let age = workStartAge; age < currentAge; age++) {
    const yearsIn = age - workStartAge;
    const income = startingSalary * Math.pow(1 + pastGrowthRate, yearsIn);
    const tax = estimateTax(income);
    cumulativeTax += tax;
    totalTaxRate += tax / Math.max(income, 1);
    yearlyData.push({
      age,
      year: currentYear - (currentAge - age),
      income: Math.round(income),
      tax: Math.round(tax),
      cumulativeTax: Math.round(cumulativeTax),
    });
  }

  // Generate future data (current age to retirement)
  for (let age = currentAge; age < retirementAge; age++) {
    const yearsAhead = age - currentAge;
    const income = currentSalary * Math.pow(1 + annualGrowthRate, yearsAhead);
    const tax = estimateTax(income);
    cumulativeTax += tax;
    totalTaxRate += tax / Math.max(income, 1);
    yearlyData.push({
      age,
      year: currentYear + yearsAhead,
      income: Math.round(income),
      tax: Math.round(tax),
      cumulativeTax: Math.round(cumulativeTax),
    });
  }

  const totalLifetimeTax = cumulativeTax;
  const totalYears = yearlyData.length;
  const averageEffectiveRate = totalYears > 0 ? totalTaxRate / totalYears : 0;

  // Category breakdown of total lifetime tax
  const categoryBreakdown = categories.map((cat) => ({
    key: cat.key,
    label: cat.label,
    percentage: cat.percentage,
    amount: Math.round(totalLifetimeTax * cat.percentage),
    color: cat.color,
    description: cat.description,
  }));

  // Decade breakdown
  const decadeMap = new Map<string, { totalTax: number; incomeSum: number; count: number; ageRange: string }>();

  for (const point of yearlyData) {
    const decadeStart = Math.floor(point.age / 10) * 10;
    const decadeKey = `${decadeStart}s`;
    if (!decadeMap.has(decadeKey)) {
      decadeMap.set(decadeKey, {
        totalTax: 0,
        incomeSum: 0,
        count: 0,
        ageRange: `${decadeStart}–${decadeStart + 9}`,
      });
    }
    const d = decadeMap.get(decadeKey)!;
    d.totalTax += point.tax;
    d.incomeSum += point.income;
    d.count++;
  }

  const decadeBreakdown = Array.from(decadeMap.entries()).map(([decade, data]) => ({
    decade,
    totalTax: Math.round(data.totalTax),
    averageIncome: Math.round(data.incomeSum / Math.max(data.count, 1)),
    ageRange: data.ageRange,
  }));

  const result = CalculateLifetimeTaxResponse.parse({
    totalLifetimeTax: Math.round(totalLifetimeTax),
    yearsWorking,
    averageEffectiveRate: Math.round(averageEffectiveRate * 10000) / 10000,
    categoryBreakdown,
    yearlyData,
    decadeBreakdown,
  });

  res.json(result);
});

export default router;
