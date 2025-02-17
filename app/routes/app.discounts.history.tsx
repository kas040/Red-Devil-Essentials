import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { getProductMetafields } from "~/utils/price.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query getProducts {
      products(first: 50) {
        nodes {
          id
          title
        }
      }
    }
  `);

  const { data } = await response.json();

  const priceHistory = await Promise.all(
    data.products.nodes.map(async (product: any) => {
      const metafields = await getProductMetafields(
        product.id.split("/").pop(),
        admin
      );
      return {
        productId: product.id,
        productTitle: product.title,
        history: metafields?.priceHistory || [],
      };
    })
  );

  return json({ priceHistory });
};

export default function PriceHistoryPage() {
  const { priceHistory } = useLoaderData<typeof loader>();

  const rows = priceHistory.flatMap((item) =>
    item.history.map((change: any) => [
      item.productTitle,
      `$${change.oldPrice}`,
      `$${change.newPrice}`,
      new Date(change.date).toLocaleString(),
      <Badge status={change.ruleId ? "success" : "info"}>
        {change.ruleId ? "Rule Applied" : "Manual Change"}
      </Badge>,
    ])
  );

  return (
    <Page
      title="Price History"
      subtitle="View all price changes across your products"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={["text", "numeric", "numeric", "text", "text"]}
              headings={[
                "Product",
                "Old Price",
                "New Price",
                "Date",
                "Type",
              ]}
              rows={rows}
              footerContent={`${rows.length} price changes`}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}