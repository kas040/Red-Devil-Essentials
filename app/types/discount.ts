export type PriceChange = {
  oldPrice: number;
  newPrice: number;
  date: string;
  ruleId?: string;
  userId?: string;
};

export type DiscountRule = {
  id: string;
  name: string;
  type: "percentage" | "fixed" | "formula";
  value: string;
  startDate?: string;
  endDate?: string;
  target: "product" | "collection" | "vendor" | "productType";
  targetId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductMetafields = {
  originalPrice: number;
  priceHistory: PriceChange[];
  activeRules: DiscountRule[];
};