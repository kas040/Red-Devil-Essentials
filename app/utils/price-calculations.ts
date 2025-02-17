import type { DiscountRule } from "~/types/discount";

export function calculateDiscountedPrice(originalPrice: number, rules: DiscountRule[]): number {
  let finalPrice = originalPrice;

  for (const rule of rules) {
    switch (rule.type) {
      case 'percentage':
        finalPrice *= (1 - (Number(rule.value) / 100));
        break;
      case 'fixed':
        finalPrice -= Number(rule.value);
        break;
      case 'formula':
        try {
          // Veilige evaluatie van formule
          const formula = String(rule.value)
            .replace(/price/g, finalPrice.toString())
            .replace(/[^0-9+\-*/().]/g, '');
          finalPrice = Function(`return ${formula}`)();
        } catch (e) {
          console.error('Formula evaluation failed:', e);
        }
        break;
    }
  }

  return Math.round(finalPrice * 100) / 100; // Round to 2 decimals
}

export function validatePriceRule(rule: DiscountRule): boolean {
  switch (rule.type) {
    case 'percentage':
      const percent = Number(rule.value);
      return !isNaN(percent) && percent >= 0 && percent <= 100;
    case 'fixed':
      const amount = Number(rule.value);
      return !isNaN(amount) && amount >= 0;
    case 'formula':
      try {
        // Test formula with sample price
        const testPrice = 100;
        const formula = String(rule.value)
          .replace(/price/g, testPrice.toString())
          .replace(/[^0-9+\-*/().]/g, '');
        const result = Function(`return ${formula}`)();
        return !isNaN(result) && result >= 0;
      } catch {
        return false;
      }
  }
  return false;
}
