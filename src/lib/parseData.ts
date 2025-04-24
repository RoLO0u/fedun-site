import { z } from "zod";

import { messagesSchema } from "@/lib/chatSchema";
import { ChartDataType, CountType } from "@/lib/dataSchema";

const parseNullish = (value: string | number | null | undefined): string | number => {
  if (value === null || value === undefined) {
    return "No data";
  }
  return value;
};

const parseDate = (date: string | null | undefined): string => {
  return new Date(parseNullish(date)).toLocaleString();
};

const parseChartData = (
  messages: z.infer<typeof messagesSchema>
): ChartDataType => {
  const chartData: CountType = {};

  messages.forEach((message) => {
    const from_id = parseNullish(message.from_id);
    const from = parseNullish(message.from);
    let newFrom: string;
    if (typeof from === "number") {
      newFrom = from.toString();
    } else {
      newFrom = from;
    }
    if (chartData[from_id]) {
      chartData[from_id].count += 1;
    } else {
      chartData[from_id] = {
        count: 1,
        from: newFrom,
      };
    }
  });

  const parsedChartData: ChartDataType = [];
  for (const key in chartData) {
    parsedChartData.push({
      user_id: key,
      count: chartData[key].count,
      from: chartData[key].from,
    });
  }

  parsedChartData.sort((a, b) => b.count - a.count);

  return parsedChartData;
};

export { parseDate, parseChartData };
