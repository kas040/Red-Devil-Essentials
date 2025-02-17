import { 
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
  LATEST_API_VERSION 
} from "@shopify/shopify-app-remix/server";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-01";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  apiVersion: LATEST_API_VERSION,
  scopes: [
    "read_products",
    "write_products",
    "read_product_listings",
    "write_product_listings",
    "read_inventory",
    "write_inventory",
    "read_price_rules",
    "write_price_rules",
    "read_discounts",
    "write_discounts",
    "read_scheduled_products",
    "write_scheduled_products"
  ],
  appUrl: process.env.SHOPIFY_APP_URL,
  authPathPrefix: "/auth",
  distribution: AppDistribution.AppStore,
  isEmbeddedApp: true,
  sessionStorage: new SQLiteSessionStorage(new URL("../database.sqlite", import.meta.url).pathname),
  hooks: {
    afterAuth: async ({ session }) => {
      // Setup webhooks and any post-authentication tasks
      shopify.registerWebhooks({
        session,
        webhooks: [
          {
            path: "/webhooks/app/uninstalled",
            topic: "APP_UNINSTALLED",
            deliveryMethod: DeliveryMethod.Http,
          },
          // Add other webhooks as needed
        ],
      });
    },
  },
  restResources,
  future: {
    v3_webhookAdminAuth: true,
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
export const sessionStorage = shopify.sessionStorage;
