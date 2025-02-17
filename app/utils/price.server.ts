import { authenticate } from "../shopify.server";
import type { DiscountRule, PriceChange, ProductMetafields } from "~/types/discount";

const METAFIELD_NAMESPACE = "discount_manager";

export async function getProductMetafields(productId: string, admin: any): Promise<ProductMetafields | null> {
  const response = await admin.graphql(`
    query getProductMetafields($productId: ID!) {
      product(id: $productId) {
        metafields(namespace: "${METAFIELD_NAMESPACE}") {
          nodes {
            key
            value
          }
        }
      }
    }
  `, {
    variables: {
      productId: `gid://shopify/Product/${productId}`,
    },
  });

  const { data } = await response.json();
  const metafields = data.product.metafields.nodes;

  if (!metafields.length) return null;

  return {
    originalPrice: parseFloat(metafields.find((m: any) => m.key === "original_price")?.value || "0"),
    priceHistory: JSON.parse(metafields.find((m: any) => m.key === "price_history")?.value || "[]"),
    activeRules: JSON.parse(metafields.find((m: any) => m.key === "active_rules")?.value || "[]"),
  };
}

export async function updateProductPrice(
  productId: string, 
  newPrice: number,
  rule?: DiscountRule,
  admin: any
): Promise<void> {
  // Get current product data
  const productResponse = await admin.graphql(`
    query getProduct($productId: ID!) {
      product(id: $productId) {
        variants(first: 1) {
          nodes {
            id
            price
          }
        }
      }
    }
  `, {
    variables: {
      productId: `gid://shopify/Product/${productId}`,
    },
  });

  const { data: productData } = await productResponse.json();
  const currentPrice = parseFloat(productData.product.variants.nodes[0].price);
  const variantId = productData.product.variants.nodes[0].id;

  // Get or initialize metafields
  let metafields = await getProductMetafields(productId, admin) || {
    originalPrice: currentPrice,
    priceHistory: [],
    activeRules: [],
  };

  // Record price change
  const priceChange: PriceChange = {
    oldPrice: currentPrice,
    newPrice,
    date: new Date().toISOString(),
    ruleId: rule?.id,
  };

  metafields.priceHistory.push(priceChange);

  // Update active rules
  if (rule) {
    metafields.activeRules = metafields.activeRules.filter(r => r.id !== rule.id);
    if (rule.isActive) {
      metafields.activeRules.push(rule);
    }
  }

  // Update metafields
  await admin.graphql(`
    mutation updateProductMetafields($input: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $input) {
        metafields {
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      input: [
        {
          namespace: METAFIELD_NAMESPACE,
          key: "original_price",
          value: metafields.originalPrice.toString(),
          type: "number_decimal",
          ownerId: `gid://shopify/Product/${productId}`,
        },
        {
          namespace: METAFIELD_NAMESPACE,
          key: "price_history",
          value: JSON.stringify(metafields.priceHistory),
          type: "json",
          ownerId: `gid://shopify/Product/${productId}`,
        },
        {
          namespace: METAFIELD_NAMESPACE,
          key: "active_rules",
          value: JSON.stringify(metafields.activeRules),
          type: "json",
          ownerId: `gid://shopify/Product/${productId}`,
        },
      ],
    },
  });

  // Update product variant price
  await admin.graphql(`
    mutation updateProductVariant($input: ProductVariantInput!) {
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
        price: newPrice.toString(),
        compareAtPrice: currentPrice.toString(),
      },
    },
  });
}

export async function restoreOriginalPrice(productId: string, admin: any): Promise<void> {
  const metafields = await getProductMetafields(productId, admin);
  if (!metafields) return;

  await updateProductPrice(productId, metafields.originalPrice, undefined, admin);

  // Clear active rules
  await admin.graphql(`
    mutation updateActiveRules($input: MetafieldInput!) {
      metafieldsSet(metafields: [{
        namespace: "${METAFIELD_NAMESPACE}",
        key: "active_rules",
        value: "[]",
        type: "json",
        ownerId: "gid://shopify/Product/${productId}"
      }]) {
        metafields {
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `);
}