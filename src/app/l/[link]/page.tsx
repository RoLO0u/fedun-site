"use server";

import { getLinkByShortUrl, incrementAccessCount } from "@/lib/db/linkActions";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import geoip from "geoip-lite";

const redirectPage = async ({
  params,
}: {
  params: Promise<{ link: string }>;
}) => {
  const link = await params;
  const foundLink = await getLinkByShortUrl(link.link);

  if (!foundLink) {
    return null;
  }

  if (foundLink.collectStats) {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "Unknown IP";
    const country = geoip.lookup(ip)?.country;

    await incrementAccessCount(link.link, country);
  }

  return redirect(foundLink.url);
}

export default redirectPage;