import { type MessagesType } from "@/lib/chatSchema";
import { ChartDataType } from "@/lib/dataSchema";

import { 
  calculateMessagesPerUser,
  calculateCharactersPerUser,
  calculateMostUsedWords,
  calculateMessagesOverTime,
} from "./calculateMessages";

const parseChartData = (
  messages: MessagesType,
  minLength: number,
): ChartDataType => {
  return {
    messagesPerUser: calculateMessagesPerUser(messages),
    charactersPerUser: calculateCharactersPerUser(messages),
    mostUsedWords: calculateMostUsedWords(messages, minLength),
    messagesOverTime: calculateMessagesOverTime(messages),
  };
};

export { parseChartData };
