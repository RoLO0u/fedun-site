"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import type { StickerSet } from "@/types/telegram";
import { authClient } from "@/lib/auth-client";
import { CopyText } from "@/components/copyText";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { SiTelegram } from "@icons-pack/react-simple-icons";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/authButton";
import { UnlinkTelegramButton } from "@/components/unlinkTelegramButton";
import { StickerSetDialog, RenderSticker } from "@/components/stickerSet";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const StickerSetsPage = () => {
  const [stickerSets, setStickerSets] = useState<StickerSet[]>([]);
  const [firstStickers, setFirstStickers] = useState<string[]>([]);
  const [thumbnails, setThumbnails] = useState<(string | null)[]>([]);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<string | null>(null);
  const {
    data: session,
    isPending,
    error,
  } = authClient.useSession();
  
  useEffect(() => {
    const fetchStickerSets = async () => {
      try {
        const response = await fetch("/api/sticker-set/get-all");
        if (!response.ok) {
          setErrorState(`Error fetching sticker sets: ${response.statusText}`);
          return;
        }
        const data = await response.json();
        setStickerSets(data.stickerSets);
        setFirstStickers(data.firstStickers);
        setThumbnails(data.thumbnails);
      } catch (error) {
        setErrorState(`Error fetching sticker sets: ${error}`);
      }
    };

    fetchStickerSets();
  }, [session?.user?.telegram]);

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
        <h1 className="text-2xl font-bold mb-4">{!session || !session.user ? "You are not logged in!" : "You're logged in anonimously"}</h1>
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
      <main className="flex flex-wrap grow justify-center content-center items-center h-full">
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
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-2 flex-wrap grow justify-center content-center items-center h-full">
      <h1 className="text-4xl font-bold mt-4">Your Sticker Sets</h1>
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {stickerSets.map((stickerSet, index) => (
          <Card key={stickerSet.name} className="gap-1">
            <CardHeader className="flex flex-row content-center justify-center text-lg font-semibold">
              {stickerSet.title}
              { thumbnails[index] &&
                <Image
                  width={25}
                  height={25}
                  src={thumbnails[index]}
                  unoptimized
                  alt={`${stickerSet.title} thumbnail`}
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
                <DialogTrigger asChild>
                  <Button variant="outline">Manage {stickerSet.stickers.length} Stickers</Button>
                </DialogTrigger>
                <StickerSetDialog
                  stickerSet={stickerSet}
                  thumbnail={thumbnails[index]}
                  open={dialogOpen === stickerSet.name}
                />
              </Dialog>
            </CardContent>
          </Card>
          ))}
      </div>
      <div className="mt-4">
        <UnlinkTelegramButton />
      </div>
    </main>
  );
}

export default StickerSetsPage;