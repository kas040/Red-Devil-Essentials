import { useState } from "react";
import { Page, Layout, DataTable, Card, Button, ButtonGroup } from "@shopify/polaris";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { PriceHistory } from "~/types/discount";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Implement price history fetching
  return json({ priceHistory: [] as PriceHistory[] });
};

export default function DiscountHistory() {
  const { priceHistory } = useLoaderData<typeof loader>();
  
  const rows = priceHistory.map(entry => [
    entry.productId,
    entry.oldPrice.toFixed(2),
    entry.newPrice.toFixed(2),
    new Date(entry.timestamp).toLocaleString(),
    <ButtonGroup>
      <Button onClick={() => handleRestore(entry.id)}>Restore</Button>
    </ButtonGroup>
  ]);

  return (
    <Page title="Price History">
      <Layout>
        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={['text', 'numeric', 'numeric', 'text', 'text']}
              headings={['Product', 'Old Price', 'New Price', 'Date', 'Actions']}
              rows={rows}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}