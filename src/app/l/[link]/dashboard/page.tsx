"use client";

import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ClipboardCheckIcon, ClipboardIcon, Loader2Icon, CircleXIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ReactQRCode, type ReactQRCodeRef } from "@lglab/react-qr-code";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { LinksList } from "@/components/linksList";
import WorldMap, { type ISOCode } from "react-svg-worldmap";
import { useTheme } from "next-themes";
import { GoogleSignInButton } from "@/components/authButton";

const dashboardPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const linkParam = params?.link as string | undefined;
  const created = searchParams?.get("created");
  const ref = useRef<ReactQRCodeRef>(null);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  const [foundLink, setFoundLink] = useState<any>(null);
  const session = authClient.useSession();
  const [mapData, setMapData] = useState<{ country: ISOCode; value: number }[] | null>(null);

  const handleDownload = async () => {
    const isMobileFirefox = /Firefox\/\d+.*Mobile|FxiOS\/\d+/i.test(navigator.userAgent);
    const qrSvg = ref.current?.svg;

    if (!isMobileFirefox || !qrSvg) {
      ref.current?.download({
        name: "qr-code",
        format: "png",
        size: 1000,
      });
      return;
    }

    const downloadWindow = window.open("about:blank", "_blank");
    const svg = qrSvg.cloneNode(true) as SVGSVGElement;
    svg.setAttribute("width", "1000");
    svg.setAttribute("height", "1000");

    try {
      const svgBlob = new Blob([new XMLSerializer().serializeToString(svg)], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1000;
        canvas.height = 1000;
        canvas.getContext("2d")?.drawImage(image, 0, 0, 1000, 1000);
        URL.revokeObjectURL(svgUrl);

        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            downloadWindow?.close();
            return;
          }

          const pngUrl = URL.createObjectURL(pngBlob);
          if (downloadWindow) {
            downloadWindow.location.href = pngUrl;
          } else {
            window.location.href = pngUrl;
          }
        }, "image/png");
      };
      image.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        downloadWindow?.close();
      };
      image.src = svgUrl;
    } catch {
      downloadWindow?.close();
      setErrorState("Failed to prepare the QR code download");
    }
  };

  useEffect(() => {
    if (!linkParam) return;

    const fetchLink = async () => {
      const response = await fetch(`/api/shortener/get`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shortUrl: linkParam,
          userId: session.data?.user?.id,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setFoundLink(data);
        setMapData(Object.entries(data.countriesAccessed).map(([country, count]) => ({
          country: country as ISOCode,
          value: count as number,
        })));
      } else {
        setErrorState(data.error || "Failed to fetch link data");
      }
    };

    if (!session.isPending && session.data?.user) {
      fetchLink();
    }
  }, [linkParam, session.isPending]);

  if (!session.isPending && !session.data?.user) {
    return (
      <div className="flex justify-center items-center h-full grow">
        <Alert variant="destructive" className="w-fit">
          <CircleXIcon />
          <AlertTitle>403 | Not logged in</AlertTitle>
          <AlertDescription>
            You must be logged in to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (errorState) {
    return (
      <div className="flex justify-center items-center h-full grow">
        <Alert variant="destructive" className="w-fit">
          <CircleXIcon />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errorState}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!foundLink) {
    return (
      <div className="flex justify-center items-center h-full grow">
        <Loader2Icon className="animate-spin" />
      </div>
    );
  }

  const shortUrl = `${window.location.origin}/l/${foundLink.shortUrl}`;

  return (
    <main className="mt-4 flex grow flex-col gap-4">
      <div className="grid w-full items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
        <Card className="w-full gap-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Link details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Short URL</p>
              <div className="min-w-0 overflow-x-auto">
                <Popover>
                  <PopoverTrigger
                    className="flex w-max items-center gap-2 whitespace-nowrap text-muted-foreground underline hover:text-foreground"
                    onClick={() => navigator.clipboard.writeText(shortUrl)}
                  >
                    {shortUrl}
                    <ClipboardIcon className="inline-block w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" />
                  </PopoverTrigger>
                  <PopoverContent className="w-fit">
                    <div className="flex items-center">Success!
                      <ClipboardCheckIcon className="ml-2 inline-block w-4 h-4 text-green-500 dark:text-green-700" />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <Separator />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Destination URL</p>
              <div className="overflow-x-auto whitespace-nowrap">
                <Link className="text-blue-500 dark:text-indigo-500" href={foundLink.url}>
                  {foundLink.url}
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">Visits</p>
                <p className="font-semibold">
                  {foundLink.collectStats ? foundLink.accessCount : "Statistics off"}
                </p>
              </div>
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">Last visited</p>
                <p className="font-semibold">
                  {foundLink.collectStats && foundLink.accessedAt
                    ? new Date(foundLink.accessedAt).toLocaleString("uk-UA")
                    : "—"}
                </p>
              </div>
            </div>
            <Separator />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Dashboard URL</p>
              <div className="w-full min-w-0 overflow-x-auto">
                <Popover>
                  <PopoverTrigger className="flex w-max items-center gap-2 whitespace-nowrap underline" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/l/${foundLink.shortUrl}/dashboard`);
                    }} >
                    {`${window.location.origin}/l/${foundLink.shortUrl}/dashboard`}
                    <ClipboardIcon className="inline-block w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"/>
                  </PopoverTrigger>
                  <PopoverContent className="w-fit">
                    <div className="flex items-center">Success!
                      <ClipboardCheckIcon className="ml-2 inline-block w-4 h-4 text-green-500 dark:text-green-700" />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            { session.data?.user?.isAnonymous &&
              <>
              <Separator className="my-2" />
              <div className="flex items-center max-w-lg gap-4">
                <p>
                  Your account is currently anonymous. To save your links and access statistics, please link your account with Google. All of your existing links and statistics will be preserved after linking your account.
                  <GoogleSignInButton callbackURL={window.location.href} setErrorState={setErrorState} className="mt-2" />
                </p>
                <TriangleAlertIcon className="ml-2 inline-block min-w-6 min-h-6a text-yellow-500 dark:text-yellow-400" />
              </div>
              </>
            }
            <div className="flex justify-end border-t pt-4">
              <Button variant="destructive" onClick={() => {setDeleteDialogOpen(true)}}>
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          {errorState &&
            <Alert className="mb-4 py-5 px-7 max-w-fit text-lg">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {errorState}
              </AlertDescription>
            </Alert>
          }
          {created === "true" && 
          <Alert className="py-4">
            <AlertTitle>Short link created</AlertTitle>
            <AlertDescription>
              Click the short URL to copy it:
              <div className="mt-1 min-w-0 overflow-x-auto">
                <Popover>
                  <PopoverTrigger
                    className="flex w-max items-center gap-2 whitespace-nowrap text-muted-foreground underline hover:text-foreground"
                    onClick={() => navigator.clipboard.writeText(shortUrl)}
                  >
                    {shortUrl}
                    <ClipboardIcon className="inline-block w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" />
                  </PopoverTrigger>
                  <PopoverContent className="w-fit">
                    <div className="flex items-center">Success!
                      <ClipboardCheckIcon className="ml-2 inline-block w-4 h-4 text-green-500 dark:text-green-700" />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </AlertDescription>
          </Alert>
          }
          <Card className="w-full gap-4">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">QR code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ReactQRCode 
                value={`${window.location.origin}/l/${foundLink.shortUrl}`}
                ref={ref}
                size={256}
                marginSize={2}
                background="#FFFFFF"
              />
              <Button className="mt-4" onClick={handleDownload}>Download PNG</Button>
            </CardContent>
          </Card>
        </div>
        {foundLink.collectStats && (
        <Card className="w-full gap-4 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Country access statistics</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
              {mapData && resolvedTheme ? (
                <WorldMap
                  key={resolvedTheme}
                  value-suffix="accesses"
                  size="xxl"
                  containerClassName="flex w-full justify-center"
                  data={mapData}
                  backgroundColor="var(--card)"
                  borderColor="var(--foreground)"
                  color="var(--chart-2)"
                />
              ) : (
                <p>No access data available.</p>
              )}
          </CardContent>
        </Card>
        )}
        <Dialog open={!!deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Short Link</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this short link? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={async () => {

                const res = await fetch(`/api/shortener/delete`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    shortUrl: foundLink.shortUrl,
                    userId: session.data?.user?.id,
                  }),
                });

                if (res.ok) {
                  window.location.href = "/l";
                } else {
                  const data = await res.json();
                  setErrorState(data.error || "Failed to delete short link");
                }
              }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="w-full">
        <LinksList userId={session.data?.user?.id || ""} />
      </div>
    </main>
  );
};

export default dashboardPage;