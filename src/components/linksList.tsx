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
import { CheckIcon, XIcon, InfoIcon } from "lucide-react";

export function LinksList({ userId }: { userId: string }) {
  const [links, setLinks] = useState<LinkType[]>([]);
  
  useEffect(() => {
    if (!userId) return;
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
        setLinks(data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchLinks();
  }, [userId]);

  if (!links.length || !userId) {
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
            <TableHead>Original URL</TableHead>
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
                target="_blank"
                rel="noopener noreferrer"
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