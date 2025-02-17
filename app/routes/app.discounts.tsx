import { Page, Layout, LegacyCard, Tabs } from "@shopify/polaris";
import { useState, useCallback } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "~/shopify.server";
import { checkSubscription } from "~/utils/checkSubscription";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  // Check if user has active subscription
  await checkSubscription(admin);

  return json({
    // Add any initial data you need
  });
};

export default function DiscountsPage() {
  const [selected, setSelected] = useState(0);

  const tabs = [
    {
      id: 'dashboard',
      content: 'Dashboard',
      accessibilityLabel: 'Dashboard',
      panelID: 'dashboard-panel',
    },
    {
      id: 'products',
      content: 'Producten',
      accessibilityLabel: 'Products',
      panelID: 'products-panel',
    },
    {
      id: 'rules',
      content: 'Kortingsregels',
      accessibilityLabel: 'Discount rules',
      panelID: 'rules-panel',
    },
    {
      id: 'history',
      content: 'Prijsgeschiedenis',
      accessibilityLabel: 'Price history',
      panelID: 'history-panel',
    },
  ];

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelected(selectedTabIndex),
    [],
  );

  return (
    <Page title="Kortingen Beheer">
      <Layout>
        <Layout.Section>
          <LegacyCard>
            <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
              <LegacyCard.Section>
                {selected === 0 && <BulkPricingPanel />}
                {selected === 1 && <DiscountRulesPanel />}
              </LegacyCard.Section>
            </Tabs>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function BulkPricingPanel() {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [previewChanges, setPreviewChanges] = useState([]);
  
  return (
    <BlockStack gap="400">
      <DatePicker />
      <ProductSelector onSelect={setSelectedProducts} />
      <PriceRulesForm onPreview={setPreviewChanges} />
      <PreviewTable changes={previewChanges} />
      <ButtonGroup>
        <Button primary>Opslaan</Button>
        <Button>Preview</Button>
      </ButtonGroup>
    </BlockStack>
  );
}

function DiscountRulesPanel() {
  return (
    <div>
      {/* Implement discount rules UI here */}
    </div>
  );
}