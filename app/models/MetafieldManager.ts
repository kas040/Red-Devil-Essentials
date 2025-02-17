import type { PriceHistory, ProductMetafields, DiscountRule } from "~/types/discount";

export class MetafieldManager {
  private readonly NAMESPACE = "reddevil_discounts";
  private readonly PRICE_HISTORY_KEY = "price_history";
  private readonly ACTIVE_RULES_KEY = "active_rules";
  private readonly DISCOUNT_RULES_KEY = "discount_rules";

  async saveProductMetafields(admin: any, productId: string, data: ProductMetafields) {
    const mutation = `#graphql
      mutation productMetafieldsSet($productId: ID!, $priceHistory: String!, $activeRules: String!) {
        productUpdate(input: {
          id: $productId,
          metafields: [
            {
              namespace: "${this.NAMESPACE}",
              key: "${this.PRICE_HISTORY_KEY}",
              value: $priceHistory,
              type: "json"
            },
            {
              namespace: "${this.NAMESPACE}",
              key: "${this.ACTIVE_RULES_KEY}",
              value: $activeRules,
              type: "json"
            }
          ]
        }) {
          userErrors {
            field
            message
          }
        }
      }
    `;

    await admin.graphql(mutation, {
      variables: {
        productId: `gid://shopify/Product/${productId}`,
        priceHistory: JSON.stringify(data.priceHistory),
        activeRules: JSON.stringify(data.activeRules)
      }
    });
  }

  async getProductMetafields(admin: any, productId: string): Promise<ProductMetafields> {
    const query = `#graphql
      query getProductMetafields($productId: ID!) {
        product(id: $productId) {
          metafields(namespace: "${this.NAMESPACE}", first: 10) {
            edges {
              node {
                key
                value
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(query, {
      variables: {
        productId: `gid://shopify/Product/${productId}`
      }
    });

    const data = await response.json();
    const metafields = data.data.product.metafields.edges;
    
    return {
      priceHistory: JSON.parse(metafields.find(m => m.node.key === this.PRICE_HISTORY_KEY)?.node.value || '[]'),
      activeRules: JSON.parse(metafields.find(m => m.node.key === this.ACTIVE_RULES_KEY)?.node.value || '[]'),
      originalPrice: 0 // Will be set from variant price
    };
  }

  async saveDiscountRule(admin: any, rule: DiscountRule) {
    const existingRules = await this.getDiscountRules(admin);
    const updatedRules = [...existingRules, rule];

    const mutation = `#graphql
      mutation updateAppMetafield($input: AppMetafieldInput!) {
        appMetafieldSet(
          metafield: $input
        ) {
          userErrors {
            field
            message
          }
        }
      }
    `;

    await admin.graphql(mutation, {
      variables: {
        input: {
          namespace: this.NAMESPACE,
          key: this.DISCOUNT_RULES_KEY,
          type: "json",
          value: JSON.stringify(updatedRules)
        }
      }
    });
  }

  async getDiscountRules(admin: any): Promise<DiscountRule[]> {
    const query = `#graphql
      query getAppMetafield {
        appInstallation {
          metafields(namespace: "${this.NAMESPACE}", first: 1) {
            edges {
              node {
                key
                value
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(query);
    const data = await response.json();
    const metafield = data.data.appInstallation.metafields.edges
      .find(edge => edge.node.key === this.DISCOUNT_RULES_KEY);

    return metafield ? JSON.parse(metafield.node.value) : [];
  }

  async addRuleToProduct(admin: any, productId: string, ruleId: string) {
    const metafields = await this.getProductMetafields(admin, productId);
    if (!metafields.activeRules.includes(ruleId)) {
      metafields.activeRules.push(ruleId);
      await this.saveProductMetafields(admin, productId, metafields);
    }
  }

  async updateRuleStatus(admin: any, ruleId: string, status: 'draft' | 'scheduled' | 'active' | 'completed') {
    const rules = await this.getDiscountRules(admin);
    const updatedRules = rules.map(rule => 
      rule.id === ruleId ? { ...rule, status } : rule
    );

    await this.saveDiscountRules(admin, updatedRules);
  }

  async saveDiscountRules(admin: any, rules: DiscountRule[]) {
    const mutation = `#graphql
      mutation updateAppMetafield($input: AppMetafieldInput!) {
        appMetafieldSet(
          metafield: $input
        ) {
          userErrors {
            field
            message
          }
        }
      }
    `;

    await admin.graphql(mutation, {
      variables: {
        input: {
          namespace: this.NAMESPACE,
          key: this.DISCOUNT_RULES_KEY,
          type: "json",
          value: JSON.stringify(rules)
        }
      }
    });

    // Trigger scheduler update
    await fetch('/webhooks/scheduler', { method: 'POST' });
  }
}

export const metafieldManager = new MetafieldManager();
