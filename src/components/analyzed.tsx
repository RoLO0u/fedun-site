"use client";

import React from "react";
import { z } from "zod";

import { parseChartData } from "@/lib/parseData";
import { parseDate } from "@/lib/utils";
import { chatSchema } from "@/lib/chatSchema";

import { type ChartConfig } from "./ui/chart";
import { CustomChart } from "./ui/customChart";

interface AnalyzedProps {
  json: z.infer<typeof chatSchema>,
};

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
      <div className="w-full flex flex-wrap justify-between">
        <div className="w-full xl:w-[49%] max-h-screen pb-2 xl:pb-8">
          <CustomChart title="Messages per user" chartConfig={chartConfig} chartData={chartData.messagesPerUser} />
        </div>
        <div className="w-full xl:w-[49%] max-h-screen pb-2">
          <CustomChart title="Characters per user" chartConfig={chartConfig} chartData={chartData.charactersPerUser} />
        </div>
        <div className="w-full xl:w-[49%] max-h-screen">
          <CustomChart title="Most used words" chartConfig={chartConfig} chartData={chartData.mostUsedWords} />
        </div>
      </div>
    </>
  );
};

export default Analyzed;
