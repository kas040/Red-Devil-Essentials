import { useState, useCallback } from "react";
import {
  Card,
  FormLayout,
  Select,
  TextField,
  Button,
  Stack,
  Text,
  Box,
  Autocomplete,
  Tag,
} from "@shopify/polaris";

interface BulkSelectionFormProps {
  onSearch: (criteria: BulkSelectionCriteria) => void;
  onClear: () => void;
  collections: Array<{ label: string; value: string }>;
  vendors: Array<{ label: string; value: string }>;
  productTypes: Array<{ label: string; value: string }>;
}

export interface BulkSelectionCriteria {
  type: "collection" | "vendor" | "productType" | "ids";
  value: string;
}

export function BulkSelectionForm({
  onSearch,
  onClear,
  collections,
  vendors,
  productTypes,
}: BulkSelectionFormProps) {
  const [selectedType, setSelectedType] = useState<string>("collection");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<BulkSelectionCriteria[]>([]);

  const getOptions = useCallback(() => {
    switch (selectedType) {
      case "collection":
        return collections;
      case "vendor":
        return vendors;
      case "productType":
        return productTypes;
      default:
        return [];
    }
  }, [selectedType, collections, vendors, productTypes]);

  const options = getOptions().filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSearch = useCallback(() => {
    if (selectedOptions.length === 0) return;

    const criteria: BulkSelectionCriteria = {
      type: selectedType as BulkSelectionCriteria["type"],
      value: selectedOptions.join(","),
    };
    setAppliedFilters((prev) => [...prev, criteria]);
    onSearch(criteria);
    setSelectedOptions([]);
  }, [selectedType, selectedOptions, onSearch]);

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
            onChange={(value) => {
              setSelectedType(value);
              setSelectedOptions([]);
              setInputValue("");
            }}
          />

          {selectedType === "ids" ? (
            <TextField
              label="Product IDs"
              value={inputValue}
              onChange={setInputValue}
              placeholder="Enter comma-separated product IDs"
              helpText="Example: gid://shopify/Product/123,gid://shopify/Product/456"
            />
          ) : (
            <Autocomplete
              allowMultiple
              options={options}
              selected={selectedOptions}
              textField={
                <Autocomplete.TextField
                  onChange={setInputValue}
                  label="Search"
                  value={inputValue}
                  placeholder={`Search ${selectedType}s...`}
                />
              }
              onSelect={(selected) => {
                setSelectedOptions(selected);
                setInputValue("");
              }}
            />
          )}

          <Button onClick={handleSearch} disabled={selectedType === "ids" ? !inputValue : selectedOptions.length === 0}>
            Add Filter
          </Button>
        </FormLayout>
      </Card.Section>

      {appliedFilters.length > 0 && (
        <Box padding="400">
          <Stack vertical spacing="tight">
            <Text as="h3" variant="headingMd">Applied Filters</Text>
            <Stack spacing="tight">
            {appliedFilters.map((filter, index) => (
              <Tag
                key={index}
                onRemove={() => handleRemoveFilter(index)}
              >
                {filter.type}: {filter.value}
              </Tag>
            ))}
            </Stack>
          </Stack>
        </Box>
      )}
    </Card>
  );
}