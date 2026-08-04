"use client";

import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ClipboardCheckIcon, ClipboardIcon } from "lucide-react";
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

const dashboardPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const linkParam = params?.link as string | undefined;
  const created = searchParams?.get("created");
  const ref = useRef<ReactQRCodeRef>(null)

  const [foundLink, setFoundLink] = useState<any>(null);

  const handleDownload = () => {
    ref.current?.download({
      name: 'download-demo',
      format: 'png',
      size: 1000,
    })
  }

  useEffect(() => {
    if (!linkParam) return;

    const fetchLink = async () => {
      const response = await fetch(`/api/shortener/get`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shortUrl: linkParam }),
      });
      const data = await response.json();
      setFoundLink(data);
    };

    fetchLink();
  }, [linkParam]);

  if (!foundLink) {
    return null;
  }

  return (
    <main className="flex gap-4 items-center flex-wrap justify-center grow h-full">
      <Card className="gap-4 sm:w-96 w-90 md:w-120">
        <CardHeader>
          <CardTitle className="text-2xl font-bold mb-4">Dashboard for {foundLink.url}</CardTitle>
        </CardHeader>
        <CardContent className="mb-4">
          <div className="flex items-center">Short URL:
            <Link className="text-blue-500 dark:text-indigo-500" href={`${window.location.origin}/l/${foundLink.shortUrl}`}>{`${window.location.origin}/l/${foundLink.shortUrl}`}</Link>
            <Popover>
              <PopoverTrigger>
                <ClipboardIcon className="ml-2 inline-block w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/l/${foundLink.shortUrl}`);
                }} />
              </PopoverTrigger>
              <PopoverContent className="w-fit">
                <div className="flex items-center">Success!
                  <ClipboardCheckIcon className="ml-2 inline-block w-4 h-4 text-green-500 dark:text-green-700" />
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Separator className="my-2" />
          <div>Original URL: <Link className="text-blue-500 dark:text-indigo-500" href={foundLink.url}>{foundLink.url}</Link></div>
          <Separator className="my-2" />
          <p>Access Count: {foundLink.collectStats ? foundLink.accessCount : "N/A"}</p>
          <Separator className="my-2" />
          <p>Last Accessed At: {foundLink.accessedAt ? new Date(foundLink.accessedAt).toLocaleString() : "N/A"}</p>
          <Separator className="my-2" />
          <div className="flex flex-col items-center">
            <p className="mr-auto">Link to this dashboard:</p>
            <div className="mr-auto">
              <Popover>
                <PopoverTrigger className="underline flex items-center gap-2" onClick={() => {
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
        </CardContent>
      </Card>
      <div>
        {created === "true" && 
        <Alert className="mb-4 py-5 px-7 max-w-fit text-lg">
          <AlertTitle>Your redirect was added to you clipboard!</AlertTitle>
          <AlertDescription>
            Here's the shortened url:
            <div className="flex items-center">
            <Link className="text-blue-500 dark:text-indigo-500" href={`${window.location.origin}/l/${foundLink.shortUrl}`}>{`${window.location.origin}/l/${foundLink.shortUrl}`}</Link>
            <ClipboardCheckIcon className="ml-2 inline-block w-4 h-4 text-green-500 dark:text-green-700" />
            </div>
          </AlertDescription>
        </Alert>
        }
        <Card className="gap-4">
          <CardHeader>
            <CardTitle className="text-2xl font-bold mb-4">QR Code</CardTitle>
          </CardHeader>
          <CardContent className="mb-4 flex flex-col items-center">
            <ReactQRCode 
              value={`${window.location.origin}/l/${foundLink.shortUrl}`}
              ref={ref}
              size={256}
              marginSize={2}
              background="#FFFFFF"
            />
            <Button onClick={handleDownload}>Download PNG</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default dashboardPage;