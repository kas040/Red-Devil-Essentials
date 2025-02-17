import type { DiscountRule } from "~/types/discount";

export function useDiscountCalculator() {
  const calculateDiscount = (
    originalPrice: number,
    rule: DiscountRule
  ): number => {
    switch (rule.type) {
      case "percentage":
        const percentage = parseFloat(rule.value);
        return originalPrice * (1 - percentage / 100);
      
      case "fixed":
        const amount = parseFloat(rule.value);
        return Math.max(0, originalPrice - amount);
      
      case "formula":
        // Safe formula evaluation (implement proper validation)
        try {
          const price = originalPrice;
          // eslint-disable-next-line no-new-func
          return Function("price", `"use strict";return (${rule.value})`)(price);
        } catch (error) {
          console.error("Formula evaluation error:", error);
          return originalPrice;
        }
      
      default:
        return originalPrice;
    }
  };

  const validateRule = (rule: DiscountRule): string[] => {
    const errors: string[] = [];

    if (!rule.name) {
      errors.push("Rule name is required");
    }

    if (!rule.value) {
      errors.push("Rule value is required");
    }

    switch (rule.type) {
      case "percentage":
        const percentage = parseFloat(rule.value);
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
          errors.push("Percentage must be between 0 and 100");
        }
        break;

      case "fixed":
        const amount = parseFloat(rule.value);
        if (isNaN(amount) || amount < 0) {
          errors.push("Fixed amount must be a positive number");
        }
        break;

      case "formula":
        try {
          // Test formula with a sample price
          const testPrice = 100;
          // eslint-disable-next-line no-new-func
          const result = Function("price", `"use strict";return (${rule.value})`)(
            testPrice
          );
          if (typeof result !== "number" || isNaN(result)) {
            errors.push("Formula must return a valid number");
          }
        } catch (error) {
          errors.push("Invalid formula");
        }
        break;
    }

    return errors;
  };

  return {
    calculateDiscount,
    validateRule,
  };
}