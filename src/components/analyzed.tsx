"use client";

import React from "react";
import { z } from "zod";

import { parseDate, parseChartData } from "@/lib/parseData";
import { chatSchema } from "@/lib/chatSchema";

import { Bar, BarChart, XAxis, YAxis, LabelList } from "recharts";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";

interface AnalyzedProps {
  json: z.infer<typeof chatSchema>;
}

const chartConfig = {
  user: {
    label: "User",
    theme: {
      light: "#1111aa",
      dark: "#000090",
    }
  },
} satisfies ChartConfig;

const Analyzed: React.FC<AnalyzedProps> = ({ json }) => {

  const chartData = parseChartData(json.messages);

  return (
    <>
      <h1 className="text-2xl font-bold">Analyze Result of "{json.name}"</h1>
      <div>
        <p>First message sent: {parseDate(json.messages[0].date)}</p>
        <p>
          Last message sent: {parseDate(json.messages[json.messages.length - 1].date)}
        </p>
      </div>
      <ChartContainer config={chartConfig} className="w-full" style={{ maxHeight: `${chartData.length*3}rem` }}>
        <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ right: 16, left: 80 }}>
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
                return value.length > 11 ? `${value.slice(0, 9)}...` : value;
              }}
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
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
    </>
  );
};

export default Analyzed;
