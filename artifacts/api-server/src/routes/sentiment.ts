import { Router, type IRouter } from "express";
import { GetPublicSentimentResponse, SubmitPreferenceBody, SubmitPreferenceResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// In-memory preference store (seeded with realistic data)
const preferenceStore: Record<string, number[]> = {
  healthcare: [38, 40, 35, 42, 39, 37, 41, 43, 36, 40, 38, 45, 42, 39, 36, 41],
  education: [22, 20, 25, 18, 23, 24, 21, 19, 26, 22, 20, 24, 23, 21, 25, 20],
  defence: [8, 6, 9, 7, 5, 10, 8, 6, 7, 9, 5, 8, 6, 7, 9, 8],
  infrastructure: [12, 14, 11, 13, 15, 11, 12, 14, 13, 11, 15, 12, 13, 14, 12, 11],
  welfare: [12, 14, 13, 11, 10, 12, 11, 13, 12, 11, 13, 11, 12, 13, 11, 12],
  admin: [4, 3, 5, 4, 4, 3, 5, 4, 3, 4, 5, 3, 4, 4, 5, 3],
  other: [4, 3, 2, 5, 4, 3, 2, 1, 3, 3, 2, 1, 0, 2, 2, 6],
};

const GOVERNMENT_ALLOCATIONS: Record<string, number> = {
  healthcare: 0.36,
  education: 0.15,
  defence: 0.10,
  infrastructure: 0.09,
  welfare: 0.18,
  admin: 0.06,
  other: 0.06,
};

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  healthcare: { label: "Healthcare", color: "#10B981" },
  education: { label: "Education", color: "#3B82F6" },
  defence: { label: "Defence", color: "#EF4444" },
  infrastructure: { label: "Infrastructure", color: "#F97316" },
  welfare: { label: "Welfare", color: "#8B5CF6" },
  admin: { label: "Government Admin", color: "#6B7280" },
  other: { label: "Other", color: "#F59E0B" },
};

router.get("/public-sentiment", (_req, res) => {
  const totalResponses = Object.values(preferenceStore)[0]?.length ?? 0;

  const categories = Object.entries(CATEGORY_META).map(([key, meta]) => {
    const prefs = preferenceStore[key] ?? [];
    const avg = prefs.length > 0
      ? prefs.reduce((sum, v) => sum + v, 0) / prefs.length / 100
      : GOVERNMENT_ALLOCATIONS[key] ?? 0;
    return {
      key,
      label: meta.label,
      color: meta.color,
      governmentAllocation: GOVERNMENT_ALLOCATIONS[key] ?? 0,
      averageUserPreference: Math.round(avg * 10000) / 10000,
      totalResponses: prefs.length,
    };
  });

  const result = GetPublicSentimentResponse.parse({
    categories,
    totalResponses,
    lastUpdated: new Date().toISOString().split("T")[0],
  });

  res.json(result);
});

router.post("/submit-preference", (req, res) => {
  const body = SubmitPreferenceBody.parse(req.body);
  const { allocations } = body;

  // Store each allocation
  for (const [key, value] of Object.entries(allocations)) {
    if (preferenceStore[key]) {
      preferenceStore[key].push(value);
      // Keep only last 1000 responses
      if (preferenceStore[key].length > 1000) {
        preferenceStore[key] = preferenceStore[key].slice(-1000);
      }
    }
  }

  const totalResponses = Object.values(preferenceStore)[0]?.length ?? 0;

  const result = SubmitPreferenceResponse.parse({
    success: true,
    message: "Thank you for contributing your preferences.",
    totalResponses,
  });

  res.json(result);
});

export default router;
