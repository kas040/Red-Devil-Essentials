import { Page, Layout, Card, ButtonGroup, Button, Banner, Toast } from "@shopify/polaris";
import { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { PriceHistoryTable } from "~/components/PriceHistoryTable";
import { ActiveRulesList } from "~/components/ActiveRulesList";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const { id } = params;

  const response = await admin.graphql(`
    query GetProduct($id: ID!) {
      product(id: $id) {
        id
        title
        variants(first: 1) {
          edges {
            node {
              id
              price
            }
          }
        }
      }
    }
  `, {
    variables: { id: `gid://shopify/Product/${id}` }
  });

  const data = await response.json();
  return json({ 
    product: data.data.product,
    priceHistory: [], // Fetch from your database
    activeRules: []   // Fetch from your database
  });
}

export default function ProductDetail() {
  const { product, priceHistory, activeRules } = useLoaderData<typeof loader>();
  const [showToast, setShowToast] = useState(false);
  const submit = useSubmit();

  const handleApplyPrice = () => {
    submit({ action: 'apply' }, { method: 'post' });
  };

  const handleUpdateShopify = () => {
    submit({ action: 'publish' }, { method: 'post' });
  };

  return (
    <Page
      title={product.title}
      backAction={{ content: 'Producten', url: '/app/discounts/products' }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Card.Section title="Product Details">
              <p>Shopify ID: {product.id}</p>
              <p>Huidige prijs: €{product.variants.edges[0].node.price}</p>
              <p>Berekende prijs: €{/* Calculate new price */}</p>
            </Card.Section>
            <Card.Section>
              <ButtonGroup>
                <Button primary onClick={handleApplyPrice}>Apply Price</Button>
                <Button onClick={handleUpdateShopify}>Update on Shopify</Button>
                <Button>Preview</Button>
              </ButtonGroup>
            </Card.Section>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <ActiveRulesList rules={activeRules} />
        </Layout.Section>

        <Layout.Section>
          <PriceHistoryTable history={priceHistory} />
        </Layout.Section>
      </Layout>
      {showToast && (
        <Toast content="Prijzen bijgewerkt" onDismiss={() => setShowToast(false)} />
      )}
    </Page>
  );
}
