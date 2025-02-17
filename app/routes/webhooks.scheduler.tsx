import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { processScheduledDiscounts } from "~/services/scheduler.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    await processScheduledDiscounts(admin);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Scheduler error:", error);
    return new Response("Error processing scheduled discounts", { status: 500 });
  }
};