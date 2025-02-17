import { DataTable, Card, Pagination, ButtonGroup, Button, Badge } from "@shopify/polaris";
import { useState } from "react";
import type { DiscountRule } from "~/types/discount";

interface DiscountTableProps {
  rules: DiscountRule[];
  onEdit: (ruleId: string) => void;
  onDelete: (ruleId: string) => void;
  onDuplicate: (ruleId: string) => void;
}

export function DiscountTable({ rules, onEdit, onDelete, onDuplicate }: DiscountTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const formatValue = (rule: DiscountRule) => {
    switch (rule.type) {
      case 'percentage':
        return `${rule.value}%`;
      case 'fixed':
        return `€${Number(rule.value).toFixed(2)}`;
      case 'formula':
        return rule.value;
      default:
        return rule.value;
    }
  };

  const getStatusBadge = (rule: DiscountRule) => {
    const now = new Date();
    const startDate = new Date(rule.startDate);
    const endDate = rule.endDate ? new Date(rule.endDate) : null;
    
    if (startDate > now) {
      return <Badge status="info">Gepland</Badge>;
    } else if (endDate && endDate < now) {
      return <Badge status="warning">Verlopen</Badge>;
    } else if (startDate <= now && (!endDate || endDate > now)) {
      return <Badge status="success">Actief</Badge>;
    }
    return <Badge>Inactief</Badge>;
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const rows = rules
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    .map(rule => [
      rule.name || "Naamloos",
      rule.type === 'percentage' ? "Percentage" : 
      rule.type === 'fixed' ? "Vast bedrag" : "Formule",
      formatValue(rule),
      formatDateTime(rule.startDate),
      rule.endDate ? formatDateTime(rule.endDate) : "Geen einddatum",
      getStatusBadge(rule),
      <ButtonGroup>
        <Button size="slim" onClick={() => onEdit(rule.id)}>
          Bewerken
        </Button>
        <Button size="slim" onClick={() => onDuplicate(rule.id)}>
          Dupliceren
        </Button>
        <Button size="slim" destructive onClick={() => onDelete(rule.id)}>
          Verwijderen
        </Button>
      </ButtonGroup>
    ]);

  return (
    <Card>
      <Card.Section>
        <DataTable
          columnContentTypes={[
            'text',
            'text',
            'text',
            'text',
            'text',
            'text',
            'text',
          ]}
          headings={[
            'Naam',
            'Type',
            'Waarde',
            'Startdatum',
            'Einddatum',
            'Status',
            'Acties'
          ]}
          rows={rows}
          defaultSortDirection="descending"
        />
      </Card.Section>
      <Card.Section>
        <Pagination
          label={`${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, rules.length)} van ${rules.length} regels`}
          hasPrevious={currentPage > 1}
          onPrevious={() => setCurrentPage(p => p - 1)}
          hasNext={currentPage * rowsPerPage < rules.length}
          onNext={() => setCurrentPage(p => p + 1)}
        />
      </Card.Section>
    </Card>
  );
}
