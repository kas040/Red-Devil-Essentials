import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Grid,
  DataTable,
  Select,
  Box,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "~/shopify.server";
import { getDiscountAnalytics } from "~/services/analytics.server";
import { generateDiscountRecommendations } from "~/services/recommendations.server";
import { AnalyticsCharts } from "~/features/discounts/components/AnalyticsCharts";
import { CategoryAnalytics } from "~/features/discounts/components/CategoryAnalytics";
import { DiscountRecommendations } from "~/features/discounts/components/DiscountRecommendations";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const timeframe = url.searchParams.get("timeframe") || "30d";
  
  const analytics = await getDiscountAnalytics(admin, timeframe);
  const recommendations = await generateDiscountRecommendations(
    analytics.timeBasedStats,
    analytics.activeRules,
    analytics.categoryStats
  );
  
  return json({ analytics, recommendations });
};

export default function DashboardPage() {
  const { analytics, recommendations } = useLoaderData<typeof loader>();
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d");

  const handleApplyRecommendation = (recommendation: any) => {
    // Navigate to new discount page with pre-filled values
    window.location.href = `/app/discounts/new?category=${recommendation.category}&discount=${recommendation.suggestedDiscount}`;
  };

  const timeframeOptions = [
    { label: "Last 7 days", value: "7d" },
    { label: "Last 30 days", value: "30d" },
    { label: "Last 90 days", value: "90d" },
  ];

  const popularDiscountRows = analytics.popularDiscounts.map(discount => [
    discount.type,
    discount.count.toString(),
    `${discount.averageDiscount.toFixed(2)}%`,
  ]);

  const timeBasedRows = analytics.timeBasedStats.map(stat => [
    stat.date,
    stat.discountCount.toString(),
    `$${stat.averageDiscount.toFixed(2)}`,
  ]);

  return (
    <Page title="Discount Analytics Dashboard">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Box padding="400">
                <Select
                  label="Time Period"
                  options={timeframeOptions}
                  value={selectedTimeframe}
                  onChange={setSelectedTimeframe}
                />
              </Box>
              
              <Grid gap="400">
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
                  <Card>
                    <Box padding="400">
                      <BlockStack gap="200">
                        <Text variant="headingMd">Total Discounts</Text>
                        <Text variant="heading2xl">{analytics.totalDiscounts}</Text>
                      </BlockStack>
                    </Box>
                  </Card>
                </Grid.Cell>
                
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
                  <Card>
                    <Box padding="400">
                      <BlockStack gap="200">
                        <Text variant="headingMd">Average Discount</Text>
                        <Text variant="heading2xl">
                          ${analytics.averageDiscount.toFixed(2)}
                        </Text>
                      </BlockStack>
                    </Box>
                  </Card>
                </Grid.Cell>
                
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
                  <Card>
                    <Box padding="400">
                      <BlockStack gap="200">
                        <Text variant="headingMd">Active Rules</Text>
                        <Text variant="heading2xl">{analytics.activeRules}</Text>
                      </BlockStack>
                    </Box>
                  </Card>
                </Grid.Cell>
                
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
                  <Card>
                    <Box padding="400">
                      <BlockStack gap="200">
                        <Text variant="headingMd">Revenue Impact</Text>
                        <Text variant="heading2xl" tone="critical">
                          -${analytics.revenueImpact.toFixed(2)}
                        </Text>
                      </BlockStack>
                    </Box>
                  </Card>
                </Grid.Cell>
              </Grid>

              <Card title="Popular Discount Types">
                <DataTable
                  columnContentTypes={["text", "numeric", "numeric"]}
                  headings={["Type", "Usage Count", "Average Discount"]}
                  rows={popularDiscountRows}
                />
              </Card>

              <Card title="Discount Activity Over Time">
                <DataTable
                  columnContentTypes={["text", "numeric", "numeric"]}
                  headings={["Date", "Number of Discounts", "Average Amount"]}
                  rows={timeBasedRows}
                />
              </Card>
              
              <AnalyticsCharts analytics={analytics} />
              
              <CategoryAnalytics categoryStats={analytics.categoryStats} />
              
              <DiscountRecommendations
                recommendations={recommendations}
                onApplyRecommendation={handleApplyRecommendation}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}