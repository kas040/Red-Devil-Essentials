import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, Text, Box, BlockStack, DataTable } from "@shopify/polaris";
import type { DiscountAnalytics } from "~/services/analytics.server";

interface CategoryAnalyticsProps {
  categoryStats: DiscountAnalytics["categoryStats"];
}

const COLORS = ["#5C6AC4", "#47C1BF", "#F49342", "#DE3618", "#454F5B"];

export function CategoryAnalytics({ categoryStats }: CategoryAnalyticsProps) {
  const rows = categoryStats.map(stat => [
    stat.category,
    stat.totalProducts.toString(),
    stat.totalDiscounts.toString(),
    `$${stat.averageDiscount.toFixed(2)}`,
    `$${stat.revenue.toFixed(2)}`,
  ]);

  return (
    <BlockStack gap="400">
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">Category Performance</Text>
            <Box height="400px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryStats}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="totalProducts"
                    name="Total Products"
                    fill="#5C6AC4"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="totalDiscounts"
                    name="Total Discounts"
                    fill="#47C1BF"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </BlockStack>
        </Box>
      </Card>

      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">Category Details</Text>
            <DataTable
              columnContentTypes={["text", "numeric", "numeric", "numeric", "numeric"]}
              headings={[
                "Category",
                "Products",
                "Discounts",
                "Avg. Discount",
                "Revenue",
              ]}
              rows={rows}
            />
          </BlockStack>
        </Box>
      </Card>
    </BlockStack>
  );
}