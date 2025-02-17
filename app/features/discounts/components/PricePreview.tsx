import { useState, useEffect } from "react";
import { Card, DataTable, Text, Box } from "@shopify/polaris";
import { useDiscountCalculator } from "~/features/discounts/hooks/useDiscountCalculator";
import type { DiscountRule } from "~/types/discount";

interface PricePreviewProps {
  products: Array<{
    id: string;
    title: string;
    currentPrice: number;
  }>;
  rule: Partial<DiscountRule>;
}

export function PricePreview({ products, rule }: PricePreviewProps) {
  const { calculateDiscount } = useDiscountCalculator();
  const [previewData, setPreviewData] = useState<Array<[string, string, string, string]>>([]);

  useEffect(() => {
    if (!rule.type || !rule.value) return;

    const newPreviewData = products.map(product => {
      const newPrice = calculateDiscount(product.currentPrice, rule as DiscountRule);
      const discount = product.currentPrice - newPrice;
      const percentOff = ((discount / product.currentPrice) * 100).toFixed(1);

      return [
        product.title,
        `$${product.currentPrice.toFixed(2)}`,
        `$${newPrice.toFixed(2)}`,
        `${percentOff}%`,
      ];
    });

    setPreviewData(newPreviewData);
  }, [products, rule, calculateDiscount]);

  if (!rule.type || !rule.value || products.length === 0) {
    return null;
  }

  return (
    <Card title="Price Preview">
      <Box padding="400">
        <Text variant="bodyMd" as="p" color="subdued">
          Preview how the discount will affect your product prices
        </Text>
        <Box paddingBlockStart="400">
          <DataTable
            columnContentTypes={["text", "numeric", "numeric", "numeric"]}
            headings={["Product", "Current Price", "New Price", "Discount"]}
            rows={previewData}
            footerContent={`Showing preview for ${products.length} products`}
          />
        </Box>
      </Box>
    </Card>
  );
}