import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { TextType } from "./chatSchema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const parseNullish = (value: string | number | null | undefined): string | number => {
  if (value === null || value === undefined) {
    return "No data";
  }
  return value;
};

const parseDate = (date: string | null | undefined): string => {
  return new Date(parseNullish(date)).toLocaleString();
};

const countCharacters = (text: TextType): number => {
  if (typeof text === "string") {
    return text.length;
  }
  let count = 0;
  text.forEach((textPiece) => {
    if (typeof textPiece === "string") {
      count += textPiece.length;
    } else {
      count += textPiece.text.length;
    }
  })
  return count;
}

export { parseNullish, parseDate, countCharacters };