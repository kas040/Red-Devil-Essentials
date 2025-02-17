import { authenticate } from "~/shopify.server";
import type { DiscountRule, PriceChange } from "~/types/discount";

export interface DiscountAnalytics {
  totalDiscounts: number;
  averageDiscount: number;
  categoryStats: Array<{
    category: string;
    totalProducts: number;
    totalDiscounts: number;
    averageDiscount: number;
    revenue: number;
  }>;
  totalProducts: number;
  activeRules: number;
  revenueImpact: number;
  popularDiscounts: Array<{
    type: string;
    count: number;
    averageDiscount: number;
  }>;
  timeBasedStats: Array<{
    date: string;
    discountCount: number;
    averageDiscount: number;
  }>;
}

export async function getDiscountAnalytics(admin: any, timeframe: string = "30d"): Promise<DiscountAnalytics> {
  // Fetch all price changes and rules
  const response = await admin.graphql(`
    query getDiscountData {
      products(first: 100) {
        nodes {
          id
          productType
          variants(first: 1) {
            nodes {
              price
            }
          }
        }
      }
      metaobjects(type: "discount_rule", first: 100) {
        nodes {
          fields {
            key
            value
          }
        }
      }
    }
  `);

  const { data } = await response.json();
  const rules = data.metaobjects.nodes.map((node: any) => {
    const fields = node.fields.reduce((acc: any, field: any) => {
      acc[field.key] = field.value;
      return acc;
    }, {});
    return fields;
  });
  
  const products = data.products.nodes;
  
  // Group products by category
  const categoryData = products.reduce((acc: any, product: any) => {
    const category = product.productType || "Uncategorized";
    if (!acc[category]) {
      acc[category] = {
        totalProducts: 0,
        totalDiscounts: 0,
        discountAmount: 0,
        revenue: 0,
      };
    }
    
    acc[category].totalProducts++;
    acc[category].revenue += parseFloat(product.variants.nodes[0].price);
    
    return acc;
  }, {});
  
  // Calculate category statistics
  const categoryStats = Object.entries(categoryData).map(([category, data]: [string, any]) => ({
    category,
    totalProducts: data.totalProducts,
    totalDiscounts: data.totalDiscounts,
    averageDiscount: data.totalDiscounts > 0 ? data.discountAmount / data.totalDiscounts : 0,
    revenue: data.revenue,
  }));

  // Calculate analytics
  const activeRules = rules.filter((rule: any) => rule.is_active === "true");
  const priceChanges = rules.flatMap((rule: any) => 
    JSON.parse(rule.price_history || "[]")
  );

  const now = new Date();
  const timeframeDate = new Date();
  switch (timeframe) {
    case "7d":
      timeframeDate.setDate(now.getDate() - 7);
      break;
    case "30d":
      timeframeDate.setDate(now.getDate() - 30);
      break;
    case "90d":
      timeframeDate.setDate(now.getDate() - 90);
      break;
  }

  const recentChanges = priceChanges.filter((change: PriceChange) => 
    new Date(change.date) >= timeframeDate
  );

  // Calculate statistics
  const discountAmounts = recentChanges.map(
    (change: PriceChange) => change.oldPrice - change.newPrice
  );

  const totalDiscounts = discountAmounts.length;
  const averageDiscount = totalDiscounts > 0
    ? discountAmounts.reduce((a, b) => a + b, 0) / totalDiscounts
    : 0;

  // Group by discount type
  const discountsByType = rules.reduce((acc: any, rule: any) => {
    const type = rule.type;
    if (!acc[type]) {
      acc[type] = {
        count: 0,
        totalDiscount: 0,
      };
    }
    acc[type].count++;
    acc[type].totalDiscount += parseFloat(rule.value);
    return acc;
  }, {});

  const popularDiscounts = Object.entries(discountsByType).map(([type, data]: [string, any]) => ({
    type,
    count: data.count,
    averageDiscount: data.totalDiscount / data.count,
  }));

  // Calculate time-based statistics
  const timeBasedStats = generateTimeBasedStats(recentChanges, timeframe);

  return {
    totalDiscounts,
    averageDiscount,
    categoryStats,
    totalProducts: new Set(recentChanges.map(c => c.productId)).size,
    activeRules: activeRules.length,
    revenueImpact: -discountAmounts.reduce((a, b) => a + b, 0),
    popularDiscounts,
    timeBasedStats,
  };
}

function generateTimeBasedStats(changes: PriceChange[], timeframe: string) {
  const stats: Record<string, { count: number; total: number }> = {};
  
  changes.forEach(change => {
    const date = new Date(change.date);
    const key = date.toISOString().split('T')[0];
    
    if (!stats[key]) {
      stats[key] = { count: 0, total: 0 };
    }
    
    stats[key].count++;
    stats[key].total += (change.oldPrice - change.newPrice);
  });

  return Object.entries(stats).map(([date, data]) => ({
    date,
    discountCount: data.count,
    averageDiscount: data.total / data.count,
  }));
}