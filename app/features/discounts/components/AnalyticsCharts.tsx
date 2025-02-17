import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, Text, Box, BlockStack } from "@shopify/polaris";
import type { DiscountAnalytics } from "~/services/analytics.server";

interface AnalyticsChartsProps {
  analytics: DiscountAnalytics;
}

const COLORS = ["#5C6AC4", "#47C1BF", "#F49342", "#DE3618", "#454F5B"];

export function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  // Prepare data for discount type distribution
  const discountTypeData = analytics.popularDiscounts.map(discount => ({
    name: discount.type,
    value: discount.count,
  }));

  return (
    <BlockStack gap="400">
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">Discount Activity Over Time</Text>
            <Box height="400px">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analytics.timeBasedStats}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="discountCount"
                    name="Number of Discounts"
                    stroke="#5C6AC4"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="averageDiscount"
                    name="Average Discount ($)"
                    stroke="#47C1BF"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </BlockStack>
        </Box>
      </Card>

      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">Discount Type Distribution</Text>
            <Box height="400px">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={discountTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {discountTypeData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </BlockStack>
        </Box>
      </Card>

      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">Average Discount by Type</Text>
            <Box height="400px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.popularDiscounts}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="averageDiscount"
                    name="Average Discount"
                    fill="#5C6AC4"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </BlockStack>
        </Box>
      </Card>
    </BlockStack>
  );
}