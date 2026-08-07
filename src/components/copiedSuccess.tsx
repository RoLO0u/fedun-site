"use client";

import { ClipboardCheckIcon, ClipboardIcon } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";

export function CopiedSuccess(
  props: { children: React.ReactNode }
) {
  return <Popover>
    <PopoverTrigger>
      {props.children}
    </PopoverTrigger>
    <PopoverContent className="w-fit">
      <div className="flex items-center">Success!
        <ClipboardCheckIcon className="ml-2 inline-block w-4 h-4 text-green-500 dark:text-green-700" />
      </div>
    </PopoverContent>
  </Popover>
}