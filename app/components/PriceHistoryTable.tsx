import { DataTable, Card } from "@shopify/polaris";
import type { PriceHistory } from "~/types/discount";

export function PriceHistoryTable({ history }: { history: PriceHistory[] }) {
  const rows = history.map((entry) => [
    new Date(entry.timestamp).toLocaleString(),
    `€${entry.oldPrice.toFixed(2)}`,
    `€${entry.newPrice.toFixed(2)}`,
    entry.ruleId || 'Handmatige aanpassing',
    ((entry.newPrice - entry.oldPrice) / entry.oldPrice * 100).toFixed(2) + '%'
  ]);

  return (
    <Card title="Prijsgeschiedenis">
      <DataTable
        columnContentTypes={['text', 'numeric', 'numeric', 'text', 'numeric']}
        headings={['Datum', 'Oude prijs', 'Nieuwe prijs', 'Regel', 'Verschil']}
        rows={rows}
        defaultSortDirection="descending"
      />
    </Card>
  );
}
