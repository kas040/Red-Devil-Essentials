import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useNavigate, useRouteError } from "@remix-run/react";
import { AppProvider } from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { NavigationMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Check subscription status
  const subscriptionResponse = await admin.graphql(`
    query getSubscription {
      appInstallation {
        activeSubscriptions {
          status
          currentPeriodEnd
        }
      }
    }
  `);

  const data = await subscriptionResponse.json();
  
  return json({
    apiKey: process.env.SHOPIFY_API_KEY,
    subscription: data.data.appInstallation.activeSubscriptions[0] || null
  });
};

export default function App() {
  const { apiKey, subscription } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const navigationItems = [
    {
      label: "Dashboard",
      destination: "/app/discounts",
    },
    {
      label: "Producten",
      destination: "/app/discounts/products",
    },
    {
      label: "Kortingsregels",
      destination: "/app/discounts/rules",
    },
    {
      label: "Prijsgeschiedenis",
      destination: "/app/discounts/history",
    },
  ];

  return (
    <AppProvider>
      <NavigationMenu 
        navigationLinks={navigationItems}
      />
      {!subscription && (
        <Banner status="warning">
          <p>Start uw gratis proefperiode om gebruik te maken van alle functies.</p>
          <Button onClick={() => navigate("/app/billing")}>Start proefperiode</Button>
        </Banner>
      )}
      <Outlet />
    </AppProvider>
  );
}

// Error boundary
export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <AppProvider>
      <Page>
        <Banner status="critical">
          <p>Er is een fout opgetreden: {error.message}</p>
        </Banner>
      </Page>
    </AppProvider>
  );
}