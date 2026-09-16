import { MessagesType } from "./chatSchema";
import { GenericChartSchema, GenericChartType, CountType, TimeCountType } from "./dataSchema";
import { countCharacters, parseNullish } from "./utils";
import { MILISECONDS_IN_DAY } from "./const";

const rawToSchema = (
  rawCount: CountType,
  split?: number,
  sort: boolean = true
): GenericChartType => {
  const genericChartData = GenericChartSchema.parse([]);
  for (const key in rawCount) {
    genericChartData.push({
      id: key,
      count: rawCount[key].count,
      label: rawCount[key].from,
    });
  }
  if (sort)
    genericChartData.sort((a, b) => b.count - a.count);
  if (split)
    return genericChartData.slice(0, split);
  return genericChartData;
}

const rawCountToSchema = (
  rawCount: TimeCountType
): GenericChartType => {
  const genericChartData = GenericChartSchema.parse([]);
  rawCount.forEach((item) => {
    genericChartData.push({
      id: item.date,
      count: item.count,
      label: item.date,
    });
  });
  return genericChartData;
}

const calculateMessagesPerUser = (
  messages: MessagesType
): GenericChartType => {
  const rawCount: CountType = {};

  messages.forEach((message) => {
    const from_id = parseNullish(message.from_id);
    const from = parseNullish(message.from);
    let newFrom: string;
    if (typeof from === "number") {
      newFrom = from.toString();
    } else {
      newFrom = from;
    }
    if (rawCount[from_id]) {
      rawCount[from_id].count += 1;
    } else {
      rawCount[from_id] = {
        count: 1,
        from: newFrom,
      };
    }
  });

  return rawToSchema(rawCount, 30);
}

const calculateCharactersPerUser = (
  messages: MessagesType
): GenericChartType => {
  const rawCount: CountType = {};

  messages.forEach((message) => {
    const from_id = parseNullish(message.from_id);
    const from = parseNullish(message.from);
    const charactersCount = countCharacters(message.text);
    let newFrom: string;
    if (typeof from === "number") {
      newFrom = from.toString();
    } else {
      newFrom = from;
    }
    if (rawCount[from_id]) {
      rawCount[from_id].count += charactersCount;
    } else {
      rawCount[from_id] = {
        count: charactersCount,
        from: newFrom
      }
    }
  })

  return rawToSchema(rawCount, 30);
}

const calculateMostUsedWords = (
  messages: MessagesType,
  minLength: number
): GenericChartType => {
  const rawCount: CountType = {};

  messages.forEach((message) => {
    let words: Array<string>
    if (typeof message.text === "string") {
      words = message.text.split(" ")
    } else {
      words = [];
      if (message.text == null) return;
      message.text.forEach((textPiece) => {
        if (typeof textPiece === "string") {
          words.concat(textPiece.split(" "));
        } else {
          words.concat(textPiece.text.split(" "));
        }
      })
    }
    words.forEach((word) => {
      word = word.toLowerCase().replace(RegExp("[!?.,)(@#$%^&*<>'\"\\/{}]"), "");
      if (word.length < minLength) {
        return
      }
      if (rawCount[word]) {
        rawCount[word].count += 1
      } else {
        rawCount[word] = {
          count: 1,
          from: word,
        }
      }
    })
  })

  return rawToSchema(rawCount, 30);
}

const calculateMessagesOverTime = (
  messages: MessagesType,
  user?: string
): GenericChartType => {
  const rawCount: TimeCountType = [];

  messages.forEach((message) => {
    if (user && message.from !== user || message.date == null) {
      return;
    }
    const date = new Date(message.date);
    const dateString = date.toLocaleDateString();
    if (!rawCount.at(0)) {
      rawCount.push({
        count: 1,
        date: dateString,
      });
      return;
    } else if (rawCount.at(-1)?.date === dateString) {
      rawCount.at(-1)!.count += 1;
      return;
    }
    const lastDate = new Date(rawCount.at(-1)!.date);
    if (date.getTime() - lastDate.getTime() > MILISECONDS_IN_DAY) {
      const daysDiff = Math.floor((date.getTime() - lastDate.getTime()) / MILISECONDS_IN_DAY);
      for (let i = 1; i < daysDiff; i++) {
        const newDate = new Date(lastDate.getTime() + (i * MILISECONDS_IN_DAY));
        rawCount.push({
          count: 0,
          date: newDate.toLocaleDateString(),
        });
      }
    }
    rawCount.push({
        count: 1,
        date: dateString,
      });
  })

  return rawCountToSchema(rawCount);
}

export {
  calculateMessagesPerUser,
  calculateCharactersPerUser,
  calculateMostUsedWords,
  calculateMessagesOverTime
};