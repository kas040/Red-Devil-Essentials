import type { DiscountRule, PriceChange } from "~/types/discount";

interface DiscountPerformance {
  ruleId: string;
  type: string;
  value: string;
  revenue: number;
  conversionRate: number;
  category: string;
}

interface Recommendation {
  category: string;
  suggestedDiscount: number;
  expectedRevenue: number;
  confidence: number;
  reasoning: string;
}

export async function generateDiscountRecommendations(
  priceHistory: PriceChange[],
  activeRules: DiscountRule[],
  categoryStats: any[]
): Promise<Recommendation[]> {
  // Analyze historical performance
  const performanceByCategory = analyzeHistoricalPerformance(
    priceHistory,
    activeRules,
    categoryStats
  );

  // Generate recommendations
  return Object.entries(performanceByCategory).map(([category, performance]) => {
    const recommendation = calculateOptimalDiscount(performance as DiscountPerformance[]);
    return {
      category,
      ...recommendation,
    };
  });
}

function analyzeHistoricalPerformance(
  priceHistory: PriceChange[],
  activeRules: DiscountRule[],
  categoryStats: any[]
): Record<string, DiscountPerformance[]> {
  const performanceByCategory: Record<string, DiscountPerformance[]> = {};

  // Group performance data by category
  categoryStats.forEach(categoryStat => {
    const categoryRules = activeRules.filter(rule => 
      rule.target === "productType" && rule.targetId === categoryStat.category
    );

    const performance = categoryRules.map(rule => {
      const ruleChanges = priceHistory.filter(change => change.ruleId === rule.id);
      const totalRevenue = ruleChanges.reduce((sum, change) => 
        sum + (change.newPrice), 0
      );

      return {
        ruleId: rule.id,
        type: rule.type,
        value: rule.value,
        revenue: totalRevenue,
        conversionRate: 0.5, // This should be calculated from actual order data
        category: categoryStat.category,
      };
    });

    performanceByCategory[categoryStat.category] = performance;
  });

  return performanceByCategory;
}

function calculateOptimalDiscount(
  performance: DiscountPerformance[]
): Omit<Recommendation, 'category'> {
  if (!performance.length) {
    return {
      suggestedDiscount: 15, // Default conservative discount
      expectedRevenue: 0,
      confidence: 0.5,
      reasoning: "No historical data available. Suggesting conservative discount.",
    };
  }

  // Find best performing discount
  const bestPerforming = performance.reduce((best, current) => 
    current.revenue > best.revenue ? current : best
  );

  // Calculate optimal discount based on historical performance
  const suggestedDiscount = parseFloat(bestPerforming.value);
  const confidence = calculateConfidence(performance, suggestedDiscount);

  return {
    suggestedDiscount,
    expectedRevenue: estimateRevenue(performance, suggestedDiscount),
    confidence,
    reasoning: generateReasoning(performance, suggestedDiscount, confidence),
  };
}

function calculateConfidence(
  performance: DiscountPerformance[],
  suggestedDiscount: number
): number {
  if (performance.length < 2) return 0.5;

  // Calculate variance in performance
  const revenues = performance.map(p => p.revenue);
  const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
  const variance = revenues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / revenues.length;

  // Higher variance = lower confidence
  const varianceScore = Math.max(0, 1 - (variance / mean));

  // More data points = higher confidence
  const dataScore = Math.min(1, performance.length / 10);

  return (varianceScore * 0.7 + dataScore * 0.3);
}

function estimateRevenue(
  performance: DiscountPerformance[],
  suggestedDiscount: number
): number {
  if (!performance.length) return 0;

  // Calculate average revenue for similar discounts
  const similarDiscounts = performance.filter(p => 
    Math.abs(parseFloat(p.value) - suggestedDiscount) <= 5
  );

  if (similarDiscounts.length === 0) return performance[0].revenue;

  return similarDiscounts.reduce((sum, p) => sum + p.revenue, 0) / similarDiscounts.length;
}

function generateReasoning(
  performance: DiscountPerformance[],
  suggestedDiscount: number,
  confidence: number
): string {
  if (!performance.length) {
    return "No historical data available. Suggesting conservative discount.";
  }

  const confidenceLevel = confidence > 0.8 ? "high" : confidence > 0.5 ? "moderate" : "low";
  const dataPoints = performance.length;
  const averageRevenue = performance.reduce((sum, p) => sum + p.revenue, 0) / performance.length;

  return `Based on ${dataPoints} historical discount campaigns with ${confidenceLevel} confidence. ` +
    `Average revenue per campaign: $${averageRevenue.toFixed(2)}. ` +
    `${suggestedDiscount}% discount shows optimal balance of conversion and revenue.`;
}