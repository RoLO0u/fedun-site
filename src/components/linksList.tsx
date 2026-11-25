"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import type { Link as LinkType } from "@/db/schema";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CopiedSuccess } from "@/components/copiedSuccess";
import { CheckIcon, XIcon, InfoIcon, ExternalLinkIcon, Loader2Icon, CircleXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LinksList({ userId }: { userId: string }) {
  const [links, setLinks] = useState<LinkType[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setLinks(null);
      setIsLoading(false);
      setError(false);
      return () => {
        cancelled = true;
      };
    }

    setLinks(null);
    setIsLoading(true);
    setError(false);

    async function fetchLinks() {
      try {
        const response = await fetch(`/api/shortener/get-all`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch links");
        }
        const data: LinkType[] = await response.json();
        if (!cancelled) {
          setLinks(data);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    fetchLinks();
    return () => {
      cancelled = true;
    };
  }, [userId, retryCount]);

  if (!userId) {
    return (
      <Card className="px-4 py-3 gap-2 flex flex-row justify-center items-center">
        <InfoIcon className="inline-block min-w-4 min-h-4 text-blue-500 dark:text-blue-700" />
        Sign in or continue as a guest to view your short links here
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="px-4 py-3 gap-2 flex flex-row justify-center items-center" role="status">
        <Loader2Icon className="h-4 w-4 animate-spin" />
        Loading your short links...
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="px-4 py-3 gap-3 flex flex-col justify-center items-center" role="alert">
        <div className="flex items-center gap-2">
          <CircleXIcon className="h-4 w-4 text-destructive" />
          Could not load your short links.
        </div>
        <Button variant="outline" size="sm" onClick={() => setRetryCount((count) => count + 1)}>
          Try again
        </Button>
      </Card>
    );
  }

  if (!links?.length) {
    return (
      <Card className="px-4 py-3 gap-2 flex flex-row justify-center items-center">
        <InfoIcon className="inline-block min-w-4 min-h-4 text-blue-500 dark:text-blue-700" />
        Create your first short link to see them all here
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <Table>
        <TableCaption>Your Shortened Links</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="sm:table-cell hidden" >Short URL</TableHead>
            <TableHead>
              <ExternalLinkIcon className="w-4 h-4 mb-0.5 mr-1 inline-block"/>
              Original URL
            </TableHead>
            <TableHead>Manage</TableHead>
            <TableHead>Stats</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
        {links.map((link) => (
          <TableRow key={link.shortUrl}>
            <TableCell
              className="text-sm sm:table-cell hidden text-muted-foreground underline hover:cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/l/${link.shortUrl}`);
              }}
            >
              <CopiedSuccess>
                <div className="underline">
                  {window.location.host}/l/{link.shortUrl}
                </div>
              </CopiedSuccess>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
                <Link href={link.url} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                  {link.url.length < 20 ? link.url : `${link.url.slice(0, 19)}...` }
                </Link>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground text-right">
              <Link
                href={`/l/${link.shortUrl}/dashboard`}
                className="text-sm text-blue-500 hover:underline"
              >
                View
              </Link>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground flex justify-center items-center">
              {link.collectStats ?
                <CheckIcon className="text-green-500"/>
              :
                <XIcon className="text-red-500"/>}
            </TableCell>
          </TableRow>
        ))}
        </TableBody>
      </Table>
    </Card>
  );
}