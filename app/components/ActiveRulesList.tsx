import { Card, ResourceList, ResourceItem, Badge, ButtonGroup, Button } from "@shopify/polaris";
import type { DiscountRule } from "~/types/discount";

export function ActiveRulesList({ rules }: { rules: DiscountRule[] }) {
  return (
    <Card title="Actieve kortingsregels">
      <ResourceList
        items={rules}
        renderItem={(rule) => (
          <ResourceItem id={rule.type}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Badge status={rule.type === 'percentage' ? 'success' : 'info'}>
                  {rule.type}
                </Badge>
                <p>{typeof rule.value === 'string' ? rule.value : `${rule.value}${rule.type === 'percentage' ? '%' : '€'}`}</p>
              </div>
              <ButtonGroup>
                <Button plain>Bewerken</Button>
                <Button plain destructive>Verwijderen</Button>
              </ButtonGroup>
            </div>
          </ResourceItem>
        )}
      />
    </Card>
  );
}
