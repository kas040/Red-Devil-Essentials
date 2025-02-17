import { Page, Layout, DataTable, Card, Filters, Button } from "@shopify/polaris";
import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { discountManager } from "~/models/DiscountManager";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  
  const response = await admin.graphql(`
    query GetProducts {
      products(first: 50) {
        edges {
          node {
            id
            title
            vendor
            productType
            variants(first: 1) {
              edges {
                node {
                  price
                }
              }
            }
          }
        }
      }
    }
  `);

  const data = await response.json();
  return json({ products: data.data.products.edges });
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const { productId, action, ruleIds } = Object.fromEntries(formData);

  switch (action) {
    case 'apply': {
      const newPrice = await discountManager.applyRulesToProduct(productId, ruleIds);
      return json({ success: true, newPrice });
    }
    case 'publish': {
      const product = await admin.rest.resources.Product.find({ id: productId });
      const variantId = product.variants[0].id;
      const newPrice = await discountManager.applyRulesToProduct(productId, ruleIds);
      await discountManager.updateShopifyPrice(admin, productId, variantId, newPrice);
      return json({ success: true });
    }
    default:
      return json({ error: "Invalid action" }, { status: 400 });
  }
}

export default function ProductList() {
  const navigate = useNavigate();
  const [queryValue, setQueryValue] = useState("");
  
  const rows = products.map(({ node: product }) => [
    product.id,
    product.title,
    product.variants.edges[0]?.node.price || "0",
    calculateDiscountedPrice(product), // Implement this helper
    <Button onClick={() => navigate(`/app/discounts/products/${product.id}`)}>
      Details
    </Button>
  ]);

  return (
    <Page title="Producten">
      <Layout>
        <Layout.Section>
          <Card>
            <Card.Section>
              <Filters
                queryValue={queryValue}
                filters={[
                  {
                    key: 'vendor',
                    label: 'Leverancier',
                    operatorText: 'is',
                    type: 'select',
                  },
                  {
                    key: 'type',
                    label: 'Producttype',
                    operatorText: 'is',
                    type: 'select',
                  },
                ]}
                onQueryChange={setQueryValue}
                onQueryClear={() => setQueryValue("")}
              />
            </Card.Section>
            <DataTable
              columnContentTypes={['text', 'text', 'numeric', 'numeric', 'text']}
              headings={['ID', 'Product', 'Huidige prijs', 'Nieuwe prijs', 'Acties']}
              rows={rows}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
