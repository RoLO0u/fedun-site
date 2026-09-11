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
  const headersList = await headers();
  const link = await params;
  const foundLink = await getLinkByShortUrl(link.link);

  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor?.split(',')[0]?.trim() || 'Unknown IP';
  const geo = geoip.lookup(ip);
  const country = geo?.country;

  console.log(`Accessed link: ${link.link}, IP: ${ip}, Country: ${country}`);
  
  if (foundLink) {
    if (foundLink.collectStats) {
      await incrementAccessCount(link.link, country);
    }
    return redirect(foundLink.url);
  }
  
  
  return null;
}

export default redirectPage;