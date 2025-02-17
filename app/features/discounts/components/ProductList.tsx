import {
  Card,
  DataTable,
  Button,
  Badge,
  Stack,
  Checkbox,
} from "@shopify/polaris";
import type { DiscountRule } from "~/types/discount";

interface Product {
  id: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  activeRules: DiscountRule[];
}

interface ProductListProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  selectedProducts: Set<string>;
  onProductSelect: (productId: string, selected: boolean) => void;
}

export function ProductList({
  products,
  onSelectProduct,
  selectedProducts,
  onProductSelect,
}: ProductListProps) {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const rows = products.map((product) => [
    <Checkbox
      label="Select product"
      checked={selectedProducts.has(product.id)}
      onChange={(checked) => onProductSelect(product.id, checked)}
    />,
    product.title,
    formatPrice(product.currentPrice),
    formatPrice(product.originalPrice),
    <Stack spacing="tight">
      {product.activeRules.length ? (
        product.activeRules.map((rule) => (
          <Badge key={rule.id} status="success">
            {rule.name}
          </Badge>
        ))
      ) : (
        <Badge status="info">No active rules</Badge>
      )}
    </Stack>,
    <Button onClick={() => onSelectProduct(product)}>
      Manage
    </Button>,
  ]);

  return (
    <Card>
      <DataTable
        columnContentTypes={["text", "text", "numeric", "numeric", "text", "text"]}
        headings={["Select", "Product", "Current Price", "Original Price", "Active Rules", "Actions"]}
        rows={rows}
        footerContent={`${selectedProducts.size} selected of ${products.length} products`}
      />
    </Card>
  );
}