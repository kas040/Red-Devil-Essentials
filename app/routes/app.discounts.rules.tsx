import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Badge,
  Button,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import type { DiscountRule } from "~/types/discount";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Fetch discount rules from metafields
  const response = await admin.graphql(`
    query getDiscountRules {
      metaobjects(first: 50, type: "discount_rule") {
        nodes {
          id
          fields {
            key
            value
          }
        }
      }
    }
  `);

  const { data } = await response.json();
  const rules = data.metaobjects.nodes.map((node: any) => {
    const fields = node.fields.reduce((acc: any, field: any) => {
      acc[field.key] = field.value;
      return acc;
    }, {});

    return {
      id: node.id,
      name: fields.name,
      type: fields.type,
      value: fields.value,
      isActive: fields.is_active === "true",
      createdAt: fields.created_at,
      updatedAt: fields.updated_at,
    };
  });

  return json({ rules });
};

export default function DiscountRulesPage() {
  const { rules } = useLoaderData<typeof loader>();

  const rows = rules.map((rule: DiscountRule) => [
    rule.name,
    rule.type,
    rule.value,
    <Badge status={rule.isActive ? "success" : "critical"}>
      {rule.isActive ? "Active" : "Inactive"}
    </Badge>,
    new Date(rule.createdAt).toLocaleDateString(),
    <Button
      url={`/app/discounts/rules/${rule.id}`}
      variant="plain"
    >
      Edit
    </Button>,
  ]);

  return (
    <Page title="Discount Rules">
      <Layout>
        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={["text", "text", "text", "text", "text", "text"]}
              headings={["Name", "Type", "Value", "Status", "Created", "Actions"]}
              rows={rows}
              footerContent={`${rules.length} rules`}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}