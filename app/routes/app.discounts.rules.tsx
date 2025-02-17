import { Page, Layout, Button, Banner } from "@shopify/polaris";
import { useState } from "react";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { DiscountTable } from "~/components/DiscountTable";
import { discountManager } from "~/models/DiscountManager";
import { discountScheduler } from "~/models/DiscountScheduler";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const rules = await discountManager.getAllRules();
  return json({ rules });
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  
  try {
    switch (formData.get('action')) {
      case 'create':
      case 'update': {
        const rule = createRuleFromFormData(formData);
        await metafieldManager.saveDiscountRule(admin, rule);
        await discountScheduler.scheduleRule(admin, rule);
        return json({ success: true });
      }
      case 'delete':
        await discountManager.deleteRule(formData.get('ruleId') as string);
        return json({ success: true });
      
      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return json({ error: error.message }, { status: 400 });
  }
}

export default function RulesPage() {
  const { rules } = useLoaderData<typeof loader>();
  const actionData = useActionData();
  const [showRuleForm, setShowRuleForm] = useState(false);

  const handleEdit = (ruleId: string) => {
    // Implementeer edit functionaliteit
  };

  const handleDelete = async (ruleId: string) => {
    // Implementeer delete functionaliteit
  };

  const handleDuplicate = (ruleId: string) => {
    // Implementeer duplicate functionaliteit
  };

  return (
    <Page
      title="Kortingsregels"
      primaryAction={
        <Button primary onClick={() => setShowRuleForm(true)}>
          Nieuwe regel
        </Button>
      }
    >
      <Layout>
        {actionData?.error && (
          <Layout.Section>
            <Banner status="critical">{actionData.error}</Banner>
          </Layout.Section>
        )}
        <Layout.Section>
          <DiscountTable
            rules={rules}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
