import type { DiscountRule, PriceHistory, ProductMetafields } from "~/types/discount";
import { calculateDiscountedPrice, validatePriceRule } from "~/utils/price-calculations";

export class DiscountManager {
  private rules: Map<string, DiscountRule> = new Map();
  private history: Map<string, PriceHistory[]> = new Map();
  private productMetafields: Map<string, ProductMetafields> = new Map();

  async addRule(rule: DiscountRule): Promise<string> {
    if (!validatePriceRule(rule)) {
      throw new Error("Invalid rule configuration");
    }
    const id = crypto.randomUUID();
    this.rules.set(id, rule);
    return id;
  }

  async applyRulesToProduct(productId: string, ruleIds: string[]): Promise<number> {
    const product = await this.getProduct(productId);
    const rules = ruleIds.map(id => this.rules.get(id)).filter(Boolean);
    
    const oldPrice = product.variants.edges[0].node.price;
    const newPrice = calculateDiscountedPrice(oldPrice, rules);
    
    // Save price history
    this.addToHistory(productId, {
      id: crypto.randomUUID(),
      productId,
      oldPrice,
      newPrice,
      timestamp: new Date().toISOString(),
      ruleIds
    });

    return newPrice;
  }

  async updateShopifyPrice(admin: any, productId: string, variantId: string, newPrice: number) {
    const response = await admin.graphql(`
      mutation updateProductVariantPrice($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            id
            price
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      variables: {
        input: {
          id: variantId,
          price: newPrice.toString()
        }
      }
    });

    const result = await response.json();
    if (result.data.productVariantUpdate.userErrors.length > 0) {
      throw new Error(result.data.productVariantUpdate.userErrors[0].message);
    }

    return result.data.productVariantUpdate.productVariant;
  }

  getHistory(productId: string): PriceHistory[] {
    return this.history.get(productId) || [];
  }

  private async getProduct(productId: string): Promise<any> {
    // Implement product fetching from Shopify
  }

  private addToHistory(productId: string, entry: PriceHistory) {
    const history = this.history.get(productId) || [];
    history.unshift(entry);
    this.history.set(productId, history);
  }
}

// Create singleton instance
export const discountManager = new DiscountManager();
