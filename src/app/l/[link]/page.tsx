import { getLinkByShortUrl, incrementAccessCount } from "@/lib/db/linkActions";
import { redirect } from "next/navigation";

const redirectPage = async ({
  params,
}: {
  params: Promise<{ link: string }>;
}) => {
  const link = await params;
  const foundLink = await getLinkByShortUrl(link.link);
  
  if (foundLink) {
    if (foundLink.collectStats) {
      await incrementAccessCount(link.link);
    }
    return redirect(foundLink.url);
  }
  
  
  return null;
}

export default redirectPage;