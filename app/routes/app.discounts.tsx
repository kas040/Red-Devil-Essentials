import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  DataTable,
  TextField,
  Select,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getProductMetafields, updateProductPrice, restoreOriginalPrice } from "~/utils/price.server";
import type { DiscountRule } from "~/types/discount";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query getProducts {
      products(first: 10) {
        nodes {
          id
          title
          variants(first: 1) {
            nodes {
              price
            }
          }
        }
      }
    }
  `);

  const { data } = await response.json();

  const products = await Promise.all(
    data.products.nodes.map(async (product: any) => {
      const metafields = await getProductMetafields(product.id.split("/").pop(), admin);
      return {
        ...product,
        currentPrice: product.variants.nodes[0].price,
        originalPrice: metafields?.originalPrice || product.variants.nodes[0].price,
        activeRules: metafields?.activeRules || [],
      };
    })
  );

  return json({ products });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");
  const productId = formData.get("productId") as string;

  if (action === "restore") {
    await restoreOriginalPrice(productId, admin);
    return json({ success: true });
  }

  if (action === "update") {
    const newPrice = parseFloat(formData.get("price") as string);
    const rule: DiscountRule = {
      id: crypto.randomUUID(),
      name: formData.get("ruleName") as string,
      type: formData.get("ruleType") as "percentage" | "fixed" | "formula",
      value: formData.get("ruleValue") as string,
      target: "product",
      targetId: productId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await updateProductPrice(productId, newPrice, rule, admin);
    return json({ success: true });
  }

  return json({ error: "Invalid action" }, { status: 400 });
};

export default function DiscountsPage() {
  const { products } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const rows = products.map((product: any) => [
    product.title,
    `$${product.currentPrice}`,
    `$${product.originalPrice}`,
    product.activeRules.length ? 
      product.activeRules.map((rule: DiscountRule) => rule.name).join(", ") :
      "None",
    <Button
      onClick={() => setSelectedProduct(product)}
      variant="primary"
    >
      Manage
    </Button>,
  ]);

  return (
    <Page title="Discount Manager">
      <Layout>
        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={["text", "numeric", "numeric", "text", "text"]}
              headings={["Product", "Current Price", "Original Price", "Active Rules", "Actions"]}
              rows={rows}
            />
          </Card>
        </Layout.Section>

        {selectedProduct && (
          <Layout.Section>
            <Card title={`Manage Price: ${selectedProduct.title}`}>
              <Card.Section>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    submit(formData, { method: "POST" });
                  }}
                >
                  <input type="hidden" name="productId" value={selectedProduct.id.split("/").pop()} />
                  <input type="hidden" name="action" value="update" />
                  
                  <TextField
                    label="Rule Name"
                    name="ruleName"
                    autoComplete="off"
                    required
                  />
                  
                  <Select
                    label="Rule Type"
                    name="ruleType"
                    options={[
                      { label: "Percentage", value: "percentage" },
                      { label: "Fixed Amount", value: "fixed" },
                      { label: "Formula", value: "formula" },
                    ]}
                  />
                  
                  <TextField
                    label="Rule Value"
                    name="ruleValue"
                    autoComplete="off"
                    required
                  />
                  
                  <TextField
                    label="New Price"
                    name="price"
                    type="number"
                    step="0.01"
                    autoComplete="off"
                    required
                  />
                  
                  <Button submit>Apply Price</Button>
                </form>
              </Card.Section>
              
              <Card.Section>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData();
                    formData.append("action", "restore");
                    formData.append("productId", selectedProduct.id.split("/").pop());
                    submit(formData, { method: "POST" });
                  }}
                >
                  <Button destructive submit>
                    Restore Original Price
                  </Button>
                </form>
              </Card.Section>
            </Card>
          </Layout.Section>
        )}

        {actionData?.success && (
          <Layout.Section>
            <Banner status="success">
              Price updated successfully
            </Banner>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}