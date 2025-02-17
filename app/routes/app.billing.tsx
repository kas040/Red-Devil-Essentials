import { useState } from "react";
import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { Page, Layout, Card, Button, Text, BlockStack, Banner, List } from "@shopify/polaris";

const SUBSCRIPTION_PLAN = {
  name: "Red Devil Essentials Pro",
  amount: 19.00,
  currencyCode: "EUR",
  trialDays: 14,
  interval: "EVERY_30_DAYS",
  paymentTerms: "REQUIRES_PAYMENT_UPFRONT"
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  // Create subscription
  const response = await admin.graphql(`
    mutation createSubscription($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $trialDays: Int!) {
      appSubscriptionCreate(
        name: $name,
        lineItems: $lineItems,
        returnUrl: $returnUrl,
        trialDays: $trialDays,
        test: ${process.env.NODE_ENV === 'development'}
      ) {
        userErrors {
          field
          message
        }
        confirmationUrl
        appSubscription {
          id
          status
        }
      }
    }`,
    {
      variables: {
        name: SUBSCRIPTION_PLAN.name,
        lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                price: { amount: SUBSCRIPTION_PLAN.amount, currencyCode: SUBSCRIPTION_PLAN.currencyCode },
                interval: SUBSCRIPTION_PLAN.interval
              }
            }
          }
        ],
        returnUrl: `${process.env.SHOPIFY_APP_URL}/app`,
        trialDays: SUBSCRIPTION_PLAN.trialDays
      }
    }
  );

  const responseJson = await response.json();
  const confirmationUrl = responseJson.data?.appSubscriptionCreate?.confirmationUrl;

  if (confirmationUrl) {
    return redirect(confirmationUrl);
  }

  return json({ 
    error: responseJson.data?.appSubscriptionCreate?.userErrors[0]?.message || "Er is een fout opgetreden"
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  
  // Create subscription with required upfront payment
  const response = await admin.graphql(`
    mutation createSubscription($name: String!, $returnUrl: URL!, $trialDays: Int!, $amount: Decimal!, $currencyCode: CurrencyCode!) {
      appSubscriptionCreate(
        name: $name
        returnUrl: $returnUrl
        trialDays: $trialDays
        test: ${process.env.NODE_ENV === 'development'}
        lineItems: [{
          plan: {
            appRecurringPricingDetails: {
              price: { amount: $amount, currencyCode: $currencyCode }
              interval: EVERY_30_DAYS
            }
          }
        }]
        requiresPaymentUpfront: true
      ) {
        userErrors {
          field
          message
        }
        confirmationUrl
        appSubscription {
          id
          status
        }
      }
    }
  `, {
    variables: {
      name: SUBSCRIPTION_PLAN.name,
      returnUrl: `${process.env.SHOPIFY_APP_URL}/app`,
      trialDays: SUBSCRIPTION_PLAN.trialDays,
      amount: SUBSCRIPTION_PLAN.amount,
      currencyCode: SUBSCRIPTION_PLAN.currencyCode
    }
  });

  const data = await response.json();
  
  if (data.data?.appSubscriptionCreate?.confirmationUrl) {
    return redirect(data.data.appSubscriptionCreate.confirmationUrl);
  }

  return json({
    error: data.data?.appSubscriptionCreate?.userErrors[0]?.message || "Er is een fout opgetreden"
  });
}

export default function BillingPage() {
  const [showPromoCode, setShowPromoCode] = useState(false);
  const actionData = useActionData<typeof action>();

  return (
    <Page title="Abonnement activeren">
      <Layout>
        <Layout.Section>
          {actionData?.error && (
            <Banner status="critical">{actionData.error}</Banner>
          )}
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">Red Devil Essentials Pro</Text>
              <Banner status="info">
                <p>Bij activering wordt er direct een betaling van €19 verwerkt voor de eerste periode na uw proefperiode.</p>
              </Banner>
              <List>
                <List.Item>14 dagen gratis uitproberen</List.Item>
                <List.Item>€19 per 30 dagen (eerste betaling direct)</List.Item>
                <List.Item>Op elk moment opzegbaar</List.Item>
              </List>
              <form method="post">
                <Button submit primary>Activeer nu</Button>
              </form>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
