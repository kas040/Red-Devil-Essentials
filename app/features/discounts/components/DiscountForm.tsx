import { useState, useCallback } from "react";
import { useSubmit } from "@remix-run/react";
import {
  Card,
  TextField,
  Select,
  Button,
  DatePicker,
  Box,
  InlineStack,
  Tag,
  FormLayout,
  Banner,
  Text,
} from "@shopify/polaris";
import { format, startOfToday, addDays } from "date-fns";
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
  const [startDate, setStartDate] = useState(startOfToday());
  const [endDate, setEndDate] = useState(addDays(startOfToday(), 7));
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const handleAddTag = useCallback((tag: string, type: "add" | "remove") => {
    if (!tag) return;
    if (type === "add") {
      setTagsToAdd(prev => [...prev, tag]);
    } else {
      setTagsToRemove(prev => [...prev, tag]);
    }
    setNewTag("");
  }, []);

  const handleRemoveTag = useCallback((tag: string, type: "add" | "remove") => {
    if (type === "add") {
      setTagsToAdd(prev => prev.filter(t => t !== tag));
    } else {
      setTagsToRemove(prev => prev.filter(t => t !== tag));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Add schedule and tags data
    formData.append("startDate", format(startDate, "yyyy-MM-dd'T'HH:mm:ssXXX"));
    if (endDate) {
      formData.append("endDate", format(endDate, "yyyy-MM-dd'T'HH:mm:ssXXX"));
    }
    formData.append("tagsToAdd", JSON.stringify(tagsToAdd));
    formData.append("tagsToRemove", JSON.stringify(tagsToRemove));
    
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
            
            <Box padding="400">
              <Text variant="headingMd" as="h3">Schedule</Text>
              <FormLayout>
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
                  label="End Date (Optional)"
                />
              </FormLayout>
            </Box>
            
            <Box padding="400">
              <Text variant="headingMd" as="h3">Tags</Text>
              <FormLayout>
                <Box padding="200">
                  <Text variant="bodyMd">Tags to Add:</Text>
                  <InlineStack gap="200" wrap>
                    {tagsToAdd.map(tag => (
                      <Tag key={tag} onRemove={() => handleRemoveTag(tag, "add")}>
                        {tag}
                      </Tag>
                    ))}
                    <TextField
                      label="New tag to add"
                      labelHidden
                      value={newTag}
                      onChange={setNewTag}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag(newTag, "add");
                        }
                      }}
                      placeholder="Press Enter to add tag"
                    />
                  </InlineStack>
                </Box>
                
                <Box padding="200">
                  <Text variant="bodyMd">Tags to Remove:</Text>
                  <InlineStack gap="200" wrap>
                    {tagsToRemove.map(tag => (
                      <Tag key={tag} onRemove={() => handleRemoveTag(tag, "remove")}>
                        {tag}
                      </Tag>
                    ))}
                    <TextField
                      label="New tag to remove"
                      labelHidden
                      value={newTag}
                      onChange={setNewTag}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag(newTag, "remove");
                        }
                      }}
                      placeholder="Press Enter to add tag"
                    />
                  </InlineStack>
                </Box>
              </FormLayout>
            </Box>
            
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