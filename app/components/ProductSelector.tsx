import { Card, Tabs, ResourcePicker, Button, Tag, Stack } from "@shopify/polaris";
import { useState, useCallback } from "react";
import type { ProductSelection } from "~/types/discount";

export function ProductSelector({ onSelect }: { onSelect: (selection: ProductSelection) => void }) {
  const [selected, setSelected] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const tabs = [
    {
      id: 'collection',
      content: 'Collectie',
      accessibilityLabel: 'Collection',
      panelID: 'collection-panel',
    },
    {
      id: 'manual',
      content: 'Handmatig',
      accessibilityLabel: 'Manual',
      panelID: 'manual-panel',
    },
  ];

  const handleResourcePickerSelect = useCallback(({ selection }) => {
    setSelectedItems(selection.map((item: any) => item.id));
    setPickerOpen(false);
    onSelect({
      type: 'manual',
      value: selection.map((item: any) => item.id)
    });
  }, [onSelect]);

  return (
    <Card title="Product selectie">
      <Tabs tabs={tabs} selected={selected} onSelect={setSelected}>
        <Card.Section>
          {selected === 0 && (
            <Button onClick={() => setPickerOpen(true)}>Selecteer collectie</Button>
          )}
          {selected === 1 && (
            <Button onClick={() => setPickerOpen(true)}>Selecteer producten</Button>
          )}
        </Card.Section>
        <Card.Section>
          <Stack spacing="tight">
            {selectedItems.map(id => (
              <Tag key={id} onRemove={() => {
                setSelectedItems(items => items.filter(item => item !== id));
              }}>{id}</Tag>
            ))}
          </Stack>
        </Card.Section>
      </Tabs>
      <ResourcePicker
        resourceType={selected === 0 ? "Collection" : "Product"}
        open={pickerOpen}
        onSelection={handleResourcePickerSelect}
        onCancel={() => setPickerOpen(false)}
      />
    </Card>
  );
}
