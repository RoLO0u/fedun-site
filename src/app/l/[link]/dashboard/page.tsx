"use server";

import { getLinkByShortUrl } from "@/lib/db/linkActions";
import Link from "next/link";
import { env } from "node:process";

const dashboardPage = async ({ params }: { params: Promise<{ link: string }> }) => {
  const link = await params;
  const foundLink = await getLinkByShortUrl(link.link);

  if (!foundLink) {
    return null;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard for {foundLink.url}</h1>
      <div>Short URL: <Link className="text-blue-500" href={`${env.BASE_URL}/l/${foundLink.shortUrl}`}>{`${env.BASE_URL}/l/${foundLink.shortUrl}`}</Link></div>
      <div>Original URL: <Link className="text-blue-500" href={foundLink.url}>{foundLink.url}</Link></div>
      <p>Access Count: {foundLink.accessCount}</p>
      <p>Last Accessed At: {foundLink.accessedAt ? new Date(foundLink.accessedAt).toLocaleString() : "N/A"}</p>
    </div>
  );
};

export default dashboardPage;