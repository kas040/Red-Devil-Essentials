import { Form } from "@remix-run/react";
import { 
  Card, FormLayout, Select, TextField, Button, 
  ButtonGroup, Collapsible, Tag, Stack, Banner 
} from "@shopify/polaris";
import { useState } from "react";
import { ProductSelector } from "./ProductSelector";
import { DateTimePicker } from "./DateTimePicker";

export function DiscountForm({ onSubmit, initialData = {} }) {
  const [selectedType, setSelectedType] = useState(initialData.type || 'percentage');
  const [showConditions, setShowConditions] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [startDateTime, setStartDateTime] = useState(initialData.startDate ? new Date(initialData.startDate) : new Date());
  const [endDateTime, setEndDateTime] = useState(initialData.endDate ? new Date(initialData.endDate) : null);

  return (
    <Form method="post">
      <Card sectioned>
        <FormLayout>
          <TextField
            label="Naam van de korting"
            name="name"
            defaultValue={initialData.name}
            placeholder="Zomer Sale 2024"
            required
          />

          <FormLayout.Group>
            <Select
              label="Type korting"
              options={[
                { label: 'Percentage', value: 'percentage' },
                { label: 'Vast bedrag', value: 'fixed' },
                { label: 'Formule', value: 'formula' }
              ]}
              value={selectedType}
              onChange={setSelectedType}
              name="type"
            />

            <TextField
              label="Waarde"
              name="value"
              type={selectedType === 'percentage' ? 'number' : 'text'}
              suffix={selectedType === 'percentage' ? '%' : selectedType === 'fixed' ? '€' : ''}
              placeholder={selectedType === 'formula' ? 'price * 0.9' : ''}
              defaultValue={initialData.value}
              required
            />
          </FormLayout.Group>

          <FormLayout.Group>
            <DateTimePicker
              label="Startdatum en tijd"
              value={startDateTime}
              onChange={setStartDateTime}
              required
            />
            <DateTimePicker
              label="Einddatum en tijd (optioneel)"
              value={endDateTime}
              onChange={setEndDateTime}
            />
          </FormLayout.Group>

          <ProductSelector onSelect={setSelectedProducts} />

          <Button
            onClick={() => setShowConditions(!showConditions)}
            disclosure={showConditions ? 'up' : 'down'}
          >
            Aanvullende voorwaarden
          </Button>

          <Collapsible open={showConditions}>
            <Card.Section>
              <FormLayout>
                <Select
                  label="Voorwaarde type"
                  options={[
                    { label: 'Productprijs', value: 'price' },
                    { label: 'Voorraad', value: 'inventory' },
                    { label: 'Tags', value: 'tags' }
                  ]}
                  name="condition_type"
                />
                <Select
                  label="Operator"
                  options={[
                    { label: 'Gelijk aan', value: 'equals' },
                    { label: 'Groter dan', value: 'greater_than' },
                    { label: 'Kleiner dan', value: 'less_than' }
                  ]}
                  name="condition_operator"
                />
                <TextField
                  label="Waarde"
                  name="condition_value"
                />
              </FormLayout>
            </Card.Section>
          </Collapsible>

          {selectedProducts.length > 0 && (
            <Banner status="info">
              <p>Geselecteerde producten: {selectedProducts.length}</p>
              <Stack spacing="tight">
                {selectedProducts.map(id => (
                  <Tag key={id}>{id}</Tag>
                ))}
              </Stack>
            </Banner>
          )}

          <ButtonGroup>
            <Button primary submit>
              Opslaan
            </Button>
            <Button onClick={() => onSubmit('preview')}>
              Preview
            </Button>
          </ButtonGroup>

          <input 
            type="hidden" 
            name="startDateTime" 
            value={startDateTime.toISOString()} 
          />
          {endDateTime && (
            <input 
              type="hidden" 
              name="endDateTime" 
              value={endDateTime.toISOString()} 
            />
          )}
        </FormLayout>
      </Card>
    </Form>
  );
}
