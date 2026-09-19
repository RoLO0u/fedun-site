"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

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
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" disabled={isLoading}>
          Unlink Telegram
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlink Telegram Account</DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to unlink your Telegram account?</p>
        <div className="mt-4 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline" onClick={() => setIsLoading(false)} disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleUnlink} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unlinking...
              </>
            ) : (
              "Unlink"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};