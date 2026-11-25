"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayersIcon, LayoutGridIcon, PencilIcon, PlusIcon } from "lucide-react";
import type { Sticker, StickerSet } from "@/types/telegram";
import { RenderSticker } from "@/components/stickerSet";
import { authClient } from "@/lib/auth-client";
import { UnlinkTelegramButton } from "@/components/unlinkTelegramButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

type StickerSetsData = {
  stickerSets: StickerSet[];
  firstStickers: string[];
  thumbnails: (string | null)[];
};

type StickerSetsLayoutContextValue = {
  data: StickerSetsData | null;
  isLoading: boolean;
  error: string | null;
  isLinked: boolean;
  showSidebar: boolean;
  refreshStickerSets: () => Promise<void>;
  isAddStickerDialogOpen: boolean;
  setIsAddStickerDialogOpen: (open: boolean) => void;
};

const StickerSetsLayoutContext = createContext<StickerSetsLayoutContextValue | null>(null);

const StickerSetsSidebarLink = ({
  href,
  isActive,
  thumbnail,
  thumbnailSticker,
  icon,
  children,
}: {
  href: string;
  isActive: boolean;
  thumbnail?: string | null;
  thumbnailSticker?: Sticker;
  icon?: React.ReactNode;
  children: string;
}) => {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarMenuButton asChild isActive={isActive} tooltip={children}>
      <Link href={href} onClick={() => isMobile && setOpenMobile(false)}>
        {thumbnail && thumbnailSticker ? (
          <RenderSticker
            sticker={thumbnailSticker}
            index={1}
            stickerSetTitle={children}
            stickerUrl={thumbnail}
            className="size-4 shrink-0 rounded object-cover"
          />
        ) : thumbnail ? (
          <Image
            src={thumbnail}
            alt=""
            width={16}
            height={16}
            unoptimized
            className="size-4 shrink-0 rounded object-cover"
          />
        ) : icon ?? <LayersIcon aria-hidden="true" />}
        <span className="truncate group-data-[collapsible=icon]:hidden">{children}</span>
      </Link>
    </SidebarMenuButton>
  );
};

const AddStickerSidebarButton = ({ onClick }: { onClick: () => void }) => {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarMenuSubButton asChild>
      <button
        type="button"
        onClick={() => {
          if (isMobile) setOpenMobile(false);
          onClick();
        }}
      >
        <PlusIcon aria-hidden="true" />
        <span>Add sticker</span>
      </button>
    </SidebarMenuSubButton>
  );
};

const StickerSetsPageContent = ({ children }: { children: React.ReactNode }) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <div
      className={`min-w-0 flex flex-col ${
        collapsed ? "mx-auto w-full max-w-7xl flex-none" : "flex-1"
      }`}
    >
      {children}
    </div>
  );
};

export const useStickerSetsLayout = () => {
  const context = useContext(StickerSetsLayoutContext);
  if (!context) {
    throw new Error("useStickerSetsLayout must be used within the sticker sets layout.");
  }
  return context;
};

