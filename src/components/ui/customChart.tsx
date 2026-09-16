import * as React from "react"

import { Bar, BarChart, Area, AreaChart, XAxis, YAxis, LabelList, CartesianGrid } from "recharts";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "./chart";

import { Card, CardHeader, CardTitle, CardContent } from "./card";

import { type GenericChartType } from "@/lib/dataSchema";

function VerticalChart({
  chartConfig, chartData, title}: 
  React.ComponentProps<"div"> & 
  {
    chartConfig: ChartConfig,
    chartData: GenericChartType,
    title: string
  }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full min-h-screen sm:min-h-[80vh] text-xl md:text-base md:min-h-[60vh] lg:min-h-[50vh] xl:h-auto">
          <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ right: 30, left: 90 }}>
            <CartesianGrid horizontal={false} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              hide
            />
            <XAxis
              type="number"
              dataKey="count"
              hide
            />
            <Bar
              dataKey="count"
              name="Count"
              layout="vertical"
              fill="var(--chart-4)"
              radius={4}
            >
              <LabelList
                dataKey="label"
                position="insideLeft"
                style={{
                  fill: "var(--secondary-foreground)",
                }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function TimeMessageChart({
  chartConfig, chartData, title}:
  React.ComponentProps<"div"> & 
  {
    chartConfig: ChartConfig,
    chartData: GenericChartType,
    title: string
  }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full min-h-screen sm:min-h-[80vh] text-xl md:text-base md:min-h-[60vh] lg:min-h-[50vh] xl:h-auto">
          <AreaChart accessibilityLayer data={chartData} margin={{ right: 12, left: 12 }}>
            <CartesianGrid vertical={false} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <XAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              hide
            />
            <YAxis
              type="number"
              dataKey="count"
            />
            <Area
              dataKey="count"
              name="Count"
              layout="vertical"
              type="linear"
              fill="var(--chart-2)"
              radius={4}
            >
            </Area>
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );  
}

export {
  VerticalChart,
  TimeMessageChart,
};