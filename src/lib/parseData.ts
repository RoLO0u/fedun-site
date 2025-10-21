import { type MessagesType } from "@/lib/chatSchema";
import { ChartDataType } from "@/lib/dataSchema";

import { calculateMessagesPerUser, calculateCharactersPerUser, calculateMostUsedWords } from "./calculateMessages";

const parseChartData = (
  messages: MessagesType,
  minLength: number,
): ChartDataType => {
  return {
    messagesPerUser: calculateMessagesPerUser(messages),
    charactersPerUser: calculateCharactersPerUser(messages),
    mostUsedWords: calculateMostUsedWords(messages, minLength),
  };
};

export { parseChartData };
