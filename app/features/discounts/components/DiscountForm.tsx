import { useState } from "react";
import { useSubmit } from "@remix-run/react";
import {
  Card,
  TextField,
  Select,
  Button,
  FormLayout,
  DatePicker,
  Banner,
} from "@shopify/polaris";
import type { DiscountRule } from "~/types/discount";

interface DiscountFormProps {
  productId: string;
  productTitle: string;
  isBulkUpdate?: boolean;
  selectedProductIds?: string[];
  onSuccess?: () => void;
}

export function DiscountForm({
  productId,
  productTitle,
  isBulkUpdate,
  selectedProductIds = [],
  onSuccess,
}: DiscountFormProps) {
  const submit = useSubmit();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    submit(formData, { method: "POST" });
    onSuccess?.();
  };

  return (
    <Card title={`Manage Price: ${productTitle}`}>
      <Card.Section>
        {isBulkUpdate && (
          <Banner status="info">
            This update will affect {selectedProductIds.length} products
          </Banner>
        )}
        <form onSubmit={handleSubmit}>
          <FormLayout>
            {isBulkUpdate ? (
              <input
                type="hidden"
                name="productIds"
                value={selectedProductIds.join(",")}
              />
            ) : (
              <input type="hidden" name="productId" value={productId} />
            )}
            <input type="hidden" name="action" value="update" />
            
            <TextField
              label="Rule Name"
              name="ruleName"
              autoComplete="off"
              required
              helpText="Give your discount rule a descriptive name"
            />
            
            <Select
              label="Rule Type"
              name="ruleType"
              options={[
                { label: "Percentage Off", value: "percentage" },
                { label: "Fixed Amount Off", value: "fixed" },
                { label: "Custom Formula", value: "formula" },
              ]}
              helpText="Choose how you want to calculate the discount"
            />
            
            <TextField
              label="Rule Value"
              name="ruleValue"
              autoComplete="off"
              required
              helpText="Enter percentage, amount, or formula"
            />
            
            <DatePicker
              month={startDate.getMonth()}
              year={startDate.getFullYear()}
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              label="Start Date"
            />
            
            <DatePicker
              month={endDate.getMonth()}
              year={endDate.getFullYear()}
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              label="End Date"
            />
            
            <TextField
              label="New Price"
              name="price"
              type="number"
              step="0.01"
              autoComplete="off"
              required
              prefix="$"
              helpText="The final price after applying the discount"
            />
            
            <Button primary submit>
              Apply Price Change
            </Button>
          </FormLayout>
        </form>
      </Card.Section>
    </Card>
  );
}