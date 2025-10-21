import { MessagesType } from "./chatSchema";
import { GenericChartSchema, GenericChartType, CountType } from "./dataSchema";
import { countCharacters, parseNullish } from "./utils";

const rawToSchema = (
  rawCount: CountType,
  split: number
): GenericChartType => {
  const genericChartData = GenericChartSchema.parse([]);
  for (const key in rawCount) {
    genericChartData.push({
      id: key,
      count: rawCount[key].count,
      label: rawCount[key].from,
    });
  }
  genericChartData.sort((a, b) => b.count - a.count);
  return genericChartData.slice(0, split);
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

export { calculateMessagesPerUser, calculateCharactersPerUser, calculateMostUsedWords };