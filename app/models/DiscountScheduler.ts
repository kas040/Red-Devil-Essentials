import type { DiscountRule } from "../types/discount";
import { metafieldManager } from "./MetafieldManager";
import { discountManager } from "./DiscountManager";

export class DiscountScheduler {
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();

  async initializeScheduler(admin: any) {
    // Clear existing schedules
    this.clearAllSchedules();

    // Get all rules
    const rules = await metafieldManager.getDiscountRules(admin);
    
    // Schedule all rules
    rules.forEach(rule => this.scheduleRule(admin, rule));
  }

  async scheduleRule(admin: any, rule: DiscountRule) {
    const startTime = new Date(rule.startDate).getTime();
    const endTime = rule.endDate ? new Date(rule.endDate).getTime() : null;
    const now = Date.now();

    // Schedule start
    if (startTime > now) {
      const startTimeout = setTimeout(async () => {
        await this.activateRule(admin, rule);
      }, startTime - now);
      this.scheduledTasks.set(`start_${rule.id}`, startTimeout);
    }

    // Schedule end if exists
    if (endTime && endTime > now) {
      const endTimeout = setTimeout(async () => {
        await this.deactivateRule(admin, rule);
      }, endTime - now);
      this.scheduledTasks.set(`end_${rule.id}`, endTimeout);
    }
  }

  private async activateRule(admin: any, rule: DiscountRule) {
    try {
      // Get all products affected by this rule
      const products = await this.getAffectedProducts(admin, rule);
      
      // Apply discount to each product
      await Promise.all(products.map(async (productId) => {
        await discountManager.applyRulesToProduct(productId, [rule.id]);
        await this.updateShopifyPrice(admin, productId, rule);
      }));

      // Update rule status
      await metafieldManager.updateRuleStatus(admin, rule.id, 'active');
    } catch (error) {
      console.error(`Failed to activate rule ${rule.id}:`, error);
    }
  }

  private async deactivateRule(admin: any, rule: DiscountRule) {
    try {
      // Get all products affected by this rule
      const products = await this.getAffectedProducts(admin, rule);
      
      // Remove discount from each product
      await Promise.all(products.map(async (productId) => {
        const metafields = await metafieldManager.getProductMetafields(admin, productId);
        const activeRules = metafields.activeRules.filter(r => r !== rule.id);
        
        // Recalculate price without this rule
        if (activeRules.length > 0) {
          await discountManager.applyRulesToProduct(productId, activeRules);
        } else {
          // Reset to original price
          await this.resetOriginalPrice(admin, productId);
        }
      }));

      // Update rule status
      await metafieldManager.updateRuleStatus(admin, rule.id, 'completed');
    } catch (error) {
      console.error(`Failed to deactivate rule ${rule.id}:`, error);
    }
  }

  private clearAllSchedules() {
    this.scheduledTasks.forEach(timeout => clearTimeout(timeout));
    this.scheduledTasks.clear();
  }

  private async getAffectedProducts(admin: any, rule: DiscountRule): Promise<string[]> {
    // Implement product selection based on rule conditions
    return [];
  }

  private async updateShopifyPrice(admin: any, productId: string, rule: DiscountRule) {
    // Implement price update in Shopify
  }

  private async resetOriginalPrice(admin: any, productId: string) {
    // Implement price reset logic
  }
}

export const discountScheduler = new DiscountScheduler();
