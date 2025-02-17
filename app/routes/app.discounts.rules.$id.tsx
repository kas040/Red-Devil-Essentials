import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  Banner,
  Box,
  Text,
  DatePicker,
  Stack,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { useState } from "react";
import { format, parseISO } from "date-fns";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const { id } = params;

  const response = await admin.graphql(`
    query getDiscountRule($id: ID!) {
      metaobject(id: $id) {
        fields {
          key
          value
        }
      }
    }
  `, {
    variables: {
      id,
    },
  });

  const { data } = await response.json();
  const fields = data.metaobject.fields.reduce((acc: any, field: any) => {
    acc[field.key] = field.value;
    return acc;
  }, {});

  return json({
    rule: {
      id,
      name: fields.name,
      type: fields.type,
      value: fields.value,
      schedule: JSON.parse(fields.schedule || "{}"),
      tags: JSON.parse(fields.tags || "{}"),
      isActive: fields.is_active === "true",
    },
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const { id } = params;
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "delete") {
    const response = await admin.graphql(`
      mutation deleteDiscountRule($id: ID!) {
        metaobjectDelete(id: $id) {
          userErrors {
            field
            message
          }
        }
      }
    `, {
      variables: {
        id,
      },
    });

    const { data } = await response.json();
    if (data.metaobjectDelete.userErrors.length > 0) {
      return json({ errors: data.metaobjectDelete.userErrors });
    }

    return redirect("/app/discounts/rules");
  }

  // Update rule
  const response = await admin.graphql(`
    mutation updateDiscountRule($input: MetaobjectInput!) {
      metaobjectUpdate(metaobject: $input) {
        metaobject {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      input: {
        id,
        fields: [
          { key: "name", value: formData.get("name") as string },
          { key: "type", value: formData.get("type") as string },
          { key: "value", value: formData.get("value") as string },
          { key: "schedule", value: formData.get("schedule") as string },
          { key: "tags", value: formData.get("tags") as string },
          { key: "updated_at", value: new Date().toISOString() },
        ],
      },
    },
  });

  const { data } = await response.json();
  if (data.metaobjectUpdate.userErrors.length > 0) {
    return json({ errors: data.metaobjectUpdate.userErrors });
  }

  return redirect("/app/discounts/rules");
};

export default function EditDiscountRulePage() {
  const { rule } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const [startDate, setStartDate] = useState(
    rule.schedule?.startDate ? parseISO(rule.schedule.startDate) : new Date()
  );
  const [endDate, setEndDate] = useState(
    rule.schedule?.endDate ? parseISO(rule.schedule.endDate) : new Date()
  );

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this rule?")) {
      const formData = new FormData();
      formData.append("action", "delete");
      submit(formData, { method: "POST" });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Add schedule and tags
    formData.append("schedule", JSON.stringify({
      startDate: format(startDate, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      endDate: format(endDate, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    }));
    
    submit(formData, { method: "POST" });
  };

  return (
    <Page
      title={`Edit Rule: ${rule.name}`}
      backAction={{
        content: "Discount Rules",
        url: "/app/discounts/rules",
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <form onSubmit={handleSubmit}>
              <FormLayout>
                <TextField
                  label="Rule Name"
                  name="name"
                  value={rule.name}
                  autoComplete="off"
                  required
                />

                <Select
                  label="Rule Type"
                  name="type"
                  value={rule.type}
                  options={[
                    { label: "Percentage Off", value: "percentage" },
                    { label: "Fixed Amount Off", value: "fixed" },
                    { label: "Custom Formula", value: "formula" },
                  ]}
                />

                <TextField
                  label="Rule Value"
                  name="value"
                  value={rule.value}
                  autoComplete="off"
                  required
                />

                <Box padding="400">
                  <Text variant="headingMd" as="h3">Schedule</Text>
                  <Stack vertical>
                    <DatePicker
                      month={startDate.getMonth()}
                      year={startDate.getFullYear()}
                      selected={startDate}
                      onChange={setStartDate}
                      label="Start Date"
                    />
                    
                    <DatePicker
                      month={endDate.getMonth()}
                      year={endDate.getFullYear()}
                      selected={endDate}
                      onChange={setEndDate}
                      label="End Date"
                    />
                  </Stack>
                </Box>

                <Stack distribution="equalSpacing">
                  <Button submit primary>
                    Save Changes
                  </Button>
                  <Button destructive onClick={handleDelete}>
                    Delete Rule
                  </Button>
                </Stack>
              </FormLayout>
            </form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}