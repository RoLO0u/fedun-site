"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export const UnlinkTelegramButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/sticker-set/unlink", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Error unlinking user: ${response.statusText}`);
      }
      // reload the page to reflect the changes after unlinking
      window.location.reload();
    } catch (error) {
      console.error("Error unlinking user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleUnlink} variant="destructive" disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Unlinking...
        </>
      ) : (
        "Unlink Telegram"
      )}
    </Button>
  );
};