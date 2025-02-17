import { useState, useCallback } from "react";
import {
  Card,
  FormLayout,
  Select,
  TextField,
  Button,
  InlineStack,
  Text,
  Box,
} from "@shopify/polaris";

interface BulkSelectionFormProps {
  onSearch: (criteria: BulkSelectionCriteria) => void;
  onClear: () => void;
}

export interface BulkSelectionCriteria {
  type: "collection" | "vendor" | "productType" | "ids";
  value: string;
}

export function BulkSelectionForm({ onSearch, onClear }: BulkSelectionFormProps) {
  const [selectedType, setSelectedType] = useState<string>("collection");
  const [searchValue, setSearchValue] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<BulkSelectionCriteria[]>([]);

  const handleSearch = useCallback(() => {
    const criteria: BulkSelectionCriteria = {
      type: selectedType as BulkSelectionCriteria["type"],
      value: searchValue,
    };
    setAppliedFilters((prev) => [...prev, criteria]);
    onSearch(criteria);
    setSearchValue("");
  }, [selectedType, searchValue, onSearch]);

  const handleRemoveFilter = useCallback(
    (index: number) => {
      setAppliedFilters((prev) => prev.filter((_, i) => i !== index));
      onClear();
    },
    [onClear]
  );

  return (
    <Card title="Bulk Selection">
      <Card.Section>
        <FormLayout>
          <Select
            label="Selection Type"
            options={[
              { label: "Collection", value: "collection" },
              { label: "Vendor", value: "vendor" },
              { label: "Product Type", value: "productType" },
              { label: "Product IDs", value: "ids" },
            ]}
            value={selectedType}
            onChange={setSelectedType}
          />

          <TextField
            label="Search Value"
            value={searchValue}
            onChange={setSearchValue}
            placeholder={
              selectedType === "ids"
                ? "Enter comma-separated product IDs"
                : "Enter search term"
            }
          />

          <Button onClick={handleSearch} disabled={!searchValue}>
            Add Filter
          </Button>
        </FormLayout>
      </Card.Section>

      {appliedFilters.length > 0 && (
        <Box padding="400">
          <Text as="h3" variant="headingMd">Applied Filters</Text>
          <InlineStack gap="200" wrap>
            {appliedFilters.map((filter, index) => (
              <Box
                key={index}
                background="bg-surface-secondary"
                padding="200"
                borderRadius="200"
                borderWidth="025"
                borderColor="border"
              >
                <InlineStack gap="200" align="center">
                  <Text>{filter.type}: {filter.value}</Text>
                  <Button
                    variant="plain"
                    onClick={() => handleRemoveFilter(index)}
                    accessibilityLabel={`Remove filter ${filter.type}`}
                  >
                    ✕
                  </Button>
                </InlineStack>
              </Box>
            ))}
          </InlineStack>
        </Box>
      )}
    </Card>
  );
}