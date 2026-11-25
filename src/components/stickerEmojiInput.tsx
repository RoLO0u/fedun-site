"use client";

import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { SmileIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const parseStickerEmojiList = (value: string) =>
  value.split(/[,\s]+/).map((emoji) => emoji.trim()).filter(Boolean);

export const StickerEmojiInput = ({
  value,
  onChange,
  label,
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
}) => {
  const addEmoji = (emoji: EmojiClickData) => {
    const emojiList = parseStickerEmojiList(value);
    if (emojiList.includes(emoji.emoji)) return;
    if (emojiList.length >= 20) {
      toast.error("A sticker can have at most 20 emoji.");
      return;
    }
    onChange([...emojiList, emoji.emoji].join(", "));
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Type emoji or choose from the picker"
        aria-label={label}
        maxLength={200}
        required={required}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Choose emoji for ${label}`}
          >
            <SmileIcon aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[calc(100vw-2rem)] p-0 sm:w-[350px]"
        >
          <EmojiPicker
            colorScheme="auto"
            width="100%"
            height={350}
            lazyLoadEmojis
            previewConfig={{ showPreview: false }}
            onEmojiClick={addEmoji}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
