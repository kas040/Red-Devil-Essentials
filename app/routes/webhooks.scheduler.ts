import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { discountScheduler } from "~/models/DiscountScheduler";

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  
  try {
    await discountScheduler.initializeScheduler(admin);
    return json({ success: true });
  } catch (error) {
    console.error("Scheduler initialization failed:", error);
    return json({ error: "Failed to initialize scheduler" }, { status: 500 });
  }
}
