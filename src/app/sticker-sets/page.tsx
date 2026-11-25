"use client"

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { CopyText } from "@/components/copyText";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { SiTelegram } from "@icons-pack/react-simple-icons";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/authButton";
import { StickerSetDialog, RenderSticker } from "@/components/stickerSet";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStickerSetsLayout } from "@/components/stickerSetsLayout";
import { useIsMobile } from "@/hooks/use-mobile";

const StickerSetsPage = () => {
  const [dialogOpen, setDialogOpen] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { data, error: errorState, isLoading } = useStickerSetsLayout();
  const stickerSets = data?.stickerSets ?? [];
  const firstStickers = data?.firstStickers ?? [];
  const thumbnails = data?.thumbnails ?? [];
  const {
    data: session,
    isPending,
    error,
  } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center grow py-2">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!session || !session.user || session.user.isAnonymous) {
    return (
      <div className="flex flex-col items-center justify-center grow py-2">
        <h1 className="text-2xl font-bold mb-4">{!session || !session.user ? "You are not logged in!" : "You're logged in anonymously"}</h1>
        <p className="text-lg text-gray-600">Please log in to view your sticker sets.</p>
        <GoogleSignInButton callbackURL={window.location.href} className="mt-3 mb-1" shrink={false} />
      </div>
    );
  }

  if (errorState || error) {
    return (
      <div className="flex flex-col items-center justify-center grow py-2">
        <h1 className="text-2xl font-bold mb-4">There seems to be an issue!</h1>
        <p className="text-lg text-gray-600">{errorState || error?.message}</p>
      </div>
    );
  }
  
  if (!session?.user?.telegram) {
    return (
      <div className="flex flex-wrap grow justify-center content-center items-center h-full">
        <Card>
          <CardHeader className="text-2xl w-full flex justify-center font-bold">Telegram Not Linked</CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4">
            <p className="text-lg flex-wrap max-w-2xl">
              Please link your account to view your sticker sets.
            </p>
            <Link href={`https://t.me/paces_bot?text=${encodeURIComponent(`/connect ${session?.user?.email}`)}`} className="text-2xl font-semibold flex items-center gap-2">
              Just Click Here!
              <SiTelegram size={24} />
            </Link>
            <div className="text-sm flex flex-row items-center justify-center gap-2">
              <Separator className="bg-primary" />
              or
              <Separator className="bg-primary" />
            </div>
            <p className="text-lg flex-wrap max-w-2xl">
              Paste the following command to the <Link href="https://t.me/paces_bot" className="text-blue-500 underline">Sticker Packs Bot</Link> in chat:
            </p> 
            <div className="flex items-center gap-2">
              <CopyText text={`/connect ${session?.user?.email}`} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 flex-wrap grow justify-center content-center items-center h-full">
      <h1 className="text-4xl font-bold mt-4">Your Sticker Sets</h1>
      <div className="text-lg text-center">Move your stickers to change the order of them in the set<br/>The changed order is saved automatically</div>
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-81.5 w-62.5" />
          ))
        ) : stickerSets.length ? stickerSets.map((stickerSet, index) => (
          <Card key={stickerSet.name} className="gap-1">
            <CardHeader className="flex flex-row content-center justify-center text-lg font-semibold">
              {stickerSet.title}
              { thumbnails[index] &&
                <RenderSticker
                  sticker={stickerSet.stickers[0]}
                  index={1}
                  stickerSetTitle={stickerSet.title}
                  stickerUrl={thumbnails[index]}
                  className="size-6 shrink-0 rounded object-cover"
                />
              }
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-2">
              <RenderSticker
                sticker={stickerSet.stickers[0]}
                index={1}
                stickerSetTitle={stickerSet.title}
                stickerUrl={firstStickers[index]}
                className="w-50 aspect-square object-contain"
              />
              <Dialog
                open={dialogOpen === stickerSet.name}
                onOpenChange={(open) => setDialogOpen(open ? stickerSet.name : null)}
              >
                {isMobile ? (
                  <Button asChild variant="outline">
                    <Link href={`/sticker-sets/${encodeURIComponent(stickerSet.name)}`}>
                      Edit {stickerSet.stickers.length} Stickers
                    </Link>
                  </Button>
                ) : (
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      Manage {stickerSet.stickers.length} Stickers
                    </Button>
                  </DialogTrigger>
                )}
                <StickerSetDialog
                  stickerSet={stickerSet}
                  thumbnail={thumbnails[index]}
                  open={dialogOpen === stickerSet.name}
                />
              </Dialog>
            </CardContent>
          </Card>
        )) : (
          <div className="max-w-md rounded-lg border p-6 text-center">
            <p className="font-medium">No sticker sets found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a sticker set with the Sticker Packs Bot and it will appear here.
            </p>
            <Link href="https://t.me/paces_bot" className="mt-4 inline-block text-primary underline">
              Open Sticker Packs Bot
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default StickerSetsPage;