export const StickerSetsLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [data, setData] = useState<StickerSetsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddStickerDialogOpen, setIsAddStickerDialogOpen] = useState(false);
  const [renamingStickerSet, setRenamingStickerSet] = useState<StickerSet | null>(null);
  const [stickerSetTitle, setStickerSetTitle] = useState("");
  const [isRenamingStickerSet, setIsRenamingStickerSet] = useState(false);
  const telegramAccount = session?.user?.telegram;
  const isAnonymous = session?.user?.isAnonymous;
  const isLinked = Boolean(telegramAccount) && !isAnonymous;
  const showSidebar = isLinked || isSessionPending;

  const refreshStickerSets = useCallback(async () => {
    if (!isLinked) return;
    const response = await fetch("/api/sticker-set/get-all");
    if (!response.ok) {
      throw new Error(`Error refreshing sticker sets: ${response.statusText}`);
    }
    setData(await response.json());
  }, [isLinked]);

  const handleRenameStickerSet = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!renamingStickerSet) return;

    setIsRenamingStickerSet(true);
    try {
      const response = await fetch("/api/sticker-set/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setName: renamingStickerSet.name,
          title: stickerSetTitle,
        }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : `Could not rename sticker set (${response.status}).`;
        throw new Error(message);
      }

      toast.success("Sticker set renamed.");
      setRenamingStickerSet(null);
      setStickerSetTitle("");
      try {
        await refreshStickerSets();
      } catch (refreshError) {
        console.error("Could not refresh sticker sets after renaming:", refreshError);
        toast.error("Sticker set renamed, but the sidebar could not refresh. Reload the page.");
      }
    } catch (renameError) {
      toast.error(renameError instanceof Error ? renameError.message : "Could not rename sticker set.");
    } finally {
      setIsRenamingStickerSet(false);
    }
  };

  useEffect(() => {
    if (isSessionPending) return;
    if (!isLinked) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const fetchStickerSets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/sticker-set/get-all");
        if (!response.ok) {
          throw new Error(`Error fetching sticker sets: ${response.statusText}`);
        }
        const result = await response.json();
        if (!cancelled) {
          setData(result);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(`Error fetching sticker sets: ${fetchError}`);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchStickerSets();
    return () => {
      cancelled = true;
    };
  }, [isLinked, isSessionPending, telegramAccount, isAnonymous]);

  const setPath = pathname.split("/")[2];
  const currentSet = data?.stickerSets.find(
    (stickerSet) => encodeURIComponent(stickerSet.name) === setPath,
  );
  const contextValue = {
    data,
    isLoading: isSessionPending || isLoading,
    error,
    isLinked,
    showSidebar,
    refreshStickerSets,
    isAddStickerDialogOpen,
    setIsAddStickerDialogOpen,
  };

  return (
    <StickerSetsLayoutContext.Provider value={contextValue}>
      {showSidebar ? (
        <SidebarProvider
          className="min-h-svh w-full"
          style={{ "--sidebar-width": "18rem" } as React.CSSProperties}
        >
          <Sidebar collapsible="icon">
            <SidebarHeader className="pt-5">
              <div className="flex items-center gap-2">
                <Link
                  href="/sticker-sets"
                  className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1 font-semibold group-data-[collapsible=icon]:hidden"
                >
                  <LayersIcon className="size-5" aria-hidden="true" />
                  <span className="whitespace-nowrap">Sticker sets</span>
                </Link>
                <SidebarTrigger className="ml-auto hidden md:flex group-data-[collapsible=icon]:mx-auto" />
              </div>
            </SidebarHeader>
            <SidebarContent>
              {isSessionPending ? (
                <SidebarGroup>
                  <SidebarGroupLabel>Your packs</SidebarGroupLabel>
                  <SidebarMenu>
                    {[0, 1, 2].map((item) => (
                      <SidebarMenuItem key={item}>
                        <SidebarMenuButton disabled>
                          <Skeleton className="size-4 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
              ) : (
                <>
                  <SidebarGroup>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <StickerSetsSidebarLink
                          href="/sticker-sets"
                          isActive={pathname === "/sticker-sets"}
                          icon={<LayoutGridIcon aria-hidden="true" />}
                        >
                          All packs
                        </StickerSetsSidebarLink>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroup>
                  <SidebarGroup>
                    <SidebarGroupLabel>Your packs</SidebarGroupLabel>
                    <SidebarMenu>
                      {data?.stickerSets.map((stickerSet, index) => {
                        const href = `/sticker-sets/${encodeURIComponent(stickerSet.name)}`;
                        return (
                          <SidebarMenuItem key={stickerSet.name}>
                            <div className="flex items-center gap-1">
                              <div className="min-w-0 flex-1">
                                <StickerSetsSidebarLink
                                  href={href}
                                  isActive={pathname === href}
                                  thumbnail={data.thumbnails[index]}
                                  thumbnailSticker={stickerSet.stickers[0]}
                                >
                                  {stickerSet.title}
                                </StickerSetsSidebarLink>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="shrink-0 group-data-[collapsible=icon]:hidden"
                                aria-label={`Rename ${stickerSet.title}`}
                                title={`Rename ${stickerSet.title}`}
                                onClick={() => {
                                  setRenamingStickerSet(stickerSet);
                                  setStickerSetTitle(stickerSet.title);
                                }}
                              >
                                <PencilIcon aria-hidden="true" />
                              </Button>
                            </div>
                            {currentSet?.name === stickerSet.name && (
                              <>
                                <SidebarMenuSub>
                                  <SidebarMenuSubItem>
                                    <AddStickerSidebarButton
                                      onClick={() => setIsAddStickerDialogOpen(true)}
                                    />
                                  </SidebarMenuSubItem>
                                </SidebarMenuSub>
                                <SidebarMenuButton
                                  className="hidden group-data-[collapsible=icon]:flex"
                                  tooltip="Add sticker"
                                  onClick={() => setIsAddStickerDialogOpen(true)}
                                >
                                  <PlusIcon aria-hidden="true" />
                                  <span className="sr-only">Add sticker</span>
                                </SidebarMenuButton>
                              </>
                            )}
                          </SidebarMenuItem>
                        );
                      })}
                      {isLoading && (
                        <SidebarMenuItem>
                          <SidebarMenuButton disabled>
                            <span>Loading packs…</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                      {!isLoading && !error && !data?.stickerSets.length && (
                        <SidebarMenuItem>
                          <span className="px-2 py-1.5 text-sm text-muted-foreground">
                            No packs found
                          </span>
                        </SidebarMenuItem>
                      )}
                      {error && (
                        <SidebarMenuItem>
                          <span className="px-2 py-1.5 text-sm text-destructive">
                            Could not load packs
                          </span>
                        </SidebarMenuItem>
                      )}
                    </SidebarMenu>
                  </SidebarGroup>
                </>
              )}
            </SidebarContent>
            {isLinked && (
              <SidebarFooter className="border-t border-sidebar-border">
                <div className="[&>button]:w-full">
                  <UnlinkTelegramButton />
                </div>
              </SidebarFooter>
            )}
          </Sidebar>
          <StickerSetsPageContent>{children}</StickerSetsPageContent>
        </SidebarProvider>
      ) : (
        children
      )}
      <Dialog
        open={Boolean(renamingStickerSet)}
        onOpenChange={(open) => {
          if (!open && !isRenamingStickerSet) {
            setRenamingStickerSet(null);
            setStickerSetTitle("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename sticker set</DialogTitle>
            <DialogDescription>
              Choose a new title for {renamingStickerSet?.title}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameStickerSet} className="space-y-4">
            <Input
              autoFocus
              value={stickerSetTitle}
              onChange={(event) => setStickerSetTitle(event.target.value)}
              placeholder="Sticker set title"
              aria-label="Sticker set title"
              disabled={isRenamingStickerSet}
              required
            />
            <DialogFooter>
              <Button type="submit" disabled={isRenamingStickerSet}>
                {isRenamingStickerSet ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </StickerSetsLayoutContext.Provider>
  );
};
