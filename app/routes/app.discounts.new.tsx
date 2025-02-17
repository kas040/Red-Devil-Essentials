import { Page, Layout } from "@shopify/polaris";
import { json, redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { authenticate } from "~/shopify.server";
import { DiscountForm } from "~/components/DiscountForm";
import { metafieldManager } from "~/models/MetafieldManager";
import type { DiscountRule } from "~/types/discount";

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const rule: DiscountRule = {
    id: crypto.randomUUID(),
    name: formData.get("name") as string,
    type: formData.get("type") as "percentage" | "fixed" | "formula",
    value: formData.get("value") as string,
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string || undefined,
    conditions: formData.get("conditions") ? 
      JSON.parse(formData.get("conditions") as string) : undefined
  };

  try {
    // Store in metafields
    await metafieldManager.saveDiscountRule(admin, rule);
    
    // If products were selected, apply the rule
    const productIds = formData.get("productIds") ? 
      JSON.parse(formData.get("productIds") as string) : [];
    
    if (productIds.length > 0) {
      await Promise.all(productIds.map(async (productId: string) => {
        await metafieldManager.addRuleToProduct(admin, productId, rule.id);
      }));
    }

    return redirect("/app/discounts/rules");
  } catch (error) {
    return json({ error: error.message }, { status: 400 });
  }
}

export default function NewDiscountPage() {
  const actionData = useActionData<typeof action>();

  return (
    <Page
      title="Nieuwe korting"
      breadcrumbs={[{ content: 'Kortingen', url: '/app/discounts/rules' }]}
    >
      <Layout>
        <Layout.Section>
          <DiscountForm />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
