import { useSubmit } from "@remix-run/react";
import { Card, Button, Box, Text } from "@shopify/polaris";

interface RestorePriceProps {
  productId: string;
  originalPrice: number;
}

export function RestorePrice({ productId, originalPrice }: RestorePriceProps) {
  const submit = useSubmit();

  const handleRestore = () => {
    const formData = new FormData();
    formData.append("action", "restore");
    formData.append("productId", productId);
    submit(formData, { method: "POST" });
  };

  return (
    <Card sectioned>
      <Box>
        <Text as="p" variant="bodyMd">
          Original price: ${originalPrice.toFixed(2)}
        </Text>
        <Button
          destructive
          onClick={handleRestore}
          accessibilityLabel="Restore original price"
        >
          Restore Original Price
        </Button>
      </Box>
    </Card>
  );
}