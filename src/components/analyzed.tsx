"use client";

import React from "react";
import { z } from "zod";

import { parseDate, parseChartData } from "@/lib/parseData";
import { chatSchema } from "@/lib/chatSchema";

import { type ChartConfig } from "./ui/chart";
import { CustomChart } from "./ui/customChart";

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
      <div className="w-full flex flex-wrap divide-y-[1px] max-h-[200vh]">
        <div className="w-full xl:w-[50%] xl:border-r max-h-screen pb-2">
          <p className="text-xl mb-1">
            Messages per user:
          </p>
          <CustomChart chartConfig={chartConfig} chartData={chartData} />
        </div>
        <div className="w-full xl:w-[50%] max-h-screen pb-2">
          <p className="text-xl mb-1">
            Characters per user:
          </p>
          <CustomChart chartConfig={chartConfig} chartData={chartData} />
        </div>
        <div className="w-full xl:w-[50%] max-h-screen">
          <p className="text-xl mb-1">
            Most used words {"\(first 50 \)"}:
          </p>
          <CustomChart chartConfig={chartConfig} chartData={chartData} />
        </div>
      </div>
    </>
  );
};

export default Analyzed;
