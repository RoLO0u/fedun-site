"use client";

import React from "react";
import { z } from "zod";

import { parseChartData } from "@/lib/parseData";
import { parseDate } from "@/lib/utils";
import { chatSchema } from "@/lib/chatSchema";

import { type ChartConfig } from "./ui/chart";
import { VerticalChart, TimeMessageChart } from "./ui/customChart";
import { Slider } from "./ui/slider";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  calculateMostUsedWords,
  calculateMessagesOverTime,
} from "@/lib/calculateMessages";

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
  const [minLength, setMinLength] = React.useState(1);
  const chartData = parseChartData(json.messages, minLength);
  const [mostUsedWords, setMostUsedWords] = React.useState(chartData.mostUsedWords);
  const [messagesOverTime, setMessagesOverTime] = React.useState(chartData.messagesOverTime);
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null); 
  const users = chartData.messagesPerUser.map((user) => user.label);

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
          <VerticalChart title="Messages per user" chartConfig={chartConfig} chartData={chartData.messagesPerUser} />
        </div>
        <div className="w-full xl:w-[49%] max-h-screen pb-2">
          <VerticalChart title="Characters per user" chartConfig={chartConfig} chartData={chartData.charactersPerUser} />
        </div>
        <div className="w-full xl:w-[49%] max-h-screen">
          <div className="flex items-center justify-center gap-4 w-full xl:mt-0 mt-4 mb-4">
            <p>Minimum characters in word:</p>
            <Slider min={1} defaultValue={[minLength]} max={10} className="max-w-40" onValueChange={
              (val) => {
                setMinLength(val[0]);
                setMostUsedWords(calculateMostUsedWords(json.messages, val[0]));
              }
            } />
            <p>{minLength}</p>
          </div>
          <VerticalChart title="Most used words" chartConfig={chartConfig} chartData={mostUsedWords} />
        </div>
        <div className="w-full xl:w-[49%] max-h-screen">
          <div className="flex items-center justify-center gap-4 w-full xl:mt-0 mt-4 mb-4">
            <p>Select user</p>
            <Combobox items={users} 
              itemToStringValue={(item) => {
                if (item == null) {
                  return "All Users";
                }
                return item;
              }}
              onValueChange={(value?: string | null) => {
                console.log("Selected user:", value);
                setSelectedUser(value ?? null);
                setMessagesOverTime(calculateMessagesOverTime(json.messages, value ?? undefined));
              }}
            >
              <ComboboxInput placeholder="Select user" className="w-40" />
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxItem key="All Users" value={null}>
                    <i>All Users</i>
                  </ComboboxItem>
                  {users.map((user) => (
                    <ComboboxItem key={user} value={user}>
                      {user}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <TimeMessageChart title="Messages over time" chartConfig={chartConfig} chartData={messagesOverTime} />
        </div>
      </div>
    </>
  );
};

export default Analyzed;
