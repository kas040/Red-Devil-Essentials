import { useState } from "react";
import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Banner,
  Card,
  Tabs,
  Loading,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { getProductMetafields, updateProductPrice, restoreOriginalPrice } from "~/utils/price.server";
import { ProductList } from "~/features/discounts/components/ProductList";
import { DiscountForm } from "~/features/discounts/components/DiscountForm";
import { RestorePrice } from "~/features/discounts/components/RestorePrice";
import { BulkSelectionForm, type BulkSelectionCriteria } from "~/features/discounts/components/BulkSelectionForm";
import { PricePreview } from "~/features/discounts/components/PricePreview";
import type { DiscountRule } from "~/types/discount";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Fetch products
  const productsResponse = await admin.graphql(`
    query getProducts {
      products(first: 50) {
        nodes {
          id
          title
          variants(first: 1) {
            nodes {
              price
            }
          }
          vendor
          productType
        }
      }
    }
  `);

  // Fetch collections
  const collectionsResponse = await admin.graphql(`
    query getCollections {
      collections(first: 50) {
        nodes {
          id
          title
        }
      }
    }
  `);

  const { data: productsData } = await productsResponse.json();
  const { data: collectionsData } = await collectionsResponse.json();

  const products = await Promise.all(
    productsData.products.nodes.map(async (product: any) => {
      const metafields = await getProductMetafields(
        product.id.split("/").pop(),
        admin
      );
      return {
        ...product,
        vendor: product.vendor,
        productType: product.productType,
        currentPrice: parseFloat(product.variants.nodes[0].price),
        originalPrice: metafields?.originalPrice || parseFloat(product.variants.nodes[0].price),
        activeRules: metafields?.activeRules || [],
      };
    })
  );

  // Prepare unique values for filters
  const vendors = [...new Set(products.map(p => p.vendor))].filter(Boolean).map(v => ({
    label: v,
    value: v,
  }));

  const productTypes = [...new Set(products.map(p => p.productType))].filter(Boolean).map(t => ({
    label: t,
    value: t,
  }));

  const collections = collectionsData.collections.nodes.map((c: any) => ({
    label: c.title,
    value: c.id,
  }));

  return json({
    products,
    collections,
    vendors,
    productTypes,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");
  const productId = formData.get("productId") as string;

  try {
    if (action === "restore") {
      await restoreOriginalPrice(productId, admin);
      return json({ success: true, message: "Price restored successfully" });
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
      return json({ success: true, message: "Price updated successfully" });
    }

    return json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating price:", error);
    return json(
      { success: false, message: "Failed to update price" },
      { status: 500 }
    );
  }
};

export default function DiscountsPage() {
  const { products, collections, vendors, productTypes } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState(0);
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [isLoading, setIsLoading] = useState(false);
  const [previewRule, setPreviewRule] = useState<Partial<DiscountRule>>({});

  const handleBulkSearch = async (criteria: BulkSelectionCriteria) => {
    setIsLoading(true);
    // Filter products based on criteria
    let filtered = [...products];
    
    switch (criteria.type) {
      case "collection":
        // Implement collection filtering
        break;
      case "vendor":
        filtered = products.filter(p => 
          p.vendor?.toLowerCase().includes(criteria.value.toLowerCase())
        );
        break;
      case "productType":
        filtered = products.filter(p => 
          p.productType?.toLowerCase().includes(criteria.value.toLowerCase())
        );
        break;
      case "ids":
        const ids = criteria.value.split(",").map(id => id.trim());
        filtered = products.filter(p => ids.includes(p.id));
        break;
    }
    
    setFilteredProducts(filtered);
    setIsLoading(false);
  };

  const handleProductSelect = (productId: string, selected: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (selected) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const tabs = [
    {
      id: "products",
      content: "Products",
      accessibilityLabel: "Products list",
      panelID: "products-panel",
    },
    {
      id: "history",
      content: "Price History",
      accessibilityLabel: "Price change history",
      panelID: "history-panel",
    },
  ];

  return (
    <Page
      title="Discount Manager"
      subtitle="Manage product prices and discounts"
    >
      <Layout>
        {actionData?.message && (
          <Layout.Section>
            <Banner
              tone={actionData.success ? "success" : "critical"}
              onDismiss={() => {}}
            >
              {actionData.message}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <Tabs
              tabs={tabs}
              selected={selectedTab}
              onSelect={setSelectedTab}
            />
          </Card>
        </Layout.Section>

        {selectedTab === 0 && (
          <>
            <Layout.Section>
              <BulkSelectionForm
                onSearch={handleBulkSearch}
                onClear={() => setFilteredProducts(products)}
                collections={collections}
                vendors={vendors}
                productTypes={productTypes}
              />
            </Layout.Section>

            <Layout.Section>
              {isLoading ? (
                <Card sectioned>
                  <Loading />
                </Card>
              ) : (
              <ProductList
                products={filteredProducts}
                onSelectProduct={setSelectedProduct}
                selectedProducts={selectedProducts}
                onProductSelect={handleProductSelect}
              />
              )}
            </Layout.Section>

            {(selectedProduct || selectedProducts.size > 0) && (
              <Layout.Section secondary>
                <DiscountForm
                  productId={selectedProduct?.id.split("/").pop()}
                  productTitle={selectedProduct?.title || `${selectedProducts.size} products selected`}
                  isBulkUpdate={selectedProducts.size > 0}
                  selectedProductIds={Array.from(selectedProducts)}
                  onRuleChange={setPreviewRule}
                  onSuccess={() => setSelectedProduct(null)}
                />

                <PricePreview
                  products={selectedProduct ? [selectedProduct] : 
                    filteredProducts.filter(p => selectedProducts.has(p.id))}
                  rule={previewRule}
                />

                {selectedProduct && (
                  <RestorePrice
                    productId={selectedProduct.id.split("/").pop()}
                    originalPrice={selectedProduct.originalPrice}
                  />
                )}
              </Layout.Section>
            )}
          </>
        )}

        {selectedTab === 1 && (
          <Layout.Section>
            <Card title="Price History">
              <Box padding="400">
                {/* Implement price history view */}
                <p>Price history view coming soon...</p>
              </Box>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}