import { authenticate } from "~/shopify.server";
import type { ActionFunctionArgs } from "@remix-run/node";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, admin, payload } = await authenticate.webhook(request);

  switch (topic) {
    case "APP_SUBSCRIPTIONS_UPDATE":
      // Handle subscription updates
      console.log("Subscription updated:", payload);
      break;
    
    case "APP_SUBSCRIPTIONS_CANCEL":
      // Handle subscription cancellations
      console.log("Subscription cancelled:", payload);
      break;
  }

  return new Response(null, {
    status: 200,
  });
};
