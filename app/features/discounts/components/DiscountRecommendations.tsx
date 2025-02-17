import {
  Card,
  Text,
  Box,
  BlockStack,
  DataTable,
  ProgressBar,
  Button,
  Banner,
} from "@shopify/polaris";
import { useState } from "react";

interface Recommendation {
  category: string;
  suggestedDiscount: number;
  expectedRevenue: number;
  confidence: number;
  reasoning: string;
}

interface DiscountRecommendationsProps {
  recommendations: Recommendation[];
  onApplyRecommendation: (recommendation: Recommendation) => void;
}

export function DiscountRecommendations({
  recommendations,
  onApplyRecommendation,
}: DiscountRecommendationsProps) {
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);

  const rows = recommendations.map(rec => [
    rec.category,
    `${rec.suggestedDiscount.toFixed(1)}%`,
    `$${rec.expectedRevenue.toFixed(2)}`,
    <ProgressBar
      progress={rec.confidence * 100}
      size="small"
      tone={rec.confidence > 0.7 ? "success" : rec.confidence > 0.4 ? "warning" : "critical"}
    />,
    <Button
      onClick={() => setSelectedRecommendation(rec)}
      size="slim"
    >
      View Details
    </Button>,
  ]);

  return (
    <BlockStack gap="400">
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">Discount Recommendations</Text>
            <DataTable
              columnContentTypes={["text", "numeric", "numeric", "numeric", "text"]}
              headings={[
                "Category",
                "Suggested Discount",
                "Expected Revenue",
                "Confidence",
                "Actions",
              ]}
              rows={rows}
            />
          </BlockStack>
        </Box>
      </Card>

      {selectedRecommendation && (
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">
                Recommendation Details: {selectedRecommendation.category}
              </Text>
              
              <Banner tone="info">
                {selectedRecommendation.reasoning}
              </Banner>

              <BlockStack gap="200">
                <Text variant="bodyMd" as="p">
                  Suggested Discount: {selectedRecommendation.suggestedDiscount.toFixed(1)}%
                </Text>
                <Text variant="bodyMd" as="p">
                  Expected Revenue: ${selectedRecommendation.expectedRevenue.toFixed(2)}
                </Text>
                <Text variant="bodyMd" as="p">
                  Confidence Score: {(selectedRecommendation.confidence * 100).toFixed(1)}%
                </Text>
              </BlockStack>

              <Button
                primary
                onClick={() => onApplyRecommendation(selectedRecommendation)}
              >
                Apply This Recommendation
              </Button>
            </BlockStack>
          </Box>
        </Card>
      )}
    </BlockStack>
  );
}