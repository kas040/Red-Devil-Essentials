import { Filters, TextField, Select } from "@shopify/polaris";
import { useCallback, useState } from "react";

export function ProductFilters({ onFiltersChange }) {
  const [queryValue, setQueryValue] = useState("");
  const [vendorValue, setVendorValue] = useState("");
  const [typeValue, setTypeValue] = useState("");

  const handleFiltersChange = useCallback(() => {
    onFiltersChange({
      query: queryValue,
      vendor: vendorValue,
      type: typeValue
    });
  }, [queryValue, vendorValue, typeValue, onFiltersChange]);

  const handleQueryChange = useCallback((value: string) => {
    setQueryValue(value);
    handleFiltersChange();
  }, [handleFiltersChange]);

  return (
    <Filters
      queryValue={queryValue}
      queryPlaceholder="Zoek op productnaam..."
      onQueryChange={handleQueryChange}
      onQueryClear={() => handleQueryChange("")}
      filters={[
        {
          key: 'vendor',
          label: 'Leverancier',
          filter: (
            <Select
              options={[
                { label: 'Alle leveranciers', value: '' },
                // Add vendor options dynamically
              ]}
              value={vendorValue}
              onChange={(value) => {
                setVendorValue(value);
                handleFiltersChange();
              }}
            />
          ),
        },
        {
          key: 'type',
          label: 'Producttype',
          filter: (
            <Select
              options={[
                { label: 'Alle types', value: '' },
                // Add type options dynamically
              ]}
              value={typeValue}
              onChange={(value) => {
                setTypeValue(value);
                handleFiltersChange();
              }}
            />
          ),
        },
      ]}
    />
  );
}
