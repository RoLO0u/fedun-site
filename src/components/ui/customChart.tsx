import * as React from "react"

import { Bar, BarChart, XAxis, YAxis, LabelList, CartesianGrid } from "recharts";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "./chart";

import { type ChartDataType } from "@/lib/dataSchema";
import { ChartOffset } from "recharts/types/util/types";

type GeneratorProps = {
  xAxis: Array<number>,
  width: number,
  height: number,
  offset: ChartOffset,
}
type CoordinatesGeneratorType = (props: GeneratorProps) => Array<number>;

function coordinatesGenerator(chartData: ChartDataType): CoordinatesGeneratorType {
  let highestScore = chartData[0].count;
  let timesTen = 0;
  while (highestScore > 10) {
    timesTen += 1;
    highestScore /= 10
  }
  return (props: GeneratorProps): Array<number> => {
    
    props.offset.left
    return [250, 200]
  };
}

function CustomChart({
  chartConfig, chartData}: 
  React.ComponentProps<"div"> & 
  {
    chartConfig: ChartConfig,
    chartData: ChartDataType
  }) {
  return (
    <ChartContainer config={chartConfig} className="w-full min-h-screen sm:min-h-[80vh] text-xl md:text-base md:min-h-[60vh] lg:min-h-[50vh] xl:h-auto">
      <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ right: 30, left: 90 }}>
        <CartesianGrid horizontal={false} verticalCoordinatesGenerator={coordinatesGenerator(chartData)} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <YAxis
          dataKey="from"
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
          fill="var(--color-user)"
          radius={4}
        >
          <LabelList
            dataKey="from"
            position="left"
            formatter={(value: string) => {
              let length: number;
              const width = window.innerWidth;
              if (width >= 768) {
                length = 7;
              } else {
                length = 5;
              }
              const text = value.replaceAll(' ', '\u00A0');
              return value.length > length ? `${text.slice(0, length-1)}...` : text;
            }}
            style={{
              fill: "var(--foreground)",
            }}
          />
          <LabelList
            dataKey="count"
            position="right"
            style={{
              fill: "var(--foreground)",
            }}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export {
  CustomChart
};