"use server";

import { getLinkByShortUrl, incrementAccessCount } from "@/lib/db/linkActions";
import { redirect } from "next/navigation";

const redirectPage = async ({
  params,
}: {
  params: Promise<{ link: string }>;
}) => {
  const link = await params;
  const foundLink = await getLinkByShortUrl(link.link);
  await incrementAccessCount(link.link);

  if (foundLink) {
    return redirect(foundLink.url);
  }
  return null;
}

export default redirectPage;