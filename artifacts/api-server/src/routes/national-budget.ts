import { Router, type IRouter } from "express";
import { GetNationalBudgetResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const NATIONAL_BUDGET_TOTAL_BILLIONS = 6750; // FY2026 approximate US federal budget

const NATIONAL_BUDGET = [
  {
    key: "healthcare",
    label: "Healthcare",
    percentage: 0.36,
    color: "#10B981",
    description: "Healthcare covers Medicare, Medicaid, Children's Health Insurance, and public health agencies.",
    subCategories: [
      { key: "medicare", label: "Medicare", percentage: 0.55, description: "Health coverage for seniors 65+ and certain disabled individuals." },
      { key: "medicaid", label: "Medicaid & CHIP", percentage: 0.30, description: "Health coverage for low-income individuals and families." },
      { key: "public_health", label: "Public Health & Prevention", percentage: 0.08, description: "CDC, NIH, and public health programs." },
      { key: "mental_health", label: "Mental Health", percentage: 0.04, description: "SAMHSA grants and behavioral health services." },
      { key: "pharma", label: "Pharmaceuticals & Research", percentage: 0.03, description: "FDA regulation and biomedical research grants." },
    ],
  },
  {
    key: "welfare",
    label: "Welfare & Social Security",
    percentage: 0.18,
    color: "#8B5CF6",
    description: "Income support, food assistance, housing, and Social Security retirement.",
    subCategories: [
      { key: "social_security", label: "Social Security", percentage: 0.60, description: "Retirement and disability payments for eligible Americans." },
      { key: "food_assistance", label: "Food Assistance (SNAP)", percentage: 0.15, description: "Supplemental Nutrition Assistance Program for low-income families." },
      { key: "housing", label: "Housing & Rental Assistance", percentage: 0.12, description: "HUD programs, Section 8, and public housing." },
      { key: "unemployment", label: "Unemployment Insurance", percentage: 0.08, description: "Federal-state unemployment compensation program." },
      { key: "disability", label: "Disability Benefits", percentage: 0.05, description: "SSI and other disability income support programs." },
    ],
  },
  {
    key: "education",
    label: "Education",
    percentage: 0.15,
    color: "#3B82F6",
    description: "K-12 education, higher education, student aid, and federal research grants.",
    subCategories: [
      { key: "k12", label: "K-12 Schools", percentage: 0.40, description: "Title I grants, special education, and school improvement programs." },
      { key: "higher_ed", label: "Higher Education", percentage: 0.25, description: "Pell Grants, student loans, and university research." },
      { key: "student_aid", label: "Student Financial Aid", percentage: 0.20, description: "Federal direct loans and work-study programs." },
      { key: "vocational", label: "Vocational Training", percentage: 0.10, description: "Job training programs and workforce development." },
      { key: "early_childhood", label: "Early Childhood", percentage: 0.05, description: "Head Start and childcare assistance programs." },
    ],
  },
  {
    key: "defence",
    label: "Defence",
    percentage: 0.10,
    color: "#EF4444",
    description: "Military readiness, national security, intelligence, and veteran services.",
    subCategories: [
      { key: "military_ops", label: "Military Operations", percentage: 0.45, description: "Army, Navy, Air Force, Marine Corps, and Space Force." },
      { key: "veterans", label: "Veterans Affairs", percentage: 0.25, description: "VA healthcare, benefits, and housing for veterans." },
      { key: "intelligence", label: "Intelligence & Security", percentage: 0.15, description: "CIA, NSA, DHS, and homeland security programs." },
      { key: "rd_defence", label: "R&D & Procurement", percentage: 0.10, description: "Weapons systems, technology development, and equipment." },
      { key: "international_ops", label: "International Operations", percentage: 0.05, description: "Overseas contingency, peacekeeping, and NATO contributions." },
    ],
  },
  {
    key: "infrastructure",
    label: "Infrastructure",
    percentage: 0.09,
    color: "#F97316",
    description: "Roads, bridges, airports, energy grid, broadband, and water systems.",
    subCategories: [
      { key: "transportation", label: "Roads & Highways", percentage: 0.35, description: "Federal Highway Administration and surface transportation." },
      { key: "transit", label: "Public Transit", percentage: 0.20, description: "FTA grants for buses, subways, and commuter rail." },
      { key: "energy", label: "Energy Grid & Clean Energy", percentage: 0.20, description: "Grid modernization, renewable energy, and DOE programs." },
      { key: "broadband", label: "Broadband & Technology", percentage: 0.15, description: "Rural broadband expansion and digital infrastructure." },
      { key: "water", label: "Water & Environmental", percentage: 0.10, description: "EPA water infrastructure, clean water grants." },
    ],
  },
  {
    key: "admin",
    label: "Government Administration",
    percentage: 0.06,
    color: "#6B7280",
    description: "Federal agencies, justice system, tax collection, and general government operations.",
    subCategories: [
      { key: "justice", label: "Justice & Courts", percentage: 0.35, description: "DOJ, federal courts, FBI, and law enforcement." },
      { key: "treasury", label: "Treasury & IRS", percentage: 0.25, description: "Tax collection, debt management, and financial regulation." },
      { key: "legislative", label: "Legislative Branch", percentage: 0.15, description: "Congress, CBO, GAO, and support agencies." },
      { key: "executive", label: "Executive Branch", percentage: 0.15, description: "White House, OMB, and executive agencies." },
      { key: "diplomacy", label: "Diplomacy & State Dept", percentage: 0.10, description: "State Department, embassies, and foreign missions." },
    ],
  },
  {
    key: "other",
    label: "Other Programs",
    percentage: 0.06,
    color: "#F59E0B",
    description: "Science, environment, agriculture, arts, and international aid programs.",
    subCategories: [
      { key: "science", label: "Science & Space", percentage: 0.30, description: "NASA, NSF, and basic scientific research funding." },
      { key: "environment", label: "Environment & Climate", percentage: 0.25, description: "EPA programs, national parks, and climate initiatives." },
      { key: "agriculture", label: "Agriculture & Food Safety", percentage: 0.20, description: "USDA programs, farm subsidies, and food safety." },
      { key: "international_aid", label: "International Aid", percentage: 0.15, description: "USAID, foreign assistance, and global health programs." },
      { key: "arts", label: "Arts & Culture", percentage: 0.10, description: "NEA, NEH, Smithsonian, and public broadcasting." },
    ],
  },
];

router.get("/national-budget", (_req, res) => {
  const categories = NATIONAL_BUDGET.map((cat) => ({
    key: cat.key,
    label: cat.label,
    percentage: cat.percentage,
    amount: Math.round(cat.percentage * NATIONAL_BUDGET_TOTAL_BILLIONS * 10) / 10,
    color: cat.color,
    description: cat.description,
    subCategories: cat.subCategories.map((sub) => ({
      key: sub.key,
      label: sub.label,
      percentage: sub.percentage,
      description: sub.description,
    })),
  }));

  const result = GetNationalBudgetResponse.parse({
    categories,
    totalBudgetBillions: NATIONAL_BUDGET_TOTAL_BILLIONS,
    fiscalYear: "2026",
    lastUpdated: new Date().toISOString().split("T")[0],
  });

  res.json(result);
});

export default router;
