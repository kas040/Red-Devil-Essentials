import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { metafieldManager } from "~/models/MetafieldManager";
import { discountManager } from "~/models/DiscountManager";

export async function action({ request, params }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const { id: historyId } = params;
  const formData = await request.formData();
  const productId = formData.get("productId") as string;

  try {
    // Get product metafields
    const metafields = await metafieldManager.getProductMetafields(admin, productId);
    
    // Find the historical price entry
    const historyEntry = metafields.priceHistory.find(h => h.id === historyId);
    if (!historyEntry) {
      throw new Error("Historical price entry not found");
    }

    // Restore the price
    await discountManager.updateShopifyPrice(
      admin,
      productId,
      historyEntry.variantId,
      historyEntry.oldPrice
    );

    // Add restoration to price history
    const newHistoryEntry = {
      id: crypto.randomUUID(),
      productId,
      variantId: historyEntry.variantId,
      oldPrice: historyEntry.newPrice,
      newPrice: historyEntry.oldPrice,
      timestamp: new Date().toISOString(),
      restoredFrom: historyId
    };

    metafields.priceHistory.unshift(newHistoryEntry);
    await metafieldManager.saveProductMetafields(admin, productId, metafields);

    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: 400 });
  }
}
