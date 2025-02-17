import { useSubmit } from "@remix-run/react";
import { Card, Button, TextContainer } from "@shopify/polaris";

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
      <TextContainer>
        <p>
          Original price: ${originalPrice.toFixed(2)}
        </p>
        <Button
          destructive
          onClick={handleRestore}
          accessibilityLabel="Restore original price"
        >
          Restore Original Price
        </Button>
      </TextContainer>
    </Card>
  );
}