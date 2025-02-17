import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { Page, Layout } from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { DiscountForm } from "~/features/discounts/components/DiscountForm";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const tagsToAdd = JSON.parse(formData.get("tagsToAdd") as string);
  const tagsToRemove = JSON.parse(formData.get("tagsToRemove") as string);

  // Create new discount rule
  const ruleResponse = await admin.graphql(`
    mutation createDiscountRule($input: MetaobjectInput!) {
      metaobjectCreate(metaobject: $input) {
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
        type: "discount_rule",
        fields: [
          { key: "name", value: formData.get("ruleName") as string },
          { key: "type", value: formData.get("ruleType") as string },
          { key: "value", value: formData.get("ruleValue") as string },
          { key: "is_active", value: "true" },
          { key: "schedule", value: JSON.stringify({ startDate, endDate }) },
          { key: "tags", value: JSON.stringify({ add: tagsToAdd, remove: tagsToRemove }) },
          { key: "created_at", value: new Date().toISOString() },
          { key: "updated_at", value: new Date().toISOString() },
        ],
      },
    },
  });

  const { data } = await ruleResponse.json();

  if (data.metaobjectCreate.userErrors.length > 0) {
    return json({ errors: data.metaobjectCreate.userErrors });
  }

  return redirect("/app/discounts/rules");
};

export default function NewDiscountPage() {
  const navigate = useNavigate();

  return (
    <Page
      title="Create New Discount"
      backAction={{
        content: "Discounts",
        onAction: () => navigate("/app/discounts"),
      }}
    >
      <Layout>
        <Layout.Section>
          <DiscountForm
            productId=""
            productTitle="New Discount Rule"
            onSuccess={() => navigate("/app/discounts/rules")}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}