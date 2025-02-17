export type PriceChange = {
  oldPrice: number;
  newPrice: number;
  date: string;
  ruleId?: string;
  userId?: string;
};

export interface ProductSelection {
  type: 'id' | 'collection' | 'vendor' | 'product_type' | 'manual';
  value: string | string[];
}

export interface DiscountRule {
  id: string;
  name?: string;
  type: 'percentage' | 'fixed' | 'formula';
  value: string | number;
  startDate?: string;
  endDate?: string;
  conditions?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
    value: string | number;
  }[];
}

export interface BulkPricingOperation {
  selection: ProductSelection;
  rules: DiscountRule[];
}

export type ProductMetafields = {
  originalPrice: number;
  priceHistory: PriceChange[];
  activeRules: DiscountRule[];
};

export interface PriceSchedule {
  id: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  rules: DiscountRule[];
  status: 'draft' | 'scheduled' | 'active' | 'completed';
}

export interface PriceHistory {
  id: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  timestamp: string;
  userId: string;
  ruleId?: string;
  scheduleId?: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string;
  status: 'trial' | 'active' | 'cancelled' | 'expired';
}