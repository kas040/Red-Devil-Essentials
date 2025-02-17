import { authenticate } from "~/shopify.server";
import type { DiscountRule } from "~/types/discount";
import { updateProductPrice, restoreOriginalPrice } from "~/utils/price.server";

export async function processScheduledDiscounts(admin: any) {
  const now = new Date();

  // Fetch all active discount rules
  const response = await admin.graphql(`
    query getActiveDiscountRules {
      metaobjects(first: 50, type: "discount_rule") {
        nodes {
          id
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

    return {
      id: node.id,
      schedule: JSON.parse(fields.schedule || "{}"),
      tags: JSON.parse(fields.tags || "{}"),
      isActive: fields.is_active === "true",
      // ... other fields
    };
  });

  for (const rule of rules) {
    if (!rule.isActive) continue;

    const startDate = new Date(rule.schedule.startDate);
    const endDate = rule.schedule.endDate ? new Date(rule.schedule.endDate) : null;

    // Check if rule should be activated
    if (startDate <= now && (!endDate || endDate > now)) {
      await activateRule(rule, admin);
    }
    // Check if rule should be deactivated
    else if (endDate && endDate <= now) {
      await deactivateRule(rule, admin);
    }
  }
}

async function activateRule(rule: DiscountRule, admin: any) {
  // Apply tags
  if (rule.tags?.add?.length) {
    await addTagsToProducts(rule.targetId, rule.tags.add, admin);
  }
  
  // Apply price changes
  // Implementation depends on rule type and target
}

async function deactivateRule(rule: DiscountRule, admin: any) {
  // Remove tags
  if (rule.tags?.remove?.length) {
    await removeTagsFromProducts(rule.targetId, rule.tags.remove, admin);
  }

  // Restore original prices
  await restoreOriginalPrice(rule.targetId, admin);

  // Update rule status
  await updateRuleStatus(rule.id, false, admin);
}

async function addTagsToProducts(productId: string, tags: string[], admin: any) {
  const response = await admin.graphql(`
    mutation addTags($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
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
        id: `gid://shopify/Product/${productId}`,
        tags,
      },
    },
  });

  return response.json();
}

async function removeTagsFromProducts(productId: string, tags: string[], admin: any) {
  // First get current tags
  const response = await admin.graphql(`
    query getProductTags($id: ID!) {
      product(id: $id) {
        tags
      }
    }
  `, {
    variables: {
      id: `gid://shopify/Product/${productId}`,
    },
  });

  const { data } = await response.json();
  const currentTags = data.product.tags;
  const updatedTags = currentTags.filter((tag: string) => !tags.includes(tag));

  // Update with new tags
  return addTagsToProducts(productId, updatedTags, admin);
}

async function updateRuleStatus(ruleId: string, isActive: boolean, admin: any) {
  const response = await admin.graphql(`
    mutation updateDiscountRule($input: MetaobjectInput!) {
      metaobjectUpdate(metaobject: $input) {
        metaobject {
          id
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
        id: ruleId,
        fields: [
          { key: "is_active", value: isActive.toString() },
          { key: "updated_at", value: new Date().toISOString() },
        ],
      },
    },
  });

  return response.json();
}