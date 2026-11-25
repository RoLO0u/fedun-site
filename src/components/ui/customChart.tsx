import * as React from "react"

import { Bar, BarChart, Area, AreaChart, XAxis, YAxis, LabelList, CartesianGrid } from "recharts";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "./chart";

import { Card, CardHeader, CardTitle, CardContent } from "./card";

import { type GenericChartType } from "@/lib/dataSchema";

function useResponsiveChartMargin() {
  const [margin, setMargin] = React.useState({ right: 30, left: 90 });

  React.useEffect(() => {
    const updateMargin = () => {
      const width = window.innerWidth;

      setMargin(
        width < 640
          ? { right: 10, left: 20 }
          : width < 1024
            ? { right: 20, left: 50 }
            : { right: 30, left: 80 }
      );
    };

    updateMargin();
    window.addEventListener("resize", updateMargin);
    return () => window.removeEventListener("resize", updateMargin);
  }, []);

  return margin;
}

function VerticalChart({
  chartConfig, chartData, title, controls}:
  React.ComponentProps<"div"> & 
  {
    chartConfig: ChartConfig,
    chartData: GenericChartType,
    title: string,
    controls?: React.ReactNode,
  }) {
  const margin = useResponsiveChartMargin();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {title}
        </CardTitle>
        {controls}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full min-h-screen sm:min-h-[80vh] text-xl md:text-base md:min-h-[60vh] lg:min-h-[50vh] xl:h-auto">
          <BarChart accessibilityLayer data={chartData} layout="vertical" margin={margin}>
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
                formatter={(value: string | number | undefined) =>
                  String(value).replace(/ /g, "\u00a0")
                }
                style={{
                  fill: "var(--secondary-foreground)",
                  whiteSpace: "nowrap",
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
  chartConfig, chartData, title, controls}:
  React.ComponentProps<"div"> & 
  {
    chartConfig: ChartConfig,
    chartData: GenericChartType,
    title: string,
    controls?: React.ReactNode,
  }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {title}
        </CardTitle>
        {controls}
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