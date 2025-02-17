import { redirect } from "@remix-run/node";

export async function checkSubscription(admin: any) {
  const response = await admin.graphql(`
    query getSubscription {
      appInstallation {
        activeSubscriptions {
          id
          status
          currentPeriodEnd
          trialDays
          createdAt
          test
          requirements {
            paymentPending
          }
        }
      }
    }
  `);

  const data = await response.json();
  const subscription = data.data?.appInstallation?.activeSubscriptions?.[0];

  if (!subscription) {
    throw redirect("/app/billing");
  }

  // Check if payment is required
  if (subscription.requirements?.paymentPending) {
    throw redirect("/app/billing?payment_required=true");
  }

  // Check trial status
  if (subscription.trialDays) {
    const trialEnd = new Date(subscription.createdAt);
    trialEnd.setDate(trialEnd.getDate() + subscription.trialDays);
    
    if (new Date() > trialEnd && subscription.status !== 'ACTIVE') {
      throw redirect("/app/billing?trial_expired=true");
    }
  }

  return subscription;
}